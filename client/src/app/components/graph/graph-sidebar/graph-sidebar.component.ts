import { Component, Input, OnDestroy, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { take } from 'rxjs';
import { BoundingBoxPreviewDisplayModeEventOutputParameter } from 'src/app/entities/displaymode/boundingboxpreviewdisplaymode';
import { RelationPreviewDisplayModeEventOutputParameter } from 'src/app/entities/displaymode/relationpreviewdisplaymode';
import { Scene } from 'src/app/entities/scene';
import { _Crypto } from 'src/app/providers/crypto';
import { GraphComponent } from '../graph.component';
import {
    DeleteObjectDialogData,
    DeleteSceneGraphObjectDialog,
} from './dialog/graph-sidebar-delete-object-dialog.component';
import {
    DeleteRelationDialogData,
    DeleteSceneGraphRelationDialog,
} from './dialog/graph-sidebar-delete-relation-dialog.component';
import {
    EditObjectDialogData,
    EditSceneGraphObjectDialog,
} from './dialog/graph-sidebar-edit-object-dialog.component';
import {
    EditRelationDialogData,
    EditSceneGraphRelationDialog,
} from './dialog/graph-sidebar-edit-relation-dialog.component';
import { DisplayModeWidgetComponent } from './widget/display-mode/display-mode-widget.component';
import { ElementListWidgetComponent } from './widget/element-list/element-list-widget.component';

@Component({
    selector: 'app-graph-sidebar',
    templateUrl: './graph-sidebar.component.html',
    styleUrls: ['./graph-sidebar.component.scss'],
})
export class GraphSidebarComponent implements OnDestroy {
    _scene?: Scene;
    scene_changed_subscription_key = _Crypto.randomUUID();

    @ViewChild('widgetDisplayMode')
    widgetDisplayMode?: DisplayModeWidgetComponent;

    @ViewChild('widgetElementList')
    widgetElementList?: ElementListWidgetComponent;

    constructor(
        public root: GraphComponent,
        public dialog: MatDialog,
        public snackbar: MatSnackBar
    ) {}

    ngOnDestroy(): void {
        if (this._scene) {
            this._scene.unregisterGraphChangedCallback(
                this.scene_changed_subscription_key
            );
        }
    }

    get scene(): Scene | undefined {
        return this._scene;
    }

    @Input() set scene(value: Scene | undefined) {
        if (this._scene) {
            this._scene.unregisterGraphChangedCallback(
                this.scene_changed_subscription_key
            );
        }

        this._scene = value;

        this._scene?.registerGraphChangedCallback(
            this.scene_changed_subscription_key,
            (sender) => {
                this.widgetElementList?.updateListElements();
            }
        );

        this.widgetElementList?.updateListElements();
    }

    // edit name & attributes of object
    onEditObject(object_id: string) {
        if (!this._scene?.graph) return;

        const obj = this._scene.graph.all_objects[object_id];
        const attributes_copy = Object.assign([], obj.attributes);

        const input_data: EditObjectDialogData = {
            id: obj.id,
            name: obj.name,
            attributes: attributes_copy,
            name_suggestions: this.scene?.vocab?.objects,
            attribute_suggestions: this.scene?.vocab?.attributes,
        };

        const dialogRef = this.dialog.open(EditSceneGraphObjectDialog, {
            width: '550px',
            data: input_data,
        });

        dialogRef.afterClosed().subscribe((result: EditObjectDialogData) => {
            if (result) {
                obj.name = result.name;
                obj.attributes = result.attributes;

                this._scene?.graphObject_Overwrite(obj);
            } else {
                // edit cancelled, do nothing...
            }
        });
    }

    // change object bounding box
    onChangeObjectBoundingBox(object_id: string) {
        if (!this._scene?.graph) return;
        const obj = this._scene.graph.all_objects[object_id];
        if (!obj) return;

        // todo: consider refactoring this to use messages or something else instead
        this.widgetDisplayMode?.enterBoundingBoxPreviewMode(
            obj,
            (event, parameters) => {
                this.snackbar
                    .open(
                        "Draw your object's adjusted bounding box into the scene",
                        'Cancel'
                    )
                    .onAction()
                    .pipe(take(1))
                    .subscribe((result) => {
                        // todo: consider refactoring this to use messages or something else instead
                        this.widgetDisplayMode?.requestDisplayModeChange();
                    });
            },
            (event, parameters) => {
                if (parameters) {
                    const modified_object =
                        parameters[
                            BoundingBoxPreviewDisplayModeEventOutputParameter
                                .PREVIEW_RESULT
                        ];
                    if (modified_object) {
                        this._scene?.graphObject_Overwrite(modified_object);
                    }
                }

                // todo: consider refactoring this to use messages or something else instead
                this.widgetDisplayMode?.requestDisplayModeChange();
            },
            (event, parameters) => {
                // on cancel, do nothing...
            }
        );
    }

    // delete object (and relations)
    onRemoveObject(object_id: string) {
        if (!this._scene?.graph) return;

        const obj = this._scene.graph.all_objects[object_id];

        const input_data: DeleteObjectDialogData = {
            id: obj.id,
            name: obj.name,
        };

        const dialogRef = this.dialog.open(DeleteSceneGraphObjectDialog, {
            width: '480px',
            data: input_data,
        });

        dialogRef.afterClosed().subscribe((result: DeleteObjectDialogData) => {
            if (result) {
                this._scene?.graphObject_Delete(object_id);
            } else {
                // edit cancelled, do nothing...
            }
        });
    }

    // add object (set bounding box first, then edit name & attributes)
    onAddObject() {
        if (!this._scene) return;
        const new_object = this._scene.graphObject_Create();
        if (!new_object) return;

        // todo: consider refactoring this to use messages or something else instead
        this.widgetDisplayMode?.enterBoundingBoxPreviewMode(
            new_object,
            (event, parameters) => {
                this.snackbar
                    .open(
                        "Draw your new object's bounding box into the scene",
                        'Cancel'
                    )
                    .onAction()
                    .pipe(take(1))
                    .subscribe((result) => {
                        // todo: consider refactoring this to use messages or something else instead
                        this.widgetDisplayMode?.requestDisplayModeChange();
                    });
            },
            (event, parameters) => {
                if (parameters) {
                    const modified_object =
                        parameters[
                            BoundingBoxPreviewDisplayModeEventOutputParameter
                                .PREVIEW_RESULT
                        ];
                    if (modified_object) {
                        this._scene?.graphObject_Overwrite(modified_object);
                        this.onEditObject(modified_object.id);
                    }
                }
                // todo: consider refactoring this to use messages or something else instead
                this.widgetDisplayMode?.requestDisplayModeChange();
            },
            (event, parameters) => {
                if (parameters) {
                    const modified_object =
                        parameters[
                            BoundingBoxPreviewDisplayModeEventOutputParameter
                                .PREVIEW_RESULT
                        ];
                    if (modified_object) {
                        // if we cancel after adding a new object, delete the object again...
                        this._scene?.graphObject_Delete(modified_object.id);
                    }
                }
            }
        );
    }

    // edit relation name
    onEditRelation(relation_id: string) {
        if (!this._scene?.graph) return;

        const relation = this._scene.graph.all_relations[relation_id];
        const name_copy = relation.name;

        const from_obj_name =
            this._scene.graph.all_objects[relation.from_obj_id]?.name ||
            'unknown';
        const to_obj_name =
            this._scene.graph.all_objects[relation.to_obj_id]?.name ||
            'unknown';

        const input_data: EditRelationDialogData = {
            id: relation.id,
            name: relation.name,
            from_obj_name: from_obj_name,
            to_obj_name: to_obj_name,
            name_suggestions: this.scene?.vocab?.relations,
        };

        const dialogRef = this.dialog.open(EditSceneGraphRelationDialog, {
            width: '300px',
            data: input_data,
        });

        dialogRef.afterClosed().subscribe((result: EditRelationDialogData) => {
            if (result) {
                relation.name = result.name;
                this._scene?.graphRelation_Overwrite(relation);
            } else {
                // edit cancelled, do nothing...
            }
        });
    }

    // delete relation
    onRemoveRelation(relation_id: string) {
        if (!this._scene?.graph) return;

        const rel = this._scene.graph.all_relations[relation_id];

        const from_obj_name =
            this._scene.graph.all_objects[rel.from_obj_id]?.name || 'unknown';
        const to_obj_name =
            this._scene.graph.all_objects[rel.to_obj_id]?.name || 'unknown';

        const input_data: DeleteRelationDialogData = {
            id: rel.id,
            name: rel.name,
            from_obj_name: from_obj_name,
            to_obj_name: to_obj_name,
        };

        const dialogRef = this.dialog.open(DeleteSceneGraphRelationDialog, {
            width: undefined,
            data: input_data,
        });

        dialogRef
            .afterClosed()
            .subscribe((result: DeleteRelationDialogData) => {
                if (result) {
                    this._scene?.graphRelation_Delete(relation_id);
                } else {
                    // edit cancelled, do nothing...
                }
            });
    }

    // add relation (set source and target first, then edit description)
    onAddRelation() {
        if (!this._scene) return;

        this.widgetDisplayMode?.enterRelationPreviewMode(
            (event, parameters) => {
                this.snackbar
                    .open(
                        'Click to select a source object for your new relation',
                        'Cancel'
                    )
                    .onAction()
                    .pipe(take(1))
                    .subscribe((result) => {
                        // todo: consider refactoring this to use messages or something else instead
                        this.widgetDisplayMode?.requestDisplayModeChange();
                    });
            },
            (event, parameters) => {
                if (parameters) {
                    const relation_source_id =
                        parameters[
                            RelationPreviewDisplayModeEventOutputParameter
                                .PREVIEW_RESULT_SOURCE
                        ];
                    const relation_target_id =
                        parameters[
                            RelationPreviewDisplayModeEventOutputParameter
                                .PREVIEW_RESULT_TARGET
                        ];

                    const source =
                        this._scene?.graph?.all_objects[relation_source_id];
                    const target =
                        this._scene?.graph?.all_objects[relation_target_id];

                    if (source && target) {
                        const new_relation = this._scene?.graphRelation_Create(
                            source,
                            target
                        );

                        if (new_relation) this.onEditRelation(new_relation.id);
                    }
                }

                // todo: consider refactoring this to use messages or something else instead
                this.widgetDisplayMode?.requestDisplayModeChange();
            },
            (event, parameters) => {
                if (parameters) {
                    // no need to do anything on cancel
                }
            }
        );
    }

    onAddObjectButtonClicked(event: any) {
        this.onAddObject();
    }

    onAddRelationButtonClicked(event: any) {
        this.onAddRelation();
    }

    onCancelButtonClicked(event: any) {
        this.widgetDisplayMode?.requestDisplayModeChange();
    }
}

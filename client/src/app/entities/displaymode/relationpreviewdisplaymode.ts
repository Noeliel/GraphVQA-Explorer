/**
 * This is the code that handles defining new relations between objects.
 */

import { MatSnackBar } from '@angular/material/snack-bar';
import { take } from 'rxjs';
import { MouseDragEvent } from 'src/app/models/mousedragevent.model';
import { Point2D } from 'src/app/models/point2d.model';
import { _Crypto } from 'src/app/providers/crypto';
import {
    SceneGraphObject,
    SceneGraphObjectVisibility,
    SceneGraphRelation,
    SceneGraphRelationType,
    SceneGraphRelationVisibility,
} from '../scenegraph';
import {
    DisplayModeEventHooks,
    DisplayModeInputParameters,
    DisplayModeOutputParameters,
} from './interfaces/displaymode';
import { GroundTruthDisplayMode } from './groundtruthdisplaymode';
import { environment } from 'src/environments/environment';

export enum RelationPreviewDisplayModeEvent {
    STARTED = 'started',
    FINISHED = 'finished',
    CANCELLED = 'cancelled',
}

export enum RelationPreviewDisplayModeEventInputParameter {
    SNACKBAR_INPUT = 'snackbar',
    PREVIEW_INPUT = 'input',
}

export enum RelationPreviewDisplayModeEventOutputParameter {
    PREVIEW_RESULT_SOURCE = 'result_source',
    PREVIEW_RESULT_TARGET = 'result_target',
}

enum RelationCreationStage {
    NOT_STARTED = 0,
    SOURCE_SET = 1,
    TARGET_SET = 2,
    FINISHED = 3,
}

export class RelationPreviewDisplayMode extends GroundTruthDisplayMode {
    mouse_event_sub_key = _Crypto.randomUUID();
    private relation_source?: string;
    private relation_target?: string;
    private relation_projection?: string;
    private snackbar?: MatSnackBar;
    private did_finalize = false;
    private stage: RelationCreationStage = RelationCreationStage.NOT_STARTED;

    public trySetupPreview() {
        if (!this.parameters) return;
    }

    public trySetupSnackbar() {
        if (!this.parameters) return;

        this.snackbar =
            this.parameters[
                RelationPreviewDisplayModeEventInputParameter.SNACKBAR_INPUT
            ];
    }

    public tryFinalize() {
        this.did_finalize = true;

        if (!this.eventHooks) return;

        const parameters: DisplayModeOutputParameters = {};
        parameters[
            RelationPreviewDisplayModeEventOutputParameter.PREVIEW_RESULT_SOURCE
        ] = this.relation_source;
        parameters[
            RelationPreviewDisplayModeEventOutputParameter.PREVIEW_RESULT_TARGET
        ] = this.relation_target;

        this.eventHooks[RelationPreviewDisplayModeEvent.FINISHED](
            RelationPreviewDisplayModeEvent.FINISHED,
            parameters
        );
    }

    override setup(
        parameters: DisplayModeInputParameters,
        eventHooks: DisplayModeEventHooks
    ): RelationPreviewDisplayMode {
        super.setup(parameters, eventHooks);

        this.did_finalize = false;
        this.stage = RelationCreationStage.NOT_STARTED;

        this.trySetupSnackbar();
        this.trySetupPreview();

        this.controller.registerForSpecialMouseEvents(
            this.mouse_event_sub_key,
            (event: MouseDragEvent, point: Point2D) => {
                this.handleMouseDragEvent(event, point);
            }
        );

        this.controller.disableZoomAndPan();
        this.controller.enableSVGMouseDragEvents();

        if (this.eventHooks) {
            const parameters: DisplayModeOutputParameters = {};

            this.eventHooks[RelationPreviewDisplayModeEvent.STARTED](
                RelationPreviewDisplayModeEvent.STARTED,
                parameters
            );
        }

        return this;
    }

    override prepare_impl(): RelationPreviewDisplayMode {
        this.prepare_setup_base();
        this.prepare_setup_defs();
        this.prepare_setup_fg_relations();
        this.prepare_setup_fg_object_centers();
        this.prepare_setup_tooltip();

        return this;
    }

    override redraw_impl(): RelationPreviewDisplayMode {
        const scene_graph = this.controller.scene?.graph;
        if (!scene_graph) return this;

        const component = this;

        const all_objects = Object.values(scene_graph.all_objects);
        const preview_relations: SceneGraphRelation[] = [];

        // user has clicked at least 1x to set a source...
        // create fake SceneGraphRelation for preview
        if (
            this.relation_source &&
            (this.relation_target || this.relation_projection)
        ) {
            const preview: SceneGraphRelation = {
                id: '',
                name: 'related to',
                from_obj_id: this.relation_source || '',
                to_obj_id:
                    this.relation_target || this.relation_projection || '',
                visibility: SceneGraphRelationVisibility.VISIBLE,
                weights: [],
                rank: 0,
                type: SceneGraphRelationType.REGULAR,
            };

            preview_relations.push(preview);
        }

        this.redraw_update_background()?.on('contextmenu', function (event) {
            event.preventDefault();
        });

        this.redraw_update_fg_relations(preview_relations)?.style(
            'opacity',
            (d) => {
                return this.stage == RelationCreationStage.SOURCE_SET
                    ? '0.5'
                    : '1';
            }
        );

        this.redraw_update_defs();

        this.redraw_update_fg_object_centers(all_objects)
            // hovering over an object circle should render the object's bounding box and show a tooltip containing
            // ...the object's name and attributes
            ?.attr('stroke', (d) => {
                if (this.stage == RelationCreationStage.NOT_STARTED) {
                    if (d.id == this.relation_source) {
                        return environment.colors
                            .graph_node_stroke_selection_preview;
                    }
                }

                if (this.stage == RelationCreationStage.SOURCE_SET) {
                    if (d.id == this.relation_source) {
                        return environment.colors.graph_node_stroke_selected;
                    }

                    if (d.id == this.relation_projection) {
                        return environment.colors
                            .graph_node_stroke_selection_preview;
                    }
                }

                if (
                    this.stage == RelationCreationStage.TARGET_SET ||
                    this.stage == RelationCreationStage.FINISHED
                ) {
                    if (
                        d.id == this.relation_source ||
                        d.id == this.relation_target
                    ) {
                        return environment.colors.graph_node_stroke_selected;
                    }
                }

                return environment.colors.graph_node_stroke;
            })
            .on('mouseover', function (event) {
                const id =
                    this.attributes.getNamedItem('identifier')!.nodeValue!;

                scene_graph.setObjectsVisibility(
                    [id],
                    SceneGraphObjectVisibility.HIGHLIGHTED
                );

                component.redraw();
                component.showObjectTooltip(id, event.pageX, event.pageY);
            })
            .on('mouseout', function () {
                const id =
                    this.attributes.getNamedItem('identifier')!.nodeValue!;

                scene_graph.setObjectsVisibility(
                    [id],
                    SceneGraphObjectVisibility.VISIBLE
                );

                component.redraw();
                component.hideTooltip();
            });

        return this;
    }

    override teardown(): RelationPreviewDisplayMode {
        this.snackbar?.dismiss();

        if (!this.did_finalize) {
            if (this.eventHooks) {
                const parameters: DisplayModeOutputParameters = {};

                this.eventHooks[RelationPreviewDisplayModeEvent.CANCELLED](
                    RelationPreviewDisplayModeEvent.CANCELLED,
                    parameters
                );
            }
        }

        this.controller.unregisterFromSpecialMouseEvents(
            this.mouse_event_sub_key
        );

        this.controller.disableSVGMouseDragEvents();
        this.controller.enableZoomAndPan();

        this.relation_source = undefined;
        this.relation_target = undefined;
        this.relation_projection = undefined;
        this.snackbar = undefined;

        super.teardown();

        return this;
    }

    private findClosestObjectToPoint(
        point: Point2D,
        blocked_obj_id: string | undefined
    ): SceneGraphObject | undefined {
        const scene_graph = this.controller.scene?.graph;
        if (!scene_graph) return;

        const all_objects = Object.values(scene_graph.all_objects);

        let closest_object = undefined;
        let closest_object_distance = Number.POSITIVE_INFINITY;

        all_objects.forEach((obj) => {
            const distance = point.euclideanDistanceTo(obj.center);

            if (
                distance < closest_object_distance &&
                (!blocked_obj_id || blocked_obj_id != obj.id)
            ) {
                closest_object_distance = distance;
                closest_object = obj;
            }
        });

        return closest_object;
    }

    private preparePreviewStage(obj: SceneGraphObject) {
        switch (this.stage) {
            case RelationCreationStage.NOT_STARTED:
                this.relation_target = undefined;
                this.relation_projection = undefined;
                this.relation_source = obj.id;
                break;

            case RelationCreationStage.SOURCE_SET:
                this.relation_target = undefined;
                this.relation_projection = obj.id;
                break;

            case RelationCreationStage.TARGET_SET:
                this.relation_projection = undefined;
                this.relation_target = obj.id;
                break;

            default:
                break;
        }
    }

    // cycle: given a mouse event, ...
    // NOT_STARTED + any event -> (*) upon mouse drag, update relation_source for source object preview (and clear target and target projection)
    // NOT_STARTED + Event.END -> SOURCE_SET
    // SOURCE_SET + any event except Event.END -> upon mouse drag, update relation_projection for target object preview
    // SOURCE_SET + Event.END -> TARGET_SET -> set relation_target to relation_projection -> FINISHED
    // FINISHED + any event -> NOT_STARTED -> goto (*)
    public handleMouseDragEvent(event: MouseDragEvent, point: Point2D) {
        let blocked_obj_id = undefined;

        if (event == MouseDragEvent.START) {
            this.snackbar?.dismiss();
        }

        if (this.stage == RelationCreationStage.FINISHED)
            this.stage = RelationCreationStage.NOT_STARTED;

        if (this.stage == RelationCreationStage.SOURCE_SET) {
            blocked_obj_id = this.relation_source;
        }

        if (
            event == MouseDragEvent.END &&
            this.stage == RelationCreationStage.SOURCE_SET
        ) {
            this.stage = RelationCreationStage.TARGET_SET;
        }

        const obj = this.findClosestObjectToPoint(point, blocked_obj_id);
        if (obj) this.preparePreviewStage(obj);

        if (event == MouseDragEvent.END) {
            this.stage += 1;

            switch (this.stage) {
                case RelationCreationStage.SOURCE_SET:
                    this.snackbar?.open('Click to select your target object');
                    break;

                case RelationCreationStage.FINISHED:
                    this.snackbar
                        ?.open('Finalize relation?', 'Accept')
                        .onAction()
                        .pipe(take(1))
                        .subscribe((result) => {
                            this.tryFinalize();
                        });
                    break;
                default:
                    break;
            }
        }

        this.redraw();
    }
}

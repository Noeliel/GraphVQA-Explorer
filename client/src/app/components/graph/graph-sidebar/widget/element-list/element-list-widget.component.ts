import {
    Component,
    OnDestroy,
    OnInit,
    QueryList,
    ViewChild,
    ViewChildren,
} from '@angular/core';
import { MatListOption, MatSelectionList } from '@angular/material/list';
import { Subscription } from 'rxjs';
import { PredictionDisplayMode } from 'src/app/entities/displaymode/predictiondisplaymode';
import {
    SceneGraphObject,
    SceneGraphRelation,
    SceneGraphRelationType,
} from 'src/app/entities/scenegraph';
import {
    ElementListElement,
    ElementListElementType,
} from 'src/app/models/elementlist.model';
import {
    FilterStatusMessage,
    MessageSubjectFilter,
} from 'src/app/models/messages/filter-message.model';
import {
    MessageSubjectUIEvent,
    UIEventPopoutMessage,
    UIEventPopoutType,
} from 'src/app/models/messages/ui-event-message.model';
import {
    MessageSubjectWeight,
    WeightStatusMessage,
} from 'src/app/models/messages/weight-message.model';
import { MBChannel, MessageBusService } from 'src/app/providers/message-bus';
import { GraphSidebarComponent } from '../../graph-sidebar.component';
import { ElementListRipple } from './directive/elementlistoptionripple';

@Component({
    selector: 'app-element-list-widget',
    templateUrl: './element-list-widget.component.html',
    styleUrls: ['./element-list-widget.component.scss'],
})
export class ElementListWidgetComponent implements OnInit, OnDestroy {
    objects: ElementListElement[] = [];
    relations: ElementListElement[] = [];
    synthetic_relations: ElementListElement[] = [];

    // for updating element list when filter changes
    private filter_status_subscription: Subscription | undefined;

    // for updating element list when weight update is finished
    private weight_status_subscription: Subscription | undefined;

    // ELEMENT LIST
    @ViewChild('elements')
    elementList!: MatSelectionList;

    @ViewChildren(ElementListRipple)
    ripples!: QueryList<ElementListRipple>;

    constructor(public controller: GraphSidebarComponent) {}

    ngOnInit(): void {
        if (!this.filter_status_subscription)
            this.filter_status_subscription =
                MessageBusService.subscribe<FilterStatusMessage>(
                    MBChannel.FILTER,
                    MessageSubjectFilter.STATUS,
                    {
                        next: () => {
                            this.updateListElements();
                        },
                    }
                );

        if (!this.weight_status_subscription)
            this.weight_status_subscription =
                MessageBusService.subscribe<WeightStatusMessage>(
                    MBChannel.WEIGHT,
                    MessageSubjectWeight.STATUS,
                    {
                        next: () => {
                            this.updateListElements();
                        },
                    }
                );
    }

    ngOnDestroy(): void {
        if (this.filter_status_subscription) {
            this.filter_status_subscription.unsubscribe();
            this.filter_status_subscription = undefined;
        }

        if (this.weight_status_subscription) {
            this.weight_status_subscription.unsubscribe();
            this.weight_status_subscription = undefined;
        }
    }

    updateListElements() {
        if (!this.controller._scene?.graph) return;

        this.objects = [];
        this.relations = [];
        this.synthetic_relations = [];

        const sorted_objects: SceneGraphObject[] = [];
        Object.values(this.controller._scene.graph.filtered_objects).forEach(
            (obj) => {
                sorted_objects.push(obj);
            }
        );
        // sort alphabetically by name
        sorted_objects.sort((a, b) => a.name.localeCompare(b.name));

        let sorted_relations: SceneGraphRelation[] = [];
        Object.values(this.controller._scene.graph.filtered_relations).forEach(
            (rel) => {
                sorted_relations.push(rel);
            }
        );
        // sort alphabetically by name
        sorted_relations.sort((a, b) => a.name.localeCompare(b.name));

        // todo: find a better way to do this
        if (
            this.controller.widgetDisplayMode?.tab ==
            this.controller.widgetDisplayMode?.GroundTruthDisplayModeTab
        ) {
            // sorted_data.sort((a, b) => a.id.localeCompare(b.id)); // order für tensor?

            sorted_objects.forEach((obj) => {
                this.objects.push({
                    id: obj.id,
                    name: obj.name,
                    description: obj.attributes.join(', '),
                    type: ElementListElementType.OBJECT,
                });
            });

            sorted_relations.forEach((rel) => {
                if (rel.type == SceneGraphRelationType.REGULAR) {
                    this.relations.push({
                        id: rel.id,
                        name: rel.name,
                        description:
                            this.controller._scene!.graph!.all_objects[
                                rel.from_obj_id
                            ].name +
                            ' → ' +
                            this.controller._scene!.graph!.all_objects[
                                rel.to_obj_id
                            ].name,
                        type: ElementListElementType.RELATION,
                    });
                }
            });
        }
        // todo: find a better way to do this
        else if (
            this.controller.widgetDisplayMode?.tab ==
            this.controller.widgetDisplayMode?.PredictionDisplayModeTab
        ) {
            // also sort by weight
            sorted_objects.sort((a, b) => b.weight - a.weight);

            sorted_objects.forEach((obj) => {
                this.objects.push({
                    id: obj.id,
                    name: obj.name,
                    description: this.processWeightForDisplay(obj.weight) + '%',
                    type: ElementListElementType.OBJECT,
                });
            });

            let weight_step = 0;

            const display_mode = this.controller.root.vis.display_mode;
            if (display_mode && display_mode instanceof PredictionDisplayMode) {
                weight_step = display_mode.convolution_index();
            }

            sorted_relations = sorted_relations.filter(
                (rel) => rel.weights[weight_step] > 0
            );
            sorted_relations.sort((a, b) => {
                return b.weights[weight_step] - a.weights[weight_step];
            });

            sorted_relations.forEach((rel) => {
                const from_obj =
                    this.controller._scene!.graph!.all_objects[rel.from_obj_id];
                const to_obj =
                    this.controller._scene!.graph!.all_objects[rel.to_obj_id];

                if (rel.type == SceneGraphRelationType.REGULAR) {
                    this.relations.push({
                        id: rel.id,
                        name:
                            from_obj.name +
                            ' is ' +
                            rel.name +
                            ' ' +
                            to_obj.name,
                        description:
                            this.processWeightForDisplay(
                                rel.weights[weight_step]
                            ) + '%',
                        type: ElementListElementType.RELATION,
                    });
                } else {
                    this.synthetic_relations.push({
                        id: rel.id,
                        name: from_obj.name + ' → ' + to_obj.name,
                        description:
                            this.processWeightForDisplay(
                                rel.weights[weight_step]
                            ) + '%',
                        type: ElementListElementType.RELATION,
                    });
                }
            });
        }
    }

    highlightListElement(element_id: string) {
        for (let i = 0; i < this.elementList.options.length; i++) {
            const option = this.elementList.options.get(i);
            const element: ElementListElement = option?.value;

            if (element.id == element_id) {
                this.ripples.forEach((ripple) => {
                    if (
                        ripple.elRef.nativeElement == option?._getHostElement()
                    ) {
                        ripple.launch({ centered: true });
                        option?.focus();

                        // this causes a bug where popout animations aren't triggered until the user clicks a different list element first
                        // option?._setSelected(true);
                    }
                });

                break;
            }
        }
    }

    onElementListSelection(event: any, selected: MatListOption[]) {
        const element: ElementListElement = selected[0].value;

        if (!element) return;

        const popoutTypeForSectionType = function (
            type: ElementListElementType
        ): UIEventPopoutType {
            switch (type) {
                case ElementListElementType.OBJECT:
                    return UIEventPopoutType.OBJECTS;

                case ElementListElementType.RELATION:
                    return UIEventPopoutType.RELATIONS;

                default:
                    return UIEventPopoutType.NONE;
            }
        };

        MessageBusService.publish<UIEventPopoutMessage>(
            MBChannel.UI,
            MessageSubjectUIEvent.POPOUT,
            {
                type: popoutTypeForSectionType(element.type),
                ids: [element.id],
            }
        );

        this.elementList.deselectAll();
    }

    onEditElementListObjectButtonClicked(event: any, object_id: string) {
        event.stopPropagation();
        this.controller.onEditObject(object_id);
    }

    onChangeElementListObjectBoundingBoxButtonClicked(
        event: any,
        object_id: string
    ) {
        event.stopPropagation();
        this.controller.onChangeObjectBoundingBox(object_id);
    }

    onRemoveElementListObjectButtonClicked(event: any, object_id: string) {
        event.stopPropagation();
        this.controller.onRemoveObject(object_id);
    }

    onEditElementListRelationButtonClicked(event: any, relation_id: string) {
        event.stopPropagation();
        this.controller.onEditRelation(relation_id);
    }

    onRemoveElementListRelationButtonClicked(event: any, relation_id: string) {
        event.stopPropagation();
        this.controller.onRemoveRelation(relation_id);
    }

    processWeightForDisplay(raw_weight: number): string {
        return (raw_weight * 100).toFixed(0);
    }
}

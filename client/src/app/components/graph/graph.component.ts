import {
    AfterContentInit,
    AfterViewInit,
    Component,
    OnInit,
    ViewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { Scene } from 'src/app/entities/scene';
import {
    SceneGraphObjectVisibility,
    SceneGraphRelationVisibility,
} from 'src/app/entities/scenegraph';
import {
    FilterStatusMessage,
    FilterUpdateMessage,
    MessageSubjectFilter,
} from 'src/app/models/messages/filter-message.model';
import {
    MessageSubjectUIEvent,
    UIEventRedrawMessage,
} from 'src/app/models/messages/ui-event-message.model';
import {
    MessageSubjectWeight,
    WeightStatusMessage,
    WeightUpdateMessage,
} from 'src/app/models/messages/weight-message.model';
import { MBChannel, MessageBusService } from 'src/app/providers/message-bus';
import { BackendService } from 'src/app/services/backend/backend.service';
import { SceneFactoryService } from 'src/app/services/scene-factory/scene-factory.service';
import { _Crypto } from '../../providers/crypto';
import { GraphSidebarComponent } from './graph-sidebar/graph-sidebar.component';
import { GraphVisComponent } from './graph-vis/graph-vis.component';

@Component({
    selector: 'app-graph',
    templateUrl: './graph.component.html',
    styleUrls: ['./graph.component.scss'],
})
export class GraphComponent implements OnInit, AfterContentInit, AfterViewInit {
    private scene_ids?: string[];

    public scene?: Scene;
    private scene_changed_subscription_key = _Crypto.randomUUID();

    private weight_subscription: Subscription | undefined;
    private filter_subscription: Subscription | undefined;

    @ViewChild('graphVis')
    public vis!: GraphVisComponent;

    @ViewChild('graphSidebar')
    public sidebar!: GraphSidebarComponent;

    constructor(
        private backend: BackendService,
        private sceneFactory: SceneFactoryService,
        private activatedRoute: ActivatedRoute
    ) {}

    ngOnInit(): void {
        // console.log('ngOnInit()');

        this.backend.requestSceneIDs((response) => {
            this.scene_ids = response;
            this.loadSceneData();
        });
    }

    ngAfterContentInit(): void {
        // console.log('ngAfterContentInit()');
    }

    ngAfterViewInit(): void {
        // console.log('ngAfterViewInit()');
    }

    ngOnDestroy(): void {
        if (this.weight_subscription) {
            this.weight_subscription.unsubscribe();
            this.weight_subscription = undefined;
        }

        if (this.filter_subscription) {
            this.filter_subscription.unsubscribe();
            this.filter_subscription = undefined;
        }

        if (this.scene) {
            this.scene = undefined;
        }
    }

    private getViableSceneID(): string {
        const route_id = this.activatedRoute.snapshot.paramMap.get('id');
        let id = '0';

        if (
            route_id &&
            route_id.length > 0 &&
            this.scene_ids?.includes(route_id)
        ) {
            id = route_id;
        } else if (this.scene_ids) {
            id =
                this.scene_ids[
                    Math.floor(Math.random() * this.scene_ids.length) %
                        this.scene_ids.length
                ];
        }

        return id;
    }

    private loadSceneData() {
        let random_id_str = this.getViableSceneID();

        this.sceneFactory.newSceneFromID(random_id_str).then((scene) => {
            // this.scene_graph_json = JSON.stringify(response); // for debugging
            this.scene = scene;

            // third redraw in setup, triggers when processor is done computing colors
            this.scene.registerGraphChangedCallback(
                this.scene_changed_subscription_key,
                (sender) => {
                    this.issueVisualizationRerender();
                }
            );

            // no need to listen to image changes, as graph-vis takes care of preparing the image
            // ...which also triggers a redraw

            this.weight_subscription =
                MessageBusService.subscribe<WeightUpdateMessage>(
                    MBChannel.WEIGHT,
                    MessageSubjectWeight.UPDATE,
                    {
                        next: (message) => {
                            if (this.scene?.graph) {
                                this.scene.graph.setObjectWeights(
                                    message.object_weights
                                );
                                this.scene.graph.setRelationWeights(
                                    message.relation_weights
                                );

                                // notify sidebar to trigger the list element refresh
                                MessageBusService.publish<WeightStatusMessage>(
                                    MBChannel.WEIGHT,
                                    MessageSubjectWeight.STATUS,
                                    { description: 'Weights changed' }
                                );

                                this.issueVisualizationRerender();
                            }
                        },
                    }
                );

            this.filter_subscription =
                MessageBusService.subscribe<FilterUpdateMessage>(
                    MBChannel.FILTER,
                    MessageSubjectFilter.UPDATE,
                    {
                        next: (message) => {
                            if (this.scene?.graph) {
                                this.scene.graph.changeObjectsVisibility(
                                    null,
                                    SceneGraphObjectVisibility.VISIBLE
                                );
                                this.scene.graph.changeRelationsVisibility(
                                    null,
                                    SceneGraphRelationVisibility.VISIBLE
                                );

                                this.scene.graph.setFilterConfig(
                                    message.new_config
                                );

                                // notify sidebar to trigger the list element refresh
                                MessageBusService.publish<FilterStatusMessage>(
                                    MBChannel.FILTER,
                                    MessageSubjectFilter.STATUS,
                                    { description: 'Filters changed' }
                                );

                                // rerender visualization to hide the filtered elements
                                this.issueVisualizationRerender();
                            }
                        },
                    }
                );
        });
    }

    private issueVisualizationRerender() {
        MessageBusService.publish<UIEventRedrawMessage>(
            MBChannel.UI,
            MessageSubjectUIEvent.REDRAW,
            {
                description: 'Graph component requests redraw',
            }
        );
    }
}

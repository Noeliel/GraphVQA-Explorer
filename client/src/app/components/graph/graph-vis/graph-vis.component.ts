import {
    FlexibleConnectedPositionStrategyOrigin,
    Overlay,
    OverlayRef,
} from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import {
    AfterContentInit,
    AfterViewInit,
    Component,
    ElementRef,
    Input,
    OnInit,
    TemplateRef,
    ViewChild,
    ViewContainerRef,
} from '@angular/core';
import * as d3 from 'd3';
import { Subscription } from 'rxjs';
import { BoundingBoxPreviewDisplayMode } from 'src/app/entities/displaymode/boundingboxpreviewdisplaymode';
import { GroundTruthDisplayMode } from 'src/app/entities/displaymode/groundtruthdisplaymode';
import { DisplayMode } from 'src/app/entities/displaymode/interfaces/displaymode';
import { DisplayModeController } from 'src/app/entities/displaymode/interfaces/displaymodecontroller';
import { PredictionDisplayMode } from 'src/app/entities/displaymode/predictiondisplaymode';
import { RelationPreviewDisplayMode } from 'src/app/entities/displaymode/relationpreviewdisplaymode';
import { Scene } from 'src/app/entities/scene';
import {
    DisplayModeStatusMessage,
    DisplayModeUpdateMessage,
    MessageSubjectDisplayMode,
} from 'src/app/models/messages/display-mode-message.model';
import {
    MessageSubjectUIEvent,
    UIEventPopoutMessage,
    UIEventPopoutType,
    UIEventRedrawMessage,
} from 'src/app/models/messages/ui-event-message.model';
import { MouseDragEvent } from 'src/app/models/mousedragevent.model';
import { Point2D } from 'src/app/models/point2d.model';
import { _Crypto } from 'src/app/providers/crypto';
import { MBChannel, MessageBusService } from 'src/app/providers/message-bus';
import { GraphComponent } from '../graph.component';

@Component({
    selector: 'app-graph-vis',
    templateUrl: './graph-vis.component.html',
    styleUrls: ['./graph-vis.component.scss'],
})
export class GraphVisComponent
    extends DisplayModeController
    implements OnInit, AfterContentInit, AfterViewInit
{
    private _scene?: Scene;
    image: string | undefined;
    scene_changed_subscription_key = _Crypto.randomUUID();

    private display_modes = new Map();

    @ViewChild('svgContainer', { read: ElementRef, static: true })
    private svgContainerRef!: ElementRef<HTMLDivElement>;

    private svg?: d3.Selection<SVGSVGElement, unknown, null, undefined>;
    private svgInner?: d3.Selection<SVGGElement, unknown, null, undefined>;

    // ----- hovering elements -----

    @ViewChild('svgTooltip', { read: ElementRef, static: true })
    private svgTooltipRef!: ElementRef<HTMLDivElement>;

    @ViewChild('resetZoomPanButton', { read: ElementRef, static: true })
    private resetZoomPanButton!: ElementRef<HTMLButtonElement>;

    @ViewChild('toggleBackgroundButton', { read: ElementRef, static: true })
    private toggleBackgroundButton!: ElementRef<HTMLButtonElement>;

    viewIsZoomed = false;
    shouldShowZoomPanButton = false;
    shouldShowToggleBackgroundButton = false;

    // -----------------------------
    // ----- overlay elements -----

    @ViewChild('addElementContextMenu')
    private addElementContextMenu!: TemplateRef<any>;

    @ViewChild('objectContextMenu')
    private objectContextMenu!: TemplateRef<any>;

    @ViewChild('relationContextMenu')
    private relationContextMenu!: TemplateRef<any>;

    // this is for the context menu for creating, editing, ... elements
    private overlayRef?: OverlayRef;

    // this is for displaymode widgets
    @ViewChild('widgetContainer', { read: ViewContainerRef })
    private widgetContainerRef!: ViewContainerRef;

    // ----------------------------

    private zoom?: d3.ZoomBehavior<Element, unknown>;
    private mark?: d3.DragBehavior<Element, unknown, unknown>;

    private rerender_subscription: Subscription | undefined;
    private popout_subscription: Subscription | undefined;
    private dispmode_subscription: Subscription | undefined;

    constructor(
        private overlay: Overlay,
        private viewContainerRef: ViewContainerRef,
        public root: GraphComponent
    ) {
        super();
        this.overlayRef = this.overlay.create();
    }

    ngOnInit(): void {
        // console.log('ngOnInit()');
    }

    ngAfterContentInit(): void {
        // console.log('ngAfterContentInit()');
    }

    ngAfterViewInit(): void {
        // console.log('ngAfterViewInit()');

        // create the SVG element
        this.setupDOMIfNecessary();

        this.display_modes.set(
            'GroundTruthDisplayMode',
            new GroundTruthDisplayMode(
                this.svgInner!,
                this.svgTooltipRef,
                this.widgetContainerRef,
                this
            )
        );

        this.display_modes.set(
            'PredictionDisplayMode',
            new PredictionDisplayMode(
                this.svgInner!,
                this.svgTooltipRef,
                this.widgetContainerRef,
                this
            )
        );

        this.display_modes.set(
            'BoundingBoxPreviewDisplayMode',
            new BoundingBoxPreviewDisplayMode(
                this.svgInner!,
                this.svgTooltipRef,
                this.widgetContainerRef,
                this
            )
        );

        this.display_modes.set(
            'RelationPreviewDisplayMode',
            new RelationPreviewDisplayMode(
                this.svgInner!,
                this.svgTooltipRef,
                this.widgetContainerRef,
                this
            )
        );

        this.subToMessageBusIfNecessary();
    }

    ngOnDestroy(): void {
        this.display_modes.forEach((mode: DisplayMode) => {
            mode.clearPrefsAndSubscriptionsForDestruction();
        });

        this.display_modes.clear();

        if (this.rerender_subscription) {
            this.rerender_subscription.unsubscribe();
            this.rerender_subscription = undefined;
        }

        if (this.popout_subscription) {
            this.popout_subscription.unsubscribe();
            this.popout_subscription = undefined;
        }

        if (this.dispmode_subscription) {
            this.dispmode_subscription.unsubscribe();
            this.dispmode_subscription = undefined;
        }
    }

    get scene(): Scene | undefined {
        return this._scene;
    }

    @Input() set scene(value: Scene | undefined) {
        if (this._scene) {
            /* this._scene.unregisterGraphChangedCallback(
                this.scene_changed_subscription_key
            ); */
            this._scene.unregisterImageChangedCallback(
                this.scene_changed_subscription_key
            );
        }

        this._scene = value;

        // the following is not necessary since the graph is already defined when we get here
        /* this._scene?.registerGraphChangedCallback(
            this.scene_changed_subscription_key,
            (sender) => {
                // this should set the viewbox according to new graph dimensions
                this.setupDOMIfNecessary();
            }
        ); */

        this._scene?.registerImageChangedCallback(
            this.scene_changed_subscription_key,
            (sender) => {
                // here's our background image
                this.prepareImage();
            }
        );

        // this sets up the base dom elements
        this.setupDOMIfNecessary();

        // just to make sure we aren't missing the image
        // ..it's probably still undefined though
        if (this._scene?.image) {
            this.prepareImage();
        }

        if (this.svg) {
            if (value?.graph)
                this.display_modes
                    .get('GroundTruthDisplayMode')
                    ?.setup()
                    .redraw();
        }
    }

    private subToMessageBusIfNecessary() {
        if (!this.rerender_subscription)
            this.rerender_subscription =
                MessageBusService.subscribe<UIEventRedrawMessage>(
                    MBChannel.UI,
                    MessageSubjectUIEvent.REDRAW,
                    {
                        next: () => {
                            this.display_mode?.redraw();
                        },
                    }
                );

        if (!this.popout_subscription)
            this.popout_subscription =
                MessageBusService.subscribe<UIEventPopoutMessage>(
                    MBChannel.UI,
                    MessageSubjectUIEvent.POPOUT,
                    {
                        next: (message) => {
                            switch (message.type) {
                                case UIEventPopoutType.OBJECTS:
                                    this.display_mode?.handleObjectsInteraction(
                                        message.ids
                                    );
                                    break;

                                case UIEventPopoutType.RELATIONS:
                                    this.display_mode?.handleRelationsInteraction(
                                        message.ids
                                    );
                                    break;

                                default:
                                    break;
                            }
                        },
                    }
                );

        if (!this.dispmode_subscription)
            this.dispmode_subscription =
                MessageBusService.subscribe<DisplayModeUpdateMessage>(
                    MBChannel.DISPLAYMODE,
                    MessageSubjectDisplayMode.UPDATE,
                    {
                        next: (message) => {
                            const requested_mode = this.display_modes.get(
                                message.mode
                            );

                            // todo: consider introducing bool 'allows_reinitialization' to display modes
                            if (requested_mode != this.display_mode) {
                                requested_mode
                                    .setup(
                                        message.parameters,
                                        message.eventHooks
                                    )
                                    .redraw();

                                MessageBusService.publish<DisplayModeStatusMessage>(
                                    MBChannel.DISPLAYMODE,
                                    MessageSubjectDisplayMode.STATUS,
                                    {
                                        mode: message.mode,
                                    }
                                );
                            }
                        },
                    }
                );
    }

    // set up scene graph svg layers and dimensions
    // this._scene_graph must be populated before calling this
    // private setupGraph() {
    // const foreground = this.svgFG;
    /*
        this.svgBase
            .on('mouseover', function () {
                foreground.attr('visibility', 'visible');
            })
            .on('mouseout', function () {
                foreground.attr('visibility', 'hidden');
            });
        */
    // }

    /**
     * Might need to call this multiple times (to create the SVG dom element
     * and to set the viewbox when the scene graph is available).
     */
    private setupDOMIfNecessary() {
        if (!this.svg) {
            const component = this;

            // this is a bit of a hack since directly accessing this component's own ElementRef
            // through @ViewChild so early in the lifecycle doesn't seem to work
            const componentDOM = d3.select(
                this.svgContainerRef.nativeElement.parentElement
            );

            componentDOM
                .on('mouseover', function () {
                    component.shouldShowToggleBackgroundButton = true;
                    component.shouldShowZoomPanButton = true;
                })
                .on('mouseleave', function () {
                    component.shouldShowToggleBackgroundButton = false;
                    component.shouldShowZoomPanButton = false;
                });

            const svgContainer = d3.select(this.svgContainerRef.nativeElement);

            this.svg = svgContainer
                .append('svg')
                .attr('viewBox', '0 0 0 0')
                .attr('width', '100%')
                .attr('height', '100%');

            this.svgInner = this.svg.append('g').attr('class', 'g.svg-inner');

            this.setupZoomAndPan();
            this.setupSVGMouseDragEvents();

            this.enableZoomAndPan();

            // this.enableBoundingBoxMarking();
        }

        if (this._scene?.graph)
            this.svg!.attr(
                'viewBox',
                '0 0 ' +
                    this._scene.graph.width +
                    ' ' +
                    this._scene.graph.height
            );
    }

    public setupZoomAndPan() {
        this.zoom = d3.zoom().on('zoom', (zoom) => {
            this.svgInner?.attr('transform', zoom.transform);
            this.viewIsZoomed = true;
        });
    }

    public enableZoomAndPan() {
        this.svg?.call(
            // unfortunately this is necessary...
            this.zoom as unknown as (
                selection: d3.Selection<
                    SVGSVGElement,
                    unknown,
                    null,
                    undefined
                >,
                ...args: any[]
            ) => void
        );
    }

    public disableZoomAndPan() {
        this.svg?.on('.zoom', null);
    }

    public resetZoomPan() {
        this.zoom?.transform(
            this.svg as unknown as d3.Selection<Element, unknown, any, any>,
            d3.zoomIdentity
        );

        this.svgInner?.attr('transform', null);
        this.viewIsZoomed = false;
    }

    public setupSVGMouseDragEvents() {
        this.mark = d3.drag();

        this.mark.on('start', (event) => {
            const point = this.getMouseCoordinatesRelativeToSVGInner(event);

            Object.keys(this.specialMouseEventSubscriptions).forEach(
                (sub_key) => {
                    this.specialMouseEventSubscriptions[sub_key].callback(
                        MouseDragEvent.START,
                        point
                    );
                }
            );
        });

        this.mark.on('end', (event) => {
            const point = this.getMouseCoordinatesRelativeToSVGInner(event);

            Object.keys(this.specialMouseEventSubscriptions).forEach(
                (sub_key) => {
                    this.specialMouseEventSubscriptions[sub_key].callback(
                        MouseDragEvent.END,
                        point
                    );
                }
            );
        });

        this.mark.on('drag', (event) => {
            const point = this.getMouseCoordinatesRelativeToSVGInner(event);

            Object.keys(this.specialMouseEventSubscriptions).forEach(
                (sub_key) => {
                    this.specialMouseEventSubscriptions[sub_key].callback(
                        MouseDragEvent.DRAG,
                        point
                    );
                }
            );
        });
    }

    public enableSVGMouseDragEvents() {
        this.svgInner?.call(
            // unfortunately this is necessary...
            this.mark as unknown as (
                selection: d3.Selection<SVGGElement, unknown, null, undefined>,
                ...args: any[]
            ) => void
        );
    }

    public disableSVGMouseDragEvents() {
        this.svgInner?.on('.drag', null);
    }

    public prepareImage() {
        if (!this._scene?.image) return;

        const imageReader = new FileReader();
        imageReader.onloadend = (e) => {
            // [imageReader.result!.toString()]
            this.image = imageReader.result!.toString();
            this.display_mode?.redraw();
        };
        imageReader.readAsDataURL(this._scene.image);
    }

    handleDisplayModePreferencesChanged(): void {
        this.display_mode?.redraw();
    }

    public getMouseCoordinatesRelativeToSVGInner(event: any): Point2D {
        /* const outerRect = this.svg?.node()?.getBoundingClientRect();
        const innerRect = this.svgInner?.node()?.getBoundingClientRect();

        if (!outerRect || !innerRect) return { x: 0, y: 0 };

        const diffX = innerRect.x - outerRect.x;
        const diffY = innerRect.y - outerRect.y;

        const x = event.x - diffX;
        const y = event.y - diffY; */

        let x = event.x;
        let y = event.y;

        // user draws rect relative to transformed node, and the resulting coordinates are being transformed again when drawn on screen
        // ...therefore, we need to apply the opposite transformation upfront to get the correct coordinates

        const node = this.svgInner?.node();

        if (node) {
            const transform = d3.zoomTransform(node as Element);

            x = (event.x - transform.x) * (1 / transform.k);
            y = (event.y - transform.y) * (1 / transform.k);
        }

        return new Point2D(x, y);
    }

    // todo: context menu stuff would be better kept inside the display modes, since the
    // available actions would reasonably depend on the currently active display mode
    onOpenBackgroundContextMenu(event: MouseEvent) {
        this.overlayRef?.detach();

        const origin: FlexibleConnectedPositionStrategyOrigin = {
            x: event.pageX,
            y: event.pageY,
        };

        const positionStrategy = this.overlay
            .position()
            .flexibleConnectedTo(this.svgContainerRef)
            .withPositions([
                {
                    originX: 'start',
                    originY: 'bottom',
                    overlayX: 'start',
                    overlayY: 'top',
                },
            ])
            .setOrigin(origin);

        this.overlayRef?.updatePositionStrategy(positionStrategy);

        const contextMenuOverlay = new TemplatePortal(
            this.addElementContextMenu,
            this.viewContainerRef
        );

        this.overlayRef?.attach(contextMenuOverlay);
    }

    onOpenObjectContextMenu(event: MouseEvent, obj_id: string) {
        this.overlayRef?.detach();

        const origin: FlexibleConnectedPositionStrategyOrigin = {
            x: event.pageX,
            y: event.pageY,
        };

        const positionStrategy = this.overlay
            .position()
            .flexibleConnectedTo(this.svgContainerRef)
            .withPositions([
                {
                    originX: 'start',
                    originY: 'bottom',
                    overlayX: 'start',
                    overlayY: 'top',
                },
            ])
            .setOrigin(origin);

        this.overlayRef?.updatePositionStrategy(positionStrategy);

        const contextMenuOverlay = new TemplatePortal(
            this.objectContextMenu,
            this.viewContainerRef,
            { $implicit: obj_id }
        );

        this.overlayRef?.attach(contextMenuOverlay);
    }

    onOpenRelationContextMenu(event: MouseEvent, rel_id: string) {
        this.overlayRef?.detach();

        const origin: FlexibleConnectedPositionStrategyOrigin = {
            x: event.pageX,
            y: event.pageY,
        };

        const positionStrategy = this.overlay
            .position()
            .flexibleConnectedTo(this.svgContainerRef)
            .withPositions([
                {
                    originX: 'start',
                    originY: 'bottom',
                    overlayX: 'start',
                    overlayY: 'top',
                },
            ])
            .setOrigin(origin);

        this.overlayRef?.updatePositionStrategy(positionStrategy);

        const contextMenuOverlay = new TemplatePortal(
            this.relationContextMenu,
            this.viewContainerRef,
            { $implicit: rel_id }
        );

        this.overlayRef?.attach(contextMenuOverlay);
    }

    closeContextMenu() {
        this.overlayRef?.detach();
    }

    onBackgroundContextMenuAddObject() {
        this.closeContextMenu();
        this.root.sidebar.onAddObject();
    }

    onBackgroundContextMenuAddRelation() {
        this.closeContextMenu();
        this.root.sidebar.onAddRelation();
    }

    onObjectContextMenuEditObject(obj_id: string) {
        this.closeContextMenu();
        this.root.sidebar.onEditObject(obj_id);
    }

    onObjectContextMenuResizeObject(obj_id: string) {
        this.closeContextMenu();
        this.root.sidebar.onChangeObjectBoundingBox(obj_id);
    }

    onObjectContextMenuRemoveObject(obj_id: string) {
        this.closeContextMenu();
        this.root.sidebar.onRemoveObject(obj_id);
    }

    onRelationContextMenuEditRelation(rel_id: string) {
        this.closeContextMenu();
        this.root.sidebar.onEditRelation(rel_id);
    }

    onRelationContextMenuRemoveRelation(rel_id: string) {
        this.closeContextMenu();
        this.root.sidebar.onRemoveRelation(rel_id);
    }
}

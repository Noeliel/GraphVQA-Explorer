/**
 * This is the code that handles defining bounding boxes for objects.
 */

import { MatSnackBar } from '@angular/material/snack-bar';
import { take } from 'rxjs';
import { MouseDragEvent } from 'src/app/models/mousedragevent.model';
import { Point2D } from 'src/app/models/point2d.model';
import { _Crypto } from 'src/app/providers/crypto';
import { SceneGraphObject } from '../scenegraph';
import { ExplorationTypeDisplayMode } from './explorationtypedisplaymode';
import {
    DisplayModeEventHooks,
    DisplayModeInputParameters,
    DisplayModeOutputParameters,
} from './interfaces/displaymode';

export enum BoundingBoxPreviewDisplayModeEvent {
    STARTED = 'started',
    FINISHED = 'finished',
    CANCELLED = 'cancelled',
}

export enum BoundingBoxPreviewDisplayModeEventInputParameter {
    SNACKBAR_INPUT = 'snackbar',
    PREVIEW_INPUT = 'input',
}

export enum BoundingBoxPreviewDisplayModeEventOutputParameter {
    PREVIEW_RESULT = 'result',
}

export class BoundingBoxPreviewDisplayMode extends ExplorationTypeDisplayMode {
    mouse_event_sub_key = _Crypto.randomUUID();
    private object_preview?: SceneGraphObject;
    private object_backup = {};
    private snackbar?: MatSnackBar;
    private last_preview_start = new Point2D(0, 0);
    private did_draw = false;
    private did_finalize = false;

    public trySetupPreview() {
        if (!this.parameters) return;

        this.object_preview =
            this.parameters[
                BoundingBoxPreviewDisplayModeEventInputParameter.PREVIEW_INPUT
            ];

        this.object_backup = Object.assign({}, this.object_preview);
    }

    public trySetupSnackbar() {
        if (!this.parameters) return;

        this.snackbar =
            this.parameters[
                BoundingBoxPreviewDisplayModeEventInputParameter.SNACKBAR_INPUT
            ];
    }

    public tryFinalize() {
        this.did_finalize = true;

        if (!this.eventHooks) return;

        const parameters: DisplayModeOutputParameters = {};
        parameters[
            BoundingBoxPreviewDisplayModeEventOutputParameter.PREVIEW_RESULT
        ] = this.object_preview;

        this.eventHooks[BoundingBoxPreviewDisplayModeEvent.FINISHED](
            BoundingBoxPreviewDisplayModeEvent.FINISHED,
            parameters
        );
    }

    override setup(
        parameters: DisplayModeInputParameters,
        eventHooks: DisplayModeEventHooks
    ): BoundingBoxPreviewDisplayMode {
        super.setup(parameters, eventHooks);

        this.did_finalize = false;
        this.did_draw = false;
        this.object_backup = {};

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

            this.eventHooks[BoundingBoxPreviewDisplayModeEvent.STARTED](
                BoundingBoxPreviewDisplayModeEvent.STARTED,
                parameters
            );
        }

        return this;
    }

    override prepare(): BoundingBoxPreviewDisplayMode {
        super.prepare();

        this.prepare_setup_base();
        this.prepare_setup_defs();
        this.prepare_setup_fg_object_boundingboxes();
        this.prepare_setup_fg_object_centers();
        return this;
    }

    override redraw(): BoundingBoxPreviewDisplayMode {
        super.redraw();

        this.redraw_update_background()?.on('contextmenu', function (event) {
            event.preventDefault();
        });

        if (!this.object_preview || !this.did_draw) return this;

        this.redraw_update_fg_object_boundingboxes([this.object_preview])?.attr(
            'visibility',
            'visible'
        );
        this.redraw_update_defs();
        this.redraw_update_fg_object_centers([this.object_preview]);

        return this;
    }

    override teardown(): BoundingBoxPreviewDisplayMode {
        this.snackbar?.dismiss();

        if (!this.did_finalize) {
            Object.assign(this.object_preview, this.object_backup);

            if (this.eventHooks) {
                const parameters: DisplayModeOutputParameters = {};
                parameters[
                    BoundingBoxPreviewDisplayModeEventOutputParameter.PREVIEW_RESULT
                ] = this.object_preview;

                this.eventHooks[BoundingBoxPreviewDisplayModeEvent.CANCELLED](
                    BoundingBoxPreviewDisplayModeEvent.CANCELLED,
                    parameters
                );
            }
        }

        this.controller.unregisterFromSpecialMouseEvents(
            this.mouse_event_sub_key
        );

        this.controller.disableSVGMouseDragEvents();
        this.controller.enableZoomAndPan();

        this.object_preview = undefined;
        this.snackbar = undefined;

        super.teardown();

        return this;
    }

    private adjustBoundingBox(point: Point2D) {
        if (!this.object_preview) return;

        const w = point.x - this.last_preview_start.x;
        const h = point.y - this.last_preview_start.y;

        if (w >= 0) {
            this.object_preview.x = this.last_preview_start.x;
            this.object_preview.w = w;
        } else {
            this.object_preview.x = point.x;
            this.object_preview.w = Math.abs(w);
        }

        if (h >= 0) {
            this.object_preview.y = this.last_preview_start.y;
            this.object_preview.h = h;
        } else {
            this.object_preview.y = point.y;
            this.object_preview.h = Math.abs(h);
        }
    }

    public handleMouseDragEvent(event: MouseDragEvent, point: Point2D) {
        if (!this.object_preview) return;

        this.did_draw = true;

        point.x = Math.round(point.x);
        point.y = Math.round(point.y);

        switch (event) {
            case MouseDragEvent.START:
                this.snackbar?.dismiss();

                this.last_preview_start.x = point.x;
                this.last_preview_start.y = point.y;
                this.object_preview.y = point.y;
                this.object_preview.x = point.x;
                this.object_preview.w = 0;
                this.object_preview.h = 0;
                break;

            case MouseDragEvent.DRAG:
                this.adjustBoundingBox(point);
                break;

            case MouseDragEvent.END:
                this.adjustBoundingBox(point);

                this.snackbar
                    ?.open('Finalize object bounding box?', 'Accept')
                    .onAction()
                    .pipe(take(1))
                    .subscribe((result) => {
                        this.tryFinalize();
                    });
                break;

            default:
                break;
        }

        this.redraw();
    }
}

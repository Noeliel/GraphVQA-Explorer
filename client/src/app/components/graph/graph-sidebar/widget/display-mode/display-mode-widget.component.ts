import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import {
    BoundingBoxPreviewDisplayModeEventInputParameter,
    BoundingBoxPreviewDisplayModeEvent,
} from 'src/app/entities/displaymode/boundingboxpreviewdisplaymode';
import {
    DisplayModeOutputParameters,
    DisplayModeInputParameters,
    DisplayModeEventHooks,
} from 'src/app/entities/displaymode/interfaces/displaymode';
import { GroundTruthDisplayModePreferences } from 'src/app/entities/preferences/ground-truth-display-mode-prefscachingportal';
import { PredictionDisplayModePreferences } from 'src/app/entities/preferences/prediction-display-mode-prefscachingportal';
import { SceneGraphObject } from 'src/app/entities/scenegraph';
import {
    DisplayModeMessageMode,
    DisplayModeStatusMessage,
    DisplayModeUpdateMessage,
    MessageSubjectDisplayMode,
} from 'src/app/models/messages/display-mode-message.model';
import { MessageBusService, MBChannel } from 'src/app/providers/message-bus';
import { GraphSidebarComponent } from '../../graph-sidebar.component';

export enum DisplayModeTab {
    GROUND_TRUTH,
    PREDICTION,
    NONE,
}

@Component({
    selector: 'app-display-mode-widget',
    templateUrl: './display-mode-widget.component.html',
    styleUrls: ['./display-mode-widget.component.scss'],
})
export class DisplayModeWidgetComponent implements OnInit, OnDestroy {
    private static display_mode_for_tab: Record<
        DisplayModeTab,
        DisplayModeMessageMode
    > = {
        [DisplayModeTab.GROUND_TRUTH]: DisplayModeMessageMode.GROUND_TRUTH,
        [DisplayModeTab.PREDICTION]: DisplayModeMessageMode.PREDICTION,
        [DisplayModeTab.NONE]: DisplayModeMessageMode.GROUND_TRUTH,
    };

    GroundTruthDisplayModeTab = DisplayModeTab.GROUND_TRUTH;
    PredictionDisplayModeTab = DisplayModeTab.PREDICTION;

    _tab = this.GroundTruthDisplayModeTab;
    _display_mode = DisplayModeMessageMode.GROUND_TRUTH;

    // DISPLAY MODE -- GROUND TRUTH
    ground_truth_display_mode_preferences: GroundTruthDisplayModePreferences =
        new GroundTruthDisplayModePreferences();

    // DISPLAY MODE -- PREDICTION
    prediction_display_mode_preferences: PredictionDisplayModePreferences =
        new PredictionDisplayModePreferences();

    private dispmode_status_subscription: Subscription | undefined;

    constructor(private controller: GraphSidebarComponent) {}

    ngOnInit(): void {
        if (!this.dispmode_status_subscription)
            this.dispmode_status_subscription =
                MessageBusService.subscribe<DisplayModeStatusMessage>(
                    MBChannel.DISPLAYMODE,
                    MessageSubjectDisplayMode.STATUS,
                    {
                        next: (message) => {
                            this._display_mode =
                                message.mode as DisplayModeMessageMode;
                        },
                    }
                );
    }

    ngOnDestroy(): void {
        if (this.dispmode_status_subscription) {
            this.dispmode_status_subscription.unsubscribe();
            this.dispmode_status_subscription = undefined;
        }
    }

    get tab(): number {
        return this._tab;
    }

    set tab(value: number) {
        this._tab = value;
        this.requestDisplayModeChange();

        // todo: consider refactoring this to use messages or something else instead
        this.controller.widgetElementList?.updateListElements();
    }

    requestDisplayModeChange() {
        MessageBusService.publish<DisplayModeUpdateMessage>(
            MBChannel.DISPLAYMODE,
            MessageSubjectDisplayMode.UPDATE,
            {
                mode: DisplayModeWidgetComponent.display_mode_for_tab[
                    this._tab
                ],
                parameters: undefined,
                eventHooks: undefined,
            }
        );
    }

    enterBoundingBoxPreviewMode(
        new_object: SceneGraphObject,
        startedHook: (
            event: string,
            parameters: DisplayModeOutputParameters | undefined
        ) => void,
        finishedHook: (
            event: string,
            parameters: DisplayModeOutputParameters | undefined
        ) => void,
        cancelledHook: (
            event: string,
            parameters: DisplayModeOutputParameters | undefined
        ) => void
    ): void {
        const parameters: DisplayModeInputParameters = {};
        parameters[
            BoundingBoxPreviewDisplayModeEventInputParameter.PREVIEW_INPUT
        ] = new_object;
        parameters[
            BoundingBoxPreviewDisplayModeEventInputParameter.SNACKBAR_INPUT
        ] = this.controller.snackbar;

        const eventHooks: DisplayModeEventHooks = {};
        eventHooks[BoundingBoxPreviewDisplayModeEvent.STARTED] = startedHook;
        eventHooks[BoundingBoxPreviewDisplayModeEvent.FINISHED] = finishedHook;
        eventHooks[BoundingBoxPreviewDisplayModeEvent.CANCELLED] =
            cancelledHook;

        MessageBusService.publish<DisplayModeUpdateMessage>(
            MBChannel.DISPLAYMODE,
            MessageSubjectDisplayMode.UPDATE,
            {
                mode: DisplayModeMessageMode.BOUNDINGBOXPREVIEW,
                parameters: parameters,
                eventHooks: eventHooks,
            }
        );
    }

    enterRelationPreviewMode(
        startedHook: (
            event: string,
            parameters: DisplayModeOutputParameters | undefined
        ) => void,
        finishedHook: (
            event: string,
            parameters: DisplayModeOutputParameters | undefined
        ) => void,
        cancelledHook: (
            event: string,
            parameters: DisplayModeOutputParameters | undefined
        ) => void
    ) {
        const parameters: DisplayModeInputParameters = {};
        parameters[
            BoundingBoxPreviewDisplayModeEventInputParameter.PREVIEW_INPUT
        ] = undefined;
        parameters[
            BoundingBoxPreviewDisplayModeEventInputParameter.SNACKBAR_INPUT
        ] = this.controller.snackbar;

        const eventHooks: DisplayModeEventHooks = {};
        eventHooks[BoundingBoxPreviewDisplayModeEvent.STARTED] = startedHook;
        eventHooks[BoundingBoxPreviewDisplayModeEvent.FINISHED] = finishedHook;
        eventHooks[BoundingBoxPreviewDisplayModeEvent.CANCELLED] =
            cancelledHook;

        MessageBusService.publish<DisplayModeUpdateMessage>(
            MBChannel.DISPLAYMODE,
            MessageSubjectDisplayMode.UPDATE,
            {
                mode: DisplayModeMessageMode.RELATIONPREVIEW,
                parameters: parameters,
                eventHooks: eventHooks,
            }
        );
    }

    isInAnyPreviewMode(): boolean {
        return this._display_mode ==
            DisplayModeMessageMode.BOUNDINGBOXPREVIEW ||
            this._display_mode == DisplayModeMessageMode.RELATIONPREVIEW
            ? true
            : false;
    }
}

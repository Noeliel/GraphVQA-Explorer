import { ElementRef, ViewContainerRef } from '@angular/core';
import { _Crypto } from 'src/app/providers/crypto';
import { PrefsCachingPortal } from '../../preferences/prefscachingportal';
import { DisplayModeController } from './displaymodecontroller';

export type DisplayModeInputParameters = { [name: string]: any };
export type DisplayModeOutputParameters = { [name: string]: any };

export type DisplayModeEventHooks = {
    [event: string]: (
        event: string,
        parameters: DisplayModeOutputParameters | undefined
    ) => void;
};

export abstract class DisplayMode {
    parameters?: DisplayModeInputParameters;
    eventHooks?: DisplayModeEventHooks;
    canvas: d3.Selection<SVGGElement, unknown, null, undefined>;
    tooltipContainerRef: ElementRef;
    widgetContainerRef: ViewContainerRef;
    controller: DisplayModeController;
    preferences: PrefsCachingPortal | undefined;
    preference_sub_key = _Crypto.randomUUID();
    did_prepare = false;
    is_active = false;

    constructor(
        canvas: d3.Selection<SVGGElement, unknown, null, undefined>,
        tooltipContainer: ElementRef,
        widgetContainer: ViewContainerRef,
        controller: DisplayModeController,
        preferences: PrefsCachingPortal | undefined = undefined
    ) {
        this.canvas = canvas;
        this.tooltipContainerRef = tooltipContainer;
        this.widgetContainerRef = widgetContainer;
        this.controller = controller;
        this.preferences = preferences;

        this.preferences?.subscribeToPreferenceChanges(
            this.preference_sub_key,
            () => {
                this.controller.handleDisplayModePreferencesChanged();
            },
            false
        );
    }

    clearPrefsAndSubscriptionsForDestruction() {
        this.preferences?.unsubscribeFromPreferenceChanges(
            this.preference_sub_key
        );

        this.preferences = undefined;
    }

    setup(
        parameters: DisplayModeInputParameters | undefined = undefined,
        eventHooks: DisplayModeEventHooks | undefined = undefined
    ): DisplayMode {
        this.controller.display_mode?.teardown();
        this.controller.display_mode = this;
        this.is_active = true;

        this.parameters = parameters;
        this.eventHooks = eventHooks;

        return this;
    }

    prepare(): DisplayMode {
        if (!this.is_active) return this;
        if (this.did_prepare) return this;
        this.did_prepare = true;
        return this;
    }

    /**
     * Re-render all elements.
     * *BE CAREFUL* with calling this on yourself, as a call to this function automatically makes self the
     * active display mode!
     * @returns self
     */
    redraw(): DisplayMode {
        if (!this.is_active) return this;
        if (!this.did_prepare) this.prepare();
        return this;
    }

    teardown(): DisplayMode {
        this.parameters = undefined;
        this.eventHooks = undefined;
        this.is_active = false;
        this.did_prepare = false;
        return this;
    }

    handleObjectsInteraction(ids: string[]): DisplayMode {
        return this;
    }

    handleRelationsInteraction(ids: string[]): DisplayMode {
        return this;
    }
}

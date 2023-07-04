import { PrefsCachingPortal } from './prefscachingportal';

export enum GroundTruthDisplayModeDirectionIndication {
    THICKNESS = 'ThicknessDirectionIndicator',
    ARROWS = 'ArrowDirectionIndicator',
}

export class GroundTruthDisplayModePreferences extends PrefsCachingPortal {
    protected setupDefaults() {
        this.prefs['direction_indication'] =
            GroundTruthDisplayModeDirectionIndication.THICKNESS;
        this.prefs['show_hovering_tooltips'] = true;
        this.prefs['show_hovering_incoming_edges'] = true;
        this.prefs['show_hovering_outgoing_edges'] = true;
        this.prefs['show_object_labels'] = true;
    }

    protected getPrefsKey(): string {
        return 'ground-truth-display-mode-preferences';
    }

    get direction_indication() {
        return this.getPref(
            'direction_indication'
        ) as GroundTruthDisplayModeDirectionIndication;
    }

    set direction_indication(
        indication: GroundTruthDisplayModeDirectionIndication
    ) {
        this.setPref('direction_indication', indication);
    }

    get show_hovering_tooltips(): boolean {
        return this.getPref('show_hovering_tooltips') as boolean;
    }

    set show_hovering_tooltips(value: boolean) {
        this.setPref('show_hovering_tooltips', value);
    }

    get show_hovering_incoming_edges() {
        return this.getPref('show_hovering_incoming_edges') as boolean;
    }

    set show_hovering_incoming_edges(value: boolean) {
        this.setPref('show_hovering_incoming_edges', value);
    }

    get show_hovering_outgoing_edges() {
        return this.getPref('show_hovering_outgoing_edges') as boolean;
    }

    set show_hovering_outgoing_edges(value: boolean) {
        this.setPref('show_hovering_outgoing_edges', value);
    }

    get show_object_labels() {
        return this.getPref('show_object_labels') as boolean;
    }

    set show_object_labels(show_object_labels: boolean) {
        this.setPref('show_object_labels', show_object_labels);
    }
}

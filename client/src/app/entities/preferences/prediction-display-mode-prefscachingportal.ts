import { PrefsCachingPortal } from './prefscachingportal';

export enum PredictionDisplayModeDirectionIndication {
    THICKNESS = 'ThicknessDirectionIndicator',
    ARROWS = 'ArrowDirectionIndicator',
}

export enum PredictionDisplayModeNodeWeightIndication {
    RADIUS = 'NodeWeightIndicatorRadius',
    AREA = 'NodeWeightIndicatorArea',
    OPACITY = 'NodeWeightIndicatorOpacity',
    NONE = 'NodeWeightIndicatorNone',
}

export class PredictionDisplayModePreferences extends PrefsCachingPortal {
    protected setupDefaults() {
        this.prefs['direction_indication'] =
            PredictionDisplayModeDirectionIndication.THICKNESS;
        this.prefs['show_hovering_tooltips'] = true;
        this.prefs['show_hovering_incoming_edges'] = true;
        this.prefs['show_hovering_outgoing_edges'] = false;
        this.prefs['node_weight_indication'] =
            PredictionDisplayModeNodeWeightIndication.RADIUS;
        this.prefs['normalize_relation_opacity'] = false;
    }

    protected getPrefsKey(): string {
        return 'prediction-display-mode-preferences';
    }

    get direction_indication() {
        return this.getPref(
            'direction_indication'
        ) as PredictionDisplayModeDirectionIndication;
    }

    set direction_indication(
        indication: PredictionDisplayModeDirectionIndication
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

    get node_weight_indication() {
        return this.getPref(
            'node_weight_indication'
        ) as PredictionDisplayModeNodeWeightIndication;
    }

    set node_weight_indication(
        indicator: PredictionDisplayModeNodeWeightIndication
    ) {
        this.setPref('node_weight_indication', indicator);
    }

    get normalize_relation_opacity() {
        return this.getPref('normalize_relation_opacity') as boolean;
    }

    set normalize_relation_opacity(normalize_relation_opacity: boolean) {
        this.setPref('normalize_relation_opacity', normalize_relation_opacity);
    }
}

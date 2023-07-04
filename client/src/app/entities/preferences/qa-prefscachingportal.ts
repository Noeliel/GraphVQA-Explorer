import { PrefsCachingPortal } from './prefscachingportal';

export class QAPreferences extends PrefsCachingPortal {
    protected setupDefaults() {
        this.prefs['selected_model'] = 'gat';
        this.prefs['min_confidence_threshold'] = 0.95;
        this.prefs['max_num_threshold'] = 5;
    }

    protected getPrefsKey(): string {
        return 'qa-preferences';
    }

    get selected_model() {
        return this.getPref('selected_model') as string;
    }

    set selected_model(model: string) {
        this.setPref('selected_model', model);
    }

    get min_confidence_threshold() {
        return this.getPref('min_confidence_threshold') as number;
    }

    set min_confidence_threshold(threshold: number) {
        this.setPref('min_confidence_threshold', threshold);
    }

    get max_num_threshold() {
        return this.getPref('max_num_threshold') as number;
    }

    set max_num_threshold(threshold: number) {
        this.setPref('max_num_threshold', threshold);
    }
}

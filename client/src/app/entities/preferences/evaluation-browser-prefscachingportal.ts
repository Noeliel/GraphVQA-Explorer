import { PrefsCachingPortal } from './prefscachingportal';
import { QuestionTableComponent } from 'src/app/components/eval-browser/question-table/question-table.component';
import { FocusCategoryTableComponent } from 'src/app/components/eval-browser/focus-category-table/focus-category-table.component';

export class EvaluationBrowserPrefsCachingPortal extends PrefsCachingPortal {
    protected setupDefaults() {
        this.prefs['displayed_question_columns'] =
            QuestionTableComponent.availableQuestionColumns;

        this.prefs['displayed_category_columns'] =
            FocusCategoryTableComponent.availableCategoryColumns;

        this.prefs['category_plot_axis_x'] = 'frequency_total';
        this.prefs['category_plot_axis_y'] = 'performance_norm_net';
    }

    protected getPrefsKey(): string {
        return 'evaluation-browser-preferences';
    }

    get displayed_question_columns() {
        return this.getPref('displayed_question_columns') as string[];
    }

    set displayed_question_columns(columns: string[]) {
        this.setPref('displayed_question_columns', columns);
    }

    get displayed_category_columns() {
        return this.getPref('displayed_category_columns') as string[];
    }

    set displayed_category_columns(columns: string[]) {
        this.setPref('displayed_category_columns', columns);
    }

    get category_plot_axis_x(): string {
        return this.getPref('category_plot_axis_x') as string;
    }

    set category_plot_axis_x(attribute: string) {
        this.setPref('category_plot_axis_x', attribute);
    }

    get category_plot_axis_y(): string {
        return this.getPref('category_plot_axis_y') as string;
    }

    set category_plot_axis_y(attribute: string) {
        this.setPref('category_plot_axis_y', attribute);
    }
}

import {
    AfterViewInit,
    Component,
    ElementRef,
    OnDestroy,
    OnInit,
    ViewChild,
} from '@angular/core';
import { BackendService } from 'src/app/services/backend/backend.service';
import { MatTableDataSource } from '@angular/material/table';
import { QuestionEvaluationData } from 'src/app/models/evaluationdata.model';
import { MatSelectChange } from '@angular/material/select';
import { EvaluationBrowserPrefsCachingPortal } from 'src/app/entities/preferences/evaluation-browser-prefscachingportal';
import { QuestionTableComponent } from './question-table/question-table.component';
import { FocusCategoryTableComponent } from './focus-category-table/focus-category-table.component';
import { FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MatButtonToggleGroup } from '@angular/material/button-toggle';
import { FocusCategoryPlotComponent } from './focus-category-plot/focus-category-plot.component';
import { EvaluationQuestionTableData } from 'src/app/models/evaluationquestiontabledata.model';
import { EvaluationGraphCategory } from 'src/app/models/evaluationgraphcategory.model';
import { MatTableExporterDirective } from 'mat-table-exporter';
import { sum } from 'd3';

@Component({
    selector: 'app-eval-browser',
    templateUrl: './eval-browser.component.html',
    styleUrls: ['./eval-browser.component.scss'],
    // encapsulation: ViewEncapsulation.None,
})
export class EvalBrowserComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('toolbar', { read: ElementRef, static: true })
    toolbarRef?: ElementRef<HTMLDivElement>;

    readonly toolbar_shadow_mat_elevation_z0 =
        '0px 0px 0px 0px rgba(0, 0, 0, 0.2),0px 0px 0px 0px rgba(0, 0, 0, 0.14),0px 0px 0px 0px rgba(0, 0, 0, 0.12)' as const;
    readonly toolbar_shadow_mat_elevation_z24 =
        '0px 11px 15px -7px rgba(0, 0, 0, 0.2),0px 24px 38px 3px rgba(0, 0, 0, 0.14),0px 9px 46px 8px rgba(0, 0, 0, 0.12)' as const;
    private is_showing_toolbar_shadow = false;

    @ViewChild('questionTable')
    questionTable?: QuestionTableComponent;
    @ViewChild('focusCategoryTable')
    focusCategoryTable?: FocusCategoryTableComponent;
    @ViewChild('focusCategoryPlot')
    focusCategoryPlot?: FocusCategoryPlotComponent;

    @ViewChild('display0') display0?: MatButtonToggleGroup;
    @ViewChild('display1') display1?: MatButtonToggleGroup;

    preferences = new EvaluationBrowserPrefsCachingPortal();

    selected_model = '';
    selected_split = '';
    category_depth = '1';

    data_is_loading = false;
    split_accuracy = '-';
    filter_accuracy = '-';

    plot_enabled = true;

    questionFilterString = '';
    categoryFilterString = '';

    questionDataSource: MatTableDataSource<EvaluationQuestionTableData>;
    categoryDataSource: MatTableDataSource<EvaluationGraphCategory>;

    availableQuestionColumns = QuestionTableComponent.availableQuestionColumns;
    displayedQuestionColumns = new FormControl(
        this.preferences.displayed_question_columns
    );
    displayedQuestionColumnsSubscription?: Subscription;

    availableCategoryColumns =
        FocusCategoryTableComponent.availableCategoryColumns;
    displayedCategoryColumns = new FormControl(
        this.preferences.displayed_category_columns
    );
    displayedCategoryColumnsSubscription?: Subscription;

    constructor(private backend: BackendService) {
        this.questionDataSource = new MatTableDataSource();
        this.categoryDataSource = new MatTableDataSource();

        const anyFieldIncludesFilter = this.questionDataSource.filterPredicate;

        const specificFieldIncludesFilter = (data: any, filter: string) => {
            const terms = filter.split(':');
            const field = terms[0].trim();
            const value = terms[1].trim();

            const keys = Object.keys(data);

            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];

                if (key.includes(field)) {
                    if (
                        data[key] != undefined &&
                        data[key].toString().toLowerCase().includes(value)
                    ) {
                        return true;
                    }
                }
            }

            return false;
        };

        const specificFieldEqualsFilter = (data: any, filter: string) => {
            const terms = filter.split('=');
            const field = terms[0].trim();
            const value = terms[1].trim();

            const keys = Object.keys(data);

            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];

                if (key.includes(field)) {
                    if (
                        data[key] != undefined &&
                        data[key].toString().toLowerCase() == value
                    ) {
                        return true;
                    }
                }
            }

            return false;
        };

        const multiPredicateFilter = (data: any, filter: string) => {
            const predicates = filter.split('&');

            for (let i = 0; i < predicates.length; i++) {
                const predicate = predicates[i];

                if (predicate.includes(':')) {
                    if (!specificFieldIncludesFilter(data, predicate)) {
                        return false;
                    }
                } else if (predicate.includes('=')) {
                    if (!specificFieldEqualsFilter(data, predicate)) {
                        return false;
                    }
                } else {
                    if (!anyFieldIncludesFilter(data, predicate)) {
                        return false;
                    }
                }
            }

            // none of the predicates did NOT match, return true
            return true;
        };

        const filterPredicate = (data: any, filter: string) => {
            let match = false;

            if (
                filter.includes('&') ||
                filter.includes(':') ||
                filter.includes('=')
            ) {
                match = multiPredicateFilter(data, filter);
            } else {
                match = anyFieldIncludesFilter(data, filter);
            }

            return match;
        };

        this.questionDataSource.filterPredicate = filterPredicate;
        this.categoryDataSource.filterPredicate = filterPredicate;

        this.displayedQuestionColumnsSubscription =
            this.displayedQuestionColumns.valueChanges.subscribe(() => {
                this.preferences.displayed_question_columns =
                    this.displayedQuestionColumns.value;
            });

        this.displayedCategoryColumnsSubscription =
            this.displayedCategoryColumns.valueChanges.subscribe(() => {
                this.preferences.displayed_category_columns =
                    this.displayedCategoryColumns.value;
            });
    }

    ngOnInit(): void {
        // this.updateToolbarTitle();
    }

    ngAfterViewInit(): void {
        this.updateToolbarStyle();
    }

    ngOnDestroy(): void {
        if (this.displayedQuestionColumnsSubscription) {
            this.displayedQuestionColumnsSubscription.unsubscribe();
            this.displayedQuestionColumnsSubscription = undefined;
        }

        if (this.displayedCategoryColumnsSubscription) {
            this.displayedCategoryColumnsSubscription.unsubscribe();
            this.displayedCategoryColumnsSubscription = undefined;
        }
    }

    requestData(event: MatSelectChange | undefined) {
        if (this.selected_model == '' || this.selected_split == '') return;

        this.data_is_loading = true;
        this.backend.requestEvaluationData(
            this.selected_model,
            this.selected_split,
            (response) => {
                const data: EvaluationQuestionTableData[] = [];

                Object.keys(response).forEach((qid) => {
                    data.push(createNewQuestion(qid, response[qid]));
                });

                this.questionDataSource.data = data;
                this.split_accuracy = this.calculateQuestionSplitAccuracy(data);
                this.filter_accuracy = this.split_accuracy;

                this.generateCategoryData();

                this.rerenderPlot();

                this.data_is_loading = false;
            }
        );
    }

    private rerenderPlot() {
        this.plot_enabled =
            this.categoryDataSource.filteredData.length > 2000 ? false : true;

        if (!this.plot_enabled) {
            this.display1?.writeValue('table');
            return;
        }

        this.focusCategoryPlot?.rerenderPlot();
    }

    private processFilter(string: string): string {
        return string
            .replace(/( )*&( )*/gi, '&')
            .replace(/( )*:( )*/gi, ':')
            .replace(/( )*=( )*/gi, '=')
            .trim()
            .toLowerCase();
    }

    applyQuestionFilter(event: Event) {
        this.questionFilterString = (event.target as HTMLInputElement).value;

        this.questionDataSource.filter = this.processFilter(
            this.questionFilterString
        );

        this.filter_accuracy = this.calculateQuestionSplitAccuracy(
            this.questionDataSource.filteredData
        );

        this.generateCategoryData();

        this.rerenderPlot();
    }

    applyCategoryFilter(event: Event) {
        this.categoryFilterString = (event.target as HTMLInputElement).value;

        this.categoryDataSource.filter = this.processFilter(
            this.categoryFilterString
        );

        this.rerenderPlot();
    }

    setCategoryDepth(event: MatSelectChange) {
        this.data_is_loading = true;

        window.setTimeout(() => {
            this.generateCategoryData();
            this.rerenderPlot();
            this.data_is_loading = false;
        }, 100);
    }

    exportVisibleTable() {
        let table:
            | QuestionTableComponent
            | FocusCategoryTableComponent
            | undefined = undefined;
        let filename = this.selected_model + '_' + this.selected_split;

        if (this.display0?.value == 'categories') {
            table = this.focusCategoryTable;
            filename += '_categories';
        } else {
            table = this.questionTable;
            filename += '_questions';
        }

        if (table) {
            const page_size = table.pageSize;
            const exporter: MatTableExporterDirective = table._exporter;

            this.data_is_loading = true;
            table!.pageSize = 2500;

            window.setTimeout(() => {
                const sub = exporter.exportCompleted.subscribe(() => {
                    table!.pageSize = page_size;
                    this.data_is_loading = false;

                    sub.unsubscribe();
                });

                exporter.exportTable('csv', {
                    fileName: filename,
                });
            }, 1000);
        }
    }

    private updateToolbarStyle() {}

    private calculateQuestionSplitAccuracy(
        data: EvaluationQuestionTableData[]
    ): string {
        if (data.length < 1) {
            return '-';
        }

        let correct = 0;

        data.forEach((value) => {
            if (value.correct_1.includes('true')) correct++;
        });

        const accuracy = correct / data.length;
        return parseFloat((accuracy * 100).toFixed(3)) + '%';
    }

    public styleToDisplay(display: boolean) {
        return 'visibility: ' + (display ? 'visible' : 'hidden') + ';';
    }

    private generateCategoryData() {
        // const prior = Date.now();

        this.categoryDataSource.data =
            this.generateGraphCategoriesFromQuestions(
                this.questionDataSource.filteredData
            );

        /*
        this.categoryDataSource.data =
            this.wasm.generate_categories_from_questions(
                this.questionDataSource.filteredData
            );
            
        const posterior = Date.now();
        const diff = posterior - prior;
        alert(diff + 'ms');
        */
    }

    private recursivelyCombineCategories(
        groups: CategoryGroup[],
        current_depth: number,
        target_depth: number
    ): CategoryGroup[] {
        if (current_depth == target_depth) {
            return groups;
        } else {
            const new_groups: CategoryGroup[] = groups.flatMap((group) => {
                return group.missing.map((category, i) => {
                    const new_missing = group.missing.slice(
                        i + 1,
                        group.missing.length
                    );
                    const new_group = {
                        included: group.included.concat([category]),
                        missing: new_missing,
                    };

                    return new_group;
                });
            });

            return this.recursivelyCombineCategories(
                new_groups,
                current_depth + 1,
                target_depth
            );
        }
    }

    private questionCategoriesForDepth(
        categories: Category[],
        depth: number
    ): Category[] {
        const initial_groups: CategoryGroup[] = categories.map(
            (category, i) => {
                const new_missing = categories.slice(i + 1, categories.length);

                return {
                    included: [category],
                    missing: new_missing,
                };
            }
        );

        const final_groups = this.recursivelyCombineCategories(
            initial_groups,
            1,
            depth
        );

        final_groups.forEach((group) => {
            group.included = group.included.sort((a, b) =>
                a.name.localeCompare(b.name)
            );
        });

        const final_categories: Category[] = final_groups.map((group) => {
            return {
                name: group.included
                    .map((category) => category.name)
                    .join(', '),
                weight: group.included
                    .map((category) => category.weight)
                    .reduce((sum, current) => (sum += current)),
            };
        });

        return final_categories;
    }

    /**
     * This function is bad.
     * It performs an unnecessary amount of dictionary access operations.
     *
     * @param questions The list of questions
     * @returns A list of categories
     */
    private generateGraphCategoriesFromQuestions(
        questions: EvaluationQuestionTableData[]
    ): EvaluationGraphCategory[] {
        const categories_count: { [name: string]: number } = {};
        const categories_weight: { [name: string]: number } = {};
        const categories_correctness: {
            [name: string]: EvaluationGraphCategoryCorrectness;
        } = {};

        const categories: EvaluationGraphCategory[] = [];

        // highest frequency
        // highest avg weight

        let max_frequency = 0;
        let max_avg_weight = 0;
        let max_avg_weight_t = 0;
        let max_avg_weight_f = 0;
        let max_pos_performance = 0;
        let max_neg_performance = 0;

        questions.forEach((data) => {
            const cats = this.questionCategoriesForDepth(
                [
                    { name: data.focus_1, weight: data.weight_1 },
                    { name: data.focus_2, weight: data.weight_2 },
                    { name: data.focus_3, weight: data.weight_3 },
                    { name: data.focus_4, weight: data.weight_4 },
                    { name: data.focus_5, weight: data.weight_5 },
                ],
                parseInt(this.category_depth)
            );

            cats.forEach((cat) => {
                if (!categories_count[cat.name]) categories_count[cat.name] = 0;
                if (!categories_weight[cat.name])
                    categories_weight[cat.name] = 0;
                if (!categories_correctness[cat.name])
                    categories_correctness[cat.name] = {
                        t_freq: 0,
                        f_freq: 0,
                        t_total_weight: 0,
                        f_total_weight: 0,
                    };

                categories_count[cat.name]++;
                categories_weight[cat.name] += cat.weight;

                if (data.correct_1.includes('true')) {
                    categories_correctness[cat.name].t_freq++;
                    categories_correctness[cat.name].t_total_weight +=
                        cat.weight;
                } else {
                    categories_correctness[cat.name].f_freq++;
                    categories_correctness[cat.name].f_total_weight +=
                        cat.weight;
                }
            });
        });

        Object.keys(categories_count).forEach((category) => {
            // if (category == '-') return;

            const frequency = categories_count[category];
            const correctness = categories_correctness[category];

            const avg_weight = categories_weight[category] / frequency;

            const avg_weight_t =
                correctness.t_total_weight / correctness.t_freq;
            const avg_weight_f =
                correctness.f_total_weight / correctness.f_freq;

            // old stuff
            /*
            const contribution =
                (correctness.t - correctness.f) * avg_weight;

            const pos_perf = (correctness.t / frequency) * avg_weight;
            const neg_perf = (correctness.f / frequency) * avg_weight;

            const bal_perf =
                ((correctness.t + 1) / (correctness.f + 1)) * avg_weight;
                */

            /*
            // proposal 1
                const pos_eq =
                    (correctness.t / frequency) *
                    (avg_weight / max_avg_weight) *
                    (frequency / max_count);
                
                const neg_eq =
                    (correctness.f / frequency) *
                    (avg_weight / max_avg_weight) *
                    (frequency / max_count); 
                    
                --> maybe softmax for net

                balanced_performance: red/green plot
                    sorting header: simple pos - neg
            */

            if (frequency > max_frequency) {
                max_frequency = frequency;
            }

            if (avg_weight > max_avg_weight) {
                max_avg_weight = avg_weight;
            }

            if (avg_weight_t > max_avg_weight_t) {
                max_avg_weight_t = avg_weight_t;
            }

            if (avg_weight_f > max_avg_weight_f) {
                max_avg_weight_f = avg_weight_f;
            }

            /*
            // proposal 2
                - filter: random 10%
                - depth > 1 (category pairs)
            */

            /*
            categories.push({
                name: category,
                frequency: frequency,
                avg_weight: avg_weight,
                positive_performance: pos_perf,
                negative_performance: neg_perf,
                net_performance: pos_perf - neg_perf,
                balanced_performance: bal_perf,
                accumulated_performance: contribution,
            });
            */

            categories.push({
                name: category,
                frequency_total: frequency,
                frequency_pos: correctness.t_freq,
                frequency_neg: correctness.f_freq,
                weight_total: categories_weight[category],
                weight_avg_total: avg_weight,
                weight_pos: correctness.t_total_weight,
                weight_avg_pos:
                    correctness.t_total_weight / correctness.t_freq || 0,
                weight_neg: correctness.f_total_weight,
                weight_avg_neg:
                    correctness.f_total_weight / correctness.f_freq || 0,
                performance_pos: 0,
                performance_norm_pos: 0,
                performance_norm_smax_pos: 0,
                performance_neg: 0,
                performance_norm_neg: 0,
                performance_norm_smax_neg: 0,
                performance_net: 0,
                performance_norm_net: 0,
                performance_norm_smax_net: 0,
            });
        });

        categories.forEach((category) => {
            /*
            // calculate weight through geometric progression
            let geom_weight = 0;

            for (let i = 0; i < category.frequency_total; i++) {
                geom_weight += 1 * ((1 / 2) ^ i);
            }
            */

            if (category.frequency_pos > 0) {
                category.performance_pos =
                    (category.frequency_pos / category.frequency_total) *
                    (category.weight_avg_pos / max_avg_weight_t) *
                    (category.frequency_total / max_frequency);

                if (category.performance_pos > max_pos_performance) {
                    max_pos_performance = category.performance_pos;
                }
            }

            if (category.frequency_neg > 0) {
                category.performance_neg =
                    (category.frequency_neg / category.frequency_total) *
                    (category.weight_avg_neg / max_avg_weight_f) *
                    (category.frequency_total / max_frequency);

                if (category.performance_neg > max_neg_performance) {
                    max_neg_performance = category.performance_neg;
                }
            }

            category.performance_net =
                category.performance_pos - category.performance_neg;
        });

        const max_performance =
            max_pos_performance < max_neg_performance
                ? max_neg_performance
                : max_pos_performance;

        const pos_performances: number[] = [];
        const neg_performances: number[] = [];
        const net_performances: number[] = [];
        categories.forEach((category) => {
            category.performance_norm_pos = this.normalize(
                max_performance,
                category.performance_pos
            );
            category.performance_norm_neg = this.normalize(
                max_performance,
                category.performance_neg
            );
            category.performance_norm_net =
                category.performance_norm_pos - category.performance_norm_neg;

            pos_performances.push(category.performance_norm_pos);
            neg_performances.push(category.performance_norm_neg);
            net_performances.push(category.performance_norm_net);
        });

        const pos_performances_softmax = this.softmax(pos_performances);
        const neg_performances_softmax = this.softmax(neg_performances);
        const net_performances_softmax = this.softmax(net_performances);

        categories.forEach((category, i) => {
            category.performance_norm_smax_pos = pos_performances_softmax[i];
            category.performance_norm_smax_neg = neg_performances_softmax[i];
            category.performance_norm_smax_net = net_performances_softmax[i];
        });

        return categories;
    }

    private normalize(max: number, value: number) {
        return value / max;
    }

    private softmax(values: number[]): number[] {
        const exp = values.map((value) => Math.exp(value));
        const exp_sum = sum(exp);
        const softmax = exp.map((value) => value / exp_sum);

        return softmax;
    }
}

function createNewQuestion(
    id: string,
    data: QuestionEvaluationData
): EvaluationQuestionTableData {
    return {
        question_id: id,
        scene_id: data.sid,
        question: data.q,
        ambiguity: data.ambig,
        ground_truth: data.gt,
        prediction_1: data.p1,
        confidence_1: data.c1,
        correct_1: data.p1 == data.gt ? 'true' : 'false',
        prediction_2: data.p2,
        confidence_2: data.c2,
        correct_2: data.p2 == data.gt ? 'true' : 'false',
        prediction_3: data.p3,
        confidence_3: data.c3,
        correct_3: data.p3 == data.gt ? 'true' : 'false',
        prediction_4: data.p4,
        confidence_4: data.c4,
        correct_4: data.p4 == data.gt ? 'true' : 'false',
        prediction_5: data.p5,
        confidence_5: data.c5,
        correct_5: data.p5 == data.gt ? 'true' : 'false',
        focus_1: data.f1,
        weight_1: data.w1,
        focus_2: data.f2,
        weight_2: data.w2,
        focus_3: data.f3,
        weight_3: data.w3,
        focus_4: data.f4,
        weight_4: data.w4,
        focus_5: data.f5,
        weight_5: data.w5,
    };
}

interface EvaluationGraphCategoryCorrectness {
    t_freq: number;
    f_freq: number;
    t_total_weight: number;
    f_total_weight: number;
}

interface Category {
    name: string;
    weight: number;
}

interface CategoryGroup {
    included: Category[];
    missing: Category[];
}

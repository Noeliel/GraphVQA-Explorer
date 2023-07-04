import { COMMA, ENTER } from '@angular/cdk/keycodes';
import {
    Component,
    ElementRef,
    OnDestroy,
    OnInit,
    ViewChild,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import {
    MatAutocomplete,
    MatAutocompleteSelectedEvent,
    MatAutocompleteTrigger,
    _MatAutocompleteTriggerBase,
} from '@angular/material/autocomplete';
import { MatProgressBar } from '@angular/material/progress-bar';
import { map, Observable, startWith } from 'rxjs';
import { QAPreferences } from 'src/app/entities/preferences/qa-prefscachingportal';
import {
    MessageSubjectWeight,
    WeightUpdateMessage,
} from 'src/app/models/messages/weight-message.model';
import { QAPrediction } from 'src/app/models/qa.model';
import { _Crypto } from 'src/app/providers/crypto';
import { MBChannel, MessageBusService } from 'src/app/providers/message-bus';
import { BackendService } from 'src/app/services/backend/backend.service';
import { GraphSidebarComponent } from '../../graph-sidebar.component';

@Component({
    selector: 'app-qa-widget',
    templateUrl: './qa-widget.component.html',
    styleUrls: ['./qa-widget.component.scss'],
})
export class QAWidgetComponent implements OnInit, OnDestroy {
    addOnBlur = true;
    readonly separatorKeysCodes = [ENTER, COMMA] as const;

    // QA
    qa_elem_title = '';
    _qa_question = '';
    displayed_qa_predictions = ['–'];

    @ViewChild('questionInput') questionInput!: ElementRef<HTMLInputElement>;
    @ViewChild('questionAuto') questionAuto!: MatAutocomplete;
    questionControl = new FormControl();
    filteredQuestionOptions: Observable<string[]>;

    @ViewChild('qa_progress_bar')
    qa_progress_bar!: MatProgressBar;
    qa_progress_bar_style = 'visibility: hidden;'; // todo: do this better

    @ViewChild(MatAutocompleteTrigger)
    private trigger!: MatAutocompleteTrigger;

    qa_preferences: QAPreferences = new QAPreferences();
    private qa_prefs_subscription_key = _Crypto.randomUUID();

    constructor(
        private controller: GraphSidebarComponent,
        private backend: BackendService
    ) {
        const _filter_options = function (
            options: string[],
            value: string
        ): string[] {
            if (value.length < 1) return [];

            const filterValue = value.toLowerCase().split(' ').pop() || '';

            return options
                .filter((option) => option.toLowerCase().includes(filterValue))
                .slice(0, 10);
        };

        this.filteredQuestionOptions = this.questionControl.valueChanges.pipe(
            startWith(null),
            map((value: string | null) =>
                value
                    ? _filter_options(
                          this.controller._scene?.vocab?.questions || [],
                          value
                      )
                    : []
            )
        );
    }

    ngOnInit(): void {
        this.updateQAElemTitle();

        this.qa_preferences.subscribeToPreferenceChanges(
            this.qa_prefs_subscription_key,
            () => {
                this.poseQuestion();
            },
            true
        );
    }

    ngAfterViewInit(): void {
        // :( i'm so sorry for this mess
        const _hack_trigger_proto = function (component: QAWidgetComponent) {
            const proto = Object.getPrototypeOf(component.trigger);
            const clone = Object.defineProperties(
                {},
                Object.getOwnPropertyDescriptors(proto.__proto__)
            ) as any;
            clone._setTriggerValue = function (
                this: _MatAutocompleteTriggerBase,
                value: any
            ) {
                const toDisplay =
                    this.autocomplete && this.autocomplete.displayWith
                        ? this.autocomplete.displayWith(value)
                        : value;
                const inputValue = toDisplay != null ? toDisplay : '';

                const tokens =
                    component.questionInput.nativeElement.value.split(' ');
                tokens.pop();
                tokens.push(inputValue);

                component.questionInput.nativeElement.value = tokens.join(' ');
            };

            Object.setPrototypeOf(component.trigger, clone);
        };

        _hack_trigger_proto(this);
    }

    ngOnDestroy(): void {
        this.qa_preferences!.unsubscribeFromPreferenceChanges(
            this.qa_prefs_subscription_key
        );
    }

    get qa_question(): string {
        return this._qa_question;
    }

    set qa_question(value: string) {
        this._qa_question = value;
        this.updateQAElemTitle();
    }

    poseQuestion(switch_mode_if_cleared = false): void {
        if (!this.controller._scene?.graph) return;

        this.updateQAElemTitle();

        if (this._qa_question.length == 0) {
            this.displayed_qa_predictions = ['–'];

            MessageBusService.publish<WeightUpdateMessage>(
                MBChannel.WEIGHT,
                MessageSubjectWeight.UPDATE,
                {
                    object_weights: null,
                    relation_weights: null,
                }
            );

            // todo: consider refactoring this to use messages or something else instead
            if (switch_mode_if_cleared && this.controller.widgetDisplayMode) {
                this.controller.widgetDisplayMode.tab =
                    this.controller.widgetDisplayMode.GroundTruthDisplayModeTab;
            }
        } else {
            this.showQAProgressBar();

            this.backend.requestPredictions(
                this.controller._scene.graph!.id,
                this.qa_preferences.selected_model,
                this._qa_question.trim(),
                (response) => {
                    // alert(response.prediction);
                    this.processPredictionsForDisplay(response);

                    MessageBusService.publish<WeightUpdateMessage>(
                        MBChannel.WEIGHT,
                        MessageSubjectWeight.UPDATE,
                        {
                            object_weights: response.object_weights,
                            relation_weights: response.relation_weights,
                        }
                    );

                    this.hideQAProgressBar();
                }
            );

            // todo: consider refactoring this to use messages or something else instead
            if (this.controller.widgetDisplayMode) {
                this.controller.widgetDisplayMode.tab =
                    this.controller.widgetDisplayMode.PredictionDisplayModeTab;
            }
        }
    }

    onQuestionTokenSelected(event: MatAutocompleteSelectedEvent) {
        // ...
    }

    // todo: do this better
    private showQAProgressBar() {
        this.qa_progress_bar.mode = 'indeterminate';
        this.qa_progress_bar_style = 'visibility: visible;';
    }

    // todo: do this better
    private hideQAProgressBar() {
        this.qa_progress_bar.mode = 'determinate';
        this.qa_progress_bar_style = 'visibility: hidden;';
    }

    updateQAElemTitle() {
        this.qa_elem_title =
            this.qa_question.length == 0
                ? 'Click to pose a question about image contents...'
                : 'Question';
    }

    processWeightForDisplay(raw_weight: number): string {
        return (raw_weight * 100).toFixed(0);
    }

    processPredictionsForDisplay(predictions: QAPrediction) {
        const formatForDisplay = (
            num: number,
            prediction: string,
            weight: number
        ) => {
            return (
                num +
                '. ' +
                prediction +
                ' (' +
                this.processWeightForDisplay(weight) +
                '%' +
                ')'
            );
        };

        this.displayed_qa_predictions = ['-'];

        let i = 0;
        let confidence_sum = 0;

        while (i < this.qa_preferences.max_num_threshold) {
            const score = predictions.prediction_scores[i];

            this.displayed_qa_predictions[i] = formatForDisplay(
                i + 1,
                predictions.predictions[i],
                score
            );

            confidence_sum += score;
            i++;
        }
    }
}

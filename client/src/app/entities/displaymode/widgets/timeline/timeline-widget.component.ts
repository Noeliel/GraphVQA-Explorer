import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { interval, Subscription } from 'rxjs';
import {
    UIEventRedrawMessage,
    MessageSubjectUIEvent,
} from 'src/app/models/messages/ui-event-message.model';
import {
    WeightStatusMessage,
    MessageSubjectWeight,
} from 'src/app/models/messages/weight-message.model';
import { MessageBusService, MBChannel } from 'src/app/providers/message-bus';

@Component({
    selector: 'app-timeline-widget',
    templateUrl: './timeline-widget.component.html',
    styleUrls: ['./timeline-widget.component.scss'],
})
export class TimelineWidgetComponent implements OnInit, OnDestroy {
    timelineControl = new FormControl();
    _steps: Array<number> = [];

    private animationTimer = interval(650);

    private valueChangeSubscription?: Subscription;
    private animationSubscription?: Subscription;

    constructor() {
        this.num_steps = 1;
    }

    /*
    window.setTimeout(() => {
            this.cycleRelationWeights(weight_steps, (idx + 1) % 5, true);
        }, 500);
    */

    ngOnInit(): void {
        this.valueChangeSubscription =
            this.timelineControl.valueChanges.subscribe(() => {
                MessageBusService.publish<WeightStatusMessage>(
                    MBChannel.WEIGHT,
                    MessageSubjectWeight.STATUS,
                    { description: 'Weights changed' }
                );

                MessageBusService.publish<UIEventRedrawMessage>(
                    MBChannel.UI,
                    MessageSubjectUIEvent.REDRAW,
                    {
                        description: 'Timeline widget requests redraw',
                    }
                );
            });
    }

    ngOnDestroy(): void {
        this.stop_animation();

        if (this.valueChangeSubscription) {
            this.valueChangeSubscription.unsubscribe();
            this.valueChangeSubscription = undefined;
        }
    }

    get timelineExists(): boolean {
        return this._steps.length > 1;
    }

    get shouldShowTimelineControl(): boolean {
        return true;
    }

    get num_steps(): number {
        return this._steps.length;
    }

    /**
     * Less than 2 steps effectively disables the timeline.
     * @param num_steps Number of steps
     */
    set num_steps(steps: number) {
        if (steps < 1) steps = 1;

        this._steps = Array(steps)
            .fill(0)
            .map((x, i) => i + 1);

        const selected_step: number = this.timelineControl.value;

        if (!this._steps.find((step) => step == selected_step)) {
            // if no valid step is selected, select the last one

            // technically the array access is not necessary
            // could just set this to this._steps.length or this.num_steps (but risk bugs)
            this.timelineControl.setValue(
                this._steps[this._steps.length - 1].toString()
            );
        }
    }

    get selected_step(): number {
        return this.timelineControl.value;
    }

    set selected_step(step: number) {
        this.timelineControl.setValue(step.toString());
    }

    get is_animating(): boolean {
        return this.animationSubscription ? true : false;
    }

    public select_next_step(): void {
        // +1 happens inherently because we convert a step value with a range of 1..X (mod X)
        // ...to an index below (and step 0 has value 1, step 1 has 2, etc.)
        const next_step = this.selected_step % this.num_steps;
        this.selected_step = this._steps[next_step];
    }

    public toggle_animation(): void {
        if (this.is_animating) {
            this.stop_animation();
        } else {
            this.start_animation();
        }
    }

    public start_animation(): void {
        if (!this.animationSubscription) {
            this.select_next_step();

            this.animationSubscription = this.animationTimer.subscribe(() => {
                this.select_next_step();
            });
        }
    }

    public stop_animation(): void {
        if (this.animationSubscription) {
            this.animationSubscription.unsubscribe();
            this.animationSubscription = undefined;
        }
    }
}

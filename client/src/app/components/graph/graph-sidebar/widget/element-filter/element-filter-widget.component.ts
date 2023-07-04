import { ENTER, COMMA } from '@angular/cdk/keycodes';
import { Component, OnInit } from '@angular/core';
import { MatChipInputEvent } from '@angular/material/chips';
import { FilterType } from 'src/app/models/filterconfig.model';
import {
    FilterUpdateMessage,
    MessageSubjectFilter,
} from 'src/app/models/messages/filter-message.model';
import { MessageBusService, MBChannel } from 'src/app/providers/message-bus';

interface FilterString {
    value: string;
}

@Component({
    selector: 'app-element-filter-widget',
    templateUrl: './element-filter-widget.component.html',
    styleUrls: ['./element-filter-widget.component.scss'],
})
export class ElementFilterWidgetComponent implements OnInit {
    filters: FilterString[] = [];
    filter_types: FilterType[] = [
        FilterType.OBJECTS,
        FilterType.ATTRIBUTES,
        FilterType.RELATIONS,
    ];
    _selected_filter_type: FilterType = this.filter_types[0];
    _filter_option_invert = false;
    _filter_option_full_match = false;
    _filter_option_include_relation_objects_out = true;
    _filter_option_include_relation_objects_inc = true;

    addOnBlur = true;
    readonly separatorKeysCodes = [ENTER, COMMA] as const;
    filter_elem_title = '';

    constructor() {}

    ngOnInit(): void {
        this.updateFilterElemTitle();
    }

    get selected_filter_type(): FilterType {
        return this._selected_filter_type;
    }

    set selected_filter_type(value: FilterType) {
        this._selected_filter_type = value;
        this.publishFilterUpdate();
    }

    get filter_option_invert(): boolean {
        return this._filter_option_invert;
    }

    set filter_option_invert(value: boolean) {
        this._filter_option_invert = value;
        this.publishFilterUpdate();
    }

    get filter_option_full_match(): boolean {
        return this._filter_option_full_match;
    }

    set filter_option_full_match(value: boolean) {
        this._filter_option_full_match = value;
        this.publishFilterUpdate();
    }

    get filter_option_include_relation_objects_out(): boolean {
        return this._filter_option_include_relation_objects_out;
    }

    set filter_option_include_relation_objects_out(value: boolean) {
        this._filter_option_include_relation_objects_out = value;
        this.publishFilterUpdate();
    }

    get filter_option_include_relation_objects_inc(): boolean {
        return this._filter_option_include_relation_objects_inc;
    }

    set filter_option_include_relation_objects_inc(value: boolean) {
        this._filter_option_include_relation_objects_inc = value;
        this.publishFilterUpdate();
    }

    addFilter(event: MatChipInputEvent): void {
        const value = (event.value || '').trim();

        if (value) {
            this.filters.push({ value: value });
            this.updateFilterElemTitle();
            this.publishFilterUpdate();
        }

        event.chipInput!.clear();
    }

    removeFilter(filter: FilterString): void {
        const index = this.filters.indexOf(filter);

        if (index >= 0) {
            this.filters.splice(index, 1);
            this.updateFilterElemTitle();
            this.publishFilterUpdate();
        }
    }

    private publishFilterUpdate() {
        const filter_update = this.filters.map((filter) => {
            return filter.value;
        });

        const filter_config =
            filter_update.length > 0
                ? {
                      type: this._selected_filter_type,
                      filters: filter_update,
                      invert: this._filter_option_invert,
                      full_match: this._filter_option_full_match,
                      include_relation_objects_out:
                          this._filter_option_include_relation_objects_out,
                      include_relation_objects_inc:
                          this._filter_option_include_relation_objects_inc,
                  }
                : null;

        MessageBusService.publish<FilterUpdateMessage>(
            MBChannel.FILTER,
            MessageSubjectFilter.UPDATE,
            {
                new_config: filter_config,
            }
        );
    }

    private updateFilterElemTitle() {
        this.filter_elem_title =
            this.filters.length == 0
                ? 'Click to add element filters...'
                : 'Element Filters';
    }
}

import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import {
    MatAutocomplete,
    MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { map, Observable, startWith } from 'rxjs';

export interface EditObjectDialogData {
    id: string;
    name: string;
    attributes: string[];
    name_suggestions?: string[];
    attribute_suggestions?: string[];
}

@Component({
    selector: 'graph-sidebar-edit-object-dialog',
    templateUrl: 'graph-sidebar-edit-object-dialog.component.html',
})
export class EditSceneGraphObjectDialog {
    // ATTRIBUTES CHIP LIST
    addOnBlur = true;
    readonly separatorKeysCodes = [ENTER, COMMA] as const;

    nameControl = new FormControl();
    nameOptions: string[];
    filteredNameOptions: Observable<string[]>;

    @ViewChild('attributeInput')
    attributeInput!: ElementRef<HTMLInputElement>;

    @ViewChild('attributeAuto') attributeAuto!: MatAutocomplete;

    attributeControl = new FormControl();
    attributeOptions: string[];
    filteredAttributeOptions: Observable<string[]>;

    constructor(
        public dialogRef: MatDialogRef<EditSceneGraphObjectDialog>,
        @Inject(MAT_DIALOG_DATA) public data: EditObjectDialogData
    ) {
        const _filter_options = function (
            options: string[],
            value: string
        ): string[] {
            if (value.length < 1) return [];

            const filterValue = value.trimStart().toLowerCase();

            return options.filter((option) =>
                option.toLowerCase().includes(filterValue)
            );
        };

        this.nameOptions =
            data.name_suggestions?.sort((a, b) => a.localeCompare(b)) || [];
        this.filteredNameOptions = this.nameControl.valueChanges.pipe(
            startWith(''),
            map((value) => _filter_options(this.nameOptions, value))
        );
        this.attributeOptions =
            data.attribute_suggestions?.sort((a, b) => a.localeCompare(b)) ||
            [];
        this.filteredAttributeOptions = this.attributeControl.valueChanges.pipe(
            startWith(null),
            map((value: string | null) =>
                value ? _filter_options(this.attributeOptions, value) : []
            )
        );
    }

    onNoClick(): void {
        this.dialogRef.close();
    }

    onRemoveAttribute(attribute: string) {
        const index = this.data.attributes.indexOf(attribute);

        if (index >= 0) {
            this.data.attributes.splice(index, 1);
        }
    }

    onAddAttribute(event: MatChipInputEvent) {
        if (this.attributeAuto.isOpen) return;

        const value = (event.value || '').trim();
        this._pushAttribute(value);
    }

    onAttributeSelected(event: MatAutocompleteSelectedEvent) {
        const value = event.option.viewValue;
        this._pushAttribute(value);
    }

    private _pushAttribute(value: string | undefined) {
        if (value) {
            const index = this.data.attributes.indexOf(value);

            if (index < 0) {
                this.data.attributes.push(value);
            }

            this.attributeInput.nativeElement.value = '';
            this.attributeControl.setValue(null);
        }
    }
}

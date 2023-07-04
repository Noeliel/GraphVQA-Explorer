import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, Inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { map, Observable, startWith } from 'rxjs';

export interface EditRelationDialogData {
    id: string;
    name: string;
    from_obj_name: string;
    to_obj_name: string;
    name_suggestions?: string[];
}

@Component({
    selector: 'graph-sidebar-edit-relation-dialog',
    templateUrl: 'graph-sidebar-edit-relation-dialog.component.html',
})
export class EditSceneGraphRelationDialog {
    // ATTRIBUTES CHIP LIST
    addOnBlur = true;
    readonly separatorKeysCodes = [ENTER, COMMA] as const;

    nameControl = new FormControl();
    nameOptions: string[];
    filteredNameOptions: Observable<string[]>;

    constructor(
        public dialogRef: MatDialogRef<EditSceneGraphRelationDialog>,
        @Inject(MAT_DIALOG_DATA) public data: EditRelationDialogData
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
    }

    onNoClick(): void {
        this.dialogRef.close();
    }
}

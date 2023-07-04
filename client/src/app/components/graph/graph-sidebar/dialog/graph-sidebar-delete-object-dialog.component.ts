import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface DeleteObjectDialogData {
    id: string;
    name: string;
}

@Component({
    selector: 'graph-sidebar-delete-object-dialog',
    templateUrl: 'graph-sidebar-delete-object-dialog.component.html',
})
export class DeleteSceneGraphObjectDialog {
    constructor(
        public dialogRef: MatDialogRef<DeleteSceneGraphObjectDialog>,
        @Inject(MAT_DIALOG_DATA) public data: DeleteObjectDialogData
    ) {}

    onCancelClick(): void {
        this.dialogRef.close(false);
    }

    onConfirmClick(): void {
        this.dialogRef.close(true);
    }
}

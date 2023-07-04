import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface DeleteRelationDialogData {
    id: string;
    name: string;
    from_obj_name: string;
    to_obj_name: string;
}

@Component({
    selector: 'graph-sidebar-delete-relation-dialog',
    templateUrl: 'graph-sidebar-delete-relation-dialog.component.html',
})
export class DeleteSceneGraphRelationDialog {
    constructor(
        public dialogRef: MatDialogRef<DeleteSceneGraphRelationDialog>,
        @Inject(MAT_DIALOG_DATA) public data: DeleteRelationDialogData
    ) {}

    onCancelClick(): void {
        this.dialogRef.close(false);
    }

    onConfirmClick(): void {
        this.dialogRef.close(true);
    }
}

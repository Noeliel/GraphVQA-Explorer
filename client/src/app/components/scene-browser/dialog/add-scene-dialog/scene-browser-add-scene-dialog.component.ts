import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FileValidator } from 'ngx-material-file-input';
import { BackendService } from 'src/app/services/backend/backend.service';

export interface AddSceneDialogData {}

export interface AddSceneDialogResult {
    success: boolean;
    scene_id?: string;
}

@Component({
    selector: 'scene-browser--add-scene-dialog',
    templateUrl: './scene-browser-add-scene-dialog.component.html',
})
export class AddSceneDialog {
    readonly maxSize = 104857600;
    formDoc: FormGroup;

    constructor(
        private backend: BackendService,
        public dialogRef: MatDialogRef<AddSceneDialog>,
        @Inject(MAT_DIALOG_DATA) public data: AddSceneDialogData,
        private _fb: FormBuilder
    ) {
        this.formDoc = this._fb.group({
            sceneImageFile: [
                undefined,
                [
                    Validators.required,
                    FileValidator.maxContentSize(this.maxSize),
                ],
            ],
        });
    }

    onCancelClick(): void {
        const result: AddSceneDialogResult = {
            success: false,
        };
        this.dialogRef.close(result);
    }

    onConfirmClick(): void {
        this.formDoc.markAllAsTouched();
        this.formDoc.updateValueAndValidity();

        if (this.formDoc.valid) {
            const sceneImage =
                this.formDoc.get('sceneImageFile')?.value.files[0];

            this.backend.createScene(sceneImage, (response) => {
                const result: AddSceneDialogResult = {
                    success: true,
                    scene_id: response,
                };
                this.dialogRef.close(result);
            });
        }
    }
}

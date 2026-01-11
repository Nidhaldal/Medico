import { Component, Inject } from '@angular/core';
import { NB_DIALOG_CONFIG, NbDialogRef } from '@nebular/theme';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss']
})
export class ConfirmDialogComponent {
  title: string = 'Confirm';
  message: string = 'Are you sure?';

  constructor(
    protected dialogRef: NbDialogRef<ConfirmDialogComponent>,
    @Inject(NB_DIALOG_CONFIG) private config: any
  ) {
    this.title = config.title || this.title;
    this.message = config.message || this.message;
  }

  confirm() {
    this.dialogRef.close(true);
  }

  cancel() {
    this.dialogRef.close(false);
  }
}

import { Component, inject, Injectable } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  readonly dialog = inject(MatDialog);

  constructor() { }

  error(e: Error, errorSource: string, alert_user: boolean = false) {
    console.error(`Unexpected error from ${errorSource}`, e)

    if (alert_user){
      this.notify(e.message, `Unexpected error from ${errorSource}`)
    }
  }

  notify(message: string, title: string | null = null) {
    this.dialog.open(DialogNotification, {
      data: {
        title: title,
        message: message
      },
    })
  }
}

@Component({
  selector: 'dialog-notification',
  templateUrl: 'dialogs/notification.html',
  imports: [MatDialogModule, MatButtonModule],
})
export class DialogNotification {
  data = inject(MAT_DIALOG_DATA);
}
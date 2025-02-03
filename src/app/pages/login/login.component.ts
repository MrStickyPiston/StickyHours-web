import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { ZermeloService } from '../../services/zermelo/zermelo.service';
import { MatIconModule } from '@angular/material/icon';
import {
  MatDialog,
  MAT_DIALOG_DATA,
  MatDialogTitle,
  MatDialogContent,
  MatDialogModule,
} from '@angular/material/dialog';
import { Dialog } from '@angular/cdk/dialog';
import { UtilsService } from '../../services/utils/utils.service';

@Component({
  selector: 'app-login',
  imports: [MatFormFieldModule,
    MatInputModule, MatButtonModule, MatCheckboxModule, FormsModule, MatIconModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  readonly dialog = inject(MatDialog);

  constructor(
    private zermelo: ZermeloService,
    private router: Router,
    private utils: UtilsService
  ) { };

  private readonly route = inject(ActivatedRoute);
  route_instance!: string | null;

  // ngModels
  instance!: string;
  linkcode!: string;

  async ngOnInit() {
    this.route_instance = this.route.snapshot.paramMap.get('instance_id')

    if (this.route_instance && !await this.zermelo.isValid(this.route_instance!)) {
      console.error(`Invalid route_instance ${this.route_instance}. Navigating to homepage`)
      this.router.navigate([''])
    }

    console.log(this.route.snapshot.paramMap)
  }

  async next() {
    if (!this.instance) {
      this.utils.notify("If you dont know what to fill in please click on the help button.", "Please fill in the instance id")
      return

    } else if (!await this.zermelo.isValid(this.instance)){
      this.utils.notify("The instance id is incorrect or the Zermelo servers are having issues. Please check if you spelled it correctly, and if you dont know what to fill in please click on the help button on the right of the field.", "Invalid instance id")
      return

    }

    // Next step
    this.router.navigate([this.instance])
  }

  async submit() {

    if (!await this.zermelo.isValid(this.route_instance!)){
      this.utils.notify("The instance id is incorrect or the Zermelo servers are having issues. Please check if you spelled it correctly, and if you dont know what to fill in please click on the help button on the right of the field.", "Invalid instance id")
      return
    }

    if (!this.linkcode) {
      this.utils.notify("If you dont know what to fill in please click on the help button.", "Please fill in the linkcode")
      return
    } else {
      // login
      this.utils.notify("Logging in is still being worked on. Please check back in a few days.", "Login in progress")
    }
  
  }

  openInstanceidDialog(){
    this.dialog.open(DialogInstanceid, { });
  }

  openLinkcodeDialog(){
    this.dialog.open(DialogLinkcode, {
      data: {
        url: this.zermelo.getDashboardUrl(this.route_instance!),
      },
    });
  }

}

@Component({
  selector: 'dialog-instanceid',
  templateUrl: 'dialogs/instance-id.html',
  imports: [MatDialogModule, MatButtonModule],
})
export class DialogInstanceid {}

@Component({
  selector: 'dialog-linkcode',
  templateUrl: 'dialogs/linkcode.html',
  imports: [MatDialogModule, MatButtonModule],
})
export class DialogLinkcode {
  data = inject(MAT_DIALOG_DATA);
}
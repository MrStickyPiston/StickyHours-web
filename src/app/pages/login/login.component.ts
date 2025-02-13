import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { UtilsService } from '../../services/utils/utils.service';
import { ZermeloService } from '../../services/zermelo/zermelo.service';
import {MatAutocompleteModule} from '@angular/material/autocomplete'; 

@Component({
  selector: 'app-login',
  imports: [MatFormFieldModule,
    MatInputModule, MatButtonModule, MatCheckboxModule, FormsModule, MatIconModule, MatAutocompleteModule],
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
  instances!: Set<string>;

  // ngModels
  instance!: string;
  linkcode!: string;
  remember_token: boolean = true;

  async ngOnInit() {
    this.route_instance = this.route.snapshot.paramMap.get('instance_id')
    this.instances = this.zermelo.getInstances()

    if (this.route_instance && !await this.zermelo.isValidInstance(this.route_instance!)) {
      console.error(`Invalid route_instance ${this.route_instance}. Navigating to homepage`)
      this.router.navigate([''])
    }

    if (await this.zermelo.isLoggedIn(this.route_instance!)){
      console.log("Already logged in on route, navigating to main page for this instance.")
      this.router.navigate([this.route_instance])
    } else {
      this.zermelo.currentInstance = null!
    }
  }

  async next() {
    if (!this.instance) {
      this.utils.notify("If you dont know what to fill in please click on the help button.", "Please fill in the instance id")
      return

    } else if (!await this.zermelo.isValidInstance(this.instance)) {
      this.utils.notify("The instance id is incorrect or the Zermelo servers are having issues. Please check if you spelled it correctly, and if you dont know what to fill in please click on the help button on the right of the field.", "Invalid instance id")
      return

    }

    // Next step
    console.log('Correct instance id, going to the next step')
    this.router.navigate([this.instance, 'login'])
  }

  async submit() {

    if (!await this.zermelo.isValidInstance(this.route_instance!)) {
      this.utils.notify("The instance id is incorrect or the Zermelo servers are having issues. Please check if you spelled it correctly, and if you dont know what to fill in please click on the help button on the right of the field.", "Invalid instance id")
      return
    }

    if (!this.linkcode) {
      this.utils.notify("If you dont know what to fill in please click on the help button.", "Please fill in the linkcode")
      return
    } else {
      // login
      if (await this.zermelo.codeLogin(this.linkcode, this.route_instance!, this.remember_token)) {
        console.log("Succesfully logged in")
        this.router.navigate([this.route_instance])
      } else {
        this.utils.notify("Invalid linkcode", "Login failed")
      }
    }

  }

  openInstanceidDialog() {
    if (this)
    this.dialog.open(DialogInstanceid, {});
  }

  openLinkcodeDialog() {
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
export class DialogInstanceid { }

@Component({
  selector: 'dialog-linkcode',
  templateUrl: 'dialogs/linkcode.html',
  styles: 'img {width: 100%;}',
  imports: [MatDialogModule, MatButtonModule],
})
export class DialogLinkcode {
  data = inject(MAT_DIALOG_DATA);
}
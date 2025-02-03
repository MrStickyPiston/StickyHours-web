import { Component, inject } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ZermeloService } from '../../services/zermelo/zermelo.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-login',
  imports: [MatFormFieldModule,
    MatInputModule, MatButtonModule, MatCheckboxModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  constructor(
    private Zermelo: ZermeloService
  ){};

  private readonly route = inject(ActivatedRoute);
  route_instance!: string | null;

  // ngModels
  instance!: string;
  linkcode!: string;

  async ngOnInit(){
    this.route_instance = this.route.snapshot.paramMap.get('instance_id')

    if (!await this.Zermelo.isValid(this.route_instance!)) {
      alert("Invalid link")
    }

    console.log(this.route.snapshot.paramMap)
  }

  async onLogin() {

    if (this.route_instance != null) {
      this.instance = this.route_instance
    }

    console.log(this.instance)
    console.log(await this.Zermelo.isValid(this.instance))
  }

}

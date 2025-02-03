import { Component, inject } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [MatFormFieldModule,
    MatInputModule, MatButtonModule, MatCheckboxModule, FormsModule,
    ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  private readonly route = inject(ActivatedRoute);
  instance!: string | null;

  ngOnInit(){
    this.instance = this.route.snapshot.paramMap.get('instance_id')
    console.log(this.route.snapshot.paramMap)
  }

  onLogin() {
    console.log(this.instance)
  }

}

import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ZermeloService } from '../../services/zermelo/zermelo.service';

@Component({
  selector: 'app-lastused',
  imports: [],
  templateUrl: './lastused.component.html',
  styleUrl: './lastused.component.scss'
})
export class LastusedComponent {
  constructor(
    private router: Router,
    private zermelo: ZermeloService
  ){
    if (zermelo.getLastInstance()){
      this.router.navigate([zermelo.getLastInstance()])
    } else {
      this.router.navigate([''])
    }
  }
}

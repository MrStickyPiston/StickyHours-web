import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { ZermeloService } from '../../services/zermelo/zermelo.service';


@Component({
  selector: 'app-main',
  imports: [MatCardModule, MatChipsModule, RouterOutlet, MatIconModule, MatMenuModule, MatButtonModule],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent {
  route_instance!: string | null;

  constructor(
    private zermelo: ZermeloService,
    private router: Router
  ) {}

  getCurrentInstance(){
    return this.zermelo.currentInstance
  }

  manageInstances() {
    this.router.navigate([''])
  }

  logout(){
    console.log(`Logging out ${this.zermelo.currentInstance}`)
    this.zermelo.logout(this.zermelo.currentInstance)
  }
}

import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UtilsService } from '../../services/utils/utils.service';
import { ZermeloService } from '../../services/zermelo/zermelo.service';

@Component({
  selector: 'app-app-main',
  imports: [],
  templateUrl: './app-main.component.html',
  styleUrl: './app-main.component.scss'
})
export class AppMainComponent {

  constructor(
      private zermelo: ZermeloService,
      private router: Router,
      private utils: UtilsService
    ) { };

  private readonly route = inject(ActivatedRoute);
  route_instance!: string | null;

  async ngOnInit() {
    this.route_instance = this.route.snapshot.paramMap.get('instance_id')

    if (!await this.zermelo.isLoggedIn(this.route_instance!)){
      console.log("Not logged in on route, navigating to login page for this instance.")
      this.zermelo.clearToken(this.route_instance!)
      this.router.navigate([this.route_instance, 'login'])
    } else {
      console.log(`Logged in on ${this.route_instance}`)
    }
  }

}

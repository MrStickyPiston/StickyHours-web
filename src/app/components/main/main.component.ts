import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card'; 
import { MatChipsModule } from '@angular/material/chips'; 
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { UtilsService } from '../../services/utils/utils.service';
import { ZermeloService } from '../../services/zermelo/zermelo.service';


@Component({
  selector: 'app-main',
  imports: [MatCardModule, MatChipsModule, RouterOutlet],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent {

  route_instance!: string | null;

  constructor(){}
}

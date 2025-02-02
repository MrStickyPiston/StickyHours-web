import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card'; 
import { MatChipsModule } from '@angular/material/chips'; 
import { RouterOutlet } from '@angular/router';


@Component({
  selector: 'app-main',
  imports: [MatCardModule, MatChipsModule, RouterOutlet],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent {

}

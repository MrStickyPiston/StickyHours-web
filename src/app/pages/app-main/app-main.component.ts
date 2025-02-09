import { Component, computed, inject, model, Signal, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UtilsService } from '../../services/utils/utils.service';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {MatSelectModule} from '@angular/material/select';
import {MatChipInputEvent, MatChipsModule} from '@angular/material/chips'; 
import { ZermeloService } from '../../services/zermelo/zermelo.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import {MatAutocompleteModule, MatAutocompleteSelectedEvent} from '@angular/material/autocomplete'; 
import { User } from '../../types/users/user';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { LiveAnnouncer } from '@angular/cdk/a11y';

@Component({
  selector: 'app-app-main',
  imports: [MatFormFieldModule, MatSelectModule, MatAutocompleteModule, FormsModule, MatInputModule, MatChipsModule, MatIconModule],
  templateUrl: './app-main.component.html',
  styleUrl: './app-main.component.scss'
})
export class AppMainComponent {

  constructor(
      private zermelo: ZermeloService,
      private router: Router,
    ) { };

  private readonly route = inject(ActivatedRoute)
  readonly announcer = inject(LiveAnnouncer)
  readonly separatorKeysCodes: number[] = [ENTER, COMMA]

  selectedUsers: User[] = []

  route_instance!: string | null

  allUsers: User[] | null = []

  user!: string;

  filteredUsers: User[] | null = []

  updateFilteredUsers(){
    const currentUser = this.user?.toLowerCase();

    let users = this.allUsers!.filter(user => !this.selectedUsers.some(selectedUser => selectedUser.code === user.code));

    this.filteredUsers = currentUser
      ? users.filter(user => user.name.toLowerCase().includes(currentUser))
      : users!.slice();
  };


  async ngOnInit() {
    this.route_instance = this.route.snapshot.paramMap.get('instance_id')

    if (!await this.zermelo.isLoggedIn(this.route_instance!)){
      console.log("Not logged in on route, navigating to login page for this instance.")
      this.zermelo.clearToken(this.route_instance!)
      this.router.navigate([this.route_instance, 'login'])
      return
    } else {
      console.log(`Logged in on ${this.route_instance}`)
    }

    this.allUsers = await this.zermelo.getUsers(this.route_instance!)
    this.updateFilteredUsers()
  }

  remove(userCode: string): void {
    this.selectedUsers = this.selectedUsers.filter(user => user.code !== userCode);
  }

  selected(event: MatAutocompleteSelectedEvent): void {

    const user = this.allUsers!.find(user => user.code === event.option.value)

    if (user) {
      this.selectedUsers = [... this.selectedUsers, user]
      this.user = '';
      event.option.deselect();
      this.updateFilteredUsers()
    }
  }

}

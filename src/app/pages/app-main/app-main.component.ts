import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UtilsService } from '../../services/utils/utils.service';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { ZermeloService } from '../../services/zermelo/zermelo.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { User } from '../../types/users/user';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ZapiService } from '../../services/zapi/zapi.service';
import { MatExpansionModule } from '@angular/material/expansion';
import { Gap } from '../../types/appointment/gap';
import {MatProgressBarModule} from '@angular/material/progress-bar'; 

@Component({
  selector: 'app-app-main',
  imports: [MatFormFieldModule, MatSelectModule, MatAutocompleteModule, FormsModule, MatInputModule, MatChipsModule, MatIconModule, MatButtonModule, MatExpansionModule, MatProgressBarModule],
  templateUrl: './app-main.component.html',
  styleUrl: './app-main.component.scss'
})
export class AppMainComponent {

  constructor(
    private zermelo: ZermeloService,
    private zapi: ZapiService,
    private utils: UtilsService,
    private router: Router,
  ) { };

  private readonly route = inject(ActivatedRoute)

  // Data from API / route
  allUsers: User[] | null = []
  route_instance!: string | null

  // The users that are currently selected
  selectedUsers: User[] = []

  // The users that can be selected after filtering out the query
  filteredUsers: User[] | null = []

  // ngModels
  user!: string
  weeks: string = '1'
  stickyHours: string = '0'

  // Output: the common free hours
  commonFreeHours!: { [date: string]: Gap[]; } | null
  dates!: string[]

  // State variables
  loading = true
  processing = false

  updateFilteredUsers() {
    const currentUser = this.user?.toLowerCase();

    let users = this.allUsers!.filter(user => !this.selectedUsers.some(selectedUser => selectedUser.code === user.code));

    this.filteredUsers = currentUser
      ? users.filter(user => user.name.toLowerCase().includes(currentUser))
      : users!.slice();
  };


  async ngOnInit() {
    this.route_instance = this.route.snapshot.paramMap.get('instance_id')

    if (!await this.zermelo.isLoggedIn(this.route_instance!)) {
      console.log("Not logged in on route, navigating to login page for this instance.")
      this.zermelo.clearToken(this.route_instance!)
      this.router.navigate([this.route_instance, 'login'])
      return
    } else {
      console.log(`Logged in on ${this.route_instance}`)
      this.zermelo.currentInstance = this.route_instance!
    }

    // This instance has a valid token and is opened
    this.zermelo.setLastInstance(this.route_instance!)

    this.allUsers = await this.zermelo.getUsers(this.route_instance!)
    this.updateFilteredUsers()

    const zermeloUserCode = (await this.zermelo.getUser(this.route_instance!)).code
    this.addSelectedUser(this.allUsers!.find(user => user.code === zermeloUserCode)!)

    this.loading = false
  }

  removeSelectedUser(userCode: string): void {
    this.selectedUsers = this.selectedUsers.filter(user => user.code !== userCode);
  }

  userSelected(event: MatAutocompleteSelectedEvent): void {

    const user = this.allUsers!.find(user => user.code === event.option.value)

    if (user) {
      this.addSelectedUser(user)
      this.user = '';
      event.option.deselect();
      this.updateFilteredUsers()
    }
  }

  addSelectedUser(user: User) {
    this.selectedUsers = [... this.selectedUsers, user]
  }

  async submit() {
    console.log(`Computing common free hours for ${JSON.stringify(this.selectedUsers)}`)
    
    this.processing = true
    this.dates = null!

    this.commonFreeHours = await this.zapi.getCommonFreeHours(this.route_instance!, this.selectedUsers, Number(this.weeks), Number(this.stickyHours))
    if (this.commonFreeHours != null) {
      this.dates = Object.keys(this.commonFreeHours!).sort()
    }

    this.processing = false

    if (this.dates.length == 0 && await this.zermelo.isLoggedIn(this.route_instance!)) {
      this.utils.notify("No common free hours have been found using this combination of users.")
    }
  }

  displayDatetime(datetime: string | number, options: Intl.DateTimeFormatOptions) {
    return new Date(datetime).toLocaleString('en-US', { ...options, hour12: false })
  }

  displayTimeDelta(seconds: number) {
    let minutes = Math.floor(seconds / 60)
    seconds -= minutes * 60

    let hours = Math.floor(minutes / 60)
    minutes -= hours * 60

    let result = ""

    if (hours > 0) {
      result += hours.toString() + "h"
    }

    if (minutes > 0) {
      result += " " + minutes.toString() + "m"
    }

    if (seconds > 0) {
      result += " " + seconds.toString() + "s"
    }

    return result.trim()
  }

}

import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { AppMainComponent } from './pages/app-main/app-main.component';
import { LastusedComponent } from './redirect/lastused/lastused.component';

export const routes: Routes = [
    { path: '', component: LoginComponent},
    { path: 'lastused', component: LastusedComponent},
    { path: ':instance_id/login', component: LoginComponent},
    { path: ':instance_id', component: AppMainComponent}
];

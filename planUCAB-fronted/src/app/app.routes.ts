import { Routes } from '@angular/router';
import { CalendarioComponent } from './calendario-semanal/calendario.component';
import { LoginComponent } from './auth/login.component';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', component: CalendarioComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];

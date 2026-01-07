import { Routes } from '@angular/router';
import { CalendarioComponent } from './calendario-semanal/calendario.component';
import { LoginComponent } from './auth/login.component';
import { NotasComponent } from './notas/notas.component';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', component: CalendarioComponent, canActivate: [authGuard] },
  { path: 'notas', component: NotasComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];

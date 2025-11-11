import { Routes } from '@angular/router';
import { CalendarioComponent } from './calendario/calendario.component';

export const routes: Routes = [
  { path: '', component: CalendarioComponent },
  { path: 'evaluaciones', loadComponent: () => import('./evaluacion/evaluaciones-list.component').then(m => m.EvaluacionesListComponent) },
  { path: 'evaluaciones/nuevo', loadComponent: () => import('./evaluacion/crear-evaluacion.component').then(m => m.CrearEvaluacionComponent) }
];

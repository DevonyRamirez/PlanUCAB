import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BusquedaService {
  filtro = signal<string>('');
}


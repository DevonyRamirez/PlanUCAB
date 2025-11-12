import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class BusquedaComunicacionService {
  private busquedaSubject = new Subject<string>();
  busqueda$ = this.busquedaSubject.asObservable();

  buscar(termino: string): void {
    this.busquedaSubject.next(termino);
  }
}


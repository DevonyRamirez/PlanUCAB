import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Materia {
  id: number;
  nombre: string;
  semestre: string;
  uc: number;
}

@Injectable({ providedIn: 'root' })
export class MateriaService {
  private readonly baseUrl = 'http://localhost:8080/api/materias';

  constructor(private http: HttpClient) {}

  obtenerMaterias(): Observable<Materia[]> {
    return this.http.get<Materia[]>(this.baseUrl);
  }
}


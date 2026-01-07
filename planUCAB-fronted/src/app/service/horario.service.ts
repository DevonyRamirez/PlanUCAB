import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Materia } from './materia.service';

export interface CreateHorarioPayload {
  materia: Materia;
  location: string;
  diaSemana: string;   // Lunes, Martes, Miércoles, etc.
  startTime: string;   // HH:mm
  endTime: string;     // HH:mm
  profesor?: string;
  tipoClase?: string;  // Teoría, Práctica, Taller
  colorHex: string;    // #RRGGBB
}

export interface Horario {
  id: number;
  userId: number;
  materia: Materia;
  location: string;
  diaSemana: string;
  startTime: string;
  endTime: string;
  profesor?: string;
  tipoClase?: string;
  colorHex: string;
}

@Injectable({ providedIn: 'root' })
export class HorarioService {
  private readonly baseUrl = 'http://localhost:8081/api';

  constructor(private http: HttpClient) {}

  crearHorario(userId: number, payload: CreateHorarioPayload): Observable<Horario> {
    return this.http.post<Horario>(`${this.baseUrl}/users/${userId}/horarios`, payload);
  }

  obtenerHorarios(userId: number): Observable<Horario[]> {
    return this.http.get<Horario[]>(`${this.baseUrl}/users/${userId}/horarios`);
  }

  actualizarHorario(userId: number, horarioId: number, payload: CreateHorarioPayload): Observable<Horario> {
    return this.http.put<Horario>(`${this.baseUrl}/users/${userId}/horarios/${horarioId}`, payload);
  }

  eliminarHorario(userId: number, horarioId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/users/${userId}/horarios/${horarioId}`);
  }
}


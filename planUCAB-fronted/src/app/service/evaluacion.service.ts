import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Materia } from './materia.service';

export interface CreateEvaluacionPayload {
  titulo: string;
  materia: Materia;
  porcentaje: number;
  nota: number; // En base a 20
  profesor: string;
  location: string;
  descripcion?: string;
  date: string;   // YYYY-MM-DD
  startTime: string;   // HH:mm
  endTime: string;     // HH:mm
  colorHex: string;    // Color en formato hexadecimal
}

export interface Evaluacion {
  id: number;
  userId: number;
  titulo: string;
  materia: Materia;
  porcentaje: number;
  nota: number;
  profesor: string;
  location: string;
  descripcion?: string;
  startDateTime: string; // ISO 8601
  endDateTime: string;   // ISO 8601
  colorHex?: string;     // Color en formato hexadecimal
}

@Injectable({ providedIn: 'root' })
export class EvaluacionService {
  private readonly baseUrl = 'http://localhost:8081/api';

  constructor(private http: HttpClient) {}

  crearEvaluacion(userId: number, payload: CreateEvaluacionPayload): Observable<Evaluacion> {
    return this.http.post<Evaluacion>(`${this.baseUrl}/users/${userId}/evaluaciones`, payload);
  }

  obtenerEvaluaciones(userId: number): Observable<Evaluacion[]> {
    return this.http.get<Evaluacion[]>(`${this.baseUrl}/users/${userId}/evaluaciones`);
  }

  actualizarEvaluacion(userId: number, evaluacionId: number, payload: CreateEvaluacionPayload): Observable<Evaluacion> {
    return this.http.put<Evaluacion>(`${this.baseUrl}/users/${userId}/evaluaciones/${evaluacionId}`, payload);
  }
}


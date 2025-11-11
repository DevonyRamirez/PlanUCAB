import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CreateEvaluationPayload {
  name: string;
  classroom: string;
  subject: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (24h)
  endTime: string; // HH:mm (24h)
  colorHex: string; // #RRGGBB
  description?: string | null;
  porcentageWeight: number;
}

export interface Evaluation {
  id: number;
  userId: number;
  name: string;
  subject: string;
  classroom: string;
  description?: string | null;
  startDateTime: string; // ISO 8601
  endDateTime: string;   // ISO 8601
  colorHex: string;
  porcentageWeight: number;
}

@Injectable({ providedIn: 'root' })
export class EvaluacionService {
  private readonly baseUrl = 'http://localhost:8080';

  constructor(private http: HttpClient) {}

  crearEvaluacion(userId: number, payload: CreateEvaluationPayload): Observable<Evaluation> {
    return this.http.post<Evaluation>(`${this.baseUrl}/evaluations/${userId}`, payload);
  }

  obtenerEvaluaciones(userId: number): Observable<Evaluation[]> {
    return this.http.get<Evaluation[]>(`${this.baseUrl}/evaluations/${userId}`);
  }

  actualizarEvaluacion(userId: number, evaluationId: number, payload: CreateEvaluationPayload): Observable<Evaluation> {
    return this.http.put<Evaluation>(`${this.baseUrl}/evaluations/${userId}/${evaluationId}`, payload);
  }

  eliminarEvaluacion(userId: number, evaluationId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/evaluations/${userId}/${evaluationId}`);
  }
}

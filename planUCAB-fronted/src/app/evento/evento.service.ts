import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CreateEventPayload {
  name: string;
  location: string;
  date: string;   // YYYY-MM-DD
  startTime: string;   // HH:mm or h:mm AM/PM
  endTime: string;     // HH:mm or h:mm AM/PM
  description?: string;
  colorHex: string; // #RRGGBB
}

export interface Event {
  id: number;
  userId: number;
  name: string;
  location: string;
  description?: string;
  startDateTime: string; // ISO
  endDateTime: string;   // ISO
  colorHex: string;
}

@Injectable({ providedIn: 'root' })
export class EventoService {
  private readonly baseUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  crearEvento(userId: number, payload: CreateEventPayload): Observable<Event> {
    return this.http.post<Event>(`${this.baseUrl}/users/${userId}/events`, payload);
  }

  obtenerEventos(userId: number): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.baseUrl}/users/${userId}/events`);
  }
}



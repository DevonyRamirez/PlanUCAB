import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventoService, Event } from '../evento/evento.service';
import { CalendarioMensualComponent } from './calendario-mensual.component';
import { CrearEventoComponent } from '../evento/crear-evento.component';
import { BusquedaService } from '../shared/busqueda.service';

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  const diff = -day; // Restar el día para llegar al domingo
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [CommonModule, CalendarioMensualComponent, CrearEventoComponent],
  templateUrl: './calendario.component.html',
  styleUrl: './calendario.component.css'
})
export class CalendarioComponent implements OnInit {
  readonly usuarioId = 1;
  readonly startHour = 0;
  readonly endHour = 24;
  readonly horas = Array.from({ length: 24 }).map((_, i) => i);
  semanaInicio = signal(startOfWeek(new Date()));
  diasSemana = computed(() => Array.from({ length: 7 }).map((_, i) => addDays(this.semanaInicio(), i)));
  eventos = signal<Event[]>([]);
  mostrarModalCrear = signal(false);
  eventoSeleccionado = signal<Event | null>(null);
  eventosFiltrados = computed(() => {
    const f = this.busquedaService.filtro().trim().toLowerCase();
    if (!f) return this.eventos();
    return this.eventos().filter(e => (e.name || '').toLowerCase().includes(f) || (e.location || '').toLowerCase().includes(f));
  });

  constructor(
    private eventoService: EventoService,
    public busquedaService: BusquedaService
  ) {}

  ngOnInit(): void { this.cargar(); }

  cargar(): void { this.eventoService.obtenerEventos(this.usuarioId).subscribe((evs) => this.eventos.set(evs)); }

  siguienteSemana(): void { this.semanaInicio.set(addDays(this.semanaInicio(), 7)); }
  anteriorSemana(): void { this.semanaInicio.set(addDays(this.semanaInicio(), -7)); }

  estaEnDia(evento: Event, dia: Date): boolean {
    const d = new Date(evento.startDateTime);
    return d.getFullYear() === dia.getFullYear() && d.getMonth() === dia.getMonth() && d.getDate() === dia.getDate();
  }

  topPercent(evento: Event): string {
    const d = new Date(evento.startDateTime);
    const minutos = d.getHours() * 60 + d.getMinutes();
    const minInicio = this.startHour * 60;
    const minFin = this.endHour * 60;
    const pct = Math.max(0, Math.min(100, ((minutos - minInicio) / Math.max(1, (minFin - minInicio))) * 100));
    return pct + '%';
  }

  heightPercent(evento: Event): string {
    const start = new Date(evento.startDateTime);
    const end = new Date(evento.endDateTime);
    const dur = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60));
    const daySpan = Math.max(1, (this.endHour - this.startHour) * 60);
    const pct = Math.max(2, (dur / daySpan) * 100);
    return pct + '%';
  }

  abrirModalCrear(): void {
    this.mostrarModalCrear.set(true);
  }

  cerrarModalCrear(): void {
    this.mostrarModalCrear.set(false);
  }

  onEventoCreado(): void {
    this.cargar();
  }

  formatHour(hour: number): string {
    return `${String(hour).padStart(2, '0')}:00`;
  }

  formatDayName(date: Date): string {
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const dia = date.getDay();
    return `${dias[dia]} ${date.getDate()}`;
  }

  formatMonthName(date: Date): string {
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return meses[date.getMonth()];
  }

  formatDateRange(): string {
    const inicio = this.diasSemana()[0];
    const fin = this.diasSemana()[6];
    return `${this.formatMonthName(inicio)} ${inicio.getDate()} - ${this.formatMonthName(fin)} ${fin.getDate()}, ${fin.getFullYear()}`;
  }

  abrirDetallesEvento(evento: Event): void {
    this.eventoSeleccionado.set(evento);
  }

  cerrarDetallesEvento(): void {
    this.eventoSeleccionado.set(null);
  }

  formatEventDate(date: string): string {
    const d = new Date(date);
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return `${dias[d.getDay()]}, ${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
  }

  formatEventTime(date: string): string {
    const d = new Date(date);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
}



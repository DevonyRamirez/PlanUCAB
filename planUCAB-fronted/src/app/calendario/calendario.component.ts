import { Component, OnInit, computed, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventoService, Event } from '../evento/evento.service';
import { HorarioService, Horario } from '../horario/horario.service';
import { CalendarioMensualComponent } from './calendario-mensual.component';
import { CrearEventoComponent } from '../evento/crear-evento.component';
import { CrearHorarioComponent } from '../horario/crear-horario.component';
import { BusquedaComunicacionService } from '../barra-busqueda/busqueda-comunicacion.service';
import { Subscription } from 'rxjs';

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
  imports: [CommonModule, CalendarioMensualComponent, CrearEventoComponent, CrearHorarioComponent],
  templateUrl: './calendario.component.html',
  styleUrl: './calendario.component.css'
})
export class CalendarioComponent implements OnInit, OnDestroy {
  readonly usuarioId = 1;
  readonly startHour = 0;
  readonly endHour = 24;
  readonly horas = Array.from({ length: 24 }).map((_, i) => i);
  semanaInicio = signal(startOfWeek(new Date()));
  diasSemana = computed(() => Array.from({ length: 7 }).map((_, i) => addDays(this.semanaInicio(), i)));
  eventos = signal<Event[]>([]);
  horarios = signal<Horario[]>([]);
  mostrarModalCrear = signal(false);
  mostrarModalCrearHorario = signal(false);
  eventoSeleccionado = signal<Event | null>(null);
  mostrarErrorBusqueda = signal(false);
  mensajeErrorBusqueda = signal('');
  
  private busquedaSubscription?: Subscription;
  
  // Combinar eventos y horarios convertidos a eventos virtuales
  eventosYHorarios = computed(() => {
    const eventos = this.eventos();
    const horariosVirtuales = this.convertirHorariosAEventos();
    return [...eventos, ...horariosVirtuales];
  });

  constructor(
    private eventoService: EventoService,
    private horarioService: HorarioService,
    private busquedaComunicacion: BusquedaComunicacionService
  ) {}

  ngOnInit(): void { 
    this.cargar(); 
    this.cargarHorarios();
    // Suscribirse a eventos de búsqueda
    this.busquedaSubscription = this.busquedaComunicacion.busqueda$.subscribe(
      termino => this.onBuscar(termino)
    );
  }

  ngOnDestroy(): void {
    this.busquedaSubscription?.unsubscribe();
  }

  cargar(): void { 
    this.eventoService.obtenerEventos(this.usuarioId).subscribe((evs) => this.eventos.set(evs)); 
  }

  cargarHorarios(): void {
    this.horarioService.obtenerHorarios(this.usuarioId).subscribe((horarios) => this.horarios.set(horarios));
  }

  siguienteSemana(): void { this.semanaInicio.set(addDays(this.semanaInicio(), 7)); }
  anteriorSemana(): void { this.semanaInicio.set(addDays(this.semanaInicio(), -7)); }
  
  navegarAFecha(fecha: Date): void {
    const semana = startOfWeek(fecha);
    this.semanaInicio.set(semana);
  }

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

  abrirModalCrearHorario(): void {
    this.mostrarModalCrearHorario.set(true);
  }

  cerrarModalCrearHorario(): void {
    this.mostrarModalCrearHorario.set(false);
  }

  onHorarioCreado(): void {
    this.cargarHorarios();
    this.cerrarModalCrearHorario();
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

  // Convertir horarios a eventos virtuales que se repiten semanalmente
  convertirHorariosAEventos(): Event[] {
    const horarios = this.horarios();
    const semanaActual = this.semanaInicio();
    const eventosVirtuales: Event[] = [];

    // Determinar rango de fechas: segunda semana de septiembre de 2025 hasta segunda semana de enero de 2026
    const inicioPeriodo = this.getSegundaSemanaSeptiembre(2025);
    const finPeriodo = this.getSegundaSemanaEnero(2026);

    // Verificar si la semana actual está dentro del rango
    if (semanaActual < inicioPeriodo || semanaActual > finPeriodo) {
      return eventosVirtuales;
    }

    // Mapeo de días de la semana: Lunes = 1, Martes = 2, etc.
    const diaSemanaMap: { [key: string]: number } = {
      'Lunes': 1,
      'Martes': 2,
      'Miércoles': 3,
      'Jueves': 4,
      'Viernes': 5,
      'Sábado': 6,
      'Domingo': 0
    };

    horarios.forEach(horario => {
      const diaSemanaNum = diaSemanaMap[horario.diaSemana];
      if (diaSemanaNum === undefined) return;

      // Encontrar el día de la semana correspondiente en la semana actual
      const diasSemana = this.diasSemana();
      const diaSemanaActual = diasSemana.find(d => d.getDay() === diaSemanaNum);
      
      if (!diaSemanaActual) return;

      // Crear un evento virtual para este horario en esta semana
      const [horaInicio, minutoInicio] = horario.startTime.split(':').map(Number);
      const [horaFin, minutoFin] = horario.endTime.split(':').map(Number);

      const fechaInicio = new Date(diaSemanaActual);
      fechaInicio.setHours(horaInicio, minutoInicio, 0, 0);

      const fechaFin = new Date(diaSemanaActual);
      fechaFin.setHours(horaFin, minutoFin, 0, 0);

      const eventoVirtual: Event = {
        id: horario.id! + 1000000, // ID virtual para distinguir de eventos reales
        userId: horario.userId,
        name: horario.materia,
        location: horario.aula,
        description: horario.profesor ? `Profesor: ${horario.profesor}` : undefined,
        startDateTime: fechaInicio.toISOString(),
        endDateTime: fechaFin.toISOString(),
        colorHex: horario.colorHex
      };

      eventosVirtuales.push(eventoVirtual);
    });

    return eventosVirtuales;
  }

  // Obtener el inicio de la segunda semana de septiembre
  private getSegundaSemanaSeptiembre(año: number): Date {
    // Primero obtener el primer día de septiembre
    const primerSeptiembre = new Date(año, 8, 1); // 8 = septiembre (0-indexed)
    // Encontrar el domingo de la primera semana
    const primerDomingo = startOfWeek(primerSeptiembre);
    // La segunda semana comienza 7 días después
    return addDays(primerDomingo, 7);
  }

  // Obtener el inicio de la segunda semana de enero
  private getSegundaSemanaEnero(año: number): Date {
    // Primero obtener el primer día de enero
    const primerEnero = new Date(año, 0, 1);
    // Encontrar el domingo de la primera semana
    const primerDomingo = startOfWeek(primerEnero);
    // La segunda semana comienza 7 días después
    return addDays(primerDomingo, 7);
  }

  // Buscar evento/horario y navegar a su semana
  onBuscar(termino: string): void {
    const terminoLower = termino.toLowerCase().trim();
    if (!terminoLower) return;

    // Buscar en eventos reales
    const eventoEncontrado = this.eventos().find(e => 
      (e.name || '').toLowerCase().includes(terminoLower) || 
      (e.location || '').toLowerCase().includes(terminoLower)
    );

    if (eventoEncontrado) {
      const fechaEvento = new Date(eventoEncontrado.startDateTime);
      const semanaEvento = startOfWeek(fechaEvento);
      this.semanaInicio.set(semanaEvento);
      this.mostrarErrorBusqueda.set(false);
      return;
    }

    // Buscar en horarios (buscar en todas las semanas posibles)
    const horarioEncontrado = this.horarios().find(h => 
      (h.materia || '').toLowerCase().includes(terminoLower) ||
      (h.aula || '').toLowerCase().includes(terminoLower)
    );

    if (horarioEncontrado) {
      // Los horarios se repiten semanalmente, así que navegar a la primera semana del período
      const inicioPeriodo = this.getSegundaSemanaSeptiembre(2025);
      this.semanaInicio.set(inicioPeriodo);
      this.mostrarErrorBusqueda.set(false);
      return;
    }

    // No se encontró nada
    this.mensajeErrorBusqueda.set(`No se encontró ningún evento o horario con el nombre "${termino}"`);
    this.mostrarErrorBusqueda.set(true);
    setTimeout(() => {
      this.mostrarErrorBusqueda.set(false);
    }, 5000);
  }
}



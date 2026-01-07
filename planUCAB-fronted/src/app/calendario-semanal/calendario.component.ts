import { Component, OnInit, computed, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventoService, Event } from '../service/evento.service';
import { HorarioService, Horario } from '../service/horario.service';
import { EvaluacionService, Evaluacion } from '../service/evaluacion.service';
import { CalendarioMensualComponent } from '../calendario-mensual/calendario-mensual.component';
import { CrearEventoComponent } from '../evento/crear-evento.component';
import { CrearHorarioComponent } from '../horario/crear-horario.component';
import { CrearEvaluacionComponent } from '../evaluacion/crear-evaluacion.component';
import { MateriasModalComponent } from '../materia/materias-modal.component';
import { BusquedaComunicacionService } from '../service/busqueda-comunicacion.service';
import { AuthService } from '../service/auth.service';
import { Router } from '@angular/router';
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
  imports: [CommonModule, CalendarioMensualComponent, CrearEventoComponent, CrearHorarioComponent, CrearEvaluacionComponent, MateriasModalComponent],
  templateUrl: './calendario.component.html',
  styleUrl: './calendario.component.css'
})
export class CalendarioComponent implements OnInit, OnDestroy {
  usuarioId = 0;
  readonly startHour = 0;
  readonly endHour = 24;
  readonly horas = Array.from({ length: 24 }).map((_, i) => i);
  semanaInicio = signal(startOfWeek(new Date()));
  diasSemana = computed(() => Array.from({ length: 7 }).map((_, i) => addDays(this.semanaInicio(), i)));
  eventos = signal<Event[]>([]);
  horarios = signal<Horario[]>([]);
  evaluaciones = signal<Evaluacion[]>([]);
  mostrarModalCrear = signal(false);
  mostrarModalCrearHorario = signal(false);
  mostrarModalCrearEvaluacion = signal(false);
  mostrarModalMaterias = signal(false);
  eventoSeleccionado = signal<Event | null>(null);
  evaluacionSeleccionada = signal<Evaluacion | null>(null);
  horarioSeleccionado = signal<Horario | null>(null);
  eventoParaEditar = signal<Event | null>(null);
  evaluacionParaEditar = signal<Evaluacion | null>(null);
  horarioParaEditar = signal<Horario | null>(null);
  mostrarErrorBusqueda = signal(false);
  mensajeErrorBusqueda = signal('');
  mostrarConfirmacionEliminar = signal(false);
  eventoAEliminar = signal<Event | null>(null);
  mostrarConfirmacionEliminarEvaluacion = signal(false);
  evaluacionAEliminar = signal<Evaluacion | null>(null);

  private busquedaSubscription?: Subscription;

  // Combinar eventos, horarios y evaluaciones para mostrar en el calendario
  eventosYHorarios = computed(() => {
    const eventos = this.eventos();
    const horarios = this.horarios();
    const evaluaciones = this.evaluaciones();
    return [...eventos, ...horarios, ...evaluaciones] as (Event | Horario | Evaluacion)[];
  });

  // Verificar si hay información registrada
  tieneInformacion = computed(() => {
    return this.eventos().length > 0 || this.horarios().length > 0 || this.evaluaciones().length > 0;
  });

  constructor(
    private eventoService: EventoService,
    private horarioService: HorarioService,
    private evaluacionService: EvaluacionService,
    private busquedaComunicacion: BusquedaComunicacionService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const userId = this.authService.getCurrentUserId();
    if (userId) {
      this.usuarioId = userId;
      this.cargar();
      this.cargarHorarios();
      this.cargarEvaluaciones();
    }
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

  cargarEvaluaciones(): void {
    this.evaluacionService.obtenerEvaluaciones(this.usuarioId).subscribe((evaluaciones) => this.evaluaciones.set(evaluaciones));
  }

  siguienteSemana(): void { this.semanaInicio.set(addDays(this.semanaInicio(), 7)); }
  anteriorSemana(): void { this.semanaInicio.set(addDays(this.semanaInicio(), -7)); }

  navegarAFecha(fecha: Date): void {
    const semana = startOfWeek(fecha);
    this.semanaInicio.set(semana);
  }

  estaEnDia(item: Event | Horario | Evaluacion, dia: Date): boolean {
    // Si es un Event o Evaluacion, usar startDateTime
    if ('startDateTime' in item) {
      const d = new Date(item.startDateTime);
      return d.getFullYear() === dia.getFullYear() && d.getMonth() === dia.getMonth() && d.getDate() === dia.getDate();
    }
    // Si es un Horario, verificar si el día de la semana coincide
    if ('diaSemana' in item) {
      const diaSemanaMap: { [key: string]: number } = {
        'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4,
        'Viernes': 5, 'Sábado': 6, 'Domingo': 0
      };
      const diaSemanaNum = diaSemanaMap[item.diaSemana];
      return diaSemanaNum !== undefined && dia.getDay() === diaSemanaNum;
    }
    return false;
  }

  topPercent(item: Event | Horario | Evaluacion): string {
    let minutos: number;
    if ('startDateTime' in item) {
      const d = new Date(item.startDateTime);
      minutos = d.getHours() * 60 + d.getMinutes();
    } else if ('startTime' in item) {
      const [hora, minuto] = item.startTime.split(':').map(Number);
      minutos = hora * 60 + minuto;
    } else {
      return '0%';
    }
    const minInicio = this.startHour * 60;
    const minFin = this.endHour * 60;
    const pct = Math.max(0, Math.min(100, ((minutos - minInicio) / Math.max(1, (minFin - minInicio))) * 100));
    return pct + '%';
  }

  heightPercent(item: Event | Horario | Evaluacion): string {
    let dur: number;
    if ('startDateTime' in item && 'endDateTime' in item) {
      const start = new Date(item.startDateTime);
      const end = new Date(item.endDateTime);
      dur = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60));
    } else if ('startTime' in item && 'endTime' in item) {
      const [horaInicio, minutoInicio] = item.startTime.split(':').map(Number);
      const [horaFin, minutoFin] = item.endTime.split(':').map(Number);
      const minutosInicio = horaInicio * 60 + minutoInicio;
      const minutosFin = horaFin * 60 + minutoFin;
      dur = minutosFin - minutosInicio;
    } else {
      return '2%';
    }
    const daySpan = Math.max(1, (this.endHour - this.startHour) * 60);
    const pct = Math.max(2, (dur / daySpan) * 100);
    return pct + '%';
  }

  getItemName(item: Event | Horario | Evaluacion): string {
    if ('name' in item) {
      return item.name;
    } else if ('titulo' in item) {
      return item.titulo;
    } else if ('materia' in item) {
      return typeof item.materia === 'string' ? item.materia : item.materia?.nombre || 'Materia desconocida';
    }
    return '';
  }

  getItemColor(item: Event | Horario | Evaluacion): string {
    return item.colorHex || '#2196F3';
  }

  abrirModalCrear(): void {
    this.mostrarModalCrear.set(true);
  }

  cerrarModalCrear(): void {
    this.mostrarModalCrear.set(false);
    this.eventoParaEditar.set(null);
  }

  onEventoCreado(): void {
    this.cargar();
    this.eventoParaEditar.set(null);
  }

  abrirModalCrearHorario(): void {
    this.mostrarModalCrearHorario.set(true);
  }

  cerrarModalCrearHorario(): void {
    this.mostrarModalCrearHorario.set(false);
    this.horarioParaEditar.set(null);
  }

  onHorarioCreado(): void {
    this.cargarHorarios();
    this.cerrarModalCrearHorario();
  }

  abrirEditarHorario(): void {
    const horario = this.horarioSeleccionado();
    if (horario) {
      this.horarioParaEditar.set(horario);
      this.cerrarDetallesEvento();
      this.mostrarModalCrearHorario.set(true);
    }
  }

  eliminarHorario(): void {
    const horario = this.horarioSeleccionado();
    if (!horario) return;

    if (confirm(`¿Estás seguro de que deseas eliminar el horario de "${horario.materia?.nombre || 'Materia desconocida'}"?\n\nEsta acción no se puede deshacer.`)) {
      this.horarioService.eliminarHorario(this.usuarioId, horario.id).subscribe({
        next: () => {
          this.cargarHorarios();
          this.cerrarDetallesEvento();
        },
        error: (err) => {
          console.error('Error al eliminar horario', err);
          alert('Error al eliminar el horario. Por favor, intenta nuevamente.');
        }
      });
    }
  }

  abrirModalCrearEvaluacion(): void {
    this.mostrarModalCrearEvaluacion.set(true);
  }

  cerrarModalCrearEvaluacion(): void {
    this.mostrarModalCrearEvaluacion.set(false);
    this.evaluacionParaEditar.set(null);
  }

  abrirModalMaterias(): void {
    this.mostrarModalMaterias.set(true);
  }

  cerrarModalMaterias(): void {
    this.mostrarModalMaterias.set(false);
  }

  onEvaluacionCreada(): void {
    this.cargarEvaluaciones(); // Recargar evaluaciones
    this.evaluacionParaEditar.set(null);
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

  abrirDetallesEvento(item: Event | Horario | Evaluacion): void {
    // Verificar si es un horario
    if ('diaSemana' in item && 'startTime' in item) {
      this.horarioSeleccionado.set(item as Horario);
      this.eventoSeleccionado.set(null);
      this.evaluacionSeleccionada.set(null);
    }
    // Verificar si es una evaluación
    else if ('titulo' in item && 'nota' in item) {
      this.evaluacionSeleccionada.set(item as Evaluacion);
      this.eventoSeleccionado.set(null);
      this.horarioSeleccionado.set(null);
    }
    // Es un evento
    else if ('name' in item && 'startDateTime' in item) {
      this.eventoSeleccionado.set(item as Event);
      this.evaluacionSeleccionada.set(null);
      this.horarioSeleccionado.set(null);
    }
  }

  cerrarDetallesEvento(): void {
    this.eventoSeleccionado.set(null);
    this.evaluacionSeleccionada.set(null);
    this.horarioSeleccionado.set(null);
  }

  abrirEditarEvento(): void {
    const evento = this.eventoSeleccionado();
    if (evento) {
      this.eventoParaEditar.set(evento);
      this.cerrarDetallesEvento();
      this.mostrarModalCrear.set(true);
    }
  }

  eliminarEvento(): void {
    const evento = this.eventoSeleccionado();
    if (!evento) return;

    this.eventoAEliminar.set(evento);
    this.mostrarConfirmacionEliminar.set(true);
  }

  confirmarEliminarEvento(): void {
    const evento = this.eventoAEliminar();
    if (!evento) return;

    this.eventoService.eliminarEvento(this.usuarioId, evento.id).subscribe({
      next: () => {
        this.cargar(); // Recargar eventos
        this.cerrarDetallesEvento();
        this.cerrarConfirmacionEliminar();
      },
      error: (err) => {
        console.error('Error al eliminar evento', err);
        this.cerrarConfirmacionEliminar();
        alert('Error al eliminar el evento. Por favor, intenta nuevamente.');
      }
    });
  }

  cerrarConfirmacionEliminar(): void {
    this.mostrarConfirmacionEliminar.set(false);
    this.eventoAEliminar.set(null);
  }

  eliminarEvaluacion(): void {
    const evaluacion = this.evaluacionSeleccionada();
    if (!evaluacion) return;

    this.evaluacionAEliminar.set(evaluacion);
    this.mostrarConfirmacionEliminarEvaluacion.set(true);
  }

  confirmarEliminarEvaluacion(): void {
    const evaluacion = this.evaluacionAEliminar();
    if (!evaluacion) return;

    this.evaluacionService.eliminarEvaluacion(this.usuarioId, evaluacion.id).subscribe({
      next: () => {
        this.cargarEvaluaciones(); // Recargar evaluaciones
        this.cerrarDetallesEvento();
        this.cerrarConfirmacionEliminarEvaluacion();
      },
      error: (err) => {
        console.error('Error al eliminar evaluación', err);
        this.cerrarConfirmacionEliminarEvaluacion();
        alert('Error al eliminar la evaluación. Por favor, intenta nuevamente.');
      }
    });
  }

  cerrarConfirmacionEliminarEvaluacion(): void {
    this.mostrarConfirmacionEliminarEvaluacion.set(false);
    this.evaluacionAEliminar.set(null);
  }

  abrirEditarEvaluacion(): void {
    const evaluacion = this.evaluacionSeleccionada();
    if (evaluacion) {
      this.evaluacionParaEditar.set(evaluacion);
      this.cerrarDetallesEvento();
      this.mostrarModalCrearEvaluacion.set(true);
    }
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


  // Buscar evento/horario/evaluación y navegar a su semana
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
    const horarioEncontrado = this.horarios().find(h => {
      const nombreMateria = typeof h.materia === 'string' ? h.materia : h.materia?.nombre || '';
      return nombreMateria.toLowerCase().includes(terminoLower) ||
             (h.location || '').toLowerCase().includes(terminoLower);
    });

    if (horarioEncontrado) {
      // Los horarios se repiten semanalmente, navegar a la semana actual o la próxima donde aparezca
      const diaSemanaMap: { [key: string]: number } = {
        'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4,
        'Viernes': 5, 'Sábado': 6, 'Domingo': 0
      };
      const diaSemanaNum = diaSemanaMap[horarioEncontrado.diaSemana];
      if (diaSemanaNum !== undefined) {
        // Encontrar el próximo día de la semana correspondiente
        const hoy = new Date();
        const diasSemana = this.diasSemana();
        const diaEncontrado = diasSemana.find(d => d.getDay() === diaSemanaNum);
        if (diaEncontrado) {
          // Ya está en la semana actual, no hacer nada
        } else {
          // Navegar a la semana actual
          this.semanaInicio.set(startOfWeek(hoy));
        }
      }
      this.mostrarErrorBusqueda.set(false);
      return;
    }

    // Buscar en evaluaciones
    const evaluacionEncontrada = this.evaluaciones().find(ev => {
      const tituloMatch = (ev.titulo || '').toLowerCase().includes(terminoLower);
      const profesorMatch = (ev.profesor || '').toLowerCase().includes(terminoLower);
      const locationMatch = (ev.location || '').toLowerCase().includes(terminoLower);
      const nombreMateria = typeof ev.materia === 'string' ? ev.materia : ev.materia?.nombre || '';
      const materiaMatch = nombreMateria.toLowerCase().includes(terminoLower);
      return tituloMatch || profesorMatch || locationMatch || materiaMatch;
    });

    if (evaluacionEncontrada) {
      const fechaEvaluacion = new Date(evaluacionEncontrada.startDateTime);
      const semanaEvaluacion = startOfWeek(fechaEvaluacion);
      this.semanaInicio.set(semanaEvaluacion);
      this.mostrarErrorBusqueda.set(false);
      return;
    }

    // No se encontró nada
    this.mensajeErrorBusqueda.set(`No se encontró ningún evento, horario o evaluación con el nombre "${termino}"`);
    this.mostrarErrorBusqueda.set(true);
    setTimeout(() => {
      this.mostrarErrorBusqueda.set(false);
    }, 5000);
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  irANotas(): void {
    this.router.navigate(['/notas']);
  }
}

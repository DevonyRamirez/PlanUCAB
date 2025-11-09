import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EventoService, Event } from './evento.service';
import { Horario } from '../horario/horario.service';
import { DatePickerComponent } from '../date-picker/date-picker.component';
import { TimePickerComponent } from '../time-picker/time-picker.component';
import { ColorPickerComponent } from '../color-picker/color-picker.component';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-crear-evento',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePickerComponent, TimePickerComponent, ColorPickerComponent],
  templateUrl: './crear-evento.component.html',
  styleUrl: './crear-evento.component.css'
})
export class CrearEventoComponent implements OnInit {
  @Input() eventosExistentes: Event[] = [];
  @Input() horariosExistentes: Horario[] = [];
  @Output() eventoCreado = new EventEmitter<void>();
  @Output() cerrar = new EventEmitter<void>();
  mensaje = '';
  mostrarError = false;
  mensajeError = '';

  form = this.fb.group({
    userId: [0, [Validators.required, Validators.min(1)]],
    name: ['', [Validators.required, Validators.maxLength(30)]],
    location: ['', [Validators.maxLength(200)]],
    date: ['', [Validators.required]],
    startTime: ['', [Validators.required]],
    endTime: ['', [Validators.required]],
    description: ['', [Validators.maxLength(1000)]],
    colorHex: ['#2196F3', [Validators.required, Validators.pattern(/^#([A-Fa-f0-9]{6})$/)]]
  });

  constructor(
    private fb: FormBuilder,
    private eventoService: EventoService,
    private authService: AuthService
  ) {
    // Cuando cambie la hora de inicio, validar y limpiar la hora de fin si es necesario
    this.form.get('startTime')?.valueChanges.subscribe(startTime => {
      if (startTime) {
        const endTime = this.form.get('endTime')?.value;
        if (endTime) {
          const normalizedStart = this.normalizeTime(startTime);
          const normalizedEnd = this.normalizeTime(endTime);
          const start = new Date(`1970-01-01T${normalizedStart}`);
          const end = new Date(`1970-01-01T${normalizedEnd}`);
          if (!(start < end)) {
            // La hora de fin es menor o igual a la de inicio, limpiarla
            this.form.patchValue({ endTime: '' }, { emitEvent: false });
          }
        }
      }
    });
  }

  ngOnInit(): void {
    const userId = this.authService.getCurrentUserId();
    if (userId) {
      this.form.patchValue({ userId });
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const faltantes: string[] = [];
      if (this.form.get('name')?.hasError('required')) faltantes.push('título');
      if (this.form.get('date')?.hasError('required')) faltantes.push('fecha');
      if (this.form.get('startTime')?.hasError('required')) faltantes.push('hora de inicio');
      if (this.form.get('endTime')?.hasError('required')) faltantes.push('hora de fin');
      const mensajeValidacion = faltantes.length
        ? `Por favor rellena: ${faltantes.join(', ')}`
        : 'Hay campos inválidos. Verifica el formulario.';
      this.mensajeError = mensajeValidacion;
      this.mostrarError = true;
      return;
    }
    const { userId, name, location, date, startTime, endTime, description, colorHex } = this.form.value as any;
    // Normalizar horas a formato 24h (HH:mm)
    const normalizedStartTime = this.normalizeTime(startTime);
    const normalizedEndTime = this.normalizeTime(endTime);
    // La validación de conflictos se hace en el backend
    // Convertir strings vacíos a null para campos opcionales
    const locationValue = location?.trim() || null;
    const descriptionValue = description?.trim() || null;
    this.eventoService
      .crearEvento(Number(userId), { name, location: locationValue, date, startTime: normalizedStartTime, endTime: normalizedEndTime, description: descriptionValue, colorHex })
      .subscribe({
        next: (ev) => {
          this.mensaje = `Evento creado (#${ev.id})`;
          setTimeout(() => {
            this.eventoCreado.emit();
            this.cerrarModal();
          }, 1000);
        },
        error: (err) => {
          console.error('Error al crear evento', err);
          let mensajeError = 'Error al crear el evento';
          
          if (err.status === 0 || err.status === undefined) {
            mensajeError = 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo en http://localhost:8080';
          } else if (err.status === 409) {
            // Conflicto de horarios
            mensajeError = err.error?.message || 'El evento entra en conflicto con otro evento existente';
          } else if (err.error?.message) {
            mensajeError = `Error: ${err.error.message}`;
          } else if (err.error?.errors) {
            mensajeError = `Error de validación: ${JSON.stringify(err.error.errors)}`;
          } else if (err.message) {
            mensajeError = `Error: ${err.message}`;
          }
          
          this.mensajeError = mensajeError;
          this.mostrarError = true;
        }
      });
  }

  cancelar(): void {
    this.cerrarModal();
  }

  cerrarModal(): void {
    this.cerrar.emit();
    const userId = this.authService.getCurrentUserId() || 0;
    this.form.reset({
      userId,
      colorHex: '#2196F3'
    });
    this.mensaje = '';
    this.mostrarError = false;
    this.mensajeError = '';
  }

  cerrarError(): void {
    this.mostrarError = false;
    this.mensajeError = '';
  }

  private normalizeTime(t: string): string {
    const ampm = /\s*(AM|PM)$/i;
    if (ampm.test(t)) {
      const [time, mer] = t.trim().split(/\s+/);
      const [hStr, mStr] = time.split(':');
      let h = parseInt(hStr, 10);
      const m = parseInt(mStr, 10) || 0;
      const upper = mer.toUpperCase();
      if (upper === 'PM' && h !== 12) h += 12;
      if (upper === 'AM' && h === 12) h = 0;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
    return t;
  }
}



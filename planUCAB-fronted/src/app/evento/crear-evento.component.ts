import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EventoService } from './evento.service';
import { DatePickerComponent } from './date-picker.component';
import { TimePickerComponent } from './time-picker.component';

@Component({
  selector: 'app-crear-evento',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePickerComponent, TimePickerComponent],
  templateUrl: './crear-evento.component.html',
  styleUrl: './crear-evento.component.css'
})
export class CrearEventoComponent {
  @Output() eventoCreado = new EventEmitter<void>();
  @Output() cerrar = new EventEmitter<void>();
  mensaje = '';

  form = this.fb.group({
    userId: [1, [Validators.required, Validators.min(1)]],
    name: ['', [Validators.required, Validators.maxLength(100)]],
    location: ['', [Validators.required, Validators.maxLength(200)]],
    date: ['', [Validators.required]],
    startTime: ['', [Validators.required]],
    endTime: ['', [Validators.required]],
    description: ['', [Validators.maxLength(1000)]],
    colorHex: ['#2196F3', [Validators.required, Validators.pattern(/^#([A-Fa-f0-9]{6})$/)]]
  });

  constructor(private fb: FormBuilder, private eventoService: EventoService) {}

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const faltantes: string[] = [];
      if (this.form.get('name')?.hasError('required')) faltantes.push('título');
      if (this.form.get('date')?.hasError('required')) faltantes.push('fecha');
      if (this.form.get('startTime')?.hasError('required')) faltantes.push('hora de inicio');
      if (this.form.get('endTime')?.hasError('required')) faltantes.push('hora de fin');
      this.mensaje = faltantes.length
        ? `Por favor rellena: ${faltantes.join(', ')}`
        : 'Hay campos inválidos. Verifica el formulario.';
      return;
    }
    const { userId, name, location, date, startTime, endTime, description, colorHex } = this.form.value as any;
    // Validar rango de horas en cliente (opcional)
    const start = new Date(`1970-01-01T${this.normalizeTime(startTime)}`);
    const end = new Date(`1970-01-01T${this.normalizeTime(endTime)}`);
    if (!(start < end)) {
      this.mensaje = 'La hora de fin debe ser mayor a la hora de inicio';
      return;
    }
    this.eventoService
      .crearEvento(Number(userId), { name, location, date, startTime, endTime, description, colorHex })
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
          const backendMsg = err?.error?.message || err?.message || '';
          this.mensaje = backendMsg ? `Error al crear el evento: ${backendMsg}` : 'Error al crear el evento';
        }
      });
  }

  cancelar(): void {
    this.cerrarModal();
  }

  cerrarModal(): void {
    this.cerrar.emit();
    this.form.reset({
      userId: 1,
      colorHex: '#2196F3'
    });
    this.mensaje = '';
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



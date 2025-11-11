import { Component, EventEmitter, Output, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EvaluacionService, Evaluation } from './evaluacion.service';
import { DatePickerComponent } from '../components/date-picker.component';
import { TimePickerComponent } from '../components/time-picker.component';
import { ColorPickerComponent } from '../components/color-picker.component';

@Component({
  selector: 'app-crear-evaluacion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePickerComponent, TimePickerComponent, ColorPickerComponent],
  templateUrl: './crear-evaluacion.component.html',
  styleUrl: './crear-evaluacion.component.css'
})
export class CrearEvaluacionComponent implements OnChanges {
  @Output() evaluacionCreada = new EventEmitter<void>();
  @Output() cerrar = new EventEmitter<void>();
  @Input() evaluation: Evaluation | null = null; // si se pasa, estamos en modo edición

  editMode = false;

  mensaje = '';
  mostrarError = false;
  mensajeError = '';

  form = this.fb.group({
    userId: [1, [Validators.required, Validators.min(1)]],
    name: ['', [Validators.required, Validators.maxLength(100)]],
    classroom: ['', [Validators.required, Validators.maxLength(50)]],
    subject: ['', [Validators.required, Validators.maxLength(100)]],
    date: ['', [Validators.required]],
    startTime: ['', [Validators.required]],
    endTime: ['', [Validators.required]],
    description: ['', [Validators.maxLength(1000)]],
    colorHex: ['#2196F3', [Validators.required, Validators.pattern(/^#([A-Fa-f0-9]{6})$/)]],
    porcentageWeight: [0, [Validators.required, Validators.min(0), Validators.max(100)]]
  });

  constructor(private fb: FormBuilder, private evaluacionService: EvaluacionService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['evaluation']) {
      const ev = this.evaluation;
      if (ev) {
        this.editMode = true;
        // rellenar formulario con la evaluación existente
        const start = new Date(ev.startDateTime);
        const end = new Date(ev.endDateTime);
        const dateStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
        const startTime = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`;
        const endTime = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
        this.form.patchValue({
          userId: ev.userId || 1,
          name: ev.name || '',
          classroom: ev.classroom || '',
          subject: ev.subject || '',
          date: dateStr,
          startTime: startTime,
          endTime: endTime,
          description: ev.description || '',
          colorHex: ev.colorHex || '#2196F3',
          porcentageWeight: ev.porcentageWeight ?? 0
        });
      } else {
        this.editMode = false;
        this.form.reset({ userId: 1, colorHex: '#2196F3', porcentageWeight: 0 });
      }
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.mostrarError = true;
      this.mensajeError = 'Por favor corrige los campos del formulario.';
      return;
    }
    const v = this.form.value as any;
    const normalizedStartTime = this.normalizeTime(v.startTime);
    const normalizedEndTime = this.normalizeTime(v.endTime);
    const start = new Date(`1970-01-01T${normalizedStartTime}`);
    const end = new Date(`1970-01-01T${normalizedEndTime}`);
    if (!(start < end)) {
      this.mensajeError = 'La hora de fin debe ser mayor a la hora de inicio';
      this.mostrarError = true;
      return;
    }

    const payload = {
      name: v.name,
      classroom: v.classroom,
      subject: v.subject,
      date: v.date,
      startTime: normalizedStartTime,
      endTime: normalizedEndTime,
      colorHex: v.colorHex,
      description: v.description?.trim() || null,
      porcentageWeight: Number(v.porcentageWeight)
    };

    const submitObs = this.editMode && this.evaluation && this.evaluation.id
      ? this.evaluacionService.actualizarEvaluacion(Number(v.userId), Number(this.evaluation.id), payload)
      : this.evaluacionService.crearEvaluacion(Number(v.userId), payload);

    submitObs.subscribe({
      next: (ev) => {
        this.mensaje = this.editMode ? `Evaluación actualizada (#${ev.id})` : `Evaluación creada (#${ev.id})`;
        setTimeout(() => {
          this.evaluacionCreada.emit();
          this.cerrarModal();
        }, 800);
      },
      error: (err) => {
        console.error('Error al crear evaluación', err);
        if (err.status === 0 || err.status === undefined) {
          this.mensajeError = 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo en http://localhost:8080';
        } else if (err.error?.message) {
          this.mensajeError = `Error: ${err.error.message}`;
        } else if (err.error?.errors) {
          this.mensajeError = `Error de validación: ${JSON.stringify(err.error.errors)}`;
        } else if (err.message) {
          this.mensajeError = `Error: ${err.message}`;
        }
        this.mostrarError = true;
      }
    });
  }

  cancelar(): void {
    this.cerrarModal();
  }

  cerrarModal(): void {
    this.cerrar.emit();
    this.form.reset({ userId: 1, colorHex: '#2196F3', porcentageWeight: 0 });
    this.mensaje = '';
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

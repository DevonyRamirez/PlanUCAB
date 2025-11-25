import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EvaluacionService, CreateEvaluacionPayload, Evaluacion } from '../service/evaluacion.service';
import { MateriaService, Materia } from '../service/materia.service';
import { DatePickerComponent } from '../generic-components/date-picker/date-picker.component';
import { TimePickerComponent } from '../generic-components/time-picker/time-picker.component';
import { ColorPickerComponent } from '../generic-components/color-picker/color-picker.component';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-crear-evaluacion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePickerComponent, TimePickerComponent, ColorPickerComponent],
  templateUrl: './crear-evaluacion.component.html',
  styleUrl: './crear-evaluacion.component.css'
})
export class CrearEvaluacionComponent implements OnInit {
  @Output() evaluacionCreada = new EventEmitter<void>();
  @Output() cerrar = new EventEmitter<void>();

  mensaje = '';
  mostrarError = false;
  mensajeError = '';
  materiasDisponibles: Materia[] = [];
  porcentaje = 0;
  sumaPorcentajesExistentesMateria = 0;
  evaluacionesExistentes: Evaluacion[] = [];

  form = this.fb.group({
    userId: [0, [Validators.required, Validators.min(1)]],
    titulo: ['', [Validators.required, Validators.maxLength(100)]],
    materia: ['', [Validators.required]],
    porcentaje: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    nota: [0, [Validators.required, Validators.min(0), Validators.max(20)]],
    profesor: ['', [Validators.required, Validators.maxLength(100)]],
    location: ['', [Validators.required, Validators.maxLength(50)]],
    descripcion: ['', [Validators.maxLength(1000)]],
    date: ['', [Validators.required]],
    startTime: ['', [Validators.required]],
    endTime: ['', [Validators.required]],
    colorHex: ['#FF9800', [Validators.required, Validators.pattern(/^#([A-Fa-f0-9]{6})$/)]]
  });

  constructor(
    private fb: FormBuilder,
    private evaluacionService: EvaluacionService,
    private materiaService: MateriaService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const userId = this.authService.getCurrentUserId();
    if (userId) {
      this.form.patchValue({ userId });
      this.cargarMaterias();
      this.cargarEvaluacionesExistentes(userId);

      // Suscribirse a cambios en el porcentaje para actualizar
      this.form.get('porcentaje')?.valueChanges.subscribe((value) => {
        this.porcentaje = value || 0;
      });

      // Suscribirse a cambios en la materia para actualizar la suma de porcentajes
      this.form.get('materia')?.valueChanges.subscribe(() => {
        this.actualizarSumaPorcentajesMateria();
      });
    }
  }

  cargarEvaluacionesExistentes(userId: number): void {
    this.evaluacionService.obtenerEvaluaciones(userId).subscribe({
      next: (evaluaciones: Evaluacion[]) => {
        this.evaluacionesExistentes = evaluaciones;
        this.actualizarSumaPorcentajesMateria();
      },
      error: (err) => {
        console.error('Error al cargar evaluaciones existentes', err);
        // No mostrar error, simplemente continuar con 0
        this.sumaPorcentajesExistentesMateria = 0;
      }
    });
  }

  actualizarSumaPorcentajesMateria(): void {
    const materiaSeleccionada = this.form.get('materia')?.value;
    if (!materiaSeleccionada) {
      this.sumaPorcentajesExistentesMateria = 0;
      return;
    }

    // Obtener el nombre de la materia seleccionada (puede ser string o objeto Materia)
    const nombreMateriaSeleccionada = this.getMateriaNombre(materiaSeleccionada);

    // Sumar solo los porcentajes de las evaluaciones que tienen la materia seleccionada
    this.sumaPorcentajesExistentesMateria = this.evaluacionesExistentes.reduce((sum, evaluacion) => {
      // Verificar si la evaluación tiene la materia seleccionada
      const nombreMateriaEvaluacion = typeof evaluacion.materia === 'string'
        ? evaluacion.materia
        : evaluacion.materia?.nombre;

      if (nombreMateriaEvaluacion === nombreMateriaSeleccionada) {
        return sum + (evaluacion.porcentaje || 0);
      }
      return sum;
    }, 0);
  }

  cargarMaterias(): void {
    this.materiaService.obtenerMaterias().subscribe({
      next: (materias) => {
        this.materiasDisponibles = materias;
      },
      error: (err) => {
        console.error('Error al cargar materias', err);
        this.materiasDisponibles = [];
      }
    });
  }

  // Helper para obtener el nombre desde el control de materia.
  // El valor puede ser un string (nombre) o un objeto Materia; esto evita que TS infiera 'never'.
  private getMateriaNombre(materiaValue: string | null | undefined | any): string {
    if (!materiaValue) return '';
    return typeof materiaValue === 'string' ? materiaValue : (materiaValue as Materia)?.nombre ?? '';
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const faltantes: string[] = [];

      if (this.form.get('titulo')?.hasError('required')) faltantes.push('Título');
      if (this.form.get('materia')?.hasError('required')) faltantes.push('Materia');
      if (this.form.get('porcentaje')?.hasError('required')) faltantes.push('Porcentaje');
      if (this.form.get('nota')?.hasError('required')) faltantes.push('Nota');
      if (this.form.get('profesor')?.hasError('required')) faltantes.push('Profesor');
      if (this.form.get('location')?.hasError('required')) faltantes.push('Ubicación');
      if (this.form.get('date')?.hasError('required')) faltantes.push('Fecha');
      if (this.form.get('startTime')?.hasError('required')) faltantes.push('Hora de inicio');
      if (this.form.get('endTime')?.hasError('required')) faltantes.push('Hora de fin');

      this.mostrarError = true;
      this.mensajeError = `Por favor completa los siguientes campos: ${faltantes.join(', ')}`;
      return;
    }

    const porcentajeValue = this.form.get('porcentaje')?.value || 0;
    const materiaSeleccionada = this.form.get('materia')?.value;

    // Validar que el porcentaje no exceda 100%
    if (porcentajeValue > 100) {
      this.mostrarError = true;
      this.mensajeError = `El porcentaje (${porcentajeValue.toFixed(2)}%) no puede exceder el 100%.`;
      return;
    }

    // Validar que se haya seleccionado una materia
    if (!materiaSeleccionada) {
      this.mostrarError = true;
      this.mensajeError = 'Debes seleccionar una materia';
      return;
    }

  // Buscar el objeto Materia completo basado en el nombre seleccionado
  const nombreSeleccionado = this.getMateriaNombre(materiaSeleccionada);
  const materiaCompleta = this.materiasDisponibles.find(m => m.nombre === nombreSeleccionado);
    if (!materiaCompleta) {
      this.mostrarError = true;
      this.mensajeError = 'La materia seleccionada no es válida';
      return;
    }

    // Actualizar la suma de porcentajes de la materia seleccionada
    this.actualizarSumaPorcentajesMateria();

    // Validar que la suma total (existentes de esta materia + nueva) no exceda 100%
    const sumaTotal = this.sumaPorcentajesExistentesMateria + porcentajeValue;
    if (sumaTotal > 100) {
      this.mostrarError = true;
      this.mensajeError = `La suma total de porcentajes para la materia "${materiaCompleta.nombre}" (${this.sumaPorcentajesExistentesMateria.toFixed(2)}% existentes + ${porcentajeValue.toFixed(2)}% nueva = ${sumaTotal.toFixed(2)}%) excede el 100%. Cada materia puede tener un máximo de 100% distribuido entre sus evaluaciones.`;
      return;
    }

    // Validar que el porcentaje sea válido
    if (porcentajeValue <= 0) {
      this.mostrarError = true;
      this.mensajeError = 'El porcentaje debe ser mayor a 0';
      return;
    }

    const formValue = this.form.value;

    const payload: CreateEvaluacionPayload = {
      titulo: formValue.titulo || '',
      materia: materiaCompleta,
      porcentaje: porcentajeValue,
      nota: formValue.nota || 0,
      profesor: formValue.profesor || '',
      location: formValue.location || '',
      descripcion: formValue.descripcion || '',
      date: this.normalizeDate(formValue.date || ''),
      startTime: this.normalizeTime(formValue.startTime || ''),
      endTime: this.normalizeTime(formValue.endTime || ''),
      colorHex: formValue.colorHex || '#FF9800'
    };

    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      this.mostrarError = true;
      this.mensajeError = 'No se pudo identificar al usuario';
      return;
    }

    this.evaluacionService.crearEvaluacion(userId, payload).subscribe({
      next: () => {
        // Recargar evaluaciones existentes para actualizar el cálculo
        this.cargarEvaluacionesExistentes(userId);
        this.evaluacionCreada.emit();
        this.cerrarModal();
      },
      error: (err) => {
        console.error('Error al crear la evaluación', err);
        this.mostrarError = true;
        if (err.status === 0 || err.status === undefined) {
          this.mensajeError = 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo en http://localhost:8081';
        } else if (err.error?.message) {
          this.mensajeError = err.error.message;
        } else {
          this.mensajeError = 'Error al crear la evaluación. Verifica los datos ingresados.';
        }
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
      titulo: '',
      materia: '',
      porcentaje: 0,
      nota: 0,
      profesor: '',
      location: '',
      descripcion: '',
      date: '',
      startTime: '',
      endTime: '',
      colorHex: '#FF9800'
    });
    this.porcentaje = 0;
    this.mensaje = '';
    this.mostrarError = false;
    this.mensajeError = '';
    // Las evaluaciones existentes se recargan cuando se crea una nueva evaluación exitosamente
  }

  cerrarError(): void {
    this.mostrarError = false;
    this.mensajeError = '';
  }

  private normalizeTime(time: string): string {
    if (!time) return '';
    // Si ya está en formato HH:mm o H:mm, devolverlo normalizado
    if (/^\d{1,2}:\d{2}$/.test(time.trim())) {
      const [hStr, mStr] = time.trim().split(':');
      const h = parseInt(hStr, 10);
      const m = parseInt(mStr, 10) || 0;
      // Mantener minutos exactos sin redondear
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
    // Si tiene formato AM/PM, convertirlo
    const ampm = /\s*(AM|PM)$/i;
    if (ampm.test(time)) {
      const [timePart, mer] = time.trim().split(/\s+/);
      const [hStr, mStr] = timePart.split(':');
      let h = parseInt(hStr, 10);
      const m = parseInt(mStr, 10) || 0;
      const upper = mer.toUpperCase();
      if (upper === 'PM' && h !== 12) h += 12;
      if (upper === 'AM' && h === 12) h = 0;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
    return time;
  }

  private normalizeDate(date: string): string {
    if (!date) return '';
    // Si ya está en formato YYYY-MM-DD, devolverlo
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    // Intentar parsear otros formatos si es necesario
    return date;
  }
}


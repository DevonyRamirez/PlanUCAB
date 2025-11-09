import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EvaluacionService, CreateEvaluacionPayload, Evaluacion } from './evaluacion.service';
import { HorarioService, Horario } from '../horario/horario.service';
import { DatePickerComponent } from '../date-picker/date-picker.component';
import { TimePickerComponent } from '../time-picker/time-picker.component';
import { ColorPickerComponent } from '../color-picker/color-picker.component';
import { AuthService } from '../auth/auth.service';

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
  materiasDisponibles: string[] = [];
  materiasBase: string[] = [
    'Ingeniería de Software',
    'Programación Orientada a la Web',
    'Organización del Computador',
    'Interacción Humano - Computador',
    'Cálculo Vectorial',
    'Ingeniería Económica',
    'Ecuaciones Diferenciales Ordinarias'
  ];
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
    private horarioService: HorarioService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const userId = this.authService.getCurrentUserId();
    if (userId) {
      this.form.patchValue({ userId });
      this.cargarMaterias(userId);
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

    // Sumar solo los porcentajes de las evaluaciones que tienen la materia seleccionada
    this.sumaPorcentajesExistentesMateria = this.evaluacionesExistentes.reduce((sum, evaluacion) => {
      // Verificar si la evaluación tiene la materia seleccionada
      if (evaluacion.materia === materiaSeleccionada) {
        return sum + (evaluacion.porcentaje || 0);
      }
      return sum;
    }, 0);
  }

  cargarMaterias(userId: number): void {
    this.horarioService.obtenerHorarios(userId).subscribe({
      next: (horarios: Horario[]) => {
        // Obtener materias únicas del horario
        const materiasSet = new Set<string>();
        horarios.forEach(horario => {
          if (horario.materia) {
            materiasSet.add(horario.materia);
          }
        });
        
        // Combinar las materias base con las materias de los horarios
        const todasLasMaterias = new Set<string>();
        // Agregar materias base
        this.materiasBase.forEach(materia => todasLasMaterias.add(materia));
        // Agregar materias de los horarios
        materiasSet.forEach(materia => todasLasMaterias.add(materia));
        
        // Ordenar alfabéticamente
        this.materiasDisponibles = Array.from(todasLasMaterias).sort();
      },
      error: (err) => {
        console.error('Error al cargar materias', err);
        // Si hay error al cargar horarios, usar solo las materias base
        this.materiasDisponibles = [...this.materiasBase].sort();
      }
    });
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
    const materiaValue = this.form.get('materia')?.value || '';

    // Validar que el porcentaje no exceda 100%
    if (porcentajeValue > 100) {
      this.mostrarError = true;
      this.mensajeError = `El porcentaje (${porcentajeValue.toFixed(2)}%) no puede exceder el 100%.`;
      return;
    }

    // Actualizar la suma de porcentajes de la materia seleccionada
    this.actualizarSumaPorcentajesMateria();

    // Validar que la suma total (existentes de esta materia + nueva) no exceda 100%
    const sumaTotal = this.sumaPorcentajesExistentesMateria + porcentajeValue;
    if (sumaTotal > 100) {
      this.mostrarError = true;
      this.mensajeError = `La suma total de porcentajes para la materia "${materiaValue}" (${this.sumaPorcentajesExistentesMateria.toFixed(2)}% existentes + ${porcentajeValue.toFixed(2)}% nueva = ${sumaTotal.toFixed(2)}%) excede el 100%. Cada materia puede tener un máximo de 100% distribuido entre sus evaluaciones.`;
      return;
    }

    // Validar que la materia y porcentaje sean válidos
    if (!materiaValue || porcentajeValue <= 0) {
      this.mostrarError = true;
      this.mensajeError = 'La materia y el porcentaje deben ser válidos (porcentaje mayor a 0)';
      return;
    }

    const formValue = this.form.value;

    const payload: CreateEvaluacionPayload = {
      titulo: formValue.titulo || '',
      materia: materiaValue,
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
          this.mensajeError = 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo en http://localhost:8080';
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
    // Si ya está en formato HH:mm, devolverlo
    if (/^\d{2}:\d{2}$/.test(time)) {
      return time;
    }
    // Intentar parsear otros formatos si es necesario
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


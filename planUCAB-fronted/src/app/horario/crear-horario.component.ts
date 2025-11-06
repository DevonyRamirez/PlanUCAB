import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormArray, FormGroup } from '@angular/forms';
import { HorarioService } from './horario.service';
import { TimePickerComponent } from '../components/time-picker.component';
import { ColorPickerComponent } from '../components/color-picker.component';

@Component({
  selector: 'app-crear-horario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TimePickerComponent, ColorPickerComponent],
  templateUrl: './crear-horario.component.html',
  styleUrl: './crear-horario.component.css'
})
export class CrearHorarioComponent {
  @Output() horarioCreado = new EventEmitter<void>();
  @Output() cerrar = new EventEmitter<void>();
  mensaje = '';
  mostrarError = false;
  mensajeError = '';

  diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  materias = [
    'Ingeniería de Software',
    'Programación Orientada a la Web',
    'Organización del Computador',
    'Interacción Humano - Computador',
    'Cálculo Vectorial',
    'Ingeniería Económica',
    'Ecuaciones Diferenciales Ordinarias'
  ];
  tiposClase = ['Teoría', 'Práctica', 'Taller'];

  form = this.fb.group({
    userId: [1, [Validators.required, Validators.min(1)]],
    materia: ['', [Validators.required]],
    aula: ['', [Validators.required, Validators.maxLength(50)]],
    profesor: ['', [Validators.maxLength(100)]],
    tipoClase: [''],
    colorHex: ['#2196F3', [Validators.required, Validators.pattern(/^#([A-Fa-f0-9]{6})$/)]],
    horarios: this.fb.array([this.createHorarioGroup()])
  });

  constructor(private fb: FormBuilder, private horarioService: HorarioService) {}

  get horariosArray(): FormArray {
    return this.form.get('horarios') as FormArray;
  }

  createHorarioGroup(): FormGroup {
    return this.fb.group({
      diaSemana: ['', [Validators.required]],
      startTime: ['', [Validators.required]],
      endTime: ['', [Validators.required]]
    });
  }

  agregarDia(): void {
    this.horariosArray.push(this.createHorarioGroup());
  }

  eliminarDia(index: number): void {
    if (this.horariosArray.length > 1) {
      this.horariosArray.removeAt(index);
    }
  }

  getDiasDisponibles(index: number): string[] {
    const diaSeleccionado = this.horariosArray.at(index)?.get('diaSemana')?.value;
    const diasOcupados = this.horariosArray.controls
      .map((control, i) => i !== index ? control.get('diaSemana')?.value : null)
      .filter(dia => dia && dia !== '');
    
    return this.diasSemana.filter(dia => !diasOcupados.includes(dia) || dia === diaSeleccionado);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const faltantes: string[] = [];
      if (this.form.get('materia')?.hasError('required')) faltantes.push('materia');
      if (this.form.get('aula')?.hasError('required')) faltantes.push('aula');
      
      this.horariosArray.controls.forEach((control, index) => {
        if (control.get('diaSemana')?.hasError('required')) faltantes.push(`día ${index + 1}`);
        if (control.get('startTime')?.hasError('required')) faltantes.push(`hora inicio ${index + 1}`);
        if (control.get('endTime')?.hasError('required')) faltantes.push(`hora fin ${index + 1}`);
      });
      
      const mensajeValidacion = faltantes.length
        ? `Por favor rellena: ${faltantes.join(', ')}`
        : 'Hay campos inválidos. Verifica el formulario.';
      this.mensajeError = mensajeValidacion;
      this.mostrarError = true;
      return;
    }

    const { userId, materia, aula, profesor, tipoClase, colorHex } = this.form.value as any;
    const horarios = this.horariosArray.value as any[];
    
    // Validar todos los horarios
    const horariosValidos: any[] = [];
    for (let i = 0; i < horarios.length; i++) {
      const horario = horarios[i];
      const normalizedStartTime = this.normalizeTime(horario.startTime);
      const normalizedEndTime = this.normalizeTime(horario.endTime);
      
      const start = new Date(`1970-01-01T${normalizedStartTime}`);
      const end = new Date(`1970-01-01T${normalizedEndTime}`);
      
      if (!(start < end)) {
        this.mensajeError = `El horario ${i + 1}: La hora de fin debe ser mayor a la hora de inicio`;
        this.mostrarError = true;
        return;
      }
      
      horariosValidos.push({
        materia,
        aula,
        diaSemana: horario.diaSemana,
        startTime: normalizedStartTime,
        endTime: normalizedEndTime,
        profesor: profesor?.trim() || null,
        tipoClase: tipoClase?.trim() || null,
        colorHex: colorHex
      });
    }

    // Crear todos los horarios
    const crearHorarios = horariosValidos.map(payload => 
      this.horarioService.crearHorario(Number(userId), payload)
    );

    // Usar forkJoin o crear secuencialmente
    let creados = 0;
    const crearSiguiente = () => {
      if (creados >= crearHorarios.length) {
        this.mensaje = `Se crearon ${creados} horario(s)`;
        setTimeout(() => {
          this.horarioCreado.emit();
          this.cerrarModal();
        }, 1000);
        return;
      }

      crearHorarios[creados].subscribe({
        next: () => {
          creados++;
          crearSiguiente();
        },
        error: (err) => {
          console.error('Error al crear horario', err);
          let mensajeError = `Error al crear el horario ${creados + 1}`;
          
          if (err.status === 0 || err.status === undefined) {
            mensajeError = 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo en http://localhost:8080';
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
    };

    crearSiguiente();
  }

  cancelar(): void {
    this.cerrarModal();
  }

  cerrarModal(): void {
    this.cerrar.emit();
    // Resetear el formulario
    while (this.horariosArray.length > 1) {
      this.horariosArray.removeAt(1);
    }
    this.form.reset({
      userId: 1,
      materia: '',
      tipoClase: '',
      colorHex: '#2196F3'
    });
    this.horariosArray.at(0).reset({
      diaSemana: '',
      startTime: '',
      endTime: ''
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


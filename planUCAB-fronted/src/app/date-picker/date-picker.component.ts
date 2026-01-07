import { Component, EventEmitter, Input, Output, signal, computed, HostListener, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

function startOfMonth(date: Date): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './date-picker.component.html',
  styleUrl: './date-picker.component.css'
})
export class DatePickerComponent implements OnChanges {
  @Input() value: string = '';
  @Output() valueChange = new EventEmitter<string>();
  
  mostrarCalendario = signal(false);
  mesActual = signal(startOfMonth(new Date()));
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value'] && this.value) {
      const d = new Date(this.value + 'T00:00:00');
      this.mesActual.set(startOfMonth(d));
    }
  }
  
  diasSemana = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];
  
  diasMes = computed(() => {
    const inicio = this.mesActual();
    const primerDia = new Date(inicio);
    primerDia.setDate(1);
    const diaSemana = primerDia.getDay();
    
    const dias: (Date | null)[] = [];
    const mesAnterior = addMonths(inicio, -1);
    const ultimoDiaAnterior = new Date(inicio.getFullYear(), inicio.getMonth(), 0);
    const diasAnteriores = ultimoDiaAnterior.getDate();
    
    for (let i = diaSemana - 1; i >= 0; i--) {
      dias.push(new Date(mesAnterior.getFullYear(), mesAnterior.getMonth(), diasAnteriores - i));
    }
    
    const ultimoDia = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 0);
    for (let i = 1; i <= ultimoDia.getDate(); i++) {
      dias.push(new Date(inicio.getFullYear(), inicio.getMonth(), i));
    }
    
    const diasRestantes = 42 - dias.length;
    for (let i = 1; i <= diasRestantes; i++) {
      dias.push(new Date(inicio.getFullYear(), inicio.getMonth() + 1, i));
    }
    return dias;
  });
  
  nombreMes = computed(() => {
    const d = this.mesActual();
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const mes = meses[d.getMonth()];
    const anio = d.getFullYear();
    return `${mes.charAt(0).toUpperCase() + mes.slice(1)} ${anio}`;
  });
  
  fechaSeleccionada = computed(() => {
    if (!this.value) return null;
    return new Date(this.value + 'T00:00:00');
  });
  
  esMesActual(dia: Date | null): boolean {
    if (!dia) return false;
    const actual = this.mesActual();
    return dia.getMonth() === actual.getMonth() && dia.getFullYear() === actual.getFullYear();
  }
  
  esHoy(dia: Date | null): boolean {
    if (!dia) return false;
    const hoy = new Date();
    return dia.getDate() === hoy.getDate() && dia.getMonth() === hoy.getMonth() && dia.getFullYear() === hoy.getFullYear();
  }
  
  esSeleccionado(dia: Date | null): boolean {
    if (!dia) return false;
    const sel = this.fechaSeleccionada();
    if (!sel) return false;
    return dia.getDate() === sel.getDate() && dia.getMonth() === sel.getMonth() && dia.getFullYear() === sel.getFullYear();
  }
  
  seleccionarDia(dia: Date | null, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (!dia || !this.esMesActual(dia)) return;
    const fechaStr = `${dia.getFullYear()}-${String(dia.getMonth() + 1).padStart(2, '0')}-${String(dia.getDate()).padStart(2, '0')}`;
    this.valueChange.emit(fechaStr);
    // Usar setTimeout para asegurar que el cambio se aplique después del ciclo de detección de cambios
    setTimeout(() => {
      this.mostrarCalendario.set(false);
    }, 0);
  }
  
  mesAnterior(): void {
    this.mesActual.set(addMonths(this.mesActual(), -1));
  }
  
  mesSiguiente(): void {
    this.mesActual.set(addMonths(this.mesActual(), 1));
  }
  
  hoy(): void {
    const hoy = new Date();
    const fechaStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    this.valueChange.emit(fechaStr);
    this.mesActual.set(startOfMonth(hoy));
    setTimeout(() => {
      this.mostrarCalendario.set(false);
    }, 0);
  }
  
  limpiar(): void {
    this.valueChange.emit('');
    this.mostrarCalendario.set(false);
  }
  
  fechaFormateada(): string {
    if (!this.value) return '';
    const d = new Date(this.value + 'T00:00:00');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    const anio = d.getFullYear();
    return `${mes}/${dia}/${anio}`;
  }
  
  @HostListener('document:click', ['$event'])
  cerrarSiClickFuera(event: Event): void {
    const target = event.target as HTMLElement;
    // No cerrar si el click es dentro del calendario o del input wrapper
    if (!target.closest('.date-picker__calendar') && !target.closest('.date-picker__input-wrapper')) {
      this.mostrarCalendario.set(false);
    }
  }
}


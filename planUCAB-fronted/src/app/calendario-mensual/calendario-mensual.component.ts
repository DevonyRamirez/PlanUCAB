import { Component, computed, signal, Output, EventEmitter, HostListener } from '@angular/core';
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
  selector: 'app-calendario-mensual',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendario-mensual.component.html',
  styleUrl: './calendario-mensual.component.css'
})
export class CalendarioMensualComponent {
  @Output() crearEvento = new EventEmitter<void>();
  @Output() crearHorario = new EventEmitter<void>();
  @Output() fechaSeleccionada = new EventEmitter<Date>();
  mesActual = signal(startOfMonth(new Date()));
  fechaSeleccionadaSignal = signal<Date | null>(null);
  mostrarMenu = signal(false);

  nombreMes = computed(() => {
    const d = this.mesActual();
    return d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  });

  diasSemana = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

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
    const sel = this.fechaSeleccionadaSignal();
    if (!sel) return false;
    return dia.getDate() === sel.getDate() && dia.getMonth() === sel.getMonth() && dia.getFullYear() === sel.getFullYear();
  }

  seleccionarDia(dia: Date | null): void {
    if (dia) {
      this.fechaSeleccionadaSignal.set(dia);
      this.fechaSeleccionada.emit(dia);
    }
  }

  mesAnterior(): void {
    this.mesActual.set(addMonths(this.mesActual(), -1));
  }

  mesSiguiente(): void {
    this.mesActual.set(addMonths(this.mesActual(), 1));
  }

  toggleMenu(): void {
    this.mostrarMenu.set(!this.mostrarMenu());
  }

  cerrarMenu(): void {
    this.mostrarMenu.set(false);
  }

  onCrearEvento(): void {
    this.crearEvento.emit();
    this.cerrarMenu();
  }

  onCrearHorario(): void {
    this.crearHorario.emit();
    this.cerrarMenu();
  }

  @HostListener('document:click', ['$event'])
  cerrarMenuSiClickFuera(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.calendario-mensual__top')) {
      this.cerrarMenu();
    }
  }


}


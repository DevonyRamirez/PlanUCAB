import { Component, EventEmitter, Output, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BusquedaComunicacionService } from '../service/busqueda-comunicacion.service';

@Component({
  selector: 'app-barra-busqueda',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './barra-busqueda.component.html',
  styleUrl: './barra-busqueda.component.css'
})
export class BarraBusquedaComponent implements OnChanges {
  @Output() buscar = new EventEmitter<string>();
  @Input() mostrarErrorExterno = false;
  @Input() mensajeErrorExterno = '';

  terminoBusqueda = '';
  mostrarError = false;
  mensajeError = '';

  constructor(private busquedaComunicacion: BusquedaComunicacionService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mostrarErrorExterno'] && this.mostrarErrorExterno && this.mensajeErrorExterno) {
      this.mostrarError = true;
      this.mensajeError = this.mensajeErrorExterno;
      setTimeout(() => {
        this.mostrarError = false;
      }, 5000);
    }
  }

  onBuscar(): void {
    const termino = this.terminoBusqueda.trim();
    if (!termino) {
      this.mostrarError = true;
      this.mensajeError = 'Por favor ingresa un término de búsqueda';
      setTimeout(() => {
        this.mostrarError = false;
      }, 3000);
      return;
    }
    this.buscar.emit(termino);
    this.busquedaComunicacion.buscar(termino);
    this.mostrarError = false;
  }

  onEnter(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.onBuscar();
    }
  }

  limpiarError(): void {
    this.mostrarError = false;
    this.mensajeError = '';
  }
}


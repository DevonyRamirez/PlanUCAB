import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BarraBusquedaComponent } from '../barra-busqueda/barra-busqueda.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, BarraBusquedaComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  nombreUsuario = signal('Usuario'); // TODO: obtener del servicio de autenticación
}


import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BusquedaService } from '../shared/busqueda.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  nombreUsuario = signal('Usuario'); // TODO: obtener del servicio de autenticación

  constructor(public busquedaService: BusquedaService) {}
}


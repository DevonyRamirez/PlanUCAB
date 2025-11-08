import { Component, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BarraBusquedaComponent } from '../barra-busqueda/barra-busqueda.component';
import { CuentaComponent } from '../cuenta/cuenta.component';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, BarraBusquedaComponent, CuentaComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit {
  nombreUsuario = 'Usuario';
  mostrarPerfil = false;

  constructor(
    private authService: AuthService
  ) {
    // Usar effect para reaccionar a cambios en el signal
    effect(() => {
      const user = this.authService.currentUser();
      this.nombreUsuario = user ? user.username : 'Usuario';
    });
  }

  ngOnInit(): void {
    this.updateUserName();
  }

  private updateUserName(): void {
    const user = this.authService.currentUser();
    this.nombreUsuario = user ? user.username : 'Usuario';
  }

  togglePerfil(): void {
    this.mostrarPerfil = !this.mostrarPerfil;
  }

  cerrarPerfil(): void {
    this.mostrarPerfil = false;
  }
}


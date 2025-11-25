import { Component, OnInit, OnChanges, SimpleChanges, effect, signal, computed, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-cuenta',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cuenta.component.html',
  styleUrl: './cuenta.component.css'
})
export class CuentaComponent implements OnInit, OnChanges {
  @Input() mostrar: boolean = false;
  @Output() cerrar = new EventEmitter<void>();

  mostrarContrasena = signal(false);
  passwordDisplayValue = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    // Actualizar el valor del input cuando cambia displayedPassword
    effect(() => {
      this.passwordDisplayValue = this.displayedPassword();
    });
  }

  ngOnInit(): void {
    this.updatePasswordDisplay();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Cuando se abre el modal, resetear el estado de la contraseña
    if (changes['mostrar'] && changes['mostrar'].currentValue) {
      this.mostrarContrasena.set(false);
      this.updatePasswordDisplay();
    }
  }

  get currentUser() {
    return this.authService.currentUser();
  }

  // Hacer que currentPassword dependa del signal currentUser para reactividad
  currentPassword = computed(() => {
    // Leer el signal para que este computed se actualice cuando cambie
    const user = this.authService.currentUser();
    // Intentar obtener la contraseña del localStorage
    const password = this.authService.getCurrentUserPassword();
    if (password) {
      return password;
    }
    // Si no hay contraseña en localStorage, intentar del objeto user
    return user?.password || '';
  });

  displayedPassword = computed(() => {
    const isVisible = this.mostrarContrasena();
    const password = this.currentPassword();

    if (!password) {
      return '••••••••••';
    }

    if (isVisible) {
      return password;
    }

    return '•'.repeat(password.length);
  });

  cerrarModal(): void {
    this.mostrarContrasena.set(false);
    this.cerrar.emit();
  }

  toggleMostrarContrasena(): void {
    this.mostrarContrasena.update(value => !value);
    // Actualizar el valor inmediatamente
    this.updatePasswordDisplay();
  }

  private updatePasswordDisplay(): void {
    this.passwordDisplayValue = this.displayedPassword();
  }

  logout(): void {
    this.cerrarModal();
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}


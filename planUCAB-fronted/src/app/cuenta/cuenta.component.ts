import { Component, OnInit, OnChanges, SimpleChanges, effect, signal, computed, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, UpdateUserRequest } from '../service/auth.service';

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
  
  // Estado para el modal de edición
  mostrarEditModal = signal(false);
  editForm = {
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  };
  editError = signal<string | null>(null);
  editSuccess = signal<string | null>(null);
  isSubmitting = signal(false);
  
  // Estado para confirmación de eliminación
  mostrarConfirmDelete = signal(false);

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

  // Métodos para edición de usuario
  abrirEditModal(): void {
    const user = this.currentUser;
    this.editForm = {
      username: user?.username || '',
      email: user?.email || '',
      password: '',
      confirmPassword: ''
    };
    this.editError.set(null);
    this.editSuccess.set(null);
    this.mostrarEditModal.set(true);
  }

  cerrarEditModal(): void {
    this.mostrarEditModal.set(false);
    this.editError.set(null);
    this.editSuccess.set(null);
  }

  guardarCambios(): void {
    this.editError.set(null);
    this.editSuccess.set(null);

    // Validar contraseñas si se proporcionan
    if (this.editForm.password && this.editForm.password !== this.editForm.confirmPassword) {
      this.editError.set('Las contraseñas no coinciden');
      return;
    }

    // Validar formato de contraseña si se proporciona
    if (this.editForm.password) {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
      if (!passwordRegex.test(this.editForm.password)) {
        this.editError.set('La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número');
        return;
      }
    }

    // Validar email
    const emailRegex = /.*@est\.ucab\.edu\.ve$/;
    if (this.editForm.email && !emailRegex.test(this.editForm.email)) {
      this.editError.set('El correo debe ser del dominio @est.ucab.edu.ve');
      return;
    }

    // Validar username
    if (this.editForm.username && this.editForm.username.length < 10) {
      this.editError.set('El nombre de usuario debe tener al menos 10 caracteres');
      return;
    }

    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      this.editError.set('Error: Usuario no identificado');
      return;
    }

    const request: UpdateUserRequest = {};
    
    // Solo incluir campos que han cambiado
    if (this.editForm.username !== this.currentUser?.username) {
      request.username = this.editForm.username;
    }
    if (this.editForm.email !== this.currentUser?.email) {
      request.email = this.editForm.email;
    }
    if (this.editForm.password) {
      request.password = this.editForm.password;
    }

    // Si no hay cambios, cerrar
    if (Object.keys(request).length === 0) {
      this.cerrarEditModal();
      return;
    }

    this.isSubmitting.set(true);

    this.authService.updateUser(userId, request).subscribe({
      next: () => {
        this.editSuccess.set('¡Datos actualizados correctamente!');
        this.isSubmitting.set(false);
        setTimeout(() => {
          this.cerrarEditModal();
        }, 1500);
      },
      error: (error) => {
        this.editError.set(error.error?.message || 'Error al actualizar los datos');
        this.isSubmitting.set(false);
      }
    });
  }

  // Métodos para eliminación de cuenta
  abrirConfirmDelete(): void {
    this.mostrarConfirmDelete.set(true);
  }

  cerrarConfirmDelete(): void {
    this.mostrarConfirmDelete.set(false);
  }

  confirmarEliminar(): void {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      return;
    }

    this.authService.deleteUser(userId).subscribe({
      next: () => {
        this.cerrarConfirmDelete();
        this.cerrarModal();
        this.authService.logout();
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Error al eliminar cuenta:', error);
        this.cerrarConfirmDelete();
      }
    });
  }
}


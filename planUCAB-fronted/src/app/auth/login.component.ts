import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm: FormGroup;
  registerForm: FormGroup;
  mostrarRegistro = false;
  mensajeError = '';
  mostrarError = false;
  mensajeExito = '';
  mostrarExito = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email, this.validateUcabEmail]],
      password: ['', [Validators.required, Validators.minLength(10)]]
    });

    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(10)]],
      email: ['', [Validators.required, Validators.email, this.validateUcabEmail]],
      password: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  validateUcabEmail(control: any) {
    const email = control.value;
    if (!email) {
      return null;
    }
    return email.endsWith('@est.ucab.edu.ve') ? null : { invalidUcabEmail: true };
  }

  onLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.mostrarError = true;
      this.mensajeError = 'Por favor completa todos los campos correctamente';
      return;
    }

    const { email, password } = this.loginForm.value;
    this.authService.login({ email, password }).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.error('Error al iniciar sesión', err);
        this.mostrarError = true;
        if (err.error?.message) {
          this.mensajeError = err.error.message;
        } else {
          this.mensajeError = 'Error al iniciar sesión. Verifica tus credenciales.';
        }
      }
    });
  }

  onRegister(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.mostrarError = true;
      this.mensajeError = 'Por favor completa todos los campos correctamente';
      return;
    }

    const { username, email, password } = this.registerForm.value;
    this.authService.register({ username, email, password }).subscribe({
      next: () => {
        // Cambiar a la pestaña de iniciar sesión
        this.mostrarRegistro = false;
        // Prellenar el email en el formulario de login
        this.loginForm.patchValue({ email });
        // Limpiar el formulario de registro
        this.registerForm.reset();
        // Mostrar mensaje de éxito
        this.mensajeError = '';
        this.mostrarError = false;
        this.mensajeExito = '¡Creación de cuenta exitosa! Por favor inicia sesión con tus credenciales.';
        this.mostrarExito = true;
        // Ocultar el mensaje de éxito después de 5 segundos
        setTimeout(() => {
          this.mostrarExito = false;
          this.mensajeExito = '';
        }, 5000);
      },
      error: (err) => {
        console.error('Error al registrar', err);
        this.mostrarError = true;
        if (err.error?.message) {
          this.mensajeError = err.error.message;
        } else {
          this.mensajeError = 'Error al registrar usuario. Verifica los datos ingresados.';
        }
      }
    });
  }

  toggleForm(): void {
    this.mostrarRegistro = !this.mostrarRegistro;
    this.mensajeError = '';
    this.mostrarError = false;
    this.mensajeExito = '';
    this.mostrarExito = false;
    this.loginForm.reset();
    this.registerForm.reset();
  }

  cerrarError(): void {
    this.mostrarError = false;
    this.mensajeError = '';
  }

  cerrarExito(): void {
    this.mostrarExito = false;
    this.mensajeExito = '';
  }
}


import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface User {
  id: number;
  username: string;
  email: string;
  password?: string; // Opcional para mostrar en el perfil
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = 'http://localhost:8080/api';
  private readonly STORAGE_KEY = 'planUCAB_user';
  private readonly STORAGE_KEY_ID = 'planUCAB_user_id';
  private readonly STORAGE_KEY_PASSWORD = 'planUCAB_password';

  // Signals para el estado de autenticación
  currentUser = signal<User | null>(null);
  isAuthenticated = signal<boolean>(false);

  constructor(private http: HttpClient) {
    // Verificar si hay un usuario guardado en localStorage al inicializar
    this.loadUserFromStorage();
  }

  register(request: CreateUserRequest): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/auth/register`, request).pipe(
      tap(user => {
        const userWithPassword = { ...user, password: request.password };
        this.setCurrentUser(userWithPassword);
      })
    );
  }

  login(request: LoginRequest): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/auth/login`, request).pipe(
      tap(user => {
        const userWithPassword = { ...user, password: request.password };
        this.setCurrentUser(userWithPassword);
      })
    );
  }

  logout(): void {
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.STORAGE_KEY_ID);
    localStorage.removeItem(this.STORAGE_KEY_PASSWORD);
  }

  getCurrentUserId(): number | null {
    const userId = localStorage.getItem(this.STORAGE_KEY_ID);
    return userId ? parseInt(userId, 10) : null;
  }

  private setCurrentUser(user: User): void {
    // Guardar contraseña por separado si existe
    if (user.password) {
      localStorage.setItem(this.STORAGE_KEY_PASSWORD, user.password);
    }
    // Guardar usuario sin contraseña en el objeto principal
    const userWithoutPassword = { id: user.id, username: user.username, email: user.email };
    this.currentUser.set(user);
    this.isAuthenticated.set(true);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userWithoutPassword));
    localStorage.setItem(this.STORAGE_KEY_ID, user.id.toString());
  }

  getCurrentUserPassword(): string | null {
    return localStorage.getItem(this.STORAGE_KEY_PASSWORD);
  }

  private loadUserFromStorage(): void {
    const storedUser = localStorage.getItem(this.STORAGE_KEY);
    const storedPassword = localStorage.getItem(this.STORAGE_KEY_PASSWORD);
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser) as User;
        if (storedPassword) {
          user.password = storedPassword;
        }
        this.currentUser.set(user);
        this.isAuthenticated.set(true);
      } catch (e) {
        // Si hay error al parsear, limpiar el localStorage
        this.logout();
      }
    }
  }
}


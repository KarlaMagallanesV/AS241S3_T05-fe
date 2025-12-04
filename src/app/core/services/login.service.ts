import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Login } from '../interfaces/login';
import { jwtDecode } from 'jwt-decode';
import { DecodedToken } from '@core/interfaces/decodedToken';
import { response } from 'express';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  private http = inject(HttpClient);
  private apiUrl = `${environment.urlBackEnd}/v1/api/user`;

  // Usuario autenticado actualmente
  private loggedUserSubject = new BehaviorSubject<DecodedToken | null>(null);
  loggedUser$ = this.loggedUserSubject.asObservable();

  // Iniciar sesión
  login(credentials: { username: string; password: string }): Observable<string> {
    return this.http.post(`${this.apiUrl}/login`, credentials, { responseType: 'text' }).pipe(
      tap(token => {
        
        this.setLoggedUser(token);
        const decoded: DecodedToken = jwtDecode(token);
        this.loggedUserSubject.next(decoded);

        this.logSuccess('Inicio de sesión exitoso');
      }),
      catchError(this.handleError<string>('login'))
    );
  }

  // Cerrar sesión
  logout(): void {
    this.loggedUserSubject.next(null);
    localStorage.removeItem('token-local');
    this.logSuccess('Sesión cerrada');
  }

  // Decodificar token
  getDecodedToken(): DecodedToken | null {
    const token = localStorage.getItem('token-local');
    return token ? jwtDecode(token) : null;
  }

  // Establecer usuario logueado
  setLoggedUser(token: string | null): void {
    if (token) {
      localStorage.setItem('token-local', token);
      sessionStorage.setItem('token-session', token);
    }
  }

  // Cargar usuario desde localStorage al iniciar la app
  loadUserFromStorage(): void {
    const userData = localStorage.getItem('user');
    if (userData) {
      this.loggedUserSubject.next(JSON.parse(userData));
    }
  }

  // ❌ Manejo centralizado de errores
  private handleError<T>(operation = 'operación', result?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`${operation} falló: ${error.message}`);
      let errorMessage = `Error en ${operation}`;
      if (error.error instanceof ErrorEvent) {
        errorMessage += `: ${error.error.message}`;
      } else {
        errorMessage += `: Código ${error.status} - ${error.error?.message || error.message}`;
      }
      this.logError(errorMessage);
      return throwError(() => errorMessage);
    };
  }

  // Logs
  private logSuccess(message: string): void {
    console.log('✅ LOGIN SUCCESS:', message);
  }

  private logError(message: string): void {
    console.error('⛔ LOGIN ERROR:', message);
  }
}

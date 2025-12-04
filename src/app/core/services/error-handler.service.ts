import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import Swal from 'sweetalert2';

export interface ErrorConfig {
  showAlert?: boolean;
  redirectOn401?: boolean;
  customMessage?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ErrorHandlerService {
  private router = inject(Router);

  /**
   * Manejo centralizado de errores HTTP
   * @param operation Nombre de la operación que falló
   * @param config Configuración opcional del manejo de errores
   */
  handleError<T>(operation = 'operación', config: ErrorConfig = {}) {
    const { showAlert = false, redirectOn401 = true, customMessage } = config;

    return (error: HttpErrorResponse): Observable<T> => {
      let errorMessage = this.getErrorMessage(error, operation);

      this.logError(operation, error);

      switch (error.status) {
        case 0:
          errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
          break;
        case 401:
          errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
          if (redirectOn401) {
            localStorage.removeItem('token-local');
            this.router.navigate(['/auth/login']);
          }
          break;
        case 403:
          errorMessage = 'No tienes permisos para realizar esta acción.';
          break;
        case 404:
          errorMessage = customMessage || `${operation}: Recurso no encontrado.`;
          break;
        case 422:
          errorMessage = this.extractValidationErrors(error) || 'Datos inválidos.';
          break;
        case 500:
          errorMessage = 'Error interno del servidor. Intenta más tarde.';
          break;
      }

      if (showAlert) {
        this.showErrorAlert(errorMessage);
      }

      return throwError(() => ({
        message: errorMessage,
        status: error.status,
        originalError: error,
      }));
    };
  }

  private getErrorMessage(error: HttpErrorResponse, operation: string): string {
    if (error.error instanceof ErrorEvent) {
      return `Error de cliente: ${error.error.message}`;
    }

    const serverMessage = error.error?.message || error.error?.error || error.message;
    return `Error en ${operation}: ${serverMessage}`;
  }

  private extractValidationErrors(error: HttpErrorResponse): string | null {
    if (error.error?.errors && typeof error.error.errors === 'object') {
      const errors = Object.values(error.error.errors).flat();
      return errors.join(', ');
    }
    return null;
  }

  showErrorAlert(message: string, title = 'Error'): void {
    Swal.fire({
      title,
      text: message,
      icon: 'error',
      confirmButtonColor: '#80A7A3',
      confirmButtonText: 'Aceptar',
    });
  }

  showSuccessAlert(message: string, title = '¡Éxito!'): void {
    Swal.fire({
      title,
      text: message,
      icon: 'success',
      confirmButtonColor: '#80A7A3',
      confirmButtonText: 'Aceptar',
    });
  }

  private logError(operation: string, error: HttpErrorResponse): void {
    console.error(`[${operation}] Error ${error.status}:`, {
      message: error.message,
      url: error.url,
      error: error.error,
    });
  }
}

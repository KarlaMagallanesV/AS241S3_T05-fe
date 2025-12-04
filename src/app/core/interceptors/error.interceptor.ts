import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import Swal from 'sweetalert2';

/**
 * Interceptor global de errores HTTP
 * Maneja automáticamente errores comunes como 401, 403, 500
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const isLoginRequest = req.url.includes('/login');

      switch (error.status) {
        case 0:
          showConnectionError();
          break;

        case 401:
          if (!isLoginRequest) {
            handleUnauthorized(router);
          }
          break;

        case 403:
          showForbiddenError();
          break;

        case 500:
        case 502:
        case 503:
          showServerError();
          break;
      }

      return throwError(() => error);
    })
  );
};

function showConnectionError(): void {
  Swal.fire({
    title: 'Error de conexión',
    text: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
    icon: 'error',
    confirmButtonColor: '#80A7A3',
    confirmButtonText: 'Aceptar',
  });
}

function handleUnauthorized(router: Router): void {
  localStorage.removeItem('token-local');
  sessionStorage.removeItem('token-session');

  Swal.fire({
    title: 'Sesión expirada',
    text: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
    icon: 'warning',
    confirmButtonColor: '#80A7A3',
    confirmButtonText: 'Ir al login',
  }).then(() => {
    router.navigate(['/auth/login']);
  });
}

function showForbiddenError(): void {
  Swal.fire({
    title: 'Acceso denegado',
    text: 'No tienes permisos para realizar esta acción.',
    icon: 'error',
    confirmButtonColor: '#80A7A3',
    confirmButtonText: 'Aceptar',
  });
}

function showServerError(): void {
  Swal.fire({
    title: 'Error del servidor',
    text: 'Ocurrió un error en el servidor. Por favor, intenta más tarde.',
    icon: 'error',
    confirmButtonColor: '#80A7A3',
    confirmButtonText: 'Aceptar',
  });
}

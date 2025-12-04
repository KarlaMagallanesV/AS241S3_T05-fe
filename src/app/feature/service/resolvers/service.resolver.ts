import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ServiceInterface } from '../interfaces/service';
import { ServiceService } from '../services/service.service';

/* Resolver para precargar la lista completa de servicios Se ejecuta antes de activar la ruta */
export const serviceListResolver: ResolveFn<ServiceInterface[]> = (): Observable<ServiceInterface[]> => {
    const serviceService = inject(ServiceService);

    return serviceService.findAll().pipe(
        catchError(error => {
            console.error('Error al cargar servicios en resolver:', error);
            // Retorna array vacío en caso de error para que la navegación no falle
            return of([]);
        })
    );
};

/* Resolver para cargar servicios filtrados por estado 1 (activos) o 0 (inactivos) */
export const servicesByStateResolver: ResolveFn<ServiceInterface[]> = (route): Observable<ServiceInterface[]> => {
    const serviceService = inject(ServiceService);
    const stateParam = route.paramMap.get('state');

    if (stateParam === null) {
        console.warn('Estado no especificado en la ruta');
        return of([]);
    }

    const state = Number(stateParam);

    if (isNaN(state)) {
        console.warn(`Estado inválido: ${stateParam}`);
        return of([]);
    }

    return serviceService.findByState(state).pipe(
        catchError(error => {
            console.error(`Error al cargar servicios con estado ${state}:`, error);
            return of([]);
        })
    );
};

/* Resolver para cargar un servicio específico por código */
export const serviceByCodeResolver: ResolveFn<ServiceInterface | null> = (route): Observable<ServiceInterface | null> => {
    const serviceService = inject(ServiceService);
    const code = route.paramMap.get('code');

    if (!code) {
        console.warn('Código de servicio no especificado');
        return of(null);
    }

    return serviceService.findById(code).pipe(
        catchError(error => {
            console.error(`Error al cargar servicio ${code}:`, error);
            return of(null);
        })
    );
};
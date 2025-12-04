import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Client } from '../interfaces/client';
import { ClientService } from '../services/client.service';

/* Resolver para precargar la lista completa de clientes Se ejecuta antes de activar la ruta*/
export const clientListResolver: ResolveFn<Client[]> = (): Observable<Client[]> => {
    const clientService = inject(ClientService);

    return clientService.findAll().pipe(
        catchError(error => {
            console.error('Error al cargar clientes en resolver:', error);
            // Retorna array vacío en caso de error para que la navegación no falle
            return of([]);
        })
    );
};

/* Resolver para cargar un cliente específico por ID Útil para rutas de edición: /client/:id*/
export const clientByIdResolver: ResolveFn<Client | null> = (route): Observable<Client | null> => {
    const clientService = inject(ClientService);
    const id = Number(route.paramMap.get('id'));

    if (!id || isNaN(id)) {
        console.warn('ID de cliente inválido');
        return of(null);
    }

    return clientService.findById(id).pipe(
        catchError(error => {
            console.error(`Error al cargar cliente ${id}:`, error);
            return of(null);
        })
    );
};

/* Resolver para cargar clientes por estado*/
export const clientsByStatusResolver: ResolveFn<Client[]> = (route): Observable<Client[]> => {
    const clientService = inject(ClientService);
    const status = route.paramMap.get('status');

    if (!status) {
        console.warn('Estado no especificado');
        return of([]);
    }

    return clientService.findByStatus(status).pipe(
        catchError(error => {
            console.error(`Error al cargar clientes con estado ${status}:`, error);
            return of([]);
        })
    );
};
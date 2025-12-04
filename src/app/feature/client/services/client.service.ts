import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { BehaviorSubject, Observable, catchError, map, tap, throwError } from 'rxjs';
import { Client } from '../interfaces/client';

@Injectable({
    providedIn: 'root'
})
export class ClientService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.urlBackEnd}/v1/api/client`;

    private selectedClientSubject = new BehaviorSubject<Client | null>(null);
    selectedClient$ = this.selectedClientSubject.asObservable();

    // Obtener todos los clientes
    findAll(): Observable<Client[]> {
        return this.http.get<Client[]>(this.apiUrl).pipe(
            catchError(this.handleError<Client[]>('findAll', []))
        );
    }

    // Buscar cliente por ID
    findById(id: number): Observable<Client> {
        return this.http.get<Client>(`${this.apiUrl}/${id}`).pipe(
            tap(client => this.setSelectedClient(client)),
            catchError(this.handleError<Client>('findById'))
        );
    }

    // Buscar clientes por estado
    findByStatus(status: string): Observable<Client[]> {
        return this.http.get<Client[]>(`${this.apiUrl}/status/${status}`).pipe(
            catchError(this.handleError<Client[]>('findByStatus', []))
        );
    }

    // Crear nuevo cliente
    save(client: Client): Observable<Client> {
        return this.http.post<Client>(this.apiUrl, client).pipe(
            tap(newClient => {
                this.setSelectedClient(newClient);
                this.logSuccess('Cliente creado exitosamente');
            }),
            catchError(this.handleError<Client>('save'))
        );
    }

    // Actualizar cliente existente
    update(id: number, client: Client): Observable<Client> {
        return this.http.put<Client>(`${this.apiUrl}/${id}`, client).pipe(
            tap(updatedClient => {
                this.setSelectedClient(updatedClient);
                this.logSuccess('Cliente actualizado exitosamente');
            }),
            catchError(this.handleError<Client>('update'))
        );
    }

    // Eliminar (lógicamente) un cliente
    delete(id: number): Observable<boolean> {
        return this.http.patch(`${this.apiUrl}/delete/${id}`, null).pipe(
            tap(() => {
                this.setSelectedClient(null);
                this.logSuccess('Cliente desactivado exitosamente');
            }),
            map(() => true),
            catchError(this.handleError<boolean>('delete', false))
        );
    }

    // Restaurar cliente
    restore(id: number): Observable<boolean> {
        return this.http.patch(`${this.apiUrl}/restore/${id}`, null).pipe(
            tap(() => this.logSuccess('Cliente reactivado exitosamente')),
            map(() => true),
            catchError(this.handleError<boolean>('restore', false))
        );
    }

    // Establecer cliente seleccionado
    setSelectedClient(client: Client | null): void {
        this.selectedClientSubject.next(client);
    }

    // Manejo centralizado de errores
    private handleError<T>(operation = 'operation', result?: T) {
        return (error: HttpErrorResponse): Observable<T> => {
            console.error(`${operation} failed: ${error.message}`);

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
        console.log('SUCCESS:', message);
    }

    private logError(message: string): void {
        console.error('ERROR:', message);
    }

    // Generar reporte PDF
    reportPdf() {
        console.log('Generating PDF report...');
        return this.http.get(`${this.apiUrl}/pdf`, { responseType: 'blob' });
    }
}

import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { BehaviorSubject, Observable, catchError, map, tap, throwError } from 'rxjs';
import { ServiceInterface as Service } from '../../../feature/service/interfaces/service';

@Injectable({
    providedIn: 'root'
})
export class ServiceService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.urlBackEnd}/v1/api/service`;
    private apiUrlImage = `${environment.urlBackEnd}/v1/api/images`;

    private selectedServiceSubject = new BehaviorSubject<Service | null>(null);
    selectedService$ = this.selectedServiceSubject.asObservable();

    // Obtener todos los servicios
    findAll(): Observable<Service[]> {
        return this.http.get<Service[]>(this.apiUrl).pipe(
            catchError(this.handleError<Service[]>('findAll', []))
        );
    }

    // Buscar servicio por ID
    findById(code: string): Observable<Service> {
        return this.http.get<Service>(`${this.apiUrl}/${code}`).pipe(
            tap(service => this.setSelectedService(service)),
            catchError(this.handleError<Service>('findById'))
        );
    }

    // Buscar servicios por estado
    findByState(state: number): Observable<Service[]> {
        return this.http.get<Service[]>(`${this.apiUrl}/state/${state}`).pipe(
            catchError(this.handleError<Service[]>('findByState', []))
        );
    }

    uploadImage(file: File): Observable<string> {
        const formData = new FormData();
        formData.append('file', file);

        return this.http.post(`${this.apiUrlImage}/upload`, formData, {
            responseType: 'text'
        });
    }

    // Crear nuevo servicio
    save(service: Service): Observable<Service> {
        return this.http.post<Service>(`${this.apiUrl}/save`, service).pipe(
            tap(newService => {
                this.setSelectedService(newService);
                this.logSuccess('Servicio creado exitosamente');
            }),
            catchError(this.handleError<Service>('save'))
        );
    }

    update(service: Service): Observable<Service> {
        return this.http.put<Service>(`${this.apiUrl}/update`, service).pipe(
            tap(updatedService => {
                this.setSelectedService(updatedService);
                this.logSuccess('Servicio actualizado exitosamente');
            }),
            catchError(this.handleError<Service>('update'))
        );
    }

    // Eliminar (lógicamente) un servicio
    delete(code: string) {
        return this.http.patch(`${this.apiUrl}/delete/${code}`, {}).pipe(
            catchError(this.handleError<Service>('delete'))
        );
    }


    // Restaurar servicio
    restore(code: string) {
        return this.http.patch(`${this.apiUrl}/restore/${code}`, {}).pipe(
            catchError(this.handleError<Service>('restore'))
        );
    }

    reportPdf() {
        return this.http.get(`${this.apiUrl}/pdf`, { responseType: 'blob' });
    }

    getCodePreview(category: string): Observable<{ code: string }> {
        return this.http.get<{ code: string }>(`${this.apiUrl}/code-preview?category=${category}`);
    }


    // Establecer servicio seleccionado
    setSelectedService(service: Service | null): void {
        this.selectedServiceSubject.next(service);
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
}

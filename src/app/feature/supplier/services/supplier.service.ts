import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { BehaviorSubject, catchError, Observable, tap, throwError } from 'rxjs';
import { SupplierInterface } from '../interfaces/supplier';

@Injectable({
  providedIn: 'root'
})
export class SupplierService {

  private http = inject(HttpClient);
  private apiUrl = `${environment.urlBackEnd}/v1/api/supplier`;

  private selectedSupplierSubject = new BehaviorSubject<SupplierInterface | null>(null);
  selectedSupplier$ = this.selectedSupplierSubject.asObservable();

  findAll(): Observable<SupplierInterface[]> {
      return this.http.get<SupplierInterface[]>(this.apiUrl).pipe(
          catchError(this.handleError<SupplierInterface[]>('findAll', []))
      );
  }

  findById(id: number): Observable<SupplierInterface> {
      return this.http.get<SupplierInterface>(`${this.apiUrl}/${id}`).pipe(
          tap(supplier => this.setSelectedSupplier(supplier)),
          catchError(this.handleError<SupplierInterface>('findById'))
      );
  }

  findByState(state: number): Observable<SupplierInterface[]> {
      return this.http.get<SupplierInterface[]>(`${this.apiUrl}/state/${state}`).pipe(
          catchError(this.handleError<SupplierInterface[]>('findByState', []))
      );
  }

    save(supplier: SupplierInterface): Observable<SupplierInterface> {
        return this.http.post<SupplierInterface>(`${this.apiUrl}/save`, supplier).pipe(
            tap(newSupplier => {
                this.setSelectedSupplier(newSupplier);
                this.logSuccess('Proveedor creado exitosamente');
            }),
            catchError(this.handleError<SupplierInterface>('save'))
        );
    }

  update(supplier: SupplierInterface): Observable<SupplierInterface> {
      return this.http.put<SupplierInterface>(`${this.apiUrl}/update`, supplier).pipe(
          tap(updatedSupplier => {
              this.setSelectedSupplier(updatedSupplier);
              this.logSuccess('Proveedor actualizado exitosamente');
          }),
          catchError(this.handleError<SupplierInterface>('update'))
      );
    }

    // Eliminar (lógicamente) un servicio
    delete(id: number) {
        return this.http.patch(`${this.apiUrl}/delete/${id}`, {}).pipe(
            catchError(this.handleError<SupplierInterface>('delete'))
        );
    }

    // Restaurar servicio
    restore(id: number) {
        return this.http.patch(`${this.apiUrl}/restore/${id}`, {}).pipe(
            catchError(this.handleError<SupplierInterface>('restore'))
        );
    }

    reportPdf() {
        return this.http.get(`${this.apiUrl}/pdf`, { responseType: 'blob' });
    }

    // Establecer servicio seleccionado
    setSelectedSupplier(supplier: SupplierInterface | null): void {
        this.selectedSupplierSubject.next(supplier);
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

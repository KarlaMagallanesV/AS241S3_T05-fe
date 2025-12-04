import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { catchError, Observable, throwError } from 'rxjs';
import { BillingInterface, BillingResponse } from '../interfaces/billing';

@Injectable({
  providedIn: 'root'
})
export class BillingService {

  private http = inject(HttpClient);
  private apiUrl = `${environment.urlBackEnd}/v1/api/billing`;

  findAll(): Observable<BillingResponse[]> {
    return this.http.get<BillingResponse[]>(this.apiUrl)
      .pipe(
        catchError(err => this.handleError('findAll', err))
      );
  }

  save(request: BillingInterface): Observable<BillingResponse> {
    return this.http.post<BillingResponse>(`${this.apiUrl}/save`, request)
      .pipe(
        catchError(err => this.handleError('save', err))
      );
  }

  delete(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/delete/${id}`, {})
      .pipe(
        catchError(err => this.handleError('delete', err))
      );
  }

  restore(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/restore/${id}`, {})
      .pipe(
        catchError(err => this.handleError('restore', err))
      );
  }

  private handleError(operation: string, error: HttpErrorResponse) {
    console.error(`${operation} failed:`, error);

    let errorMessage = `Error en ${operation}`;
    if (error.error instanceof ErrorEvent) {
      errorMessage += `: ${error.error.message}`;
    } else {
      errorMessage += `: Código ${error.status} - ${error.error?.message || error.message}`;
    }

    return throwError(() => errorMessage);
  }
}

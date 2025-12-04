import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Reservation, ReservationResponse } from '../interfaces/reservation';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  reservation?: T;
  reservations?: T[];
}

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.urlBackEnd}/v1/api/reservation`;

  findAll(): Observable<ReservationResponse[]> {
    return this.http.get<ReservationResponse[]>(this.apiUrl);
  }

  findById(id: number): Observable<ApiResponse<ReservationResponse>> {
    return this.http.get<ApiResponse<ReservationResponse>>(`${this.apiUrl}/${id}`);
  }

  findByStatus(status: string): Observable<ApiResponse<ReservationResponse[]>> {
    return this.http.get<ApiResponse<ReservationResponse[]>>(`${this.apiUrl}/status/${status}`);
  }

  findByClient(clientId: number): Observable<ApiResponse<Reservation[]>> {
    return this.http.get<ApiResponse<Reservation[]>>(`${this.apiUrl}/client/${clientId}`);
  }

  findByEmployee(employeeId: number): Observable<ApiResponse<Reservation[]>> {
    return this.http.get<ApiResponse<Reservation[]>>(`${this.apiUrl}/employee/${employeeId}`);
  }

  // Endpoints específicos por estado
  findPending(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.apiUrl}/P`);
  }

  findAttended(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.apiUrl}/A`);
  }

  findCancelled(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.apiUrl}/C`);
  }

  findRescheduled(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.apiUrl}/R`);
  }

  findNoShow(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.apiUrl}/N`);
  }

  save(reservation: Reservation): Observable<ApiResponse<Reservation>> {
    return this.http.post<ApiResponse<Reservation>>(`${this.apiUrl}/save`, reservation);
  }

  update(id: number, reservation: Reservation): Observable<ApiResponse<Reservation>> {
    return this.http.put<ApiResponse<Reservation>>(`${this.apiUrl}/${id}`, reservation);
  }

  cancel(id: number): Observable<ApiResponse<Reservation>> {
    return this.http.patch<ApiResponse<Reservation>>(`${this.apiUrl}/delete/${id}`, {});
  }

  restore(id: number): Observable<ApiResponse<Reservation>> {
    return this.http.patch<ApiResponse<Reservation>>(`${this.apiUrl}/restore/${id}`, {});
  }

  generatePdfReport(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/pdf`, { responseType: 'blob' });
  }
}

import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { User, UserRequestDTO } from '../interfaces/user';

interface ApiResponse<T> {
  message: string;
  data?: T;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.urlBackEnd}/v1/api/user`;

  findAll(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  findAllActive(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/active`);
  }

  findAllInactive(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/inactive`);
  }

  findByEmployeeId(employeeId: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/employee/${employeeId}`);
  }

  findByClientId(clientId: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/client/${clientId}`);
  }

  register(request: UserRequestDTO): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${this.apiUrl}/register`, request);
  }

  deleteUser(id: number): Observable<ApiResponse<null>> {
    return this.http.patch<ApiResponse<null>>(`${this.apiUrl}/delete/${id}`, {});
  }

  restoreUser(id: number): Observable<ApiResponse<User>> {
    return this.http.patch<ApiResponse<User>>(`${this.apiUrl}/restore/${id}`, {});
  }
}

import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Employee } from '../interfaces/employee';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  employee?: T;
  id?: number;
}

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.urlBackEnd}/v1/api/employee`;

  getEmployees(): Observable<Employee[]> {
    return this.http.get<Employee[]>(this.apiUrl);
  }

  getEmployeesByStatus(status: string): Observable<Employee[]> {
    return this.http.get<Employee[]>(`${this.apiUrl}/status/${status}`);
  }

  getEmployeeById(id: number): Observable<ApiResponse<Employee>> {
    return this.http.get<ApiResponse<Employee>>(`${this.apiUrl}/${id}`);
  }

  createEmployee(employee: Employee): Observable<ApiResponse<Employee>> {
    return this.http.post<ApiResponse<Employee>>(`${this.apiUrl}/save`, employee);
  }

  updateEmployee(id: number, employee: Employee): Observable<ApiResponse<Employee>> {
    return this.http.put<ApiResponse<Employee>>(`${this.apiUrl}/${id}`, employee);
  }

  deleteEmployee(id: number): Observable<ApiResponse<Employee>> {
    return this.http.patch<ApiResponse<Employee>>(`${this.apiUrl}/delete/${id}`, {});
  }

  restoreEmployee(id: number): Observable<ApiResponse<Employee>> {
    return this.http.patch<ApiResponse<Employee>>(`${this.apiUrl}/restore/${id}`, {});
  }
}

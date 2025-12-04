import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { BehaviorSubject, catchError, Observable, tap, throwError } from 'rxjs';
import { ProductInterface } from '../interfaces/product';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private http = inject(HttpClient);
  private apiUrl = `${environment.urlBackEnd}/v1/api/product`;
  private apiUrlImage = `${environment.urlBackEnd}/v1/api/images`;

  private selectedProductSubject = new BehaviorSubject<ProductInterface | null>(null);
  selectedProduct$ = this.selectedProductSubject.asObservable();

  findAll(): Observable<ProductInterface[]> {
      return this.http.get<ProductInterface[]>(this.apiUrl).pipe(
          catchError(this.handleError<ProductInterface[]>('findAll', []))
      );
  }

    // Buscar servicio por ID
  findById(code: string): Observable<ProductInterface> {
      return this.http.get<ProductInterface>(`${this.apiUrl}/${code}`).pipe(
          tap(product => this.setSelectedProduct(product)),
          catchError(this.handleError<ProductInterface>('findById'))
      );
  }

    // Buscar servicios por estado
  findByState(state: number): Observable<ProductInterface[]> {
      return this.http.get<ProductInterface[]>(`${this.apiUrl}/state/${state}`).pipe(
          catchError(this.handleError<ProductInterface[]>('findByState', []))
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
    save(product: ProductInterface): Observable<ProductInterface> {
        return this.http.post<ProductInterface>(`${this.apiUrl}/save`, product).pipe(
            tap(newProduct => {
                this.setSelectedProduct(newProduct);
                this.logSuccess('Producto creado exitosamente');
            }),
            catchError(this.handleError<ProductInterface>('save'))
        );
    }

  update(product: ProductInterface): Observable<ProductInterface> {
      return this.http.put<ProductInterface>(`${this.apiUrl}/update`, product).pipe(
          tap(updatedProduct => {
              this.setSelectedProduct(updatedProduct);
              this.logSuccess('Producto actualizado exitosamente');
          }),
          catchError(this.handleError<ProductInterface>('update'))
      );
    }

    // Eliminar (lógicamente) un servicio
    delete(id: number) {
        return this.http.patch(`${this.apiUrl}/delete/${id}`, {}).pipe(
            catchError(this.handleError<ProductInterface>('delete'))
        );
    }


    // Restaurar servicio
    restore(id: number) {
        return this.http.patch(`${this.apiUrl}/restore/${id}`, {}).pipe(
            catchError(this.handleError<ProductInterface>('restore'))
        );
    }

    reportPdf() {
        return this.http.get(`${this.apiUrl}/pdf`, { responseType: 'blob' });
    }

    getCodePreview(category: string): Observable<{ code: string }> {
        return this.http.get<{ code: string }>(`${this.apiUrl}/code-preview?category=${category}`);
    }


    // Establecer servicio seleccionado
    setSelectedProduct(product: ProductInterface | null): void {
        this.selectedProductSubject.next(product);
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

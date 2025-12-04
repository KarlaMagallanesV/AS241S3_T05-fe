import { ResolveFn } from "@angular/router";
import { ProductInterface } from "../interfaces/product";
import { ProductService } from "../services/product.service";
import { inject } from "@angular/core";
import { catchError, Observable, of } from "rxjs";

export const productListResolver: ResolveFn<ProductInterface[]> = (): Observable<ProductInterface[]> => {
    const productService = inject(ProductService);

    return productService.findAll().pipe(
        catchError(error => {
            console.error('Error al cargar servicios en resolver:', error);
            return of([]);
        })
    );
};

/* Resolver para cargar servicios filtrados por estado 1 (activos) o 0 (inactivos) */
export const productsByStateResolver: ResolveFn<ProductInterface[]> = (route): Observable<ProductInterface[]> => {
    const productService = inject(ProductService);
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

    return productService.findByState(state).pipe(
        catchError(error => {
            console.error(`Error al cargar servicios con estado ${state}:`, error);
            return of([]);
        })
    );
};

/* Resolver para cargar un servicio específico por código */
export const productByIdResolver: ResolveFn<ProductInterface | null> = (route): Observable<ProductInterface | null> => {
    const productService = inject(ProductService);
    const id = route.paramMap.get('id');

    if (!id) {
        console.warn('Id de producto no especificado');
        return of(null);
    }

    return productService.findById(id).pipe(
        catchError(error => {
            console.error(`Error al cargar producto ${id}:`, error);
            return of(null);
        })
    );
};
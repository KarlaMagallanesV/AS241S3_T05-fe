import { Routes } from "@angular/router";
import { Service } from "./pages/service/service";
import { serviceByCodeResolver, serviceListResolver, servicesByStateResolver } from "./resolvers/service.resolver";

export const routes: Routes = [
    {
        path: '',
        component: Service,
        resolve: {
            services: serviceListResolver  // Precarga todos los servicios
        }
    },
    {
        path: 'state/:state',
        component: Service,
        resolve: {
            services: servicesByStateResolver  // Precarga servicios por estado
        },
        data: { filterMode: 'state' }
    },
    //  Ruta para editar servicio específico
    {
        path: 'edit/:code',
        component: Service,
        resolve: {
            service: serviceByCodeResolver,  // Precarga servicio específico
            services: serviceListResolver     // También precarga la lista
        },
        data: { mode: 'edit' }
    },
// Ruta para crear nuevo servicio
    {
        path: 'new',
        component: Service,
        resolve: {
            services: serviceListResolver
        },
        data: { mode: 'create' }
    }
]
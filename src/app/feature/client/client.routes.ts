import { Routes } from "@angular/router";
import { Client } from "./pages/client/client";
import { clientByIdResolver, clientListResolver } from "./resolvers/client.resolver";
import { ClientForm } from "./components/client-form/client-form";

export const routes: Routes = [
    {
        path: '',
        component: Client,
        resolve: {
            clients: clientListResolver  // Precarga lista de clientes
        }
    },

    {
        path: 'new',
        component: ClientForm,  
        data: { mode: 'create' }
    },
    {
        path: 'edit/:id',
        component: ClientForm,
        resolve: {
            client: clientByIdResolver  // Precarga cliente específico
        },
        data: { mode: 'edit' }
    }
];
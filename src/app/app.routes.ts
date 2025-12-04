import { Routes } from "@angular/router";
import { Home } from "./feature/home/pages/home/home";
import { login } from "./feature/auth/pages/login/login";
import { Sidebar } from "./layout/sidebar/sidebar/sidebar";
import { MainLayout } from "./layout/main-layout/main-layout";
import { authGuard } from "@core/guards/auth-guard";

export const routes: Routes = [
    {
        path: 'auth/login',
        component: login
    },
    {
        path: 'console',
        component: MainLayout,
        canActivate: [authGuard],
        children: [
            {
                path: '',
                component: Home
            },
            {
                path: 'clients',
                loadChildren: () => import('./feature/client/client.routes').then(m => m.routes)
            },
            {
                path: 'billing',
                loadChildren: () => import('./feature/billing/billing.routes').then(m => m.routes)
            },
            {
                path: 'products',
                loadChildren: () => import('./feature/product/product.routes').then(m => m.routes)
            },
            {
                path: 'reports',
                loadChildren: () => import('./feature/report/report.routes').then(m => m.routes)
            },
            {
                path: 'reservations',
                loadChildren: () => import('./feature/reservations/reservations.routes').then(m => m.routes)
            },
            {
                path: 'services',
                loadChildren: () => import('./feature/service/service.routes').then(m => m.routes)
            },
            {
                path: 'suppliers',
                loadChildren: () => import('./feature/supplier/supplier.routes').then(m => m.routes)
            },
            {
                path: 'users',
                loadChildren: () => import('./feature/users/users.routes').then(m => m.routes)
            },
            {
                path: 'employee',
                loadChildren: () => import('./feature/employee/employee.routes').then(m => m.routes)
            }
        ]
    },
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'auth/login'
    }
]
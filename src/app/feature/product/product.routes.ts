import { Routes } from "@angular/router";
import { Product } from "./pages/product/product";
import { productByIdResolver, productListResolver, productsByStateResolver } from "./resolvers/product.resolver";

export const routes: Routes = [
    {
        path: '',
        component: Product
    }
];
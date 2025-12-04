import { Component, Inject, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { LoadingAnimation } from 'app/shared/components/loading-animation/loading-animation';
import { ProductList } from '../../components/product-list/product-list';
import { ProductForm } from '../../components/product-form/product-form';
import { ProductInterface } from '../../interfaces/product';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-product',
  imports: [
    RouterModule,
    FormsModule,
    LoadingAnimation,
    ProductList,
    ProductForm
  ],
  templateUrl: './product.html',
  styleUrl: './product.scss'
})
export class Product implements OnInit{
@ViewChild('productListComponent') productListComponent!: ProductList;
  searchTerm: string = '';
  isSidebarCollapsed = false;

  isLoading = true;
  loadingTime = 3000;

  isBrowser: boolean;

  showForm = false;
  selectedProduct: ProductInterface | undefined = undefined;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private route: ActivatedRoute
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {

    this.route.data.subscribe(data=>{
      if(data['product']) {
        this.selectedProduct = data['product'];
        this.showForm = true;
      }
    })

    if (this.isBrowser) {
      document.body.style.overflow = 'hidden';

      setTimeout(() => {
        this.isLoading = false;
        document.body.style.overflow = 'auto';
      }, this.loadingTime);
    } else {
      this.isLoading = false;
    }
  }

  // Maneja el estado del sidebar
  onSidebarToggle(event: any) {

    this.isSidebarCollapsed = event as boolean;
  }

  onCreateNew(): void {
    this.selectedProduct = undefined;
    this.showForm = true;

    if (this.isBrowser) {
      document.body.style.overflow = 'hidden';
    }
  }

  onFormSaved(): void {
    this.showForm = false;
    this.selectedProduct = undefined;

    if (this.isBrowser) {
      document.body.style.overflow = 'auto';
    }

    this.productListComponent.resetFilters();
    this.productListComponent.loadProducts();
  }

  onSearchChange(): void {
    this.productListComponent.filterBySearch(this.searchTerm);
  }

  onFormCancelled(): void {
    this.showForm = false;
    this.selectedProduct = undefined;

    if (this.isBrowser) {
      document.body.style.overflow = 'auto';
    }
  }

  onModalBackdropClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.classList.contains('modal-overlay')) {
      this.onFormCancelled();
    }
  }

  exportPdf(): void {
    if (this.productListComponent) {
      this.productListComponent.reportPdf();
    }
  }

  clearSearch(): void {
    this.searchTerm = '';
    if (this.productListComponent) {
      this.productListComponent.filterProducts('');
    }
  }
}

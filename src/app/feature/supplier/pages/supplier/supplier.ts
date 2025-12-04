import { Component, Inject, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
import { SupplierList } from '../../components/supplier-list/supplier-list';
import { SupplierInterface } from '../../interfaces/supplier';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoadingAnimation } from 'app/shared/components/loading-animation/loading-animation';
import { SupplierForm } from '../../components/supplier-form/supplier-form';

@Component({
  selector: 'app-supplier',
  imports: [
    RouterModule,
    FormsModule,
    LoadingAnimation,
    SupplierList,
    SupplierForm
  ],
  templateUrl: './supplier.html',
  styleUrl: './supplier.scss'
})
export class Supplier implements OnInit{
@ViewChild('supplierListComponent') supplierListComponent!: SupplierList;
  searchTerm: string = '';
  isSidebarCollapsed = false;

  isLoading = true;
  loadingTime = 3000;

  isBrowser: boolean;

  showForm = false;
  selectedSupplier: SupplierInterface | undefined = undefined;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private route: ActivatedRoute
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {

    this.route.data.subscribe(data=>{
      if(data['supplier']) {
        this.selectedSupplier = data['supplier'];
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
    this.selectedSupplier = undefined;
    this.showForm = true;

    if (this.isBrowser) {
      document.body.style.overflow = 'hidden';
    }
  }

  onFormSaved(): void {
    this.showForm = false;
    this.selectedSupplier = undefined;

    if (this.isBrowser) {
      document.body.style.overflow = 'auto';
    }

    this.supplierListComponent.resetFilters();
    this.supplierListComponent.loadSuppliers();
  }

  onSearchChange(): void {
    this.supplierListComponent.filterBySearch(this.searchTerm);
  }

  onFormCancelled(): void {
    this.showForm = false;
    this.selectedSupplier = undefined;

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
    if (this.supplierListComponent) {
      this.supplierListComponent.reportPdf();
    }
  }

  clearSearch(): void {
    this.searchTerm = '';
    if (this.supplierListComponent) {
      this.supplierListComponent.filterSuppliers('');
    }
  }
}

import { Component, Inject, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ServiceList } from '../../components/service-list/service-list';
import { LoadingAnimation } from 'app/shared/components/loading-animation/loading-animation';
import { ServiceInterface } from '../../interfaces/service';
import { ServiceForm } from '../../components/service-form/service-form';

@Component({
  selector: 'app-service',
  standalone: true,
  imports: [
    RouterModule,
    FormsModule,
    LoadingAnimation,
    ServiceList,
    ServiceForm
],
  templateUrl: './service.html',
  styleUrls: ['./service.scss']
})
export class Service implements OnInit{
  @ViewChild('serviceListComponent') serviceListComponent!: ServiceList;
  searchTerm: string = '';
  isSidebarCollapsed = false;

  isLoading = true;
  loadingTime = 3000;

  isBrowser: boolean;

  showForm = false;
  selectedService: ServiceInterface | undefined = undefined;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private route: ActivatedRoute
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {

    this.route.data.subscribe(data=>{
      if(data['service']) {
        this.selectedService = data['service'];
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
    this.selectedService = undefined;
    this.showForm = true;

    if (this.isBrowser) {
      document.body.style.overflow = 'hidden';
    }
  }

  onFormSaved(): void {
    this.showForm = false;
    this.selectedService = undefined;

    if (this.isBrowser) {
      document.body.style.overflow = 'auto';
    }

    this.serviceListComponent.resetFilters();
    this.serviceListComponent.loadServices();
  }

  onSearchChange(): void {
    this.serviceListComponent.filterBySearch(this.searchTerm);
  }

  onFormCancelled(): void {
    this.showForm = false;
    this.selectedService = undefined;

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
    if (this.serviceListComponent) {
      this.serviceListComponent.reportPdf();
    }
  }

  clearSearch(): void {
    this.searchTerm = '';
    if (this.serviceListComponent) {
      this.serviceListComponent.filterServices('');
    }
  }
}

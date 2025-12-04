import { Component, Inject, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ClientForm } from '../../components/client-form/client-form';
import { ClientList } from '../../components/client-list/client-list';
import { LoadingAnimation } from '../../../../shared/components/loading-animation/loading-animation';
import { Client as ClientInterface } from '../../interfaces/client';

@Component({
  selector: 'app-client',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ClientForm,
    ClientList,
    LoadingAnimation
],
  templateUrl: './client.html',
  styleUrls: ['./client.scss']
})
export class Client implements OnInit {
  @ViewChild('clientListComponent') clientListComponent!: ClientList;

  isSidebarCollapsed = false;
  isLoading = true;
  loadingTime = 3000;
  isBrowser: boolean;
  
  // Control de visibilidad del formulario modal
  showForm = false;
  selectedClient: ClientInterface | undefined = undefined;

  // Variable para el término de búsqueda
  searchTerm: string = '';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private route: ActivatedRoute
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    // Obtener datos del resolver (si existen)
    this.route.data.subscribe(data => {
      if (data['client']) {
        this.selectedClient = data['client'];
        this.showForm = true;
      }
    });

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

  onSidebarToggle(event: any): void {
    this.isSidebarCollapsed = event as boolean;
  }
  
  // Mostrar modal para nuevo cliente
  onCreateNew(): void {
    this.selectedClient = undefined;
    this.showForm = true;
    
    // Bloquear scroll del body cuando el modal está abierto
    if (this.isBrowser) {
      document.body.style.overflow = 'hidden';
    }
  }
  
  // Ocultar modal cuando se guarda
  onFormSaved(): void {
    this.showForm = false;
    this.selectedClient = undefined;
    
    // Restaurar scroll del body
    if (this.isBrowser) {
      document.body.style.overflow = 'auto';
    }
    
    // Recargar la lista de clientes
    if (this.clientListComponent) {
      this.clientListComponent.loadClients();
    }
  }
  
  // Ocultar modal al cancelar
  onFormCancelled(): void {
    this.showForm = false;
    this.selectedClient = undefined;
    
    // Restaurar scroll del body
    if (this.isBrowser) {
      document.body.style.overflow = 'auto';
    }
  }
  
  // Cerrar modal al hacer clic en el fondo
  onModalBackdropClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.classList.contains('modal-overlay')) {
      this.onFormCancelled();
    }
  }
  
  // Exportar PDF
  exportPdf(): void {
    if (this.clientListComponent) {
      this.clientListComponent.reportPdf();
    }
  }

  // Método para ejecutar la búsqueda
  onSearch(): void {
    if (this.clientListComponent) {
      this.clientListComponent.filterClients(this.searchTerm.trim());
    }
  }

  // Método para limpiar la búsqueda
  clearSearch(): void {
    this.searchTerm = '';
    if (this.clientListComponent) {
      this.clientListComponent.filterClients('');
    }
  }
}
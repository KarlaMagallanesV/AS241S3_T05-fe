import { Component, Inject, OnInit, PLATFORM_ID, ViewChild, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReservationsForm } from '../../components/reservations-form/reservations-form';
import { ReservationsList } from '../../components/reservations-list/reservations-list';
import { LoadingAnimation } from '../../../../shared/components/loading-animation/loading-animation';
import { Reservation as ReservationInterface } from '../../interfaces/reservation';
import { ReservationService } from '../../services/reservation.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [
    RouterModule,
    FormsModule,
    ReservationsForm,
    ReservationsList,
    LoadingAnimation
  ],
  templateUrl: './reservations.html',
  styleUrls: ['./reservations.scss']
})
export class Reservations implements OnInit {
  @ViewChild('reservationsListComponent') reservationsListComponent!: ReservationsList;

  isSidebarCollapsed = false;
  isLoading = true;
  loadingTime = 3000;
  isBrowser: boolean;
  
  // Control de visibilidad del formulario modal
  showForm = false;
  selectedReservation: ReservationInterface | undefined = undefined;

  // Variable para el término de búsqueda
  searchTerm: string = '';

  private reservationService = inject(ReservationService);

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private route: ActivatedRoute
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    // Obtener datos del resolver (si existen)
    this.route.data.subscribe(data => {
      if (data['reservation']) {
        this.selectedReservation = data['reservation'];
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
  
  // Mostrar modal para nueva reservación
  onCreateNew(): void {
    this.selectedReservation = undefined;
    this.showForm = true;
    
    // Bloquear scroll del body cuando el modal está abierto
    if (this.isBrowser) {
      document.body.style.overflow = 'hidden';
    }
  }
  
  // Ocultar modal cuando se guarda
  onFormSaved(): void {
    this.showForm = false;
    this.selectedReservation = undefined;
    
    // Restaurar scroll del body
    if (this.isBrowser) {
      document.body.style.overflow = 'auto';
    }
    
    // Recargar la lista de reservaciones
    if (this.reservationsListComponent) {
      this.reservationsListComponent.loadReservations();
    }
  }
  
  // Ocultar modal al cancelar
  onFormCancelled(): void {
    this.showForm = false;
    this.selectedReservation = undefined;
    
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
    if (this.reservationsListComponent) {
      this.reservationsListComponent.reportPdf();
    }
  }

  // Método para ejecutar la búsqueda
  onSearch(): void {
    if (this.reservationsListComponent) {
      this.reservationsListComponent.filterReservations(this.searchTerm.trim());
    }
  }

  // Método para limpiar la búsqueda
  clearSearch(): void {
    this.searchTerm = '';
    if (this.reservationsListComponent) {
      this.reservationsListComponent.filterReservations('');
    }
  }

  // Método para manejar la edición desde las cards
  onEditReservation(reservation: any): void {
    if (!reservation.id) return;

    // Cargar los datos completos de la reservación desde el backend
    this.reservationService.findById(reservation.id).subscribe({
      next: (response: any) => {
        const fullReservation = response.reservation || response;
        
        this.selectedReservation = {
          id: fullReservation.reservationId || fullReservation.id,
          serviceDate: fullReservation.serviceDate,
          serviceDateEnd: fullReservation.serviceDateEnd,
          reservationDate: fullReservation.reservationDate,
          subtotal: fullReservation.subtotal,
          totalPoints: fullReservation.totalPoints,
          status: fullReservation.status,
          clientId: fullReservation.client?.clientId || fullReservation.clientId,
          employeeId: fullReservation.employee?.employeeId || fullReservation.employeeId,
          details: fullReservation.services?.map((service: any) => ({
            id: service.detailId || service.id,
            serviceCode: service.serviceCode,
            status: service.status,
            registrationDate: service.registrationDate
          })) || fullReservation.details
        };
        
        this.showForm = true;
        
        if (this.isBrowser) {
          document.body.style.overflow = 'hidden';
        }
      },
      error: (err) => {
        console.error('Error al cargar reservación:', err);
        Swal.fire({
          title: 'Error',
          text: 'No se pudo cargar la reservación',
          icon: 'error',
          confirmButtonColor: '#80A7A3'
        });
      }
    });
  }
}

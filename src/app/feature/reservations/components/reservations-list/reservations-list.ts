import { Component, OnInit, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservationService } from '../../services/reservation.service';
import { ReservationResponse } from '../../interfaces/reservation';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reservations-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reservations-list.html',
  styleUrls: ['./reservations-list.scss']
})
export class ReservationsList implements OnInit {
  @Output() edit = new EventEmitter<ReservationResponse>();

  reservations: ReservationResponse[] = [];
  filteredReservations: ReservationResponse[] = [];
  searchText = '';
  statusFilter = '';
  sortOrder = '';

  showStatusDropdown: number | null = null;

  availableStatuses = [
    { value: 'P', label: 'Pendiente', icon: 'fa-clock' },
    { value: 'A', label: 'Atendido', icon: 'fa-check-circle' },
    { value: 'R', label: 'Reprogramada', icon: 'fa-calendar-alt' },
    { value: 'N', label: 'No se presentó', icon: 'fa-times-circle' },
    { value: 'F', label: 'Facturado', icon: 'fa-file-invoice-dollar' },
    { value: 'C', label: 'Cancelado', icon: 'fa-ban' }
  ];

  private reservationService = inject(ReservationService);

  ngOnInit(): void {
    this.loadReservations();
  }

  loadReservations(): void {
    this.reservationService.findAll().subscribe({
      next: (reservations: any[]) => {
        console.log('Reservaciones del servidor:', reservations);
        this.reservations = reservations.map(reservation => ({
          id: reservation.reservationId,
          serviceDate: reservation.serviceDate,
          serviceDateEnd: reservation.serviceDateEnd,
          reservationDate: reservation.reservationDate,
          subtotal: reservation.subtotal,
          totalPoints: reservation.totalPoints,
          status: reservation.status,
          clientId: reservation.client?.clientId,
          employeeId: reservation.employee?.employeeId,
          clientName: reservation.client 
            ? `${reservation.client.nameClient} ${reservation.client.lastname}` 
            : undefined,
          employeeName: reservation.employee 
            ? `${reservation.employee.nameEmployee} ${reservation.employee.lastname}` 
            : undefined,
          details: reservation.services?.map((service: any) => ({
            id: service.detailId,
            serviceCode: service.serviceCode,
            status: service.status,
            registrationDate: service.registrationDate
          }))
        })).reverse();
        this.applyFilters();
      },
      error: (err) => {
        console.error('Error al cargar reservaciones:', err);
        this.reservations = [];
        this.applyFilters();
        Swal.fire('Aviso', 'No se pudieron cargar las reservaciones del servidor.', 'info');
      }
    });
  }

  // Filtrar reservaciones por término de búsqueda
  filterReservations(searchTerm: string): void {
    this.searchText = searchTerm.toLowerCase();
    this.applyFilters();
  }

  setStatusFilter(status: string): void {
    this.statusFilter = this.statusFilter === status ? '' : status;
    this.applyFilters();
  }

  setSortOrder(order: string): void {
    this.sortOrder = this.sortOrder === order ? '' : order;
    this.applyFilters();
  }

  resetFilters(): void {
    this.statusFilter = '';
    this.sortOrder = '';
    this.searchText = '';
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredReservations = this.reservations.filter(reservation => {
      // Filtro de estado
      let matchesStatus = true;
      if (this.statusFilter) {
        matchesStatus = reservation.status === this.statusFilter;
      }

      // Filtro de búsqueda por texto
      let matchesSearch = true;
      if (this.searchText) {
        const searchLower = this.searchText.toLowerCase();
        matchesSearch = Boolean(
          reservation.clientName?.toLowerCase().includes(searchLower) ||
          reservation.employeeName?.toLowerCase().includes(searchLower) ||
          reservation.id?.toString().includes(searchLower)
        );
      }
      
      return matchesStatus && matchesSearch;
    });

    // Aplicar ordenamiento
    if (this.sortOrder === 'az') {
      this.filteredReservations.sort((a, b) => 
        (a.clientName || '').localeCompare(b.clientName || '')
      );
    } else if (this.sortOrder === 'za') {
      this.filteredReservations.sort((a, b) => 
        (b.clientName || '').localeCompare(a.clientName || '')
      );
    }

    console.log('Reservaciones filtradas:', this.filteredReservations.length);
    console.log('Filtros activos - Status:', this.statusFilter, 'Search:', this.searchText, 'Sort:', this.sortOrder);
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'P': 'Pendiente',
      'A': 'Atendido',
      'C': 'Cancelado',
      'R': 'Reprogramada',
      'N': 'No se presentó',
      'F': 'Facturado'
    };
    return labels[status] || status;
  }

  toggleStatusDropdown(reservationId: number | undefined, event: Event): void {
    event.stopPropagation();
    this.showStatusDropdown = this.showStatusDropdown === reservationId ? null : reservationId!;
  }

  async changeStatus(reservation: ReservationResponse, newStatus: string, event: Event): Promise<void> {
    event.stopPropagation();
    
    if (newStatus === reservation.status) {
      this.showStatusDropdown = null;
      return;
    }

    const statusLabels: Record<string, string> = {
      'P': 'Pendiente',
      'A': 'Atendido',
      'C': 'Cancelado',
      'R': 'Reprogramada',
      'N': 'No se presentó',
      'F': 'Facturado'
    };

    const result = await Swal.fire({
      title: '¿Cambiar estado?',
      text: `¿Desea cambiar el estado a "${statusLabels[newStatus]}"?`,
      icon: 'question',
      iconColor: '#80A7A3',
      showCancelButton: true,
      confirmButtonText: 'Sí, cambiar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#80A7A3',
      cancelButtonColor: '#F4A1A1'
    });

    if (result.isConfirmed && reservation.id) {
      // Crear el objeto de actualización
      const updateData: any = {
        serviceDate: reservation.serviceDate,
        serviceDateEnd: reservation.serviceDateEnd,
        status: newStatus,
        reservationDate: reservation.reservationDate,
        clientId: reservation.clientId,
        employeeId: reservation.employeeId,
        details: reservation.details?.map(d => ({
          id: d.id,
          serviceCode: d.serviceCode,
          status: d.status,
          registrationDate: d.registrationDate
        }))
      };

      this.reservationService.update(reservation.id, updateData).subscribe({
        next: () => {
          Swal.fire({
            title: '¡Actualizado!',
            text: 'Estado actualizado con éxito',
            icon: 'success',
            confirmButtonColor: '#80A7A3'
          });
          this.loadReservations();
        },
        error: (err) => {
          console.error('Error al actualizar estado:', err);
          Swal.fire({
            title: 'Error',
            text: err.error?.message || 'No se pudo actualizar el estado',
            icon: 'error',
            confirmButtonColor: '#80A7A3'
          });
        }
      });
    }
    
    this.showStatusDropdown = null;
  }

  closeDropdowns(): void {
    this.showStatusDropdown = null;
  }

  viewReservation(reservation: ReservationResponse): void {
    Swal.fire({
      title: `Reservación #${reservation.id}`,
      html: `
        <div style="text-align: left; padding: 10px;">
          <p><strong>Cliente:</strong> ${reservation.clientName || 'ID: ' + reservation.clientId}</p>
          <p><strong>Empleado:</strong> ${reservation.employeeName || 'ID: ' + reservation.employeeId}</p>
          <p><strong>Fecha inicio:</strong> ${new Date(reservation.serviceDate).toLocaleDateString('es-PE')}</p>
          <p><strong>Fecha fin:</strong> ${new Date(reservation.serviceDateEnd).toLocaleDateString('es-PE')}</p>
          <p><strong>Subtotal:</strong> S/. ${reservation.subtotal}</p>
          <p><strong>Puntos:</strong> ${reservation.totalPoints}</p>
          <p><strong>Estado:</strong> ${this.getStatusLabel(reservation.status)}</p>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#80A7A3',
      width: '500px'
    });
  }

  editReservation(reservation: ReservationResponse): void {
    this.edit.emit(reservation);
  }

  reportPdf(): void {
    this.reservationService.generatePdfReport().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reservaciones_${new Date().getTime()}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error al generar PDF:', err);
        Swal.fire({
          title: 'Error',
          text: 'No se pudo generar el PDF',
          icon: 'error',
          confirmButtonColor: '#80A7A3'
        });
      }
    });
  }
}

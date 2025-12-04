import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

import { BillingService } from '../../services/billing.service';
import { BillingResponse } from '../../interfaces/billing';

@Component({
  selector: 'app-billing-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './billing-list.html',
  styleUrls: ['./billing-list.scss']
})
export class BillingList implements OnInit {

  private billingService = inject(BillingService);

  billings: BillingResponse[] = [];
  filteredBillings: BillingResponse[] = [];

  showDetailsModal = false;
  selectedBilling: BillingResponse | null = null;

  searchText = '';
  paymentFilter = '';
  sortOption = '';
  currentPage = 1;
  itemsPerPage = 8;
  paginatedBillings: BillingResponse[] = [];

  ngOnInit(): void {
    this.loadBillings();
  }

  loadBillings(): void {
    this.billingService.findAll().subscribe({
      next: (response: BillingResponse[]) => {
        this.billings = [...response].sort((a, b) =>
          new Date(b.date_pay).getTime() - new Date(a.date_pay).getTime()
        );
        this.applyFilters();
      },
      error: () => {
        Swal.fire('Error', 'No se pudieron cargar las facturas', 'error');
      }
    });
  }

  applySearch(text: string): void {
    this.searchText = text;
    this.applyFilters();
  }

  setPaymentFilter(method: string): void {
    this.paymentFilter = this.paymentFilter === method ? '' : method;
    this.applyFilters();
  }

  setSortOption(option: string): void {
    this.sortOption = this.sortOption === option ? '' : option;
    this.applyFilters();
  }

  resetFilters(): void {
    this.searchText = '';
    this.paymentFilter = '';
    this.sortOption = '';
    this.applyFilters();
  }

  applyFilters(): void {
    const search = this.searchText.toLowerCase().trim();

    this.filteredBillings = this.billings.filter(b => {
      const fullClient =
        `${b.client?.name_client || ''} ${b.client?.lastname || ''}`.toLowerCase();
      const fullUser =
        `${b.user?.name_user || ''} ${b.user?.lastname || ''}`.toLowerCase();

      const matchesSearch =
        !search ||
        b.billingId.toString().includes(search) ||
        fullClient.includes(search) ||
        fullUser.includes(search);

      const method = (b.payment_method || '').toUpperCase();
      const matchesPayment = this.paymentFilter
        ? method === this.paymentFilter.toUpperCase()
        : true;

      return matchesSearch && matchesPayment;
    });

    this.sortFiltered();
    this.currentPage = 1;
    this.updatePaginated();
  }

  sortFiltered(): void {
    switch (this.sortOption) {
      case 'az':
        this.filteredBillings.sort((a, b) =>
          (a.client?.name_client || '').localeCompare(b.client?.name_client || '')
        );
        break;
      case 'za':
        this.filteredBillings.sort((a, b) =>
          (b.client?.name_client || '').localeCompare(a.client?.name_client || '')
        );
        break;
      default:
        break;
    }
  }

  updatePaginated(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedBillings = this.filteredBillings.slice(start, start + this.itemsPerPage);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginated();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginated();
    }
  }

  get totalPages(): number {
    return Math.ceil(this.filteredBillings.length / this.itemsPerPage) || 1;
  }

  downloadPdf(billing: BillingResponse): void {
    Swal.fire('Pendiente', `Aún no has habilitado el PDF para la factura #${billing.billingId}`, 'info');
  }

  openDetailsModal(b: BillingResponse): void {
    this.selectedBilling = b;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.selectedBilling = null;
    this.showDetailsModal = false;
  }

  deactivateBilling(id: number): void {
  Swal.fire({
    title: '¿Desactivar factura?',
    text: 'La factura quedará marcada como ANULADA.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, desactivar',
    cancelButtonText: 'Cancelar'
  }).then(result => {
    if (result.isConfirmed) {
      this.billingService.delete(id).subscribe({
        next: () => {
          Swal.fire('Desactivada', 'La factura fue anulada.', 'success');

          // Actualizar estado local sin recargar todo
          const bill = this.billings.find(b => b.billingId === id);
          if (bill) bill.status = false;

          this.applyFilters();
        },
        error: () => Swal.fire('Error', 'No se pudo desactivar', 'error')
      });
    }
  });
}

restoreBilling(id: number): void {
  Swal.fire({
    title: '¿Activar factura?',
    text: 'La factura volverá a estar disponible.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, activar',
    cancelButtonText: 'Cancelar'
  }).then(result => {
    if (result.isConfirmed) {
      this.billingService.restore(id).subscribe({
        next: () => {
          Swal.fire('Activada', 'La factura fue restaurada.', 'success');

          const bill = this.billings.find(b => b.billingId === id);
          if (bill) bill.status = true;

          this.applyFilters();
        },
        error: () => Swal.fire('Error', 'No se pudo activar', 'error')
      });
    }
  });
}
}

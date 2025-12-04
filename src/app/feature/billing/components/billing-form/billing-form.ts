import { Component, OnInit, inject, Output, EventEmitter } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

import {
  BillingInterface,
  BillingDetailInterface,
  ClientDTO,
  UserDTO,
  ReservationDTO,
} from '../../interfaces/billing';

import { BillingService } from '../../services/billing.service';
import { ClientService } from '../../../client/services/client.service';
import { EmployeeService as UserService } from '../../../employee/services/employee.service';
import { ReservationService } from '../../../reservations/services/reservation.service';
import { ProductService } from '../../../product/services/product.service';

@Component({
  selector: 'app-billing-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './billing-form.html',
  styleUrls: ['./billing-form.scss']
})
export class BillingForm implements OnInit {

  private fb = inject(FormBuilder);
  private billingService = inject(BillingService);
  private clientService = inject(ClientService);
  private userService = inject(UserService);
  private reservationService = inject(ReservationService);
  private productService = inject(ProductService);

  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  form!: FormGroup;

  clients: ClientDTO[] = [];
  users: UserDTO[] = [];
  reservations: ReservationDTO[] = [];
  products: any[] = [];

  filteredClients: ClientDTO[] = [];
  filteredUsers: UserDTO[] = [];
  filteredReservations: ReservationDTO[] = [];
  filteredProducts: any[] = [];

  selectedClient: ClientDTO | null = null;
  selectedUser: UserDTO | null = null;
  selectedReservation: ReservationDTO | null = null;

  clientSearch = '';
  userSearch = '';
  reservationSearch = '';
  productSearch = '';

  showClientModal = false;
  showUserModal = false;
  showReservationModal = false;
  showProductModal = false;

  ngOnInit(): void {
    this.initForm();
    this.loadClients();
    this.loadUsers();
    this.loadReservations();
    this.loadProducts();
  }

  private initForm(): void {
    this.form = this.fb.group({
      paymentMethod: ['', Validators.required],
      clientId: [null, Validators.required],
      userId: [null, Validators.required],
      reservationId: [null],
      details: this.fb.array([])
    });
  }

  get details(): FormArray {
    return this.form.get('details') as FormArray;
  }

  get detailsFormGroups(): FormGroup[] {
    return this.details.controls as FormGroup[];
  }

  loadClients(): void {
    this.clientService.findByStatus('A').subscribe({
      next: (clients: any[]) => {
        this.clients = clients.map(c => ({
          clientId: c.id,
          name_client: c.nameClient,
          lastname: c.lastname,
          number_document: c.document,
          type_document: c.typeDocument
        }));
        this.filteredClients = this.clients;
      }
    });
  }

  loadUsers(): void {
    this.userService.getEmployees().subscribe({
      next: (users: any[]) => {
        this.users = users.map(u => ({
          userId: u.id,
          name_user: u.nameEmployee,
          lastname: u.lastname
        }));
        this.filteredUsers = this.users;
      }
    });
  }

  loadReservations(): void {
    this.reservationService.findAll().subscribe({
      next: (reservations: any[]) => {
        this.reservations = reservations.map(r => ({
          reservationId: r.reservationId,
          service_date: r.serviceDate,
          subtotal: r.subtotal,
          clientId: r.client.id
        }));
        this.filteredReservations = this.reservations;
        console.log("RESERVAS RECIBIDAS =>", reservations);
      }
    });
  }

  loadProducts(): void {
    this.productService.findAll().subscribe({
      next: (resp: any) => {
        const allProducts = resp.data || [];

        this.products = allProducts.filter((p: any) => p.stock > 1);
        this.filteredProducts = this.products;
      },
      error: (e) => console.error('Error cargando productos', e)
    });
  }

  filterClients(): void {
    const term = this.clientSearch.toLowerCase();
    this.filteredClients = this.clients.filter(c =>
      `${c.name_client} ${c.lastname}`.toLowerCase().includes(term)
    );
  }

  filterUsers(): void {
    const term = this.userSearch.toLowerCase();
    this.filteredUsers = this.users.filter(u =>
      `${u.name_user} ${u.lastname}`.toLowerCase().includes(term)
    );
  }

  filterReservations(): void {
  if (!this.selectedClient) {
    this.filteredReservations = [];
    return;
  }

  const term = this.reservationSearch.toLowerCase();

  this.filteredReservations = this.reservations
    .filter(r => r.clientId === this.selectedClient!.clientId)
    .filter(r => `${r.reservationId}`.includes(term));
}



  filterProducts(): void {
    const term = this.productSearch.toLowerCase();
    this.filteredProducts = this.products.filter(p =>
      (p.name_product || '').toLowerCase().includes(term)
    );
  }

  openClientModal(): void { this.showClientModal = true; }
  closeClientModal(): void { this.showClientModal = false; }

  openUserModal(): void { this.showUserModal = true; }
  closeUserModal(): void { this.showUserModal = false; }

  openReservationModal(): void {
    if (!this.selectedClient) {
      Swal.fire("Seleccione cliente", "Debe elegir un cliente antes de ver reservas", "warning");
      return;
    }

    this.reservationSearch = '';

    this.filteredReservations = this.reservations.filter(
      r => r.clientId === this.selectedClient!.clientId
    );

    this.showReservationModal = true;
  }

  closeReservationModal(): void { this.showReservationModal = false; }

  openProductModal(): void { this.showProductModal = true; }
  closeProductModal(): void { this.showProductModal = false; }

  selectClient(c: ClientDTO): void {
    this.selectedClient = c;
    this.form.patchValue({ clientId: c.clientId });
    this.reservationSearch = '';
    this.filteredReservations = this.reservations.filter(r => r.clientId === c.clientId);
    this.closeClientModal();
  }

  clearClient(): void {
    this.selectedClient = null;
    this.form.patchValue({ clientId: null });
    this.selectedReservation = null;
    this.form.patchValue({ reservationId: null });
    this.filteredReservations = [];
  }

  selectUser(u: UserDTO): void {
    this.selectedUser = u;
    this.reservationSearch = '';
    this.form.patchValue({ userId: u.userId });
    this.closeUserModal();
  }

  clearUser(): void {
    this.selectedUser = null;
    this.form.patchValue({ userId: null });
  }

  selectReservation(r: ReservationDTO): void {
    this.selectedReservation = r;
    this.form.patchValue({ reservationId: r.reservationId });
    this.closeReservationModal();
  }

  clearReservation(): void {
    this.selectedReservation = null;
    this.form.patchValue({ reservationId: null });
  }

  selectProduct(p: any): void {

    const detailForm = this.fb.group({
      productId: [p.id, Validators.required],
      name: [p.name_product],
      price: [p.sale_price],
      stock: [p.stock],
      amount: [1, [
        Validators.required,
        Validators.min(1),
        Validators.max(p.stock)
      ]],
      subtotal: [p.sale_price]
    });

    detailForm.get('amount')?.valueChanges.subscribe(amount => {
      const cant = Number(amount) || 0;

      if (cant > p.stock) {
        detailForm.patchValue({ amount: p.stock }, { emitEvent: false });
      }

      const price = Number(detailForm.get('price')?.value) || 0;
      detailForm.patchValue(
        { subtotal: cant * price },
        { emitEvent: false }
      );
    });

    this.details.push(detailForm);
    this.closeProductModal();
  }

  removeDetail(i: number): void {
    this.details.removeAt(i);
  }

  async onSubmit(): Promise<void> {
    if (!this.selectedReservation && this.details.length === 0) {
      Swal.fire('Error', 'Debe agregar un producto o seleccionar una reserva', 'error');
      return;
    }

    if (this.form.invalid) {
      Swal.fire('Error', 'Complete los campos obligatorios', 'error');
      return;
    }

    const confirm = await Swal.fire({
      title: '¿Registrar factura?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Registrar'
    });

    if (!confirm.isConfirmed) return;

    const formData = this.form.getRawValue();

    const details: BillingDetailInterface[] = formData.details.map((d: any) => ({
      product_id: d.productId,
      amount: d.amount
    }));

    const billing: BillingInterface = {
      payment_method: formData.paymentMethod,
      user_id: formData.userId,
      client_id: formData.clientId,
      reservation_id: formData.reservationId,
      billingDetail: details
    };

    this.billingService.save(billing).subscribe({
      next: () => {
        Swal.fire('Éxito', 'Factura registrada', 'success');
        this.saved.emit();
        this.form.reset();
        this.details.clear();
        this.selectedClient = null;
        this.selectedUser = null;
        this.selectedReservation = null;
      },
      error: (e) => {
        Swal.fire('Error', 'No se pudo registrar', 'error');
        console.error(e);
      }
    });
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}

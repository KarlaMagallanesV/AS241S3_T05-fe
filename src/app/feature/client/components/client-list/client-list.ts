import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ClientService } from '../../services/client.service';
import { Client } from '../../interfaces/client';
import Swal from 'sweetalert2';

interface Ubigeo {
  code: string;
  department: string;
  province: string;
  district: string;
}

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './client-list.html',
  styleUrls: ['./client-list.scss']
})
export class ClientList implements OnInit {
  clients: Client[] = [];
  filteredClients: Client[] = [];
  paginatedClients: Client[] = [];

  frequencyFilter = '';
  statusFilter = '';
  birthdayMonthFilter = '';
  sortOrder = '';
  searchText = ''; // Nueva propiedad para almacenar el término de búsqueda

  currentPage = 1;
  itemsPerPage = 8;

  showModal = false;
  showBirthdayDropdown = false;
  isViewMode = false;
  selectedClient: Client | null = null;
  highlightedClientId: number | null = null;

  clientForm!: FormGroup;

  months = [
    { value: '1', label: 'Enero' },
    { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' },
    { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' }
  ];

  ubigeos: Ubigeo[] = [
    { code: '150501', department: 'Lima', province: 'Cañete', district: 'San Vicente de Cañete' },
    { code: '150502', department: 'Lima', province: 'Cañete', district: 'Asia' },
    { code: '150503', department: 'Lima', province: 'Cañete', district: 'Calango' },
    { code: '150504', department: 'Lima', province: 'Cañete', district: 'Cerro Azul' },
    { code: '150505', department: 'Lima', province: 'Cañete', district: 'Chilca' },
    { code: '150506', department: 'Lima', province: 'Cañete', district: 'Coayllo' },
    { code: '150507', department: 'Lima', province: 'Cañete', district: 'Imperial' },
    { code: '150508', department: 'Lima', province: 'Cañete', district: 'Lunahuaná' },
    { code: '150509', department: 'Lima', province: 'Cañete', district: 'Mala' },
    { code: '150510', department: 'Lima', province: 'Cañete', district: 'Nuevo Imperial' },
    { code: '150511', department: 'Lima', province: 'Cañete', district: 'Pacarán' },
    { code: '150512', department: 'Lima', province: 'Cañete', district: 'Quilmana' },
    { code: '150513', department: 'Lima', province: 'Cañete', district: 'San Antonio' },
    { code: '150514', department: 'Lima', province: 'Cañete', district: 'San Luis' },
    { code: '150515', department: 'Lima', province: 'Cañete', district: 'Santa Cruz de Flores' },
    { code: '150516', department: 'Lima', province: 'Cañete', district: 'Zúñiga' }
  ];

  private router = inject(Router);
  private clientService = inject(ClientService);
  private fb = inject(FormBuilder);
  private platformId = inject(PLATFORM_ID);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.birthday-filter')) {
      this.showBirthdayDropdown = false;
    }
  }

  ngOnInit(): void {
    this.loadClients();
    this.initForm();
  }

  initForm(): void {
    this.clientForm = this.fb.group({
      id: [null],
      typeDocument: ['', Validators.required],
      numberDocument: ['', Validators.required],
      nameClient: ['', Validators.required],
      lastname: ['', Validators.required],
      birthday: ['', Validators.required],
      visitFrequency: ['', Validators.required],
      cellphone: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]],
      email: ['', [Validators.required, Validators.email]],
      ubigeoCode: ['', Validators.required],
      registrationDate: [''],
      status: [''],
      points: [0],
      imageUrl: ['']
    });
  }

  getDistrictName(ubigeoCode: string): string {
    const ubigeo = this.ubigeos.find(u => u.code === ubigeoCode);
    return ubigeo ? ubigeo.district : ubigeoCode;
  }

  getFrequencyLabel(frequency: string): string {
    const labels: Record<string, string> = {
      'N': 'Cliente Nuevo',
      'F': 'Cliente Fiel',
      'O': 'Cliente Ocasional',
      'H': 'Cliente Habitual'
    };
    return labels[frequency] || frequency;
  }

  loadClients(): void {
    this.clientService.findAll().subscribe({
      next: (response) => {
        console.log('Clientes del servidor:', response);
        this.clients = [...response].reverse();
        this.applyFilters();
      },
      error: () => {
        // Datos de prueba
        this.clients = [
          {
            id: 1,
            imageUrl: 'https://i.pinimg.com/736x/bb/65/bd/bb65bdeab14fcb2e332edcdfae569465.jpg',
            typeDocument: 'DNI',
            numberDocument: 61024352,
            nameClient: 'Isabel María',
            lastname: 'Vicente Meza',
            birthday: new Date(2007, 2, 8),
            cellphone: 999888777,
            email: 'isabel.meza@example.com',
            registrationDate: new Date(2024, 10, 5),
            ubigeoCode: '150501',
            status: 'A',
            visitFrequency: 'F',
            points: 100
          },
          {
            id: 2,
            imageUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
            typeDocument: 'DNI',
            numberDocument: 61025352,
            nameClient: 'Juan Ignacio',
            lastname: 'Martinez González',
            birthday: new Date(2007, 2, 8),
            cellphone: 999999999,
            email: 'juan.martinez@example.com',
            registrationDate: new Date(2024, 6, 14),
            ubigeoCode: '150507',
            status: 'I',
            visitFrequency: 'N',
            points: 50
          },
          {
            id: 3,
            imageUrl: 'https://randomuser.me/api/portraits/women/45.jpg',
            typeDocument: 'DNI',
            numberDocument: 61334352,
            nameClient: 'Camila Andrea',
            lastname: 'Ruiz Mendoza',
            birthday: new Date(2007, 2, 8),
            cellphone: 963258741,
            email: 'camila.ruiz@example.com',
            registrationDate: new Date(2024, 8, 20),
            ubigeoCode: '150502',
            status: 'A',
            visitFrequency: 'H',
            points: 250
          }
        ];
        this.applyFilters();
        Swal.fire('Aviso', 'No se pudieron cargar los clientes del servidor. Mostrando datos de prueba.', 'info');
      }
    });
  }

  // NUEVO MÉTODO: Filtrar clientes por término de búsqueda
  filterClients(searchTerm: string): void {
    this.searchText = searchTerm.toLowerCase();
    this.applyFilters();
  }

  setFrequencyFilter(frequency: string): void {
    this.frequencyFilter = this.frequencyFilter === frequency ? '' : frequency;
    this.applyFilters();
  }

  toggleStatusFilter(status: string): void {
    this.statusFilter = this.statusFilter === status ? '' : status;
    this.applyFilters();
  }

  setSortOrder(order: string): void {
    this.sortOrder = this.sortOrder === order ? '' : order;
    this.applyFilters();
  }

  toggleBirthdayFilter(): void {
    this.showBirthdayDropdown = !this.showBirthdayDropdown;
  }

  selectMonth(month: string): void {
    this.birthdayMonthFilter = this.birthdayMonthFilter === month ? '' : month;
    this.showBirthdayDropdown = false;
    this.applyFilters();
  }

  resetFilters(): void {
    this.frequencyFilter = '';
    this.statusFilter = '';
    this.birthdayMonthFilter = '';
    this.sortOrder = '';
    this.searchText = ''; // Limpiar también el término de búsqueda
    this.showBirthdayDropdown = false;
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredClients = this.clients.filter(client => {
      // Filtro de frecuencia
      const matchesFrequency = !this.frequencyFilter || client.visitFrequency === this.frequencyFilter;
      
      // Filtro de estado
      let matchesStatus = true;
      if (this.statusFilter) {
        matchesStatus = client.status === this.statusFilter;
      }
      
      // Filtro de cumpleaños
      const matchesBirthday = !this.birthdayMonthFilter ||
        (new Date(client.birthday).getMonth() + 1).toString() === this.birthdayMonthFilter;
      
      // NUEVO: Filtro de búsqueda por texto
      let matchesSearch = true;
      if (this.searchText) {
        const searchLower = this.searchText.toLowerCase();
        matchesSearch = Boolean(
          client.nameClient.toLowerCase().includes(searchLower) ||
          client.lastname.toLowerCase().includes(searchLower) ||
          client.numberDocument.toString().includes(searchLower) ||
          client.cellphone.toString().includes(searchLower) ||
          (client.email && client.email.toLowerCase().includes(searchLower))
        );
      }
      
      return matchesFrequency && matchesStatus && matchesBirthday && matchesSearch;
    });

    // Aplicar ordenamiento
    if (this.sortOrder === 'az') {
      this.filteredClients.sort((a, b) => a.nameClient.localeCompare(b.nameClient));
    } else if (this.sortOrder === 'za') {
      this.filteredClients.sort((a, b) => b.nameClient.localeCompare(a.nameClient));
    }

    this.currentPage = 1;
    this.updatePaginatedClients();
  }

  updatePaginatedClients(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedClients = this.filteredClients.slice(start, start + this.itemsPerPage);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedClients();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedClients();
    }
  }

  get totalPages(): number {
    return Math.ceil(this.filteredClients.length / this.itemsPerPage) || 1;
  }

  getPageInfo(): string {
    if (this.filteredClients.length === 0) {
      return '0 to 0 of 0';
    }
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(start + this.itemsPerPage - 1, this.filteredClients.length);
    return `${start} to ${end} of ${this.filteredClients.length}`;
  }

  openModal(client: Client, viewOnly: boolean = false): void {
    this.selectedClient = client;
    this.isViewMode = viewOnly;
    
    const formattedClient = {
      ...client,
      birthday: client.birthday ? this.formatDateForInput(client.birthday) : '',
      registrationDate: client.registrationDate ? this.formatDateForInput(client.registrationDate) : ''
    };
    
    this.clientForm.patchValue(formattedClient);
    
    if (viewOnly) {
      this.clientForm.disable();
    } else {
      this.clientForm.enable();
      this.clientForm.get('typeDocument')?.disable();
      this.clientForm.get('numberDocument')?.disable();
      this.clientForm.get('registrationDate')?.disable();
      this.clientForm.get('status')?.disable();
    }
    
    this.showModal = true;

    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'hidden';
    }
  }

  private formatDateForInput(date: Date | string | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  closeModal(event?: Event): void {
    if (event) {
      const target = event.target as HTMLElement;
      if (!target.classList.contains('modal') && !target.classList.contains('close-btn')) {
        return;
      }
    }
    
    this.showModal = false;
    this.clientForm.reset();
    this.clientForm.enable();
    this.isViewMode = false;
    this.selectedClient = null;

    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'auto';
    }
  }

  viewClient(client: Client): void {
    this.openModal(client, true);
  }

  editClient(client: Client): void {
    this.openModal(client, false);
  }

  saveChanges(): void {
    if (this.isViewMode) return;

    if (this.clientForm.invalid) {
      Swal.fire({
        title: 'Atención',
        text: 'Completa todos los campos correctamente.',
        icon: 'warning',
        iconColor: '#80A7A3',
        confirmButtonColor: '#FED4C6',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    const formValue = this.clientForm.getRawValue();
    const updatedClient: Client = {
      ...formValue,
      id: this.selectedClient?.id
    };

    this.clientService.update(updatedClient.id!, updatedClient).subscribe({
      next: () => {
        Swal.fire({
          title: '¡Éxito!',
          text: 'Cliente actualizado correctamente.',
          icon: 'success',
          iconColor: '#FED4C6',
          confirmButtonColor: '#80A7A3',
          confirmButtonText: 'Aceptar'
        });
        this.closeModal();
        this.loadClientsAndJumpTo(updatedClient.id!);
      },
      error: () => {
        Swal.fire({
          title: 'Error',
          text: 'No se pudo actualizar el cliente',
          icon: 'error',
          iconColor: '#80A7A3',
          confirmButtonColor: '#FED4C6',
          confirmButtonText: 'Cerrar'
        });
      }
    });
  }

  toggleStatus(client: Client): void {
    if (!client.id) return;

    const isActive = client.status?.toUpperCase() === 'A';
    const action = isActive ? 'desactivar' : 'activar';
    const actionDone = isActive ? 'desactivado' : 'activado';

    Swal.fire({
      title: `¿Deseas ${action} al cliente?`,
      icon: 'question',
      iconColor: '#80A7A3',
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#80A7A3',
      cancelButtonColor: '#FED4C6'
    }).then(result => {
      if (result.isConfirmed) {
        const toggleAction = isActive
          ? this.clientService.delete(client.id!)
          : this.clientService.restore(client.id!);

        toggleAction.subscribe({
          next: () => {
            Swal.fire('¡Éxito!', `Cliente ${actionDone}.`, 'success');
            this.loadClientsAndJumpTo(client.id!);
            this.highlightedClientId = client.id!;
            setTimeout(() => this.highlightedClientId = null, 4000);
          },
          error: () => {
            Swal.fire('Error', 'No se pudo cambiar el estado del cliente', 'error');
          }
        });
      }
    });
  }

  private loadClientsAndJumpTo(id: number): void {
    this.clientService.findAll().subscribe({
      next: (clients) => {
        this.clients = [...clients].reverse();
        this.applyFilters();
        const index = this.filteredClients.findIndex(c => c.id === id);
        if (index !== -1) {
          this.currentPage = Math.floor(index / this.itemsPerPage) + 1;
          this.updatePaginatedClients();
        }
      },
      error: () => Swal.fire('Error', 'No se pudieron cargar los clientes', 'error')
    });
  }

  reportPdf(): void {
    this.clientService.reportPdf().subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'reporte_clientes.pdf';
      link.click();
      URL.revokeObjectURL(url);
    });
  }
}
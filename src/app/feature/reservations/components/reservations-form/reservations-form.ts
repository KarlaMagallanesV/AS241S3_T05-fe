import { Component, inject, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReservationService } from '../../services/reservation.service';
import { EmployeeService } from '../../../employee/services/employee.service';
import { ClientService } from '../../../client/services/client.service';
import { ServiceService } from '../../../service/services/service.service';
import { Employee } from '../../../employee/interfaces/employee';
import { Client } from '../../../client/interfaces/client';
import { ServiceInterface } from '../../../service/interfaces/service';
import { Reservation } from '../../interfaces/reservation';
import Swal from 'sweetalert2/dist/sweetalert2.js';

@Component({
  selector: 'app-reservations-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './reservations-form.html',
  styleUrls: ['./reservations-form.scss']
})
export class ReservationsForm implements OnInit {
  private reservationService = inject(ReservationService);
  private employeeService = inject(EmployeeService);
  private clientService = inject(ClientService);
  private serviceService = inject(ServiceService);
  private fb = inject(FormBuilder);

  @Input() reservation?: Reservation;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  form!: FormGroup;
  minDate: string = '';
  originalServiceDate?: string;

  employees: Employee[] = [];
  clients: Client[] = [];
  services: ServiceInterface[] = [];
  
  // Estados disponibles (sin Cancelado - ese se maneja con el botón de cancelar)
  availableStatuses = [
    { value: 'P', label: 'Pendiente' },
    { value: 'A', label: 'Atendido' },
    { value: 'R', label: 'Reprogramada' },
    { value: 'N', label: 'No se presentó' },
    { value: 'F', label: 'Facturado' }
  ];
  
  isReservationCancelled = false;

  filteredEmployees: Employee[] = [];
  filteredClients: Client[] = [];
  filteredServices: ServiceInterface[] = [];

  selectedEmployee: Employee | null = null;
  selectedClient: Client | null = null;
  selectedServices: ServiceInterface[] = [];

  employeeSearch = '';
  clientSearch = '';
  serviceSearch = '';

  showEmployeeModal = false;
  showClientModal = false;
  showServiceModal = false;

  ngOnInit(): void {
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
    
    this.initForm();
    this.loadServices();
    this.loadEmployees();
    this.loadClients();

    if (this.reservation) {
      this.loadReservationData();
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      clientId: [null, Validators.required],
      employeeId: [null, Validators.required],
      serviceDate: ['', Validators.required],
      serviceDateEnd: ['', Validators.required],
      status: ['P', Validators.required],
      subtotal: [0, [Validators.required, Validators.min(0)]],
      totalPoints: [0, Validators.min(0)]
    });
    
    // Detectar cambios en la fecha para marcar como reprogramada
    this.form.get('serviceDate')?.valueChanges.subscribe(newDate => {
      this.checkDateChange(newDate);
    });
  }
  
  private checkDateChange(newDate: string): void {
    // Solo aplicar si estamos editando y la fecha original existe
    if (this.reservation && this.originalServiceDate && newDate) {
      if (newDate !== this.originalServiceDate) {
        // Si la fecha cambió, marcar como reprogramada automáticamente
        this.form.patchValue({ status: 'R' }, { emitEvent: false });
      }
    }
  }

  loadServices(): void {
    this.serviceService.findAll().subscribe({
      next: (response: any) => {
        // Manejar si la respuesta es un array o un objeto
        let servicesArray: ServiceInterface[] = [];
        
        if (Array.isArray(response)) {
          servicesArray = response;
        } else if (response && response.services) {
          servicesArray = response.services;
        } else if (response && response.data) {
          servicesArray = response.data;
        }
        
        // Filtrar solo servicios activos (status = true)
        this.services = servicesArray.filter(s => s.status === true);
        this.filteredServices = this.services;
      },
      error: (err) => {
        console.error('Error al cargar servicios:', err);
        this.services = [];
        this.filteredServices = [];
      }
    });
  }

  loadEmployees(): void {
    this.employeeService.getEmployeesByStatus('A').subscribe({
      next: (employees) => {
        this.employees = employees;
        this.filteredEmployees = employees;
      },
      error: (err) => console.error('Error al cargar empleados:', err)
    });
  }

  loadClients(): void {
    this.clientService.findByStatus('A').subscribe({
      next: (clients: Client[]) => {
        this.clients = clients;
        this.filteredClients = clients;
      },
      error: (err: any) => console.error('Error al cargar clientes:', err)
    });
  }

  loadReservationData(): void {
    if (!this.reservation) return;
    
    // Verificar si la reservación está cancelada
    this.isReservationCancelled = this.reservation.status === 'C';
    
    // Cargar cliente seleccionado
    if (this.reservation?.clientId) {
      const client = this.clients.find(c => c.id === this.reservation?.clientId);
      if (client) {
        this.selectedClient = client;
        this.form.patchValue({ clientId: client.id });
      } else {
        // Si no está en la lista (puede estar inactivo), cargar desde backend
        this.clientService.findById(this.reservation.clientId).subscribe({
          next: (clientData: any) => {
            console.log('Cliente del backend:', clientData);
            // El backend puede devolver el cliente directamente o en una propiedad
            const client = clientData.client || clientData;
            this.selectedClient = client;
            this.form.patchValue({ clientId: client.id || client.clientId });
          },
          error: (err) => console.error('Error al cargar cliente:', err)
        });
      }
    }
    
    // Cargar empleado seleccionado
    if (this.reservation?.employeeId) {
      const employee = this.employees.find(e => e.id === this.reservation?.employeeId);
      if (employee) {
        this.selectedEmployee = employee;
        this.form.patchValue({ employeeId: employee.id });
      } else {
        // Si no está en la lista (puede estar inactivo), cargar desde backend
        this.employeeService.getEmployeeById(this.reservation.employeeId).subscribe({
          next: (response) => {
            this.selectedEmployee = response.employee!;
            this.form.patchValue({ employeeId: response.employee!.id });
          },
          error: (err) => console.error('Error al cargar empleado:', err)
        });
      }
    }
    
    // Cargar servicios seleccionados
    if (this.reservation.details && this.reservation.details.length > 0) {
      const serviceCodes = this.reservation.details.map(d => d.serviceCode);
      
      // Esperar a que se carguen los servicios
      const checkServices = setInterval(() => {
        if (this.services.length > 0) {
          clearInterval(checkServices);
          this.selectedServices = this.services.filter(s => 
            serviceCodes.includes(s.code)
          );
          this.updateSubtotalAndPoints();
        }
      }, 100);
    }
    
    // Cargar fechas y estado
    this.originalServiceDate = this.reservation.serviceDate as string;
    this.form.patchValue({
      serviceDate: this.reservation.serviceDate,
      serviceDateEnd: this.reservation.serviceDateEnd,
      status: this.reservation.status || 'P',
      subtotal: this.reservation.subtotal,
      totalPoints: this.reservation.totalPoints
    });
  }

  openEmployeeModal(): void {
    this.showEmployeeModal = true;
    this.employeeSearch = '';
    this.filteredEmployees = this.employees;
  }

  closeEmployeeModal(): void {
    this.showEmployeeModal = false;
  }

  openClientModal(): void {
    this.showClientModal = true;
    this.clientSearch = '';
    this.filteredClients = this.clients;
  }

  closeClientModal(): void {
    this.showClientModal = false;
  }

  openServiceModal(): void {
    this.showServiceModal = true;
    this.serviceSearch = '';
    this.filteredServices = this.services;
  }

  closeServiceModal(): void {
    this.showServiceModal = false;
  }

  filterEmployees(): void {
    const search = this.employeeSearch.toLowerCase();
    this.filteredEmployees = this.employees.filter(emp =>
      `${emp.nameEmployee} ${emp.lastname}`.toLowerCase().includes(search)
    );
  }

  filterClients(): void {
    const search = this.clientSearch.toLowerCase();
    this.filteredClients = this.clients.filter(client =>
      `${client.nameClient} ${client.lastname}`.toLowerCase().includes(search)
    );
  }

  filterServices(): void {
    const search = this.serviceSearch.toLowerCase();
    this.filteredServices = this.services.filter(service =>
      service.name_service.toLowerCase().includes(search) || service.code.toLowerCase().includes(search)
    );
  }

  selectEmployee(employee: Employee): void {
    this.selectedEmployee = employee;
    this.form.patchValue({ employeeId: employee.id });
    this.closeEmployeeModal();
  }

  selectClient(client: Client): void {
    this.selectedClient = client;
    this.form.patchValue({ clientId: client.id });
    this.closeClientModal();
  }

  selectService(service: ServiceInterface): void {
    if (!this.selectedServices.find(s => s.code === service.code)) {
      this.selectedServices.push(service);
      this.updateSubtotalAndPoints();
    }
    this.closeServiceModal();
  }

  removeService(index: number): void {
    this.selectedServices.splice(index, 1);
    this.updateSubtotalAndPoints();
  }

  updateSubtotalAndPoints(): void {
    const subtotal = this.selectedServices.reduce((sum, service) => sum + service.price, 0);
    const totalPoints = this.selectedServices.reduce((sum, service) => sum + service.points, 0);
    this.form.patchValue({ 
      subtotal,
      totalPoints 
    });
  }

  clearEmployee(): void {
    this.selectedEmployee = null;
    this.form.patchValue({ employeeId: null });
  }

  clearClient(): void {
    this.selectedClient = null;
    this.form.patchValue({ clientId: null });
  }

  async onSubmit(): Promise<void> {
    // Validar si la reservación está cancelada
    if (this.reservation && this.isReservationCancelled) {
      Swal.fire({
        title: 'Reservación Cancelada',
        text: 'No se puede editar una reservación cancelada. Debe restaurarla primero.',
        icon: 'warning',
        confirmButtonColor: '#80A7A3',
        customClass: { container: 'swal-on-modal' }
      });
      return;
    }
    
    if (this.form.invalid || this.selectedServices.length === 0) {
      if (this.selectedServices.length === 0) {
        Swal.fire({
          title: 'Error',
          text: 'Debe agregar al menos un servicio',
          icon: 'error',
          confirmButtonColor: '#80A7A3',
          customClass: { container: 'swal-on-modal' }
        });
        return;
      }
      this.markAllAsTouched();
      return;
    }

    const result = await Swal.fire({
      title: this.reservation ? '¿Guardar cambios?' : '¿Crear reservación?',
      icon: 'question',
      iconColor: '#80A7A3',
      showCancelButton: true,
      confirmButtonText: this.reservation ? 'Guardar' : 'Crear',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#80A7A3',
      cancelButtonColor: '#F4A1A1',
      customClass: { container: 'swal-on-modal' }
    });

    if (result.isConfirmed) {
      const formData = this.form.getRawValue();
      
      let reservationData: any;
      
      if (this.reservation?.id) {
        // Para EDITAR: Crear un mapa de servicios seleccionados para búsqueda rápida
        const selectedServiceCodes = new Set(this.selectedServices.map(s => s.code));
        
        // Mantener los detalles existentes que siguen seleccionados
        const detailsToSend = this.selectedServices.map((service) => {
          // Buscar si este servicio ya existía en los detalles originales
          const existingDetail = this.reservation?.details?.find(d => d.serviceCode === service.code);
          
          if (existingDetail) {
            // Si existe, mantener su ID y datos originales
            return {
              id: existingDetail.id,
              serviceCode: existingDetail.serviceCode,
              status: existingDetail.status || 'A',
              registrationDate: existingDetail.registrationDate
            };
          } else {
            // Si es nuevo, solo enviar el código (el backend creará un nuevo detalle)
            return {
              serviceCode: service.code,
              status: 'A'
            };
          }
        });
        
        // NO enviar subtotal ni totalPoints - dejar que el backend los calcule
        reservationData = {
          serviceDate: formData.serviceDate,
          serviceDateEnd: formData.serviceDateEnd,
          status: formData.status,
          reservationDate: this.reservation.reservationDate,
          clientId: formData.clientId,
          employeeId: formData.employeeId,
          details: detailsToSend
        };
        
        console.log('=== EDITANDO RESERVACIÓN ===');
        console.log('ID de reservación:', this.reservation.id);
        console.log('Estado original:', this.reservation.status);
        console.log('Estado a enviar:', formData.status);
        console.log('Servicios seleccionados:', this.selectedServices);
        console.log('Datos completos a enviar:', reservationData);
        
        this.reservationService.update(this.reservation.id, reservationData).subscribe({
          next: (response) => {
            console.log('✅ Respuesta exitosa del servidor:', response);
            this.handleSuccess('¡Actualizado!', 'Reservación actualizada con éxito');
          },
          error: (err) => {
            console.error('❌ Error al actualizar:', err);
            console.error('Status:', err.status);
            console.error('Error completo:', err.error);
            this.handleError(err);
          }
        });
      } else {
        // Para CREAR: solo serviceCode
        reservationData = {
          serviceDate: formData.serviceDate,
          serviceDateEnd: formData.serviceDateEnd,
          clientId: formData.clientId,
          employeeId: formData.employeeId,
          details: this.selectedServices.map(service => ({
            serviceCode: service.code
          }))
        };
        
        this.reservationService.save(reservationData).subscribe({
          next: () => this.handleSuccess('¡Creado!', 'Reservación creada con éxito'),
          error: (err) => this.handleError(err)
        });
      }
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  private handleSuccess(title: string, text: string): void {
    Swal.fire({
      title, text, icon: 'success',
      confirmButtonColor: '#80A7A3',
      customClass: { container: 'swal-on-modal' }
    }).then(() => {
      this.saved.emit();
      this.form.reset();
      this.initForm();
      this.selectedEmployee = null;
      this.selectedClient = null;
      this.selectedServices = [];
    });
  }

  private handleError(err: any): void {
    console.error('Error:', err);
    
    let errorMessage = 'No se pudo completar la operación';
    
    // Manejar errores específicos
    if (err.status === 403) {
      errorMessage = 'No se puede actualizar una reservación cancelada. Debe restaurarla primero.';
    } else if (err.error?.message) {
      errorMessage = err.error.message;
    }
    
    Swal.fire({
      title: 'Error',
      text: errorMessage,
      icon: 'error',
      confirmButtonColor: '#80A7A3',
      customClass: { container: 'swal-on-modal' }
    });
  }

  private markAllAsTouched(): void {
    Object.values(this.form.controls).forEach(control => control.markAsTouched());
    Swal.fire({
      title: 'Error',
      text: 'Por favor complete todos los campos requeridos',
      icon: 'error',
      confirmButtonColor: '#80A7A3',
      customClass: { container: 'swal-on-modal' }
    });
  }
}

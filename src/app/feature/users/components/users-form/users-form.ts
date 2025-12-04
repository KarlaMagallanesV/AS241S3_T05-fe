import { Component, inject, OnInit, Output, EventEmitter, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';

import { UserService } from '../../services/user.service';
import { EmployeeService } from '../../../employee/services/employee.service';
import { ClientService } from '../../../client/services/client.service';
import { Employee } from '../../../employee/interfaces/employee';
import { Client } from '../../../client/interfaces/client';
import { UserRequestDTO } from '../../interfaces/user';
import Swal from 'sweetalert2/dist/sweetalert2.js';

@Component({
  selector: 'app-users-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule
],
  templateUrl: './users-form.html',
  styleUrls: ['./users-form.scss']
})
export class UsersForm implements OnInit {
  private userService = inject(UserService);
  private employeeService = inject(EmployeeService);
  private clientService = inject(ClientService);
  private fb = inject(FormBuilder);

  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  form!: FormGroup;
  
  employees: Employee[] = [];
  clients: Client[] = [];
  filteredEmployees: Employee[] = [];
  filteredClients: Client[] = [];
  
  selectedEmployee: Employee | null = null;
  selectedClient: Client | null = null;
  
  employeeSearch = '';
  clientSearch = '';
  
  showEmployeeModal = false;
  showClientModal = false;

  ngOnInit(): void {
    this.initForm();
    this.loadEmployees();
    this.loadClients();
  }

  private initForm(): void {
    this.form = this.fb.group({
      role: ['USER', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      employeeId: [null],
      clientId: [null]
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

  selectEmployee(employee: Employee): void {
    this.selectedEmployee = employee;
    this.form.patchValue({ employeeId: employee.id, clientId: null });
    this.clearClient();
    this.closeEmployeeModal();
  }

  selectClient(client: Client): void {
    this.selectedClient = client;
    this.form.patchValue({ clientId: client.id, employeeId: null });
    this.clearEmployee();
    this.closeClientModal();
  }

  clearEmployee(): void {
    this.selectedEmployee = null;
    this.employeeSearch = '';
    this.form.patchValue({ employeeId: null });
    this.filteredEmployees = this.employees;
  }

  clearClient(): void {
    this.selectedClient = null;
    this.clientSearch = '';
    this.form.patchValue({ clientId: null });
    this.filteredClients = this.clients;
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.markAllAsTouched();
      return;
    }

    const result = await Swal.fire({
      title: '¿Registrar nuevo usuario?',
      icon: 'question',
      iconColor: '#80A7A3',
      showCancelButton: true,
      confirmButtonText: 'Registrar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#80A7A3',
      cancelButtonColor: '#F4A1A1',
      customClass: {
        container: 'swal-on-modal'
      }
    });

    if (result.isConfirmed) {
      const formData = this.form.getRawValue();
      const userRequest: UserRequestDTO = {
        password: formData.password,
        role: formData.role,
        employeeId: formData.employeeId,
        clientId: formData.clientId
      };

      this.userService.register(userRequest).subscribe({
        next: () => {
          Swal.fire({
            title: '¡Registrado!',
            text: 'Usuario creado con éxito',
            icon: 'success',
            confirmButtonColor: '#80A7A3',
            customClass: {
              container: 'swal-on-modal'
            }
          }).then(() => {
            this.saved.emit();
            this.form.reset();
            this.initForm();
            this.clearEmployee();
            this.clearClient();
          });
        },
        error: (err) => {
          console.error('Error:', err);
          Swal.fire({
            title: 'Error',
            text: err.error?.message || 'No se pudo crear el usuario',
            icon: 'error',
            confirmButtonColor: '#80A7A3',
            customClass: {
              container: 'swal-on-modal'
            }
          });
        }
      });
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  private markAllAsTouched(): void {
    Object.values(this.form.controls).forEach(control => {
      control.markAsTouched();
    });
    Swal.fire({
      title: 'Error',
      text: 'Por favor complete todos los campos requeridos correctamente',
      icon: 'error',
      confirmButtonColor: '#80A7A3',
      customClass: {
        container: 'swal-on-modal'
      }
    });
  }
}

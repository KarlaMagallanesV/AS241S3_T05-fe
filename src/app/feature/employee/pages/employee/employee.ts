import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EmployeeForm } from '../../components/employee-form/employe-form';
import { EmployeeList } from '../../components/employee-list/employee-list';
import { Employee as EmployeeInterface } from '../../interfaces/employee';
import { EmployeeService } from '../../services/employee.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-employee',
  standalone: true,
  imports: [
    RouterModule,
    FormsModule,
    EmployeeForm,
    EmployeeList
],
  templateUrl: './employee.html',
  styleUrls: ['./employee.scss']
})
export class Employee implements OnInit {
  isBrowser: boolean;
  
  showForm = false;
  selectedEmployee: EmployeeInterface | undefined = undefined;
  searchTerm: string = '';

  employees: EmployeeInterface[] = [];
  filteredEmployees: EmployeeInterface[] = [];
  paginatedEmployees: EmployeeInterface[] = [];

  statusFilter = '';
  sortOrder = '';

  currentPage = 1;
  itemsPerPage = 8;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private employeeService: EmployeeService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.employeeService.getEmployees().subscribe({
      next: (response) => {
        console.log('Empleados recibidos del backend:', response);
        this.employees = [...response].reverse();
        this.applyFilters();
      },
      error: (err) => {
        console.error('Error al cargar empleados:', err);
        Swal.fire('Error', 'No se pudieron cargar los empleados', 'error');
      }
    });
  }

  onCreateNew(): void {
    this.selectedEmployee = undefined;
    this.showForm = true;
    
    if (this.isBrowser) {
      document.body.style.overflow = 'hidden';
    }
  }

  onEditEmployee(employee: EmployeeInterface): void {
    this.selectedEmployee = employee;
    this.showForm = true;
    
    if (this.isBrowser) {
      document.body.style.overflow = 'hidden';
    }
  }

  onFormSaved(): void {
    this.showForm = false;
    this.selectedEmployee = undefined;
    
    if (this.isBrowser) {
      document.body.style.overflow = 'auto';
    }
    
    this.loadEmployees();
  }

  onFormCancelled(): void {
    this.showForm = false;
    this.selectedEmployee = undefined;
    
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

  onToggleStatus(employee: EmployeeInterface): void {
    if (!employee.id) return;

    const isActive = employee.status?.toUpperCase() === 'A';
    const action = isActive ? 'desactivar' : 'activar';
    const actionDone = isActive ? 'desactivado' : 'activado';

    Swal.fire({
      title: `¿Deseas ${action} al empleado?`,
      icon: 'question',
      iconColor: '#80A7A3',
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#80A7A3',
      cancelButtonColor: '#F4A1A1'
    }).then(result => {
      if (result.isConfirmed) {
        const toggleAction = isActive
          ? this.employeeService.deleteEmployee(employee.id!)
          : this.employeeService.restoreEmployee(employee.id!);

        toggleAction.subscribe({
          next: () => {
            Swal.fire('¡Éxito!', `Empleado ${actionDone}.`, 'success');
            this.loadEmployees();
          },
          error: () => {
            Swal.fire('Error', 'No se pudo cambiar el estado del empleado', 'error');
          }
        });
      }
    });
  }

  onSearch(): void {
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchTerm = '';
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

  resetFilters(): void {
    this.statusFilter = '';
    this.sortOrder = '';
    this.searchTerm = '';
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredEmployees = this.employees.filter(employee => {
      let matchesStatus = true;
      if (this.statusFilter) {
        matchesStatus = employee.status === this.statusFilter;
      }

      let matchesSearch = true;
      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase();
        matchesSearch = Boolean(
          employee.nameEmployee.toLowerCase().includes(searchLower) ||
          employee.lastname.toLowerCase().includes(searchLower) ||
          employee.cellphone.toString().includes(searchLower) ||
          (employee.email && employee.email.toLowerCase().includes(searchLower))
        );
      }

      return matchesStatus && matchesSearch;
    });

    if (this.sortOrder === 'az') {
      this.filteredEmployees.sort((a, b) => a.nameEmployee.localeCompare(b.nameEmployee));
    } else if (this.sortOrder === 'za') {
      this.filteredEmployees.sort((a, b) => b.nameEmployee.localeCompare(a.nameEmployee));
    }

    this.currentPage = 1;
    this.updatePaginatedEmployees();
  }

  updatePaginatedEmployees(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedEmployees = this.filteredEmployees.slice(start, start + this.itemsPerPage);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedEmployees();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedEmployees();
    }
  }

  get totalPages(): number {
    return Math.ceil(this.filteredEmployees.length / this.itemsPerPage) || 1;
  }

  getPageInfo(): string {
    if (this.filteredEmployees.length === 0) {
      return '0 to 0 of 0';
    }
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(start + this.itemsPerPage - 1, this.filteredEmployees.length);
    return `${start} to ${end} of ${this.filteredEmployees.length}`;
  }
}

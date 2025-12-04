import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UsersForm } from '../../components/users-form/users-form';
import { UsersList } from '../../components/users-list/users-list';
import { User } from '../../interfaces/user';
import { UserService } from '../../services/user.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    RouterModule,
    FormsModule,
    UsersForm,
    UsersList
],
  templateUrl: './users.html',
  styleUrls: ['./users.scss']
})
export class Users implements OnInit {
  isBrowser: boolean;
  
  showForm = false;
  searchTerm: string = '';

  users: User[] = [];
  filteredUsers: User[] = [];
  paginatedUsers: User[] = [];

  statusFilter: boolean | null = null;
  roleFilter = '';
  userTypeFilter = ''; // 'employee' o 'client'
  sortOrder = '';

  currentPage = 1;
  itemsPerPage = 8;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private userService: UserService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.findAll().subscribe({
      next: (response) => {
        console.log('Usuarios recibidos del backend:', response);
        this.users = [...response].reverse();
        this.applyFilters();
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
        Swal.fire('Error', 'No se pudieron cargar los usuarios', 'error');
      }
    });
  }

  onCreateNew(): void {
    this.showForm = true;
    
    if (this.isBrowser) {
      document.body.style.overflow = 'hidden';
    }
  }

  onFormSaved(): void {
    this.showForm = false;
    
    if (this.isBrowser) {
      document.body.style.overflow = 'auto';
    }
    
    this.loadUsers();
  }

  onFormCancelled(): void {
    this.showForm = false;
    
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

  onToggleStatus(user: User): void {
    if (!user.id) return;

    const isActive = user.status;
    const action = isActive ? 'desactivar' : 'activar';
    const actionDone = isActive ? 'desactivado' : 'activado';

    Swal.fire({
      title: `¿Deseas ${action} al usuario?`,
      icon: 'question',
      iconColor: '#80A7A3',
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#80A7A3',
      cancelButtonColor: '#F4A1A1'
    }).then(result => {
      if (result.isConfirmed) {
        if (isActive) {
          this.userService.deleteUser(user.id!).subscribe({
            next: () => {
              Swal.fire('¡Éxito!', `Usuario ${actionDone}.`, 'success');
              this.loadUsers();
            },
            error: () => {
              Swal.fire('Error', 'No se pudo cambiar el estado del usuario', 'error');
            }
          });
        } else {
          this.userService.restoreUser(user.id!).subscribe({
            next: () => {
              Swal.fire('¡Éxito!', `Usuario ${actionDone}.`, 'success');
              this.loadUsers();
            },
            error: () => {
              Swal.fire('Error', 'No se pudo cambiar el estado del usuario', 'error');
            }
          });
        }
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

  toggleStatusFilter(status: boolean): void {
    this.statusFilter = this.statusFilter === status ? null : status;
    this.applyFilters();
  }

  setRoleFilter(role: string): void {
    this.roleFilter = this.roleFilter === role ? '' : role;
    this.applyFilters();
  }

  setUserTypeFilter(type: string): void {
    this.userTypeFilter = this.userTypeFilter === type ? '' : type;
    this.applyFilters();
  }

  setSortOrder(order: string): void {
    this.sortOrder = this.sortOrder === order ? '' : order;
    this.applyFilters();
  }

  resetFilters(): void {
    this.statusFilter = null;
    this.roleFilter = '';
    this.userTypeFilter = '';
    this.sortOrder = '';
    this.searchTerm = '';
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredUsers = this.users.filter(user => {
      let matchesStatus = true;
      if (this.statusFilter !== null) {
        matchesStatus = user.status === this.statusFilter;
      }

      let matchesRole = true;
      if (this.roleFilter) {
        matchesRole = user.role === this.roleFilter;
      }

      let matchesUserType = true;
      if (this.userTypeFilter === 'employee') {
        matchesUserType = !!user.employee_id;
      } else if (this.userTypeFilter === 'client') {
        matchesUserType = !!user.client_id;
      }

      let matchesSearch = true;
      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase();
        matchesSearch = user.username.toLowerCase().includes(searchLower);
      }

      return matchesStatus && matchesRole && matchesUserType && matchesSearch;
    });

    if (this.sortOrder === 'az') {
      this.filteredUsers.sort((a, b) => a.username.localeCompare(b.username));
    } else if (this.sortOrder === 'za') {
      this.filteredUsers.sort((a, b) => b.username.localeCompare(a.username));
    }

    this.currentPage = 1;
    this.updatePaginatedUsers();
  }

  updatePaginatedUsers(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedUsers = this.filteredUsers.slice(start, start + this.itemsPerPage);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedUsers();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedUsers();
    }
  }

  get totalPages(): number {
    return Math.ceil(this.filteredUsers.length / this.itemsPerPage) || 1;
  }

  getPageInfo(): string {
    if (this.filteredUsers.length === 0) {
      return '0 to 0 of 0';
    }
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(start + this.itemsPerPage - 1, this.filteredUsers.length);
    return `${start} to ${end} of ${this.filteredUsers.length}`;
  }
}

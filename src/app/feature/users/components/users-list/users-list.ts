import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../interfaces/user';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './users-list.html',
  styleUrls: ['./users-list.scss']
})
export class UsersList {
  @Input() users: User[] = [];
  @Output() toggle = new EventEmitter<User>();

  toggleStatus(user: User): void {
    this.toggle.emit(user);
  }

  getRoleLabel(role: string): string {
    const roles: Record<string, string> = {
      'ADMIN': 'Administrador',
      'RECEPTIONIST': 'Recepcionista',
      'STYLIST': 'Estilista',
      'CLIENT': 'Cliente'
    };
    return roles[role] || role;
  }
}

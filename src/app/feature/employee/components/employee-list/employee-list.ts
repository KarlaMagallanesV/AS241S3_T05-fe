import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Employee } from '../../interfaces/employee';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './employee-list.html',
  styleUrls: ['./employee-list.scss']
})
export class EmployeeList implements OnInit, OnChanges {
  @Input() employees: Employee[] = [];
  @Output() edit = new EventEmitter<Employee>();
  @Output() toggle = new EventEmitter<Employee>();

  ngOnInit(): void {
    console.log('ngOnInit - Empleados:', this.employees.length);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['employees']) {
      console.log('Empleados actualizados:', this.employees);
      if (this.employees.length > 0) {
        console.log('Primer empleado:', this.employees[0]);
        console.log('imagenUrl del primer empleado:', this.employees[0].imagenUrl);
      }
    }
  }

  editEmployee(employee: Employee): void {
    this.edit.emit(employee);
  }

  toggleStatus(employee: Employee): void {
    this.toggle.emit(employee);
  }

  getShiftLabel(shift: string): string {
    const shifts: Record<string, string> = {
      'M': 'Mañana',
      'T': 'Tarde',
      'N': 'Noche'
    };
    return shifts[shift] || shift;
  }
}

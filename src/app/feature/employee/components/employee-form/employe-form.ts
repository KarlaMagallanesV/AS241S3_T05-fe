import { Component, inject, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { Employee } from 'app/feature/employee/interfaces/employee';
import { EmployeeService } from '../../services/employee.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import Swal from 'sweetalert2/dist/sweetalert2.js';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [
    ReactiveFormsModule
],
  templateUrl: './employee-form.html',
  styleUrls: ['./employee-form.scss']
})
export class EmployeeForm implements OnInit {
  private employeeService = inject(EmployeeService);
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  @Input() employee?: Employee;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  form!: FormGroup;
  photoPreview: string | null = null;
  selectedPhoto: File | null = null;
  isUploading: boolean = false;

  ngOnInit(): void {
    this.initForm();

    if (this.employee) {
      this.form.patchValue({
        id: this.employee.id,
        firstName: this.employee.nameEmployee,
        lastName: this.employee.lastname,
        phoneNumber: this.employee.cellphone,
        email: this.employee.email,
        workShift: this.employee.shiftEmployee
      });

      if (this.employee.imagenUrl) {
        this.photoPreview = this.employee.imagenUrl as string;
      }
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      id: [''],
      firstName: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/),
          Validators.minLength(3)
        ]
      ],
      lastName: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/),
          Validators.minLength(2)
        ]
      ],
      phoneNumber: [
        '',
        [
          Validators.required,
          Validators.pattern(/^9\d{8}$/),
          Validators.minLength(9),
          Validators.maxLength(9)
        ]
      ],
      email: ['', [Validators.required, Validators.email]],
      workShift: ['M', Validators.required]
    });
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.selectedPhoto = file;

      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.photoPreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.markAllAsTouched();
      return;
    }

    const isEditing = !!this.employee?.id;
    const result = await Swal.fire({
      title: isEditing ? '¿Guardar cambios?' : '¿Registrar nuevo empleado?',
      icon: 'question',
      iconColor: '#80A7A3',
      showCancelButton: true,
      confirmButtonText: isEditing ? 'Guardar' : 'Registrar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#80A7A3',
      cancelButtonColor: '#F4A1A1',
      customClass: {
        container: 'swal-on-modal'
      }
    });

    if (result.isConfirmed) {
      this.isUploading = true;

      try {
        let imageUrl = this.photoPreview;
        
        if (this.selectedPhoto) {
          imageUrl = await this.uploadImage(this.selectedPhoto);
        }

        const employeeData = this.prepareEmployeeData(imageUrl);
        
        if (isEditing) {
          this.employeeService.updateEmployee(this.employee!.id!, employeeData).subscribe({
            next: () => {
              this.isUploading = false;
              this.handleSuccess('¡Actualizado!', 'Empleado actualizado con éxito');
            },
            error: (err) => {
              this.isUploading = false;
              this.handleError(err);
            }
          });
        } else {
          this.employeeService.createEmployee(employeeData).subscribe({
            next: () => {
              this.isUploading = false;
              this.handleSuccess('¡Registrado!', 'Empleado creado con éxito');
            },
            error: (err) => {
              this.isUploading = false;
              this.handleError(err);
            }
          });
        }

      } catch (error) {
        this.isUploading = false;
        this.handleError(error);
      }
    }
  }

  private uploadImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);

      this.http.post<any>(`${environment.urlBackEnd}/v1/api/images/upload`, formData, {
        responseType: 'text' as 'json'
      }).subscribe({
        next: (response) => {
          console.log('Respuesta del servidor de imágenes:', response);
          const urlMatch = response;
          if (urlMatch && urlMatch) {
            console.log('URL de imagen extraída:', urlMatch);
            resolve(urlMatch);
          } else {
            console.error('No se pudo extraer la URL de la respuesta:', response);
            reject('No se pudo obtener la URL de la imagen');
          }
        },
        error: (err) => {
          console.error('Error al subir imagen:', err);
          reject('Error al subir la imagen');
        }
      });
    });
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  private prepareEmployeeData(imageUrl: string | null): Employee {
    const formData = this.form.getRawValue();
    const today = new Date();
    const registrationDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const employeeData: Employee = {
      id: formData.id,
      nameEmployee: formData.firstName,
      lastname: formData.lastName,
      cellphone: parseInt(formData.phoneNumber),
      email: formData.email,
      shiftEmployee: formData.workShift,
      registrationDate: registrationDate,
      imagenUrl: imageUrl || undefined,
      status: 'A' as 'A'
    };
    
    console.log('Datos del empleado a enviar:', employeeData);
    return employeeData;
  }

  private handleSuccess(title: string, text: string): void {
    Swal.fire({
      title,
      text,
      icon: 'success',
      confirmButtonColor: '#80A7A3',
      customClass: {
        container: 'swal-on-modal'
      }
    }).then(() => {
      this.saved.emit();
      this.photoPreview = null;
      this.selectedPhoto = null;
      if (!this.employee) {
        this.form.reset();
        this.initForm();
      }
    });
  }

  private handleError(err: unknown): void {
    console.error('Error:', err);
    let errorMessage = 'No se pudo completar la operación';

    if (typeof err === 'object' && err !== null) {
      const errorObj = err as Record<string, any>;
      if ('error' in errorObj && typeof errorObj['error'] === 'object' && errorObj['error'] !== null) {
        const serverError = errorObj['error'] as Record<string, any>;
        if ('message' in serverError) {
          errorMessage = String(serverError['message']);
        }
      } else if ('message' in errorObj) {
        errorMessage = String(errorObj['message']);
      }
    }

    Swal.fire({
      title: 'Error',
      text: errorMessage,
      icon: 'error',
      confirmButtonColor: '#80A7A3',
      customClass: {
        container: 'swal-on-modal'
      }
    });
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

  onlyNumbers(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'];
    if (allowedKeys.includes(event.key)) return;

    if (!/[0-9]/.test(event.key)) {
      event.preventDefault();
    }
  }

  onlyLetters(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', ' '];
    if (allowedKeys.includes(event.key)) return;

    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ]$/.test(event.key)) {
      event.preventDefault();
    }
  }
}

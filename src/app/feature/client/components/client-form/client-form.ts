import { Component, inject, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';

import { Client } from 'app/feature/client/interfaces/client';
import { ClientService } from '../../services/client.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { Router } from '@angular/router';
import Swal from 'sweetalert2/dist/sweetalert2.js';

interface Ubigeo {
  code: string;
  department: string;
  province: string;
  district: string;
}

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [
    ReactiveFormsModule
],
  templateUrl: './client-form.html',
  styleUrls: ['./client-form.scss']
})
export class ClientForm implements OnInit {
  private clientService = inject(ClientService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private http = inject(HttpClient);

  @Input() client?: Client;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  form!: FormGroup;
  currentStep: number = 1;
  documentTypes = ['DNI', 'CE'];
  todayDate = this.formatToBackendDate(new Date());
  maxBirthDate: string = '';
  photoPreview: string | null = null;
  selectedPhoto: File | null = null;
  isUploading: boolean = false;

  // Distritos de Cañete hardcodeados
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

  ngOnInit(): void {
    const today = new Date();
    const maxDate = new Date(
      today.getFullYear() - 18,
      today.getMonth(),
      today.getDate()
    );
    this.maxBirthDate = maxDate.toISOString().split('T')[0];

    this.initForm();

    if (this.client) {
      this.form.patchValue({
        id: this.client.id,
        documentType: this.client.typeDocument,
        documentNumber: this.client.numberDocument,
        firstName: this.client.nameClient,
        lastName: this.client.lastname,
        birthDate: this.client.birthday,
        phoneNumber: this.client.cellphone,
        ubigeoCode: this.client.ubigeoCode,
        email: this.client.email,
        visitFrequency: this.client.visitFrequency,
        points: this.client.points || 0,
        registrationDate: this.client.registrationDate || this.todayDate
      });

      if (this.client.imageUrl) {
        this.photoPreview = this.client.imageUrl as string;
      }
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      id: [''],
      documentType: ['DNI', Validators.required],
      documentNumber: [
        '',
        [
          Validators.required,
          Validators.pattern(/^\d{8}$/),
          Validators.minLength(8),
          Validators.maxLength(8)
        ]
      ],
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
      birthDate: ['', [Validators.required, this.validateBirthDate]],
      phoneNumber: [
        '',
        [
          Validators.required,
          Validators.pattern(/^9\d{8}$/),
          Validators.minLength(9),
          Validators.maxLength(9)
        ]
      ],
      ubigeoCode: ['', Validators.required],
      email: ['', [Validators.required, Validators.email, Validators.pattern(/^[^@]+@[^@]+\.[^@]+$/)]],
      visitFrequency: ['N', Validators.required],
      points: [0, [Validators.required, Validators.min(0)]],
      registrationDate: [{
        value: this.todayDate,
        disabled: true
      }]
    });
  }

  private formatToBackendDate(date: Date | string): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  validateBirthDate = (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;

    const birthDate = new Date(control.value);
    const today = new Date();

    const minValidDate = new Date(
      today.getFullYear() - 18,
      today.getMonth(),
      today.getDate()
    );

    if (birthDate > minValidDate) {
      return { underage: true };
    }

    return null;
  };

  onDocumentTypeChange(): void {
    const docType = this.form.get('documentType')?.value;
    const docNumberControl = this.form.get('documentNumber');

    if (!docNumberControl) return;

    if (docType === 'DNI') {
      docNumberControl.setValidators([
        Validators.required,
        Validators.pattern(/^\d{8}$/),
        Validators.minLength(8),
        Validators.maxLength(8)
      ]);
    } else {
      docNumberControl.setValidators([
        Validators.required,
        Validators.pattern(/^\d{12,20}$/),
        Validators.minLength(12),
        Validators.maxLength(20)
      ]);
    }
    docNumberControl.reset();
    docNumberControl.updateValueAndValidity();
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

  nextStep(): void {
    const step1Fields = ['documentType', 'documentNumber', 'firstName', 'lastName', 'phoneNumber', 'birthDate'];
    let isValid = true;

    step1Fields.forEach(field => {
      const control = this.form.get(field);
      if (control) {
        control.markAsTouched();
        if (control.invalid) {
          isValid = false;
        }
      }
    });

    if (isValid) {
      this.currentStep = 2;
    } else {
      // SweetAlert2 con z-index alto para mostrarse sobre el modal
      Swal.fire({
        title: 'Campos incompletos',
        text: 'Por favor complete todos los campos del paso 1 correctamente',
        icon: 'warning',
        iconColor: '#80A7A3',
        confirmButtonColor: '#80A7A3',
        customClass: {
          container: 'swal-on-modal'
        }
      });
    }
  }

  prevStep(): void {
    this.currentStep = 1;
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.markAllAsTouched();
      return;
    }

    const result = await Swal.fire({
      title: '¿Registrar nuevo cliente?',
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
      this.isUploading = true;

      try {
        // Subir imagen si hay una seleccionada
        let imageUrl = this.photoPreview;
        
        if (this.selectedPhoto) {
          imageUrl = await this.uploadImage(this.selectedPhoto);
        }

        // Preparar datos del cliente
        const clientData = this.prepareClientData(imageUrl);
        
        // Guardar cliente
        this.clientService.save(clientData).subscribe({
          next: () => {
            this.isUploading = false;
            this.handleSuccess('¡Registrado!', 'Cliente creado con éxito');
          },
          error: (err) => {
            this.isUploading = false;
            this.handleError(err);
          }
        });

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
          // El backend devuelve: "Imagen subida exitosamente. URL: https://..."
          const urlMatch = response;
          if (urlMatch && urlMatch) {
            resolve(urlMatch);
          } else {
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

  private prepareClientData(imageUrl: string | null): Client {
    const formData = this.form.getRawValue();
    return {
      id: formData.id,
      typeDocument: formData.documentType,
      numberDocument: formData.documentNumber,
      nameClient: formData.firstName,
      lastname: formData.lastName,
      birthday: formData.birthDate,
      cellphone: formData.phoneNumber,
      email: formData.email,
      registrationDate: formData.registrationDate || this.todayDate,
      ubigeoCode: formData.ubigeoCode,
      visitFrequency: formData.visitFrequency,
      points: formData.points || 0,
      imageUrl: imageUrl || undefined,
      status: this.client?.status || 'A'
    };
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
      this.currentStep = 1;
      this.photoPreview = null;
      this.selectedPhoto = null;
      if (!this.client) {
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
        } else if ('errors' in serverError && typeof serverError['errors'] === 'object' && serverError['errors'] !== null) {
          errorMessage = Object.values(serverError['errors']).join('\n');
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
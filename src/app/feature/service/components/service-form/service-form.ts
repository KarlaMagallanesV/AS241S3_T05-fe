import { Component, inject, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { ServiceInterface } from 'app/feature/service/interfaces/service';
import { ServiceService } from '../../services/service.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-service-form',
  standalone: true,
  imports: [
    ReactiveFormsModule
],
  templateUrl: './service-form.html',
  styleUrls: ['./service-form.scss']
})
export class ServiceForm implements OnInit {

  selectedService: any;

  private serviceService = inject(ServiceService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  selectedFile: File | null = null;
  imagePreviewUrl: string | ArrayBuffer | null = null;
  isUploading: boolean = false;

  @Input() service?: ServiceInterface;
  @Output() saved = new EventEmitter<void>();

  form!: FormGroup;
  Category = ['CC', 'CM', 'CP', 'CR', 'DC', 'DR', 'DM', 'DP', 'DD'];
  todayDate = this.formatToBackendDateTime(new Date());

  ngOnInit(): void {
    this.initForm();
    if (this.service) {
      this.form.patchValue({
        code: this.service.code,
        category: this.service.category,
        nameService: this.service.name_service,
        descriptionService: this.service.description_service,
        duration: this.service.duration,
        priceService: this.service.price,
        points: this.service.points,
        image_url: this.service.image_url,
        registration_date: this.service.registration_date
      });
    } else {
      this.onCategoryChange(this.form.get('category')?.value);
    }
    this.subscribeToCategoryChanges();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreviewUrl = reader.result;
      };
      reader.readAsDataURL(file);

      this.uploadImage(file);
    } else {
      this.selectedFile = null;
      this.imagePreviewUrl = null;
      this.form.get('image_url')?.setValue('');
    }
  }

  changeServiceState(arg0: string) {
    throw new Error('Method not implemented.');
  }

  onActivate() {
    throw new Error('Method not implemented.');
  }

  private initForm(): void {
    this.form = this.fb.group({
      code: [''],
      category: ['CC', Validators.required],
      nameService: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ][a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\/().]*$/),
          Validators.maxLength(50),
          Validators.minLength(3)
        ]
      ],
      descriptionService: [
        '',
        [
          Validators.pattern(/^[^\s][\w\sáéíóúÁÉÍÓÚñÑ.,;:+#()\-\/]*$/),
          Validators.maxLength(500),
          Validators.minLength(3)
        ]
      ],
      duration: [0, [Validators.required, Validators.min(1)]],
      price: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(6),
          Validators.pattern(/^\d{1,3}(\.\d{0,2})?$/),
          Validators.min(10)
        ]
      ],
      points: [0, [Validators.required, Validators.min(0)]],
      image_url: [''],
      registration_date: [{
        value: this.todayDate,
        disabled: true
      }]
    });
  }

  onSave(): void {
    if (this.form.invalid) {
      this.markAllAsTouched();
      return;
    }

    Swal.fire({
      title: '¿Registrar nuevo servicio?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Registrar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const serviceData = this.prepareServiceData();
        console.log('Datos a enviar al backend:', serviceData);
        this.serviceService.save(serviceData).subscribe({
          next: () => this.handleSuccess('¡Registrado!', 'Servicio creado con éxito'),
          error: (err) => this.handleError(err)
        });
      }
    });
  }

  private formatToBackendDateTime(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const yyyy = date.getFullYear();
    const MM = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());
    return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
  }

  private uploadImage(file: File): void {
    this.isUploading = true;
  
    this.serviceService.uploadImage(file).subscribe({
      next: (response: any) => {
        this.isUploading = false;
  
        const imageUrl = response;
  
        if (imageUrl) {
          this.form.get('image_url')?.setValue(imageUrl);
          Swal.fire('Cargada', 'Imagen subida correctamente', 'success');
        } else {
          this.handleUploadError('Respuesta de backend inválida');
        }
      },
      error: (err) => this.handleUploadError(err)
    });
  }

private handleUploadError(err: any): void {
    this.isUploading = false;
    this.imagePreviewUrl = null; 
    this.selectedFile = null;
    this.form.get('image_url')?.setValue(''); 
    console.error('Error al subir imagen:', err);
    Swal.fire('Error de subida', 'Fallo al subir la imagen. Inténtalo de nuevo.', 'error');
}

  onCategoryChange(category: string): void {
    if (!category) return;

    this.serviceService.getCodePreview(category).subscribe({
      next: (response) => {
        this.form.patchValue({ code: response.code });
      },
      error: (err) => {
        console.error('Error al obtener código:', err);
        this.form.patchValue({ code: '' });
      }
    });
  }

  private prepareServiceData(): ServiceInterface {
    const formData = this.form.getRawValue();
    return {
      code: formData.code,
      category: formData.category,
      name_service: formData.nameService,
      description_service: formData.descriptionService,
      duration: formData.duration,
      price: formData.price,
      points: formData.points,
      image_url: formData.image_url,
      registration_date: formData.registration_date,
      status: this.service?.status || true
    };
  }

  private handleSuccess(title: string, text: string): void {
    Swal.fire(title, text, 'success');
    this.saved.emit();
    if (!this.service) {
      this.form.reset();
      this.initForm();
      this.subscribeToCategoryChanges();
    }
    const currentCategory = this.form.get('category')?.value;
    if (currentCategory) {
      this.onCategoryChange(currentCategory);
    }
  }

  private subscribeToCategoryChanges(): void {
    this.form.get('category')?.valueChanges.subscribe(value => {
      if (!this.service) {
        this.onCategoryChange(value);
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

    Swal.fire('Error', errorMessage, 'error');
  }

  private markAllAsTouched(): void {
    Object.values(this.form.controls).forEach(control => {
      control.markAsTouched();
    });
    Swal.fire('Error', 'Por favor complete todos los campos requeridos correctamente', 'error');
  }

  onlyPrice(event: KeyboardEvent, currentValue: string): void {
    const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'];

    // Permitir teclas especiales
    if (allowedKeys.includes(event.key)) return;
    const inputChar = event.key;

    // Permitir un solo punto decimal
    if (inputChar === '.' && !currentValue.includes('.')) return;

    // Bloquear si no es número o punto
    if (!/^[0-9.]$/.test(inputChar)) {
      event.preventDefault();
      return;
    }

    // Permite solo 2 decimales
    const [integerPart, decimalPart] = currentValue.split('.');
    if (decimalPart && decimalPart.length >= 2 && currentValue.includes('.') && !allowedKeys.includes(event.key)) {
      event.preventDefault();
    }

    //Permite solo 3 números enteros
    if (!currentValue.includes('.') && integerPart.length >= 3 && inputChar !== '.') {
      event.preventDefault();
      return;
    }
  }

  onlyLetters(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', ' '];
    if (allowedKeys.includes(event.key)) return;

    //Permite solo letras, mayusculas y tildes
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\/().]*$/.test(event.key)) {
      event.preventDefault();
    }
  }
  onlyLettersAndSymbol(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', ' '];
    if (allowedKeys.includes(event.key)) return;

    //Permite letras y simbolos
    if (!/^[\w\sáéíóúÁÉÍÓÚñÑ.,;:+#()\-\/]*$/.test(event.key)) {
      event.preventDefault();
    }
  }

}

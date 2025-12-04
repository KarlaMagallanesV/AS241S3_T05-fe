import { Component, Input, OnInit, Output, EventEmitter, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ServiceService } from '../../services/service.service';
import { ServiceInterface } from '../../interfaces/service';
import Swal from 'sweetalert2';
import { ServiceResponse } from '../../interfaces/serviceResponse';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-service-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './service-list.html',
  styleUrls: ['./service-list.scss']
})
export class ServiceList implements OnInit {
  services: ServiceInterface[] = [];
  filteredServices: ServiceInterface[] = [];
  paginatedServices: ServiceInterface[] = [];

  // Filtros
  searchText = '';
  ctgTypeFilter: string = '';
  statusFilter: string = '';
  priceFilter: string = '';
  durationFilter: string = '';

  //Definición de rangos de precios
  priceRanges: { label: string; min: number; max?: number }[] = [
    { label: '20-60', min: 20, max: 60 },
    { label: '60-100', min: 60, max: 100 },
    { label: '100-140', min: 100, max: 140 },
    { label: '140-180', min: 140, max: 180 },
    { label: '180 a más', min: 180 }
  ];

  //Definición de rangos de duración del servicio
  durationRanges: { label: string; min: number; max?: number }[] = [
    { label: 'Menos de 30min', min: 0, max: 30 },
    { label: '30-60min', min: 30, max: 60 },
    { label: '60min a más', min: 60 }
  ];

  // Ordenar
  sortOption: string = '';

  // Paginación
  currentPage: number = 1;
  itemsPerPage: number = 8;

  // Modal
  showModal: boolean = false;
  showModalEdit: boolean = false;
  showModalDelete: boolean = false;
  selectedService: ServiceInterface | null = null;

  // ModalEdit
  formEdit!: FormGroup;
  Category = ['CC', 'CM', 'CP', 'CR', 'DC', 'DR', 'DM', 'DP', 'DD'];
  todayDate = this.formatToBackendDate(new Date());
  selectedFile: File | null = null;
  selectedImageUrl: SafeUrl | null = null;

  // Inyección de dependencias
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private serviceService = inject(ServiceService);
  private platformId = inject(PLATFORM_ID);
  private sanitizer = inject(DomSanitizer);

  @Input() service?: ServiceInterface;
  @Output() saved = new EventEmitter<void>();

  ngOnInit(): void {
    this.loadServices();
    this.initForm();
  }

  loadServices(): void {
    this.serviceService.findAll().subscribe({
      next: (response: ServiceResponse | ServiceInterface[]) => {
        let servicesData: ServiceInterface[];
        
        if (Array.isArray(response)) {
          servicesData = response;

      } else if (response && 'data' in response && Array.isArray(response.data)) {
        servicesData = response.data;

      } else {
        servicesData = [];
        console.error("Respuesta del servidor en formato inesperado:", response);
      }
      
      this.services = servicesData;
      this.filteredServices = [...this.services];
      this.updatePaginatedServices();
      },
      error: (err: any) => {
        console.error('Error al cargar servicios:', err);
        Swal.fire('Error', 'No se pudieron cargar los servicios', 'error');
      }
    });
  }

  filterServices(searchTerm: string): void {
    this.searchText = searchTerm.toLowerCase();
    this.applyFilters();
  }

  applyFilters(): void {
  this.filteredServices = this.services.filter(service => {
    const matchesDocType = !this.ctgTypeFilter || service.category === this.ctgTypeFilter;
    const statusFilterBool = this.statusFilter === 'true' ? true : this.statusFilter === 'false' ? false : null;
    const matchesStatus = statusFilterBool === null || service.status === statusFilterBool;

    // Precio
    const priceRange = this.priceRanges.find(range => range.label === this.priceFilter);
    let matchesPrice = true;
    if (priceRange) {
      matchesPrice = service.price >= priceRange.min && (priceRange.max ? service.price <= priceRange.max : true);
    }

    // Duración
    const durationRange = this.durationRanges.find(range => range.label === this.durationFilter);
    let matchesDuration = true;
    if (durationRange) {
      matchesDuration = service.duration >= durationRange.min && (durationRange.max ? service.duration <= durationRange.max : true);
    }

    // 🔹 Aquí estaba el error
    return matchesDocType && matchesStatus && matchesPrice && matchesDuration;
  });

  this.currentPage = 1;
  this.updatePaginatedServices();
  this.sortServices();
}


  resetFilters(): void {
    this.ctgTypeFilter = '';
    this.statusFilter = '';
    this.priceFilter = '';
    this.durationFilter = '';
    this.sortOption = '';
    this.filteredServices = [...this.services];
    this.currentPage = 1;
    this.updatePaginatedServices();
    this.loadServices();
  }

  sortServices(): void {
    switch (this.sortOption) {
      case 'name_asc':
        this.filteredServices.sort((a, b) =>
          a.name_service.localeCompare(b.name_service));
        break;
      case 'name_desc':
        this.filteredServices.sort((a, b) =>
          b.name_service.localeCompare(a.name_service));
        break;
      case 'price_asc':
        this.filteredServices.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        this.filteredServices.sort((a, b) => b.price - a.price);
        break;
      case 'date_asc':
        this.filteredServices.sort((a, b) =>
          new Date(a.registration_date).getTime() - new Date(b.registration_date).getTime());
        break;
      case 'date_desc':
        this.filteredServices.sort((a, b) =>
          new Date(b.registration_date).getTime() - new Date(a.registration_date).getTime());
        break;
      default:
        return;
    }

    this.currentPage = 1;
    this.updatePaginatedServices();
  }

  updatePaginatedServices(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedServices = this.filteredServices.slice(startIndex, startIndex + this.itemsPerPage);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedServices();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedServices();
    }
  }

  get totalPages(): number {
    return Math.ceil(this.filteredServices.length / this.itemsPerPage);
  }

  // Métodos para el modal
  openModal(service: ServiceInterface): void {
    this.selectedService = service;
    this.showModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeModal(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.classList.contains('modal') || target.classList.contains('close-btn')) {
      this.showModal = false;
      this.selectedService = null;
      document.body.style.overflow = 'auto';
    }
  }

  // Métodos para CRUD
  goToAddService(): void {
    this.router.navigate(['/service-form']);
  }

  closeModalEdit(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.classList.contains('modal') || target.classList.contains('close-btn')) {
      this.showModalEdit = false;
      this.selectedService = null;
      this.formEdit.reset();
      document.body.style.overflow = 'auto';
    }
  }

  private initForm(): void {
    this.formEdit = this.fb.group({
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
      duration: ['', Validators.required],
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
      points: ['', Validators.required],
      image_url: [''],
      registration_date: [{
        value: this.todayDate
      }]
    });
  }

  private formatToBackendDate(date: Date | string): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    
    if (file) {
        this.selectedFile = file;
        // 1. Mostrar previsualización
        const reader = new FileReader();
        reader.onload = (e: any) => {
            this.selectedImageUrl = this.sanitizer.bypassSecurityTrustUrl(e.target.result);
        };
        reader.readAsDataURL(file);
        this.serviceService.uploadImage(file).subscribe({
            next: (response: any) => {
                const imageUrl = response; 
                this.formEdit.patchValue({
                    image_url: imageUrl
                });
                this.selectedFile = null; 

                Swal.fire('¡Subida!', 'Imagen subida al servidor con éxito.', 'success');
            },
            error: (err) => {
                Swal.fire('Error de Subida', 'No se pudo subir la imagen. Intente de nuevo.', 'error');
                console.error(err);
                // Si falla la subida, es crucial restablecer el campo de imagen
                this.formEdit.patchValue({ image_url: this.selectedService!.image_url });
                this.selectedFile = null;
            }
        });
    }
}

  onUpdate(): void {
    if (this.formEdit.invalid || !this.selectedService?.code) {
        this.markAllAsTouched();
        return;
    }

    Swal.fire({
        title: '¿Actualizar servicio?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Actualizar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            // Ya no hay lógica de subida aquí. Solo actualizamos el registro
            this.updateServiceOnly();
        }
    });
}

  private prepareServiceData(): ServiceInterface {
    const formData = this.formEdit.getRawValue();
    return {
        code: this.selectedService!.code,
        category: formData.category,
        name_service: formData.nameService,
        description_service: formData.descriptionService,
        duration: formData.duration,
        price: formData.price,
        points: formData.points,
        image_url: formData.image_url, 
        registration_date: this.selectedService!.registration_date,
        status: this.selectedService!.status
    };
}

  private markAllAsTouched(): void {
    Object.values(this.formEdit.controls).forEach(control => {
      control.markAsTouched();
    });
    Swal.fire('Error', 'Por favor complete todos los campos requeridos correctamente', 'error');
  }

  private uploadAndUpdateService(): void {
    if (!this.selectedFile) return;

    this.serviceService.uploadImage(this.selectedFile).subscribe({
        next: (response: any) => {
            const imageUrl = response.body;
            const serviceData = this.prepareServiceData();
            serviceData.image_url = imageUrl; 
            this.serviceService.update(serviceData).subscribe({
                next: () => {
                    this.handleSuccess('¡Actualizado!', 'Servicio modificado con éxito y nueva imagen.');
                    this.loadServices();
                    this.closeModalEdit({ target: document.createElement('div'), classList: { contains: () => true } } as unknown as Event);
                },
                error: (err) => this.handleError(err)
            });
        },
        error: (err) => {
            Swal.fire('Error de Subida', 'No se pudo subir la imagen.', 'error');
            this.handleError(err);
        }
    });
}

private updateServiceOnly(): void {
    const serviceData = this.prepareServiceData();
    
    this.serviceService.update(serviceData).subscribe({
        next: () => {
            this.handleSuccess('¡Actualizado!', 'Servicio modificado con éxito (datos).');
            this.loadServices();
            this.closeModalEdit({ target: document.createElement('div'), classList: { contains: () => true } } as unknown as Event);
        },
        error: (err) => this.handleError(err)
    });
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

    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\/().]*$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onlyLettersAndSymbol(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', ' '];
    if (allowedKeys.includes(event.key)) return;

    if (!/^[^\s][\w\sáéíóúÁÉÍÓÚñÑ.,;:+#()\-\/]*$/.test(event.key)) {
      event.preventDefault();
    }
  }

  private handleSuccess(title: string, text: string): void {
    Swal.fire(title, text, 'success');
    this.saved.emit();
    this.formEdit.reset();
    this.initForm();
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

  openModalEdit(service: ServiceInterface): void {
    this.selectedService = service;
    this.showModalEdit = true;
    document.body.style.overflow = 'hidden';
    
    this.formEdit.reset();
    this.selectedFile = null; 
    this.selectedImageUrl = null;
    

    if (service.image_url) {

        this.selectedImageUrl = this.sanitizer.bypassSecurityTrustUrl(service.image_url);
    } else {
        this.selectedImageUrl = null;
    }
    
    this.formEdit.patchValue({
        code: service.code,
        category: service.category,
        nameService: service.name_service,
        descriptionService: service.description_service,
        duration: service.duration,
        price: service.price,
        points: service.points,
        image_url: service.image_url,
        registration_date: service.registration_date
    });
}

  toggleState(code: string, state: boolean): void {
    const action = state === true ? 'desactivar' : 'activar';
    const actionBtn = state === true ? 'Eliminar' : 'Restaurar';

    Swal.fire({
      title: `¿Deseas ${action} el servicio?`,
      text: 'Esta acción se puede cambiar más adelante',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: actionBtn,
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        if (state) {
          this.serviceService.delete(code).subscribe({
            next: () => {
              Swal.fire('¡Eliminado!', 'Servicio eliminado con éxito', 'success');
              this.saved.emit();
              this.loadServices();
              this.router.navigateByUrl('/console/services');
            },
            error: (err) => this.handleError(err)
          });
        } else {
          this.serviceService.restore(code).subscribe({
            next: () => {
              Swal.fire('¡Restaurado!', 'Servicio restaurado con éxito', 'success');
              this.saved.emit();
              this.loadServices();
              this.router.navigateByUrl('/console/services');
            },
            error: (err) => this.handleError(err)
          });
        }
      }
    });
  }

  filterBySearch(term: string): void {
    const lowerTerm = term.toLowerCase().trim();

    this.filteredServices = this.services.filter(service =>
      service.code.toLowerCase().includes(lowerTerm) ||
      service.name_service.toLowerCase().includes(lowerTerm)
    );

    this.currentPage = 1;
    this.updatePaginatedServices();
  }

  reportPdf() {
    this.serviceService.reportPdf().subscribe(blob => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'reporte_servicio.pdf';
    link.click();
    URL.revokeObjectURL(url);
    });
  }


}

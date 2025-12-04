import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, Output, EventEmitter, inject, PLATFORM_ID } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductInterface } from '../../interfaces/product';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import Swal from 'sweetalert2';
import { ProductResponse } from '../../interfaces/productResponse';

@Component({
  selector: 'app-product-list',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss'
})
export class ProductList implements OnInit{
  products: ProductInterface[] = [];
  filteredProducts: ProductInterface[] = [];
  paginatedProducts: ProductInterface[] = [];

  // Filtros
  searchText = '';
  statusFilter: string = '';
  priceFilter: string = '';

  //Definición de rangos de precios
  priceRanges: { label: string; min: number; max?: number }[] = [
    { label: '10-40', min: 10, max: 40 },
    { label: '40-70', min: 40, max: 70 },
    { label: '70-110', min: 70, max: 110 },
    { label: '110-150', min: 110, max: 150 },
    { label: '150 a más', min: 150 }
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
  selectedProduct: ProductInterface | null = null;

  // ModalEdit
  formEdit!: FormGroup;
  todayDate = this.formatToBackendDate(new Date());
  selectedFile: File | null = null;
  selectedImageUrl: SafeUrl | null = null;

  // Inyección de dependencias
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private productService = inject(ProductService);
  private platformId = inject(PLATFORM_ID);
  private sanitizer = inject(DomSanitizer);

  @Input() product?: ProductInterface;
  @Output() saved = new EventEmitter<void>();

  ngOnInit(): void {
    this.loadProducts();
    this.initForm();
  }

  loadProducts(): void {
    this.productService.findAll().subscribe({
      next: (response: ProductResponse | ProductInterface[]) => {
        let productData: ProductInterface[];
        
        if (Array.isArray(response)) {
          productData = response;

      } else if (response && 'data' in response && Array.isArray(response.data)) {
        productData = response.data;

      } else {
        productData = [];
        console.error("Respuesta del servidor en formato inesperado:", response);
      }
      
      this.products = productData;
      this.filteredProducts = [...this.products];
      this.updatePaginatedProducts();
      },
      error: (err: any) => {
        console.error('Error al cargar servicios:', err);
        Swal.fire('Error', 'No se pudieron cargar los servicios', 'error');
      }
    });
  }

  filterProducts(searchTerm: string): void {
    this.searchText = searchTerm.toLowerCase();
    this.applyFilters();
  }

  applyFilters(): void {
  this.filteredProducts = this.products.filter(product => {
    const statusFilterBool = this.statusFilter === 'true' ? true : this.statusFilter === 'false' ? false : null;
    const matchesStatus = statusFilterBool === null || product.state === statusFilterBool;

    // Precio
    const priceRange = this.priceRanges.find(range => range.label === this.priceFilter);
    let matchesPrice = true;
    if (priceRange) {
      matchesPrice = product.sale_price >= priceRange.min && (priceRange.max ? product.sale_price <= priceRange.max : true);
    }

    // 🔹 Aquí estaba el error
    return matchesStatus && matchesPrice;
  });

  this.currentPage = 1;
  this.updatePaginatedProducts();
  this.sortProducts();
}


  resetFilters(): void {
    this.statusFilter = '';
    this.priceFilter = '';
    this.sortOption = '';
    this.filteredProducts = [...this.products];
    this.currentPage = 1;
    this.updatePaginatedProducts();
    this.loadProducts();
  }

  sortProducts(): void {
    switch (this.sortOption) {
      case 'name_asc':
        this.filteredProducts.sort((a, b) =>
          a.name_product.localeCompare(b.name_product));
        break;
      case 'name_desc':
        this.filteredProducts.sort((a, b) =>
          b.name_product.localeCompare(a.name_product));
        break;
      case 'price_asc':
        this.filteredProducts.sort((a, b) => a.sale_price - b.sale_price);
        break;
      case 'price_desc':
        this.filteredProducts.sort((a, b) => b.sale_price - a.sale_price);
        break;
      case 'date_asc':
        this.filteredProducts.sort((a, b) =>
          new Date(a.registration_date).getTime() - new Date(b.registration_date).getTime());
        break;
      case 'date_desc':
        this.filteredProducts.sort((a, b) =>
          new Date(b.registration_date).getTime() - new Date(a.registration_date).getTime());
        break;
      default:
        return;
    }

    this.currentPage = 1;
    this.updatePaginatedProducts();
  }

  updatePaginatedProducts(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedProducts = this.filteredProducts.slice(startIndex, startIndex + this.itemsPerPage);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedProducts();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedProducts();
    }
  }

  get totalPages(): number {
    return Math.ceil(this.filteredProducts.length / this.itemsPerPage);
  }

  // Métodos para el modal
  openModal(product: ProductInterface): void {
    this.selectedProduct = product;
    this.showModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeModal(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.classList.contains('modal') || target.classList.contains('close-btn')) {
      this.showModal = false;
      this.selectedProduct = null;
      document.body.style.overflow = 'auto';
    }
  }

  // Métodos para CRUD
  goToAddProduct(): void {
    this.router.navigate(['/product-form']);
  }

  closeModalEdit(event?: Event): void {
    if (event) {
      const target = event.target as HTMLElement;
      if (!target.classList.contains('modal') && !target.classList.contains('close-btn')) {
        return;
      }
    }
      this.showModalEdit = false;
      this.selectedProduct = null;
      this.formEdit.reset();
      document.body.style.overflow = 'auto'
  }

  private initForm(): void {
    this.formEdit = this.fb.group({
      id: [''],
      nameProduct: [
        '',
        [
          Validators.required,
          Validators.maxLength(50),
          Validators.minLength(3)
        ]
      ],
      descriptionProduct: [
        '',
        [
          Validators.pattern(/^[^\s][\w\sáéíóúÁÉÍÓÚñÑ.,;:+#()\-\/]*$/),
          Validators.maxLength(500),
          Validators.minLength(3)
        ]
      ],
      stock: [''],
      salePrice: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(6),
          Validators.pattern(/^\d{1,3}(\.\d{0,2})?$/),
          Validators.min(10)
        ]
      ],
      image_url: [],
      registration_date: [{
        value: this.todayDate
      }],
      supplierId:['']
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
        this.productService.uploadImage(file).subscribe({
            next: (response: any) => {
                const imageUrl = response.body; 
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
                this.formEdit.patchValue({ image_url: this.selectedProduct!.image_url });
                this.selectedFile = null;
            }
        });
    }
}

  onUpdate(): void {
    if (this.formEdit.invalid || !this.selectedProduct?.id) {
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
            this.updateProductOnly();
        }
    });
}

  private prepareProductData(): ProductInterface {
    const formData = this.formEdit.getRawValue();
    return {
        id: this.selectedProduct!.id,
        name_product: formData.nameProduct,
        description_product: formData.descriptionProduct,
        stock: formData.stock,
        sale_price: formData.salePrice,
        image_url: formData.image_url, 
        registration_date: this.selectedProduct!.registration_date,
        state: this.selectedProduct!.state,
        supplier_id: formData.supplierId
    };
}

  private markAllAsTouched(): void {
    Object.values(this.formEdit.controls).forEach(control => {
      control.markAsTouched();
    });
    Swal.fire('Error', 'Por favor complete todos los campos requeridos correctamente', 'error');
  }

  private uploadAndUpdateProduct(): void {
    if (!this.selectedFile) return;

    this.productService.uploadImage(this.selectedFile).subscribe({
        next: (response: any) => {
            const imageUrl = response.body;
            const productData = this.prepareProductData();
            productData.image_url = imageUrl; 
            this.productService.update(productData).subscribe({
                next: () => {
                    this.handleSuccess('¡Actualizado!', 'Producto modificado con éxito y nueva imagen.');
                    this.loadProducts();
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

private updateProductOnly(): void {
    const productData = this.prepareProductData();
    
    this.productService.update(productData).subscribe({
        next: () => {
            this.handleSuccess('¡Actualizado!', 'Producto modificado con éxito (datos).');
            this.loadProducts();
            this.closeModalEdit();
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

  openModalEdit(product: ProductInterface): void {
    this.selectedProduct = product;
    this.showModalEdit = true;
    document.body.style.overflow = 'hidden';
    
    this.formEdit.reset();
    this.selectedFile = null; 
    this.selectedImageUrl = null;
    

    if (product.image_url) {

        this.selectedImageUrl = this.sanitizer.bypassSecurityTrustUrl(product.image_url);
    } else {
        this.selectedImageUrl = null;
    }
    
    this.formEdit.patchValue({
        id: product.id,
        nameProduct: product.name_product,
        descriptionProduct: product.description_product,
        stock: product.stock,
        salePrice: product.sale_price,
        image_url: product.image_url,
        registration_date: product.registration_date,
        supplierId: product.supplier_id
    });
}

  toggleState(id: number, state: boolean): void {
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
          this.productService.delete(id).subscribe({
            next: () => {
              Swal.fire('¡Eliminado!', 'Producto eliminado con éxito', 'success');
              this.saved.emit();
              this.loadProducts();
              this.router.navigateByUrl('/console/products');
            },
            error: (err) => this.handleError(err)
          });
        } else {
          this.productService.restore(id).subscribe({
            next: () => {
              Swal.fire('¡Restaurado!', 'Producto restaurado con éxito', 'success');
              this.saved.emit();
              this.loadProducts();
              this.router.navigateByUrl('/console/products');
            },
            error: (err) => this.handleError(err)
          });
        }
      }
    });
  }

  filterBySearch(term: string): void {
    const lowerTerm = term.toLowerCase().trim();

    this.filteredProducts = this.products.filter(products =>
      products.name_product.toLowerCase().includes(lowerTerm)
    );

    this.currentPage = 1;
    this.updatePaginatedProducts();
  }

  reportPdf() {
    this.productService.reportPdf().subscribe(blob => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'reporte_servicio.pdf';
    link.click();
    URL.revokeObjectURL(url);
    });
  }

}

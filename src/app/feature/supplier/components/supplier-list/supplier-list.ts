import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SupplierInterface } from '../../interfaces/supplier';
import { SupplierService } from '../../services/supplier.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-supplier-list',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './supplier-list.html',
  styleUrl: './supplier-list.scss'
})
export class SupplierList implements OnInit {

  suppliers: SupplierInterface[] = [];
  filteredSuppliers: SupplierInterface[] = [];
  paginatedSuppliers: SupplierInterface[] = [];

  searchText: string = '';
  statusFilter: string = '';

  sortOption: string = '';

  currentPage = 1;
  itemsPerPage = 8;

  showModalView = false;
  selectedSupplierView: SupplierInterface | null = null;

  showModalEdit = false;
  selectedSupplierEdit: SupplierInterface | null = null;
  formEdit!: FormGroup;

  private supplierService = inject(SupplierService);
  private fb = inject(FormBuilder);

  ngOnInit(): void {
    this.loadSuppliers();
    this.initForm();
  }

  loadSuppliers(): void {
    this.supplierService.findAll().subscribe({
      next: (response: any) => {
        if (response && Array.isArray(response.data)) {
          this.suppliers = response.data;
        } else {
          console.error("Formato inesperado:", response);
          this.suppliers = [];
        }

        this.filteredSuppliers = [...this.suppliers];
        this.updatePaginatedSuppliers();
      },
      error: (err) => {
        console.error("Error al cargar proveedores:", err);
        Swal.fire("Error", "No se pudo cargar la lista de proveedores", "error");
      }
    });
  }

  applyFilters(): void {
    this.filteredSuppliers = this.suppliers.filter(s => {
      const matchesSearch =
        s.company_name.toLowerCase().includes(this.searchText.toLowerCase()) ||
        s.ruc.includes(this.searchText);

      const statusFilterBool =
        this.statusFilter === 'true' ? true : this.statusFilter === 'false' ? false : null;

      const matchesStatus =
        statusFilterBool === null || s.status === statusFilterBool;

      return matchesSearch && matchesStatus;
    });

    this.currentPage = 1;
    this.updatePaginatedSuppliers();
    this.sortSuppliers();
  }

  resetFilters(): void {
    this.searchText = '';
    this.statusFilter = '';
    this.sortOption = '';
    this.filteredSuppliers = [...this.suppliers];
    this.currentPage = 1;
    this.updatePaginatedSuppliers();
    this.loadSuppliers();
  }

  filterSuppliers(searchTerm: string): void {
    this.searchText = searchTerm.toLowerCase();
    this.applyFilters();
  }

  filterBySearch(term: string): void {
    const lowerTerm = term.toLowerCase().trim();

    this.filteredSuppliers = this.suppliers.filter(suppliers =>
      suppliers.company_name.toLowerCase().includes(lowerTerm)
    );

    this.currentPage = 1;
    this.updatePaginatedSuppliers();
  }

  sortSuppliers(): void {
    switch (this.sortOption) {
      case 'name_asc':
        this.filteredSuppliers.sort((a, b) => a.company_name.localeCompare(b.company_name));
        break;
      case 'name_desc':
        this.filteredSuppliers.sort((a, b) => b.company_name.localeCompare(a.company_name));
        break;
      case 'ruc_asc':
        this.filteredSuppliers.sort((a, b) => a.ruc.localeCompare(b.ruc));
        break;
      case 'ruc_desc':
        this.filteredSuppliers.sort((a, b) => b.ruc.localeCompare(a.ruc));
        break;
      case 'date_asc':
        this.filteredSuppliers.sort((a, b) =>
          new Date(a.registration_date).getTime() - new Date(b.registration_date).getTime()
        );
        break;
      case 'date_desc':
        this.filteredSuppliers.sort((a, b) =>
          new Date(b.registration_date).getTime() - new Date(a.registration_date).getTime()
        );
        break;
      default:
        break;
    }
    this.updatePaginatedSuppliers();
  }

  updatePaginatedSuppliers(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedSuppliers = this.filteredSuppliers.slice(startIndex, startIndex + this.itemsPerPage);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedSuppliers();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedSuppliers();
    }
  }

  get totalPages(): number {
    return Math.ceil(this.filteredSuppliers.length / this.itemsPerPage);
  }

  openModalView(supplier: SupplierInterface): void {
    this.selectedSupplierView = supplier;
    this.showModalView = true;
    document.body.style.overflow = 'hidden';
  }

  closeModalView(event?: Event): void {
    if (event) {
      const target = event.target as HTMLElement;
      if (!target.classList.contains('modal') && !target.classList.contains('close-btn')) {
        return;
      }
    }
    this.showModalView = false;
    this.selectedSupplierView = null;
    document.body.style.overflow = 'auto';
  }

  openModalEdit(supplier: SupplierInterface): void {
    this.selectedSupplierEdit = supplier;
    this.showModalEdit = true;
    document.body.style.overflow = 'hidden';

    this.formEdit.patchValue({
      id: supplier.id,
      ruc: supplier.ruc,
      companyName: supplier.company_name,
      cellphone: supplier.cellphone,
      ubigeoId: supplier.ubigeo_id
    });
  }

  closeModalEdit(event?: Event): void {
    if (event) {
      const target = event.target as HTMLElement;
      if (!target.classList.contains('modal') && !target.classList.contains('close-btn')) {
        return;
      }
    }

    this.showModalEdit = false;
    this.selectedSupplierEdit = null;
    this.formEdit.reset();
    document.body.style.overflow = 'auto';
  }

  private initForm(): void {
    this.formEdit = this.fb.group({
      id: [''],
      ruc: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
      companyName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(80)]],
      cellphone: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
      ubigeoId: ['', Validators.required]
    });
  }

  onUpdate(): void {
    if (this.formEdit.invalid || !this.selectedSupplierEdit?.id) {
      this.markAllAsTouched();
      return;
    }

    Swal.fire({
      title: '¿Actualizar proveedor?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Actualizar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.updateSupplier();
      }
    });
  }

  private updateSupplier(): void {
    const formData = this.formEdit.getRawValue();

    const supplierUpdate: SupplierInterface = {
      id: formData.id,
      ruc: formData.ruc,
      company_name: formData.companyName,
      cellphone: formData.cellphone,
      ubigeo_id: formData.ubigeoId,
      registration_date: this.selectedSupplierEdit!.registration_date,
      status: this.selectedSupplierEdit!.status
    };

    this.supplierService.update(supplierUpdate).subscribe({
      next: () => {
        Swal.fire('¡Actualizado!', 'Proveedor actualizado con éxito', 'success');
        this.loadSuppliers();
        this.closeModalEdit();
      },
      error: (err) => this.handleError(err)
    });
  }

  toggleState(id: number, state: boolean): void {
    const action = state ? 'desactivar' : 'activar';

    Swal.fire({
      title: `¿Deseas ${action} este proveedor?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: action === 'desactivar' ? 'Desactivar' : 'Activar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        const call = state
          ? this.supplierService.delete(id)
          : this.supplierService.restore(id);

        call.subscribe({
          next: () => {
            Swal.fire('Hecho', `Proveedor ${action}do con éxito`, 'success');
            this.loadSuppliers();
          },
          error: err => this.handleError(err)
        });
      }
    });
  }

  private markAllAsTouched(): void {
    Object.values(this.formEdit.controls).forEach(c => c.markAsTouched());
    Swal.fire('Error', 'Complete todos los campos correctamente', 'error');
  }

  private handleError(err: any): void {
    console.error(err);
    Swal.fire('Error', 'Ocurrió un error en la operación', 'error');
  }

onlyNumbers(event: KeyboardEvent): void {
  const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'];
  if (allowedKeys.includes(event.key)) return;

  if (!/^[0-9]$/.test(event.key)) {
    event.preventDefault();
  }
}

onlyLettersAndNumbers(event: KeyboardEvent): void {
  const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', ' '];
  if (allowedKeys.includes(event.key)) return;

  if (!/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-\/().]*$/.test(event.key)) {
    event.preventDefault();
  }
}

reportPdf() {
    this.supplierService.reportPdf().subscribe(blob => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'reporte_proveedores.pdf';
    link.click();
    URL.revokeObjectURL(url);
    });
  }

}

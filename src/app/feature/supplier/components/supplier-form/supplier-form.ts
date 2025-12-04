import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { SupplierInterface } from '../../interfaces/supplier';
import { SupplierService } from '../../services/supplier.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-supplier-form',
  imports: [ReactiveFormsModule],
  templateUrl: './supplier-form.html',
  styleUrl: './supplier-form.scss'
})
export class SupplierForm implements OnInit {

  @Input() supplier?: SupplierInterface;
  @Output() saved = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private supplierService = inject(SupplierService);
  private router = inject(Router);

  form!: FormGroup;
  todayDate = this.formatToBackendDateTime(new Date());

  ngOnInit(): void {
    this.initForm();

    if (this.supplier) {
      this.form.patchValue({
        ruc: this.supplier.ruc,
        companyName: this.supplier.company_name,
        cellphone: this.supplier.cellphone,
        registration_date: this.supplier.registration_date,
        ubigeoId: this.supplier.ubigeo_id
      });
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      ruc: [
        '',
        [
          Validators.required,
          Validators.pattern(/^\d{11}$/),
        ]
      ],
      companyName: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-\/().]*$/),
          Validators.maxLength(80),
          Validators.minLength(3)
        ]
      ],
      cellphone: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[0-9]{9}$/)
        ]
      ],
      ubigeoId: ['', Validators.required],

      registration_date: [
        {
          value: this.todayDate,
          disabled: true
        }
      ]
    });
  }

  onSave(): void {
    if (this.form.invalid) {
      this.markAllAsTouched();
      return;
    }

    Swal.fire({
      title: this.supplier ? '¿Actualizar proveedor?' : '¿Registrar nuevo proveedor?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: this.supplier ? 'Actualizar' : 'Registrar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const supplierData = this.prepareSupplierData();

        this.supplierService.save(supplierData).subscribe({
          next: () => this.handleSuccess(
            this.supplier ? '¡Actualizado!' : '¡Registrado!',
            this.supplier ? 'Proveedor actualizado con éxito' : 'Proveedor registrado con éxito'
          ),
          error: (err) => this.handleError(err)
        });
      }
    });
  }

  private prepareSupplierData(): SupplierInterface {
    const formData = this.form.getRawValue();

    return {
      ruc: formData.ruc,
      company_name: formData.companyName,
      cellphone: Number(formData.cellphone),
      ubigeo_id: formData.ubigeoId,
      registration_date: formData.registration_date,
      status: this.supplier?.status ?? true
    };
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

  private handleSuccess(title: string, text: string): void {
    Swal.fire(title, text, 'success');
    this.saved.emit();

    if (!this.supplier) {
      this.form.reset();
      this.initForm();
    }
  }

  private handleError(err: unknown): void {
    console.error('Error:', err);

    let message = 'No se pudo completar la operación';

    if (typeof err === 'object' && err !== null && 'error' in err) {
      const server = (err as any).error;
      if (server?.message) message = server.message;
      else if (server?.errors) message = Object.values(server.errors).join('\n');
    }

    Swal.fire('Error', message, 'error');
  }

  private markAllAsTouched(): void {
    Object.values(this.form.controls).forEach(control => control.markAsTouched());
    Swal.fire('Error', 'Complete todos los campos correctamente', 'error');
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
}

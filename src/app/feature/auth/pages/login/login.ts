import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Loader } from "../../../../shared/components/nire-spa-loader/nire-spa-loader";
import { LoginService } from '@core/services/login.service';
import { Login } from '@core/interfaces/login';
import Swal from 'sweetalert2/dist/sweetalert2.js';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
  standalone: true,
  imports: [FormsModule, Loader, ReactiveFormsModule]
})
export class login implements OnInit {
  username: string = '';
  password: string = '';
  showPassword: boolean = false;
  rememberPassword: boolean = false;
  showForgotPasswordMessage: boolean = false;
  isForgotPasswordClicked: boolean = false;
  isLoading: boolean = true;

  loginForm: FormGroup = new FormGroup({});
  fb = inject(FormBuilder);
  
  ngOnInit(): void {
    setTimeout(() => {
      this.isLoading = false;
    }, 5000);
    this.initLoginForm();
  }
  
  initLoginForm(): void {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', [Validators.required]]
    })
  }

  constructor(
    private router: Router,
    private loginService: LoginService
  ) {}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleRememberPassword(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    this.rememberPassword = checkbox.checked;
  }

  showForgotPasswordAlert() {
    this.isForgotPasswordClicked = true;
    this.showForgotPasswordMessage = true;

    setTimeout(() => {
      this.isForgotPasswordClicked = false;
    }, 600);

    setTimeout(() => {
      this.showForgotPasswordMessage = false;
    }, 3000);
  }

  login() {
    this.isLoading = true;

    if (!this.username || !this.password) {
      this.isLoading = false;
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor completa todos los campos.',
        confirmButtonColor: '#f8bb86'
      });
      return;
    }

    this.loginService.login({ username: this.username, password: this.password }).subscribe({
      next: (token: string) => {
        this.isLoading = false;
        Swal.fire({
          icon: 'success',
          title: 'Inicio de sesión exitoso',
          showConfirmButton: false,
          timer: 1500
        });
        const decoded = this.loginService.getDecodedToken();
        if (decoded) {
          console.log('🔓 Usuario autenticado:', decoded.username, decoded.role);
          this.redirectByRole(decoded.role);
        } else {
          this.router.navigateByUrl('auth/login');
        }
      },
      error: (err: string) => {
        this.isLoading = false;
        Swal.fire({
          icon: 'error',
          title: 'Contraseña incorrecta',
          text: err || 'Revisa tu correo y contraseña.',
          confirmButtonColor: '#80A7A3'
        });
      }
    });
  }

  redirectByRole(role: string): void {
    switch (role) {
      case 'ADMIN': // Admin
        this.router.navigateByUrl('/console');
        break;
      case 'RECEPCIONISTA': // Recepcionista
        this.router.navigate(['/console']);
        break;
      case 'EMPLEADO': // Empleado
        this.router.navigate(['/console']);
        break;
      default:
        this.router.navigate(['/auth/login']);
        break;
    }
  }
}

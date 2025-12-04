import { Component, OnInit, OnDestroy, HostListener, Inject, PLATFORM_ID, ElementRef } from '@angular/core';
import { Router, NavigationEnd, RouterLink, RouterModule } from '@angular/router';
import { filter, Subject, takeUntil } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { LoginService } from '@core/services/login.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterModule],
  standalone: true,
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss']
})
export class Sidebar implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Sidebar minimizado por defecto
  isExpanded = false;
  isMobile = false;
  currentRoute = '';

  // Datos del usuario
  userData = {
    greeting: 'BIENVENIDA🌼',
    userName: 'NIRE CAIRE SORAS',
    avatar: '/Perfil.png',
    email: 'nirecaire@gmail.com'
  };

  // Rutas del menú
  menuRoutes = [
    { path: '/home', label: 'DASHBOARD', icon: '/dashboard.png' },
    { path: '/client', label: 'CLIENTES', icon: '/clientes.png' },
    { path: '/reservations', label: 'RESERVAS', icon: '/reservas.png' },
    { path: '/services', label: 'SERVICIOS', icon: '/servicios.png' },
    { path: '/products', label: 'PRODUCTOS', icon: '/productos.png' },
    { path: '/users', label: 'GESTIÓN DE USUARIOS', icon: '/usuarios.png' },
    { path: '/supplier', label: 'GESTIÓN DE PROVEEDORES', icon: '/proveedores.png' }
  ];

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: object,
    private elementRef: ElementRef
  ) {
    this.checkScreenSize();
  }

  ngOnInit(): void {
    // Obtener ruta actual
    this.currentRoute = this.router.url;

    // Suscribirse a cambios de ruta
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event: NavigationEnd) => {
      this.currentRoute = event.url;
    });

    // Verificar tamaño de pantalla inicial
    this.checkScreenSize();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Detectar cambios en el tamaño de pantalla
   */
  @HostListener('window:resize', ['$event'])
  onResize(): void {
    this.checkScreenSize();
  }

  /**
   * Cerrar sidebar si hago click fuera de él
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const clickedInside = this.elementRef.nativeElement.contains(event.target);
    if (!clickedInside && this.isExpanded) {
      this.closeSidebar();
    }
  }

  /**
   * Verificar si estamos en dispositivo móvil
   */
  private checkScreenSize(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isMobile = window.innerWidth <= 768;
      // Importante: no tocar isExpanded aquí
    }
  }

  /**
   * Verificar si una ruta está activa
   */
  isActive(route: string): boolean {
    if (route === '/home') {
      return this.currentRoute === '/' || this.currentRoute === '/home';
    }
    return this.currentRoute.startsWith(route);
  }

  /**
   * Navegar a una ruta específica
   */
  navigateTo(route: string): void {
    this.router.navigate([route]).then(() => {
      this.currentRoute = this.router.url;

      // En móvil, cerrar sidebar después de navegar
      if (this.isMobile) {
        this.isExpanded = false;
      }
    });
  }

  outsession() : void {
    this.logout();
    this.router.navigateByUrl('/auth/login')
  }

  toggleSidebar(): void {
    this.isExpanded = !this.isExpanded;
  }

  closeSidebar(): void {
    this.isExpanded = false;
  }

  expandSidebar(): void {
    this.isExpanded = true;
  }

  collapseSidebar(): void {
    this.isExpanded = false;
  }

  logout(): void {
    localStorage.clear();
    sessionStorage.clear();

    this.router.navigate(['/login']).then(() => {
      console.log('Sesión cerrada exitosamente');
    });
  }

  onMenuItemClick(route: string): void {
    this.navigateTo(route);
  }

  getMenuIcon(route: string): string {
    const menuItem = this.menuRoutes.find(item => item.path === route);
    return menuItem ? menuItem.icon : '/default.png';
  }

  getMenuLabel(route: string): string {
    const menuItem = this.menuRoutes.find(item => item.path === route);
    return menuItem ? menuItem.label : '';
  }

  hasPermission(route: string): boolean {
    return true;
  }

  onMenuItemHover(route: string): void {
    // Lógica para hover
  }

  onMenuItemLeave(route: string): void {
    // Lógica para salir de hover
  }
}

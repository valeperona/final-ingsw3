import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit {
  
  isLandingPage: boolean = false;
  isJobOpeningAdminPage: boolean = false;
  isMyUserPage: boolean = false;
  isInicioPage: boolean = false;
  isMyApplicationsPage: boolean = false;
  isAdminDashboardPage: boolean = false;
  isLoggedIn: boolean = false;
  currentUser: any = null;
  isRecruiter: boolean = false;
  canManageJobs: boolean = false;  // True si es empresa O recruiter
  isAdmin: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit() {
    // Escuchar cambios de autenticación PRIMERO
    this.authService.isLoggedIn$.subscribe(loggedIn => {
      console.log('🔐 Auth status changed:', loggedIn);
      this.isLoggedIn = loggedIn;
      if (loggedIn) {
        this.loadUserData();
      } else {
        this.currentUser = null;
        this.isRecruiter = false;
        this.canManageJobs = false;
        this.isAdmin = false;
      }
    });

    // Validar token al iniciar
    this.authService.validateToken().subscribe(isValid => {
      console.log('🔐 Token validation result:', isValid);
      this.isLoggedIn = isValid;
      if (isValid) {
        this.loadUserData();
      }
    });

    // Escuchar cambios de ruta
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        console.log('🛣️ Navigation ended:', event.url);
        this.checkCurrentRoute(event.url);
      }
    });

    // Verificar estado inicial
    console.log('🚀 Initial URL:', this.router.url);
    this.checkCurrentRoute(this.router.url);
  }

  checkCurrentRoute(url: string) {
    console.log('🔍 Current URL:', url);
    
    // Limpiar query params para comparación
    const cleanUrl = url.split('?')[0];
    
    // Landing page (solo la raíz y rutas específicas de marketing)
    const landingRoutes = ['/', '/home', '/landing'];
    this.isLandingPage = landingRoutes.includes(cleanUrl);
    
    // Página de inicio con ofertas de trabajo
    this.isInicioPage = cleanUrl === '/inicio' || cleanUrl.startsWith('/inicio');
    
    // Otras páginas específicas
    this.isJobOpeningAdminPage = cleanUrl.includes('/job-opening-administrator');
    this.isMyUserPage = cleanUrl.includes('/my-user');
    this.isMyApplicationsPage = cleanUrl.includes('/mis-postulaciones');
    this.isAdminDashboardPage = cleanUrl.includes('/admin-dashboard');
    
    // Debug para verificar detección
    console.log('🏠 isLandingPage:', this.isLandingPage);
    console.log('💼 isInicioPage:', this.isInicioPage);
    console.log('📋 isJobOpeningAdminPage:', this.isJobOpeningAdminPage);
    console.log('👤 isMyUserPage:', this.isMyUserPage);
    console.log('📄 isMyApplicationsPage:', this.isMyApplicationsPage);
    console.log('⚙️ isAdminDashboardPage:', this.isAdminDashboardPage);
    console.log('🔐 isLoggedIn:', this.isLoggedIn);
  }

  async loadUserData() {
    try {
      this.currentUser = await this.userService.getCurrentUser().toPromise();

      // Verificar si es admin
      this.isAdmin = this.currentUser?.role === 'admin';

      // Verificar si puede gestionar ofertas (empresa O recruiter)
      if (this.currentUser?.role === 'empresa') {
        // Las empresas pueden gestionar ofertas directamente
        this.canManageJobs = true;
        this.isRecruiter = false;
      } else if (this.currentUser?.role === 'candidato') {
        // Los candidatos pueden gestionar si son recruiters
        const recruitingData = await this.userService.getRecruitingCompanies().toPromise();
        this.isRecruiter = recruitingData?.companies?.length > 0;
        this.canManageJobs = this.isRecruiter;
      } else {
        this.isRecruiter = false;
        this.canManageJobs = false;
      }

      console.log('👤 Current user:', this.currentUser);
      console.log('👑 Is admin:', this.isAdmin);
      console.log('🎯 Is recruiter:', this.isRecruiter);
      console.log('💼 Can manage jobs:', this.canManageJobs);
    } catch (error) {
      console.error('Error cargando datos del usuario:', error);
      this.isRecruiter = false;
      this.canManageJobs = false;
      this.isAdmin = false;
    }
  }

  // Métodos de navegación
  onLogin() { this.router.navigate(['/login']); }
  onRegister() { this.router.navigate(['/register']); }
  onLogout() { this.authService.logout(); }
  onProfile() { this.router.navigate(['/my-user']); }
  onHome() { this.router.navigate(['/inicio']); }
  onApplications() { this.router.navigate(['/mis-postulaciones']); }
  onJobAdmin() { this.router.navigate(['/job-opening-administrator']); }
  onAdminDashboard() { this.router.navigate(['/admin-dashboard']); }
}
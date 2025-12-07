import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../components/header/header.component';
import { AuthService } from '../../services/auth.service';
import { JobsService } from '../../services/jobs.service';

interface DashboardStats {
  totalUsers: number;
  totalCandidates: number;
  totalCompanies: number;
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  pendingCompanies: number;
}

interface Company {
  id: number;
  email: string;
  nombre: string;
  descripcion?: string;
  verified: boolean;
  created_at?: string; // Cambiado a opcional
}

interface Candidate {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  created_at?: string; // Cambiado a opcional
  cv_filename?: string;
}

interface Job {
  id: number;
  title: string;
  company_id: number;
  company_name?: string;
  status: string;
  created_at?: string; // Cambiado a opcional
  applications_count?: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  // Estados de carga
  loadingStats = true;
  loadingCompanies = true;
  loadingCandidates = true;
  loadingJobs = true;

  // Datos
  stats: DashboardStats = {
    totalUsers: 0,
    totalCandidates: 0,
    totalCompanies: 0,
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    pendingCompanies: 0
  };

  pendingCompanies: Company[] = [];
  allCompanies: Company[] = [];
  recentCandidates: Candidate[] = [];
  recentJobs: Job[] = [];

  // Vista activa
  activeView: 'dashboard' | 'companies' | 'candidates' | 'jobs' = 'dashboard';

  // Filtros
  companyFilter: 'all' | 'verified' | 'pending' = 'all';
  jobFilter: 'all' | 'active' | 'closed' = 'all';

  constructor(
    private authService: AuthService,
    private jobsService: JobsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loadStats();
    this.loadPendingCompanies();
    this.loadAllCompanies();
    this.loadRecentCandidates();
    this.loadRecentJobs();
  }

  loadStats(): void {
    this.loadingStats = true;
    console.log('🔄 Iniciando carga de estadísticas...');
    
    // Usar directamente el método manual (más confiable)
    this.calculateStatsManually();
  }

  // Método fallback para calcular estadísticas manualmente
  calculateStatsManually(): void {
    console.log('📊 Calculando estadísticas manualmente...');
    
    // Obtener todos los usuarios
    this.authService.getAllUsers(0, 1000).subscribe({
      next: (users) => {
        console.log('👥 Usuarios obtenidos:', users.length);
        
        const candidates = users.filter(u => u.role === 'candidato');
        const companies = users.filter(u => u.role === 'empresa');
        const pendingCompanies = companies.filter(c => !c.verified);
        
        console.log('📈 Candidatos:', candidates.length);
        console.log('🏢 Empresas:', companies.length);
        console.log('⏳ Empresas pendientes:', pendingCompanies.length);
        
        this.stats.totalUsers = users.length;
        this.stats.totalCandidates = candidates.length;
        this.stats.totalCompanies = companies.length;
        this.stats.pendingCompanies = pendingCompanies.length;
        
        // Obtener trabajos con parámetros vacíos
        this.jobsService.searchJobs({}).subscribe({
          next: (response) => {
            const jobs = response.jobs || [];
            console.log('💼 Trabajos obtenidos:', jobs.length);
            
            this.stats.totalJobs = jobs.length;
            this.stats.activeJobs = jobs.filter((j: any) => j.status === 'active').length;
            
            console.log('📊 Trabajos activos:', this.stats.activeJobs);
            console.log('✅ Estadísticas finales:', this.stats);
            
            this.loadingStats = false;
          },
          error: (error) => {
            console.error('❌ Error obteniendo trabajos:', error);
            // Si falla, al menos mostramos las estadísticas de usuarios
            this.stats.totalJobs = 0;
            this.stats.activeJobs = 0;
            this.loadingStats = false;
          }
        });
      },
      error: (error) => {
        console.error('❌ Error obteniendo usuarios:', error);
        this.loadingStats = false;
      }
    });
  }

  loadPendingCompanies(): void {
    this.loadingCompanies = true;
    this.authService.getPendingCompanies().subscribe({
      next: (companies) => {
        this.pendingCompanies = companies;
        this.loadingCompanies = false;
      },
      error: (error) => {
        console.error('Error cargando empresas pendientes:', error);
        this.loadingCompanies = false;
      }
    });
  }

  loadAllCompanies(): void {
    this.authService.getAllUsers(0, 100).subscribe({
      next: (users) => {
        this.allCompanies = users.filter(u => u.role === 'empresa') as Company[];
      },
      error: (error) => {
        console.error('Error cargando empresas:', error);
      }
    });
  }

  loadRecentCandidates(): void {
    this.loadingCandidates = true;
    this.authService.getAllCandidates(0, 20).subscribe({
      next: (candidates) => {
        this.recentCandidates = candidates as Candidate[];
        this.loadingCandidates = false;
      },
      error: (error) => {
        console.error('Error cargando candidatos:', error);
        this.loadingCandidates = false;
      }
    });
  }

  loadRecentJobs(): void {
    this.loadingJobs = true;
    this.jobsService.searchJobs({ page: 1, size: 20 }).subscribe({
      next: (response) => {
        this.recentJobs = response.jobs || [];
        this.loadingJobs = false;
      },
      error: (error) => {
        console.error('Error cargando ofertas:', error);
        this.loadingJobs = false;
      }
    });
  }

  // Acciones de empresas
  verifyCompany(companyEmail: string): void {
    if (confirm(`¿Verificar empresa ${companyEmail}?`)) {
      this.authService.verifyCompany(companyEmail).subscribe({
        next: () => {
          alert('Empresa verificada exitosamente');
          this.loadPendingCompanies();
          this.loadAllCompanies();
          this.loadStats();
        },
        error: (error) => {
          console.error('Error verificando empresa:', error);
          alert('Error al verificar empresa');
        }
      });
    }
  }

  // Acciones de trabajos
  deleteJob(jobId: number): void {
    if (confirm('¿Estás seguro de eliminar esta oferta?')) {
      this.jobsService.deleteJob(jobId).subscribe({
        next: () => {
          alert('Oferta eliminada exitosamente');
          this.loadRecentJobs();
          this.loadStats();
        },
        error: (error) => {
          console.error('Error eliminando oferta:', error);
          alert('Error al eliminar oferta');
        }
      });
    }
  }

  // Navegación entre vistas
  setActiveView(view: 'dashboard' | 'companies' | 'candidates' | 'jobs'): void {
    this.activeView = view;
  }

  // Filtros
  get filteredCompanies(): Company[] {
    if (this.companyFilter === 'all') return this.allCompanies;
    if (this.companyFilter === 'verified') return this.allCompanies.filter(c => c.verified);
    if (this.companyFilter === 'pending') return this.allCompanies.filter(c => !c.verified);
    return this.allCompanies;
  }

  get filteredJobs(): Job[] {
    if (this.jobFilter === 'all') return this.recentJobs;
    if (this.jobFilter === 'active') return this.recentJobs.filter(j => j.status === 'active');
    if (this.jobFilter === 'closed') return this.recentJobs.filter(j => j.status === 'closed');
    return this.recentJobs;
  }

  // Utilidades
  formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
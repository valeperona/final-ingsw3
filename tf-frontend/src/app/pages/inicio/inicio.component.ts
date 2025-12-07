import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { JobsService } from '../../services/jobs.service';
import { AuthService } from '../../services/auth.service';
import { HeaderComponent } from '../../components/header/header.component';
import { JobDetailsModalComponent } from '../../components/job-details-modal/job-details-modal.component';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, JobDetailsModalComponent],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css'
})
export class InicioComponent implements OnInit {

  jobs: any[] = [];
  loading = false;
  error: string | null = null;
  
  // Paginación
  currentPage = 1;
  totalPages = 0;
  totalJobs = 0;

  // Filtros
  searchTerm = '';
  selectedJobType = '';
  selectedWorkModality = '';
  selectedLocation = '';
  minSalary: number | null = null;
  maxSalary: number | null = null;

  // Opciones para filtros
  jobTypes = [
    { value: '', label: 'Todos los tipos' },
    { value: 'full_time', label: 'Tiempo Completo' },
    { value: 'part_time', label: 'Medio Tiempo' },
    { value: 'contract', label: 'Contrato' },
    { value: 'internship', label: 'Prácticas' },
    { value: 'temporary', label: 'Temporal' }
  ];

  workModalities = [
    { value: '', label: 'Todas las modalidades' },
    { value: 'remote', label: 'Remoto' },
    { value: 'onsite', label: 'Presencial' },
    { value: 'hybrid', label: 'Híbrido' }
  ];

  // Estadísticas de la plataforma
  platformStats = {
    active_jobs: 0,
    companies_hiring: 0,
    total_applications: 0
  };

  // Estado de autenticación
  isLoggedIn = false;

  // Modal state
  showJobModal = false;
  selectedJobId: number | null = null;

  constructor(
    private jobsService: JobsService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.checkAuthStatus();
    this.loadPlatformStats();
    this.loadJobs();
  }

  checkAuthStatus() {
    this.authService.isLoggedIn$.subscribe(loggedIn => {
      this.isLoggedIn = loggedIn;
    });
  }

  loadPlatformStats() {
    this.jobsService.getPlatformStats().subscribe({
      next: (stats) => {
        this.platformStats = stats;
      },
      error: (error) => {
        console.error('Error cargando estadísticas:', error);
      }
    });
  }

  loadJobs() {
    this.loading = true;
    this.error = null;

    // Preparar filtros
    const filters: any = {
      page: this.currentPage,
      size: 12
    };

    if (this.searchTerm) filters.search = this.searchTerm;
    if (this.selectedJobType) filters.job_type = this.selectedJobType;
    if (this.selectedWorkModality) filters.work_modality = this.selectedWorkModality;
    if (this.selectedLocation) filters.location = this.selectedLocation;
    if (this.minSalary) filters.salary_min = this.minSalary;
    if (this.maxSalary) filters.salary_max = this.maxSalary;

    this.jobsService.searchJobs(filters).subscribe({
      next: (response) => {
        this.jobs = response.jobs || [];
        this.totalJobs = response.total || 0;
        this.totalPages = response.pages || 0;
        this.currentPage = response.page || 1;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando trabajos:', error);
        this.error = 'Error al cargar los puestos de trabajo. Por favor, intenta nuevamente.';
        this.loading = false;
      }
    });
  }

  // Métodos de filtrado
  onSearch() {
    this.currentPage = 1;
    this.loadJobs();
  }

  onFilterChange() {
    this.currentPage = 1;
    this.loadJobs();
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedJobType = '';
    this.selectedWorkModality = '';
    this.selectedLocation = '';
    this.minSalary = null;
    this.maxSalary = null;
    this.currentPage = 1;
    this.loadJobs();
  }

  // Métodos de paginación
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadJobs();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  getPaginationArray(): number[] {
    const maxVisible = 5;
    const pages = [];
    const startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    const endPage = Math.min(this.totalPages, startPage + maxVisible - 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Métodos de utilidad
  formatJobType(type: string): string {
    const typeMap: { [key: string]: string } = {
      'full_time': 'Tiempo Completo',
      'part_time': 'Medio Tiempo',
      'contract': 'Contrato',
      'internship': 'Prácticas',
      'temporary': 'Temporal'
    };
    return typeMap[type] || type;
  }

  formatWorkModality(modality: string): string {
    const modalityMap: { [key: string]: string } = {
      'remote': 'Remoto',
      'onsite': 'Presencial', 
      'hybrid': 'Híbrido'
    };
    return modalityMap[modality] || modality;
  }

  formatSalary(job: any): string {
    if (!job.show_salary || (!job.salary_min && !job.salary_max)) {
      return 'Salario a convenir';
    }

    const currency = job.salary_currency || 'USD';
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency;

    if (job.salary_min && job.salary_max) {
      return `${symbol}${job.salary_min.toLocaleString()} - ${symbol}${job.salary_max.toLocaleString()}`;
    } else if (job.salary_min) {
      return `Desde ${symbol}${job.salary_min.toLocaleString()}`;
    } else if (job.salary_max) {
      return `Hasta ${symbol}${job.salary_max.toLocaleString()}`;
    }

    return 'Salario a convenir';
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Hace 1 día';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    return `Hace ${Math.floor(diffDays / 30)} meses`;
  }

  truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  // Navegación
  viewJobDetails(jobId: number) {
    this.selectedJobId = jobId;
    this.showJobModal = true;
  }

  closeJobModal() {
    this.showJobModal = false;
    this.selectedJobId = null;
  }

  onApplicationSuccess() {
    // Recargar las estadísticas y jobs para reflejar la nueva aplicación
    this.loadPlatformStats();
    this.loadJobs();
    
    // Opcional: mostrar un mensaje de éxito
    alert('¡Aplicación enviada exitosamente!');
  }

  applyToJob(job: any) {
    if (!this.isLoggedIn) {
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: `/inicio` } 
      });
      return;
    }
    
    // Abrir modal en la sección de aplicación
    this.viewJobDetails(job.id);
  }
}
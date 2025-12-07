import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JobsService } from '../../services/jobs.service';
import { MatcheoService } from '../../services/matcheo.service';
import { isPlatformBrowser } from '@angular/common';
import { CandidateDetailModalComponent, CandidateDetail } from '../candidate-detail-modal/candidate-detail-modal.component';

export interface JobApplication {
  id: number;
  job_id: number;
  user_id: number;
  cover_letter?: string;
  resume_url?: string;
  application_date: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  match_percentage?: number; // 🆕 Porcentaje de compatibilidad
  user_data?: {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    fecha_nacimiento?: string;
    telefono?: string;
    ubicacion?: string;
    linkedin_url?: string;
    github_url?: string;
    portfolio_url?: string;
    biografia?: string;
  };
}

@Component({
  selector: 'app-job-applications-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, CandidateDetailModalComponent],
  templateUrl: './job-applications-modal.component.html',
  styleUrls: ['./job-applications-modal.component.css']
})
export class JobApplicationsModalComponent implements OnInit, OnChanges {
  @Input() isVisible = false;
  @Input() jobId: number | null = null;
  @Input() jobTitle = '';
  @Input() companyName = ''; // 🆕 NUEVO: Input para el nombre de la empresa
  @Output() closeModalEvent = new EventEmitter<void>();
  @Output() notificationEvent = new EventEmitter<{message: string, type: 'success' | 'error'}>();

  applications: JobApplication[] = [];
  filteredApplications: JobApplication[] = [];
  loading = false;
  selectedStatus = '';
  searchTerm = '';
  calculatingMatcheo = false; // 🆕 Estado de cálculo de matcheo

  // Propiedades para el modal de detalle
  showCandidateDetail = false;
  selectedCandidate: CandidateDetail | null = null;

  constructor(
    private jobsService: JobsService,
    private matcheoService: MatcheoService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (this.isVisible && this.jobId) {
      this.loadApplications();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isVisible'] && changes['isVisible'].currentValue && this.jobId) {
      this.loadApplications();
    }
  }

  loadApplications(): void {
    if (!this.jobId) return;
    
    this.loading = true;
    this.jobsService.getJobApplications(this.jobId).subscribe({
      next: (response) => {
        this.applications = response.applications || [];
        this.filteredApplications = [...this.applications];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando aplicaciones:', error);
        this.notificationEvent.emit({
          message: 'Error al cargar las aplicaciones',
          type: 'error'
        });
        this.loading = false;
      }
    });
  }

  filterApplications(): void {
    this.filteredApplications = this.applications.filter(app => {
      const matchesStatus = !this.selectedStatus || app.status === this.selectedStatus;
      const matchesSearch = !this.searchTerm || 
        app.user_data?.nombre?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        app.user_data?.apellido?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        app.user_data?.email?.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      return matchesStatus && matchesSearch;
    });
  }

  closeModal(): void {
    this.isVisible = false;
    this.selectedStatus = '';
    this.searchTerm = '';
    this.applications = [];
    this.filteredApplications = [];
    this.closeModalEvent.emit();
  }

  trackByApplicationId(index: number, application: JobApplication): number {
    return application.id;
  }

  // Abrir modal de detalle del candidato
  openCandidateDetail(application: JobApplication): void {
    console.log('🔍 Abriendo detalle de candidato:', application);
    
    // Convertir JobApplication a CandidateDetail
    this.selectedCandidate = {
      id: application.id,
      job_id: application.job_id,
      user_id: application.user_id,
      cover_letter: application.cover_letter,
      resume_url: application.resume_url,
      application_date: application.application_date,
      status: application.status,
      notes: application.notes,
      created_at: application.created_at,
      updated_at: application.updated_at,
      user_data: application.user_data,
      job_title: this.jobTitle,
      company_name: this.companyName // 🆕 NUEVO: Pasar nombre de empresa al modal de detalle
    };
    
    this.showCandidateDetail = true;
  }

  // Cerrar modal de detalle
  closeCandidateDetail(): void {
    console.log('❌ Cerrando modal de detalle');
    this.showCandidateDetail = false;
    this.selectedCandidate = null;
  }

  // Manejar actualización de candidato
  onCandidateUpdated(updatedCandidate: CandidateDetail): void {
    console.log('🔄 Candidato actualizado:', updatedCandidate);
    
    // Actualizar la aplicación en la lista local
    const index = this.applications.findIndex(app => app.id === updatedCandidate.id);
    if (index !== -1) {
      this.applications[index] = {
        ...this.applications[index],
        status: updatedCandidate.status,
        notes: updatedCandidate.notes
      };
      this.filterApplications(); // Refiltrar para actualizar la vista
    }
  }

  // Manejar notificaciones del modal de detalle
  onCandidateDetailNotification(notification: {message: string, type: 'success' | 'error'}): void {
    this.notificationEvent.emit(notification);
  }

  // Métodos para stats
  getPendingCount(): number {
    return this.applications.filter(app => app.status === 'applied').length;
  }

  getShortlistedCount(): number {
    return this.applications.filter(app => app.status === 'shortlisted').length;
  }

  getAcceptedCount(): number {
    return this.applications.filter(app => app.status === 'accepted').length;
  }

  // Métodos de formateo
  formatStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      'applied': 'Pendiente',
      'reviewing': 'En revisión',
      'shortlisted': 'Preseleccionado',
      'interview_scheduled': 'Entrevista programada',
      'interviewed': 'Entrevistado',
      'rejected': 'Rechazado',
      'accepted': 'Aceptado',
      'withdrawn': 'Retirado'
    };
    return statusMap[status] || status;
  }

  getStatusColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      'applied': 'warning',
      'reviewing': 'info',
      'shortlisted': 'primary',
      'interview_scheduled': 'primary',
      'interviewed': 'secondary',
      'rejected': 'danger',
      'accepted': 'success',
      'withdrawn': 'secondary'
    };
    return colorMap[status] || 'secondary';
  }

  getStatusIcon(status: string): string {
    const iconMap: { [key: string]: string } = {
      'applied': 'bi-clock',
      'reviewing': 'bi-eye',
      'shortlisted': 'bi-star',
      'interview_scheduled': 'bi-calendar-check',
      'interviewed': 'bi-chat-dots',
      'rejected': 'bi-x-circle',
      'accepted': 'bi-check-circle',
      'withdrawn': 'bi-arrow-left-circle'
    };
    return iconMap[status] || 'bi-question-circle';
  }

  formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Hace 1 día';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    return `Hace ${Math.floor(diffDays / 30)} meses`;
  }

  formatBirthDate(birthDate: string | undefined): string {
    if (!birthDate) return 'No especificada';
    
    const date = new Date(birthDate);
    const age = this.calculateAge(birthDate);
    const formattedDate = date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    return age ? `${formattedDate} (${age} años)` : formattedDate;
  }

  calculateAge(birthDate: string): number | null {
    if (!birthDate) return null;
    
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  // Acciones
  updateApplicationStatus(applicationId: number, newStatus: string): void {
    this.jobsService.updateApplicationStatus(applicationId, newStatus).subscribe({
      next: () => {
        // Actualizar el estado localmente
        const application = this.applications.find(app => app.id === applicationId);
        if (application) {
          application.status = newStatus;
          this.filterApplications();
        }
        
        this.notificationEvent.emit({
          message: `Estado actualizado a ${this.formatStatus(newStatus)}`,
          type: 'success'
        });
      },
      error: (error) => {
        console.error('Error actualizando estado:', error);
        this.notificationEvent.emit({
          message: 'Error al actualizar el estado de la aplicación',
          type: 'error'
        });
      }
    });
  }

  downloadCV(resumeUrl: string): void {
    if (isPlatformBrowser(this.platformId)) {
      window.open(resumeUrl, '_blank');
    }
  }

  exportApplications(): void {
    if (!this.jobId) return;

    this.jobsService.exportJobApplications(this.jobId, 'csv').subscribe({
      next: (blob) => {
        // Crear URL del blob y descargar
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `aplicaciones_${this.jobTitle}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);

        this.notificationEvent.emit({
          message: 'Aplicaciones exportadas exitosamente',
          type: 'success'
        });
      },
      error: (error) => {
        console.error('Error exportando:', error);
        this.notificationEvent.emit({
          message: 'Error al exportar las aplicaciones',
          type: 'error'
        });
      }
    });
  }

  // 🆕 Calcular matcheo para todos los candidatos
  calculateMatcheo(): void {
    if (!this.jobId) return;

    this.calculatingMatcheo = true;
    this.matcheoService.calculateMatches(this.jobId).subscribe({
      next: (response) => {
        console.log('✅ Matcheo calculado:', response);

        // Actualizar porcentajes de match en las aplicaciones
        response.matches.forEach(match => {
          const application = this.applications.find(app => app.id === match.application_id);
          if (application) {
            application.match_percentage = match.match_percentage;
          }
        });

        // Ordenar por match_percentage descendente
        this.applications.sort((a, b) => {
          const matchA = a.match_percentage ?? 0;
          const matchB = b.match_percentage ?? 0;
          return matchB - matchA;
        });

        this.filteredApplications = [...this.applications];
        this.filterApplications(); // Re-aplicar filtros si los hay
        this.calculatingMatcheo = false;

        this.notificationEvent.emit({
          message: `Matcheo calculado exitosamente para ${response.total_candidates} candidatos`,
          type: 'success'
        });
      },
      error: (error) => {
        console.error('Error calculando matcheo:', error);
        this.calculatingMatcheo = false;
        this.notificationEvent.emit({
          message: 'Error al calcular el matcheo. Verifica que los candidatos tengan CV analizado.',
          type: 'error'
        });
      }
    });
  }

  // Helper para obtener el color del badge de matcheo
  getMatchColor(percentage: number | undefined): string {
    if (!percentage) return 'secondary';
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'primary';
    if (percentage >= 40) return 'warning';
    return 'danger';
  }
}
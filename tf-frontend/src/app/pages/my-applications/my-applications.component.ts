import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { JobsService } from '../../services/jobs.service';
import { HeaderComponent } from '../../components/header/header.component';
import { JobDetailsModalComponent } from '../../components/job-details-modal/job-details-modal.component';
import { forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

interface Application {
  id: number;
  job_id: number;
  status: string;
  applied_at: string;
  job_title?: string;
  company_name?: string;
  company_id?: number;
  work_modality?: string;
  location?: string;
  compatibility_score?: number;
}

@Component({
  selector: 'app-my-applications',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, JobDetailsModalComponent],
  templateUrl: './my-applications.component.html',
  styleUrls: ['./my-applications.component.css']
})
export class MyApplicationsComponent implements OnInit {
  applications: Application[] = [];
  loading = true;
  error = '';

  // Estadísticas
  totalApplications = 0;
  pendingCount = 0;
  interviewCount = 0;
  acceptedCount = 0;

  // Modal state
  showJobModal = false;
  selectedJobId: number | null = null;

  constructor(
    private jobsService: JobsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadMyApplications();
  }

  loadMyApplications(): void {
    this.loading = true;
    this.jobsService.getMyApplications().subscribe({
      next: (response) => {
        // Filtrar aplicaciones retiradas
        this.applications = (response.applications || []).filter(
          (app: Application) => app.status !== 'withdrawn'
        );
        this.calculateStats();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando postulaciones:', error);
        this.error = 'Error al cargar tus postulaciones';
        this.loading = false;
      }
    });
  }

  calculateStats(): void {
    this.totalApplications = this.applications.length;
    this.pendingCount = this.applications.filter(app => 
      app.status === 'applied' || app.status === 'reviewing'
    ).length;
    this.interviewCount = this.applications.filter(app => 
      app.status === 'interview_scheduled' || app.status === 'interviewed'
    ).length;
    this.acceptedCount = this.applications.filter(app => 
      app.status === 'accepted'
    ).length;
  }

  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      'applied': 'Pendiente',
      'reviewing': 'En revisión',
      'shortlisted': 'Preseleccionado',
      'interview_scheduled': 'Entrevista programada',
      'interviewed': 'Entrevistado',
      'accepted': 'Aceptado',
      'rejected': 'Rechazado',
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
      'accepted': 'success',
      'rejected': 'danger',
      'withdrawn': 'secondary'
    };
    return colorMap[status] || 'secondary';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  viewJobDetails(jobId: number): void {
    this.selectedJobId = jobId;
    this.showJobModal = true;
  }

  closeJobModal(): void {
    this.showJobModal = false;
    this.selectedJobId = null;
  }

  onApplicationSuccess(): void {
    // Recargar aplicaciones para reflejar cambios
    this.loadMyApplications();
  }

  withdrawApplication(applicationId: number): void {
    if (confirm('¿Estás seguro de que quieres retirar esta postulación?')) {
      // Deshabilitar temporalmente mientras se procesa
      this.loading = true;
      
      this.jobsService.deleteApplication(applicationId).subscribe({
        next: () => {
          // Eliminar la aplicación del array local inmediatamente
          this.applications = this.applications.filter((app: Application) => app.id !== applicationId);
          this.calculateStats();
          this.loading = false;
          
          // Mensaje de éxito
          alert('Postulación retirada exitosamente');
        },
        error: (error) => {
          console.error('Error retirando postulación:', error);
          this.loading = false;
          alert('Error al retirar la postulación. Por favor intenta nuevamente.');
        }
      });
    }
  }
}
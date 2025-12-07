import { Component, Input, Output, EventEmitter, OnChanges, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JobsService } from '../../services/jobs.service';
import { AuthService } from '../../services/auth.service';
import { Job, JobUtils } from '../../interfaces/job.interface';

interface ApplicationResponse {
  has_applied: boolean;
}

interface JobApplication {
  cover_letter?: string | null;
}

@Component({
  selector: 'app-job-details-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './job-details-modal.component.html',
  styleUrls: ['./job-details-modal.component.css']
})
export class JobDetailsModalComponent implements OnChanges {
  @Input() jobId: number | null = null;
  @Input() isVisible = false;
  @Output() closeModal = new EventEmitter<void>();
  @Output() applicationSuccess = new EventEmitter<void>();

  job: Job | null = null;
  loading = false;
  error: string | null = null;
  applying = false;
  applicationError: string | null = null;
  applicationSuccessMessage: string | null = null;
  coverLetter = '';
  isLoggedIn = false;
  hasAlreadyApplied = false;
  private isBrowser: boolean;

  constructor(
    private jobsService: JobsService,
    private authService: AuthService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    
    // Suscribirse a cambios de autenticación
    this.authService.isLoggedIn$.subscribe(loggedIn => {
      this.isLoggedIn = loggedIn;
      if (this.job && loggedIn) {
        this.checkIfApplied();
      }
    });
  }

  ngOnChanges(): void {
    if (this.isVisible && this.jobId) {
      this.loadJobDetails();
      this.disableBodyScroll();
    } else {
      this.enableBodyScroll();
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  handleEscapeKey(event: KeyboardEvent): void {
    if (this.isVisible && this.isBrowser) {
      this.close();
    }
  }

  private disableBodyScroll(): void {
    if (this.isBrowser) {
      document.body.style.overflow = 'hidden';
    }
  }

  private enableBodyScroll(): void {
    if (this.isBrowser) {
      document.body.style.overflow = '';
    }
  }

  loadJobDetails(): void {
    if (!this.jobId) return;

    this.loading = true;
    this.error = null;
    this.resetApplicationState();

    this.jobsService.getJobById(this.jobId).subscribe({
      next: (job: Job) => {
        console.log('✅ Job cargado en modal:', job);
        console.log('🏢 Company name:', job.company_name);
        
        this.job = job;
        this.loading = false;
        if (this.isLoggedIn) {
          this.checkIfApplied();
        }
      },
      error: (error: any) => {
        console.error('❌ Error loading job details:', error);
        this.error = 'Error al cargar los detalles del trabajo. Por favor, intenta nuevamente.';
        this.loading = false;
      }
    });
  }

  checkIfApplied(): void {
    if (!this.jobId || !this.isLoggedIn) {
      return;
    }

    this.jobsService.checkIfApplied(this.jobId).subscribe({
      next: (response: ApplicationResponse) => {
        this.hasAlreadyApplied = response.has_applied;
      },
      error: (error: any) => {
        console.error('Error checking application status:', error);
        // No mostrar error al usuario para esto, es información secundaria
        this.hasAlreadyApplied = false;
      }
    });
  }

  applyToJob(): void {
    if (!this.job || this.applying || this.hasAlreadyApplied) return;

    this.applying = true;
    this.applicationError = null;
    this.applicationSuccessMessage = null;

    const applicationData: JobApplication = {
      cover_letter: this.coverLetter.trim() || null
    };

    this.jobsService.applyToJob(this.job.id, applicationData).subscribe({
      next: () => {
        this.applying = false;
        this.hasAlreadyApplied = true;
        this.applicationSuccessMessage = '¡Aplicación enviada con éxito!';
        this.applicationSuccess.emit();
        
        // Limpiar mensaje después de 3 segundos
        setTimeout(() => {
          this.applicationSuccessMessage = null;
        }, 3000);
      },
      error: (error: any) => {
        this.applying = false;
        console.error('Error applying to job:', error);
        
        if (error.error?.detail?.includes('already applied')) {
          // Si ya aplicó, actualizar estado sin mostrar error
          this.hasAlreadyApplied = true;
        } else {
          // Solo mostrar error para errores reales de aplicación
          this.applicationError = error.error?.detail || 'Error al enviar la aplicación. Por favor, intenta nuevamente.';
        }
      }
    });
  }

  close(): void {
    this.closeModal.emit();
    this.resetApplicationState();
    this.enableBodyScroll();
  }

  private resetApplicationState(): void {
    this.coverLetter = '';
    this.applicationError = null;
    this.applicationSuccessMessage = null;
    this.applying = false;
    // NO resetear hasAlreadyApplied aquí, se debe mantener durante la sesión
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }

  // Métodos de utilidad usando JobUtils
  formatJobType(type: string): string {
    return JobUtils.formatJobType(type);
  }

  formatWorkModality(modality: string): string {
    return JobUtils.formatWorkModality(modality);
  }

  formatSalary(job: Job): string {
    return JobUtils.formatSalary(job);
  }

  getTimeAgo(dateString: string): string {
    return JobUtils.getTimeAgo(dateString);
  }
}
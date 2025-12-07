import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JobsService } from '../../services/jobs.service';
import { isPlatformBrowser } from '@angular/common';

export interface CandidateDetail {
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
    cv_filename?: string;
    cv_analizado?: any;
  };
  job_title?: string;
  company_name?: string;
}

@Component({
  selector: 'app-candidate-detail-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './candidate-detail-modal.component.html',
  styleUrls: ['./candidate-detail-modal.component.css']
})
export class CandidateDetailModalComponent implements OnInit, OnChanges {
  @Input() isVisible = false;
  @Input() candidate: CandidateDetail | null = null;
  @Output() closeModalEvent = new EventEmitter<void>();
  @Output() candidateUpdatedEvent = new EventEmitter<CandidateDetail>();
  @Output() notificationEvent = new EventEmitter<{message: string, type: 'success' | 'error'}>();

  showCoverLetter = false;
  showCvAnalysis = false;
  recruiterNotes = '';
  updating = false;

  // 🆕 NUEVO: Array con todos los estados disponibles
  readonly allStatuses = [
    { 
      key: 'applied', 
      label: 'Pendiente', 
      icon: 'bi-clock', 
      class: 'pending' 
    },
    { 
      key: 'reviewing', 
      label: 'En Revisión', 
      icon: 'bi-eye', 
      class: 'reviewing' 
    },
    { 
      key: 'shortlisted', 
      label: 'Preseleccionar', 
      icon: 'bi-star', 
      class: 'shortlisted' 
    },
    { 
      key: 'interview_scheduled', 
      label: 'Programar Entrevista', 
      icon: 'bi-calendar-check', 
      class: 'interview' 
    },
    { 
      key: 'interviewed', 
      label: 'Marcar Entrevistado', 
      icon: 'bi-chat-dots', 
      class: 'interviewed' 
    },
    { 
      key: 'accepted', 
      label: 'Aceptar', 
      icon: 'bi-check-circle', 
      class: 'accepted' 
    },
    { 
      key: 'rejected', 
      label: 'Rechazar', 
      icon: 'bi-x-circle', 
      class: 'rejected' 
    },
    { 
      key: 'withdrawn', 
      label: 'Retirar', 
      icon: 'bi-arrow-left-circle', 
      class: 'withdrawn' 
    }
  ];

  constructor(
    private jobsService: JobsService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['candidate'] && changes['candidate'].currentValue) {
      this.loadInitialData();
    }
  }

  loadInitialData(): void {
    if (this.candidate) {
      this.recruiterNotes = this.candidate.notes || '';
      this.showCoverLetter = false;
    }
  }

  closeModal(): void {
    this.isVisible = false;
    this.showCoverLetter = false;
    this.closeModalEvent.emit();
  }

  // 🔧 MÉTODOS DE FORMATEO CORREGIDOS
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
  updateStatus(newStatus: string): void {
    if (!this.candidate) return;

    console.log(`🔄 Actualizando estado a: ${newStatus}`);
    
    this.updating = true;
    this.jobsService.updateApplicationStatus(this.candidate.id, newStatus).subscribe({
      next: (updatedApplication) => {
        if (this.candidate) {
          this.candidate.status = newStatus;
          this.candidateUpdatedEvent.emit(this.candidate);
        }
        
        this.notificationEvent.emit({
          message: `Estado actualizado a ${this.formatStatus(newStatus)}`,
          type: 'success'
        });
        this.updating = false;
      },
      error: (error) => {
        console.error('Error actualizando estado:', error);
        this.notificationEvent.emit({
          message: 'Error al actualizar el estado',
          type: 'error'
        });
        this.updating = false;
      }
    });
  }

  saveNotes(): void {
    if (!this.candidate) return;

    this.updating = true;
    this.jobsService.addApplicationNote(this.candidate.id, this.recruiterNotes).subscribe({
      next: () => {
        if (this.candidate) {
          this.candidate.notes = this.recruiterNotes;
          this.candidateUpdatedEvent.emit(this.candidate);
        }
        
        this.notificationEvent.emit({
          message: 'Notas guardadas exitosamente',
          type: 'success'
        });
        this.updating = false;
      },
      error: (error) => {
        console.error('Error guardando notas:', error);
        this.notificationEvent.emit({
          message: 'Error al guardar las notas',
          type: 'error'
        });
        this.updating = false;
      }
    });
  }

  downloadCV(resumeUrl?: string): void {
    // Priorizar resume_url de la aplicación, luego cv_filename del usuario
    const cvUrl = resumeUrl || this.candidate?.user_data?.cv_filename;
    
    if (!cvUrl) {
      this.notificationEvent.emit({
        message: 'No hay CV disponible para descargar',
        type: 'error'
      });
      return;
    }

    if (isPlatformBrowser(this.platformId)) {
      // Si es una URL completa, usarla directamente
      if (cvUrl.startsWith('http')) {
        window.open(cvUrl, '_blank');
      } else {
        // Si es solo el nombre del archivo, construir la URL
        const fullUrl = `http://localhost:8000/uploaded_cvs/${cvUrl}`;
        window.open(fullUrl, '_blank');
      }
    }
  }

  // Nuevo método para formatear JSON
  formatJsonAnalysis(jsonData: any): string {
    if (!jsonData) return 'No hay análisis disponible';
    return JSON.stringify(jsonData, null, 2);
  }

  // Nuevo método para verificar si hay CV
  hasCv(): boolean {
    return !!(this.candidate?.user_data?.cv_filename || this.candidate?.resume_url);
  }

  // Nuevo método para verificar si hay análisis de CV
  hasCvAnalysis(): boolean {
    return !!(this.candidate?.user_data?.cv_analizado);
  }
}


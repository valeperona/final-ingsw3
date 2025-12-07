// interfaces/application.interface.ts

export interface JobApplication {
    id: number;
    job_id: number;
    user_id: number;
    cover_letter?: string;
    resume_url?: string;
    application_date: string;
    status: ApplicationStatus;
    notes?: string;
    created_at: string;
    updated_at?: string;
    
    // Datos enriquecidos del usuario
    user_data?: UserData;
    
    // Datos del trabajo
    job_title?: string;
    company_name?: string;
  }
  
  export interface UserData {
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
    created_at?: string;
  }
  
  export enum ApplicationStatus {
    PENDING = 'pending',
    REVIEWING = 'reviewing',
    SHORTLISTED = 'shortlisted',
    INTERVIEW_SCHEDULED = 'interview_scheduled',
    INTERVIEWED = 'interviewed',
    REJECTED = 'rejected',
    ACCEPTED = 'accepted',
    WITHDRAWN = 'withdrawn'
  }
  
  export interface ApplicationListResponse {
    applications: JobApplication[];
    total: number;
    page: number;
    size: number;
    pages: number;
  }
  
  export interface ApplicationFilters {
    status?: ApplicationStatus;
    search?: string;
    date_from?: string;
    date_to?: string;
    page: number;
    size: number;
  }
  
  // Utilidades para formatear aplicaciones
  export class ApplicationUtils {
    static formatApplicationStatus(status: string): string {
      const statusMap: { [key: string]: string } = {
        [ApplicationStatus.PENDING]: 'Pendiente',
        [ApplicationStatus.REVIEWING]: 'En revisión',
        [ApplicationStatus.SHORTLISTED]: 'Preseleccionado',
        [ApplicationStatus.INTERVIEW_SCHEDULED]: 'Entrevista programada',
        [ApplicationStatus.INTERVIEWED]: 'Entrevistado',
        [ApplicationStatus.REJECTED]: 'Rechazado',
        [ApplicationStatus.ACCEPTED]: 'Aceptado',
        [ApplicationStatus.WITHDRAWN]: 'Retirado'
      };
      return statusMap[status] || status;
    }
  
    static getStatusColor(status: string): string {
      const colorMap: { [key: string]: string } = {
        [ApplicationStatus.PENDING]: 'warning',
        [ApplicationStatus.REVIEWING]: 'info',
        [ApplicationStatus.SHORTLISTED]: 'primary',
        [ApplicationStatus.INTERVIEW_SCHEDULED]: 'primary',
        [ApplicationStatus.INTERVIEWED]: 'secondary',
        [ApplicationStatus.REJECTED]: 'danger',
        [ApplicationStatus.ACCEPTED]: 'success',
        [ApplicationStatus.WITHDRAWN]: 'secondary'
      };
      return colorMap[status] || 'secondary';
    }
  
    static getStatusIcon(status: string): string {
      const iconMap: { [key: string]: string } = {
        [ApplicationStatus.PENDING]: 'bi-clock',
        [ApplicationStatus.REVIEWING]: 'bi-eye',
        [ApplicationStatus.SHORTLISTED]: 'bi-star',
        [ApplicationStatus.INTERVIEW_SCHEDULED]: 'bi-calendar-check',
        [ApplicationStatus.INTERVIEWED]: 'bi-chat-dots',
        [ApplicationStatus.REJECTED]: 'bi-x-circle',
        [ApplicationStatus.ACCEPTED]: 'bi-check-circle',
        [ApplicationStatus.WITHDRAWN]: 'bi-arrow-left-circle'
      };
      return iconMap[status] || 'bi-question-circle';
    }
  
    static formatDate(dateString: string): string {
      if (!dateString) return 'No especificada';
      
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  
    static calculateAge(birthDate: string): number | null {
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
  
    static getTimeAgo(dateString: string): string {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
      if (diffDays === 1) return 'Hace 1 día';
      if (diffDays < 7) return `Hace ${diffDays} días`;
      if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
      return `Hace ${Math.floor(diffDays / 30)} meses`;
    }
  }
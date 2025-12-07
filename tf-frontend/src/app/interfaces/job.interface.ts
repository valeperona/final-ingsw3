// interfaces/job.interface.ts

export interface Job {
    id: number;
    title: string;
    description: string;
    requirements?: string;
    benefits?: string;
    company_id: number;
    recruiter_id: number;
    job_type: JobType;
    work_modality: WorkModality;
    location?: string;
    department?: string;
    salary_min?: number;
    salary_max?: number;
    salary_currency?: string;
    show_salary: boolean;
    required_skills?: string[];
    nice_to_have_skills?: string[];
    tags?: string[];
    min_experience_years?: number;
    max_experience_years?: number;
    education_level?: string;
    status: JobStatus;
    positions_available: number;
    positions_filled: number;
    created_at: string;
    updated_at?: string;
    expires_at?: string;
    application_deadline?: string;
    external_application_url?: string;
    view_count: number;
    application_count: number;
    
    // Información adicional de la API
    company_name?: string;
    recruiter_name?: string;
    recruiter_email?: string;
  }
  
  export enum JobType {
    FULL_TIME = 'full_time',
    PART_TIME = 'part_time',
    CONTRACT = 'contract',
    INTERNSHIP = 'internship',
    TEMPORARY = 'temporary'
  }
  
  export enum WorkModality {
    REMOTE = 'remote',
    ONSITE = 'onsite',
    HYBRID = 'hybrid'
  }
  
  export enum JobStatus {
    ACTIVE = 'active',
    PAUSED = 'paused',
    CLOSED = 'closed'
  }
  
  export interface JobFilters {
    search?: string;
    company_id?: number;
    job_type?: JobType;
    work_modality?: WorkModality;
    location?: string;
    salary_min?: number;
    salary_max?: number;
    skills?: string[];
    tags?: string[];
    status?: JobStatus;
    page: number;
    size: number;
  }
  
  export interface JobListResponse {
    jobs: Job[];
    total: number;
    page: number;
    size: number;
    pages: number;
  }
  
  export interface PlatformStats {
    active_jobs: number;
    companies_hiring: number;
    total_applications: number;
  }
  
  // Opciones para los selectores de filtros
  export interface SelectOption {
    value: string;
    label: string;
  }
  
  export const JOB_TYPE_OPTIONS: SelectOption[] = [
    { value: '', label: 'Todos los tipos' },
    { value: JobType.FULL_TIME, label: 'Tiempo Completo' },
    { value: JobType.PART_TIME, label: 'Medio Tiempo' },
    { value: JobType.CONTRACT, label: 'Contrato' },
    { value: JobType.INTERNSHIP, label: 'Prácticas' },
    { value: JobType.TEMPORARY, label: 'Temporal' }
  ];
  
  export const WORK_MODALITY_OPTIONS: SelectOption[] = [
    { value: '', label: 'Todas las modalidades' },
    { value: WorkModality.REMOTE, label: 'Remoto' },
    { value: WorkModality.ONSITE, label: 'Presencial' },
    { value: WorkModality.HYBRID, label: 'Híbrido' }
  ];
  
  // Utilidades para formatear
  export class JobUtils {
    static formatJobType(type: string): string {
      const typeMap: { [key: string]: string } = {
        [JobType.FULL_TIME]: 'Tiempo Completo',
        [JobType.PART_TIME]: 'Medio Tiempo',
        [JobType.CONTRACT]: 'Contrato',
        [JobType.INTERNSHIP]: 'Prácticas',
        [JobType.TEMPORARY]: 'Temporal'
      };
      return typeMap[type] || type;
    }
  
    static formatWorkModality(modality: string): string {
      const modalityMap: { [key: string]: string } = {
        [WorkModality.REMOTE]: 'Remoto',
        [WorkModality.ONSITE]: 'Presencial',
        [WorkModality.HYBRID]: 'Híbrido'
      };
      return modalityMap[modality] || modality;
    }
  
    static formatSalary(job: Job): string {
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
  
    static truncateText(text: string, maxLength: number): string {
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength) + '...';
    }
  }
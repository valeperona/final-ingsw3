import { Component, OnInit, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JobsService } from '../../services/jobs.service';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
// Importar header, footer y los modales
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { JobApplicationsModalComponent } from '../../components/job-applications-modal/job-applications-modal.component';
import { AiAssistantModalComponent } from '../../components/ai-assistant-modal/ai-assistant-modal.component';
import { GeneratedJobPosting } from '../../services/assistant.service';

@Component({
  selector: 'app-job-opening-administrator',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HeaderComponent,
    FooterComponent,
    JobApplicationsModalComponent,
    AiAssistantModalComponent
  ],
  templateUrl: './job-opening-administrator.component.html',
  styleUrls: ['./job-opening-administrator.component.css']
})
export class JobOpeningAdministratorComponent implements OnInit {

  job: any = {
    title: '',
    description: '',
    requirements: '',
    company_id: null,
    job_type: 'full_time',
    work_modality: 'onsite',
    location: '',
    salary_min: null,
    salary_max: null,
    positions_available: 1,
    min_experience_years: 0,
    max_experience_years: null,
    status: 'active' // 🆕 NUEVO: Campo de estado por defecto
  };

  companies: any[] = [];
  myJobs: any[] = [];
  loading = false;
  showForm = false;
  isEditing = false;
  editingJobId: number | null = null;
  errors: string[] = [];
  currentUserRole: string = '';  // 🆕 Para detectar si es empresa o recruiter
  currentUserId: number | null = null;  // 🆕 ID del usuario actual

  // Para el diseño profesional
  showSuccessNotification = false;
  showErrorNotification = false;
  successMessage = '';
  errorMessage = '';

  // Para el modal de aplicaciones
  showApplicationsModal = false;
  selectedJobId: number | null = null;
  selectedJobTitle = '';
  selectedCompanyName = ''; // 🆕 NUEVO: Para pasar el nombre de la empresa

  // 🤖 Para el modal de AI Assistant
  showAiAssistantModal = false;

  // 🆕 Para gestión de recruiters (solo empresas)
  availableRecruiters: any[] = [];  // Recruiters disponibles de la empresa
  assignedRecruiters: any[] = [];   // Recruiters asignados a la oferta actual
  selectedRecruiterIds: number[] = [];  // IDs seleccionados para asignar
  showRecruiterManagement = false;  // Mostrar/ocultar sección de recruiters

  constructor(
    private jobsService: JobsService,
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  async ngOnInit(): Promise<void> {
    if (isPlatformBrowser(this.platformId)) {
      await this.loadCurrentUser();
      this.loadCompanies();
      this.loadMyJobs();
    }
  }

  // 🆕 Cargar información del usuario actual
  async loadCurrentUser(): Promise<void> {
    try {
      const user = await this.userService.getCurrentUser().toPromise();
      this.currentUserRole = user?.role || '';
      this.currentUserId = user?.id || null;

      console.log('👤 Current user role:', this.currentUserRole);
      console.log('👤 Current user ID:', this.currentUserId);

      // Si es empresa, pre-asignar su company_id
      if (this.currentUserRole === 'empresa') {
        this.job.company_id = this.currentUserId;
        // Para empresas, crear una entrada "ficticia" en companies
        this.companies = [{
          id: this.currentUserId,
          nombre: user?.nombre || 'Mi Empresa'
        }];
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  }

  private showAlert(message: string) {
    if (isPlatformBrowser(this.platformId)) {
      alert(message);
    } else {
      console.log('ALERT:', message);
    }
  }

  // Método mejorado para mostrar notificaciones
  private showNotification(message: string, type: 'success' | 'error') {
    if (type === 'success') {
      this.successMessage = message;
      this.showSuccessNotification = true;
      setTimeout(() => {
        this.showSuccessNotification = false;
      }, 4000);
    } else {
      this.errorMessage = message;
      this.showErrorNotification = true;
      setTimeout(() => {
        this.showErrorNotification = false;
      }, 4000);
    }
  }

  loadCompanies(): void {
    // Si es empresa, ya se cargó en loadCurrentUser()
    if (this.currentUserRole === 'empresa') {
      console.log('🏢 Es empresa, companies ya cargado:', this.companies);
      return;
    }

    // Si es recruiter, cargar empresas asignadas
    this.jobsService.getMyRecruiterCompanies().subscribe({
      next: (response) => {
        this.companies = response.companies || [];
        if (this.companies.length === 1) {
          this.job.company_id = this.companies[0].id;
        }
        console.log('👔 Es recruiter, companies cargados:', this.companies);
      },
      error: (error) => {
        console.error('Error:', error);
        this.showNotification('No eres recruiter para ninguna empresa', 'error');
        this.router.navigate(['/']);
      }
    });
  }

  loadMyJobs(): void {
    this.jobsService.getMyJobs().subscribe({
      next: (response) => {
        this.myJobs = response.jobs || [];
      },
      error: (error) => {
        console.error('Error:', error);
        this.showNotification('Error al cargar las ofertas', 'error');
      }
    });
  }

  validateForm(): boolean {
    this.errors = [];

    if (!this.job.title || this.job.title.length < 3) {
      this.errors.push('title');
    }

    if (!this.job.description || this.job.description.length < 10) {
      this.errors.push('description');
    }

    if (!this.job.company_id) {
      this.errors.push('company');
    }

    if (this.job.salary_min && this.job.salary_max && this.job.salary_min > this.job.salary_max) {
      this.errors.push('salary');
    }

    if (this.job.positions_available && this.job.positions_available < 1) {
      this.errors.push('positions');
    }

    // Validar experiencia
    if (this.job.min_experience_years < 0) {
      this.errors.push('min_experience');
    }

    if (this.job.max_experience_years && this.job.min_experience_years && 
        this.job.max_experience_years < this.job.min_experience_years) {
      this.errors.push('max_experience');
    }

    return this.errors.length === 0;
  }

  saveJob(): void {
    if (!this.validateForm()) {
      this.showNotification('Por favor completa todos los campos obligatorios correctamente', 'error');
      return;
    }

    this.loading = true;
    const jobData = {
      ...this.job,
      company_id: parseInt(this.job.company_id)
    };

    if (this.isEditing && this.editingJobId) {
      // Actualizar oferta existente
      this.jobsService.updateJob(this.editingJobId, jobData).subscribe({
        next: () => {
          this.showNotification('Oferta actualizada exitosamente', 'success');
          this.cancelEdit();
          this.loadMyJobs();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error completo:', error);
          this.showNotification('Error al actualizar la oferta', 'error');
          this.loading = false;
        }
      });
    } else {
      // Crear nueva oferta
      this.jobsService.createJob(jobData).subscribe({
        next: () => {
          this.showNotification('Oferta creada exitosamente', 'success');
          this.showForm = false;
          this.resetForm();
          this.loadMyJobs();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error completo:', error);
          this.showNotification('Error al crear la oferta', 'error');
          this.loading = false;
        }
      });
    }
  }

  async editJob(job: any): Promise<void> {
    this.isEditing = true;
    this.editingJobId = job.id;
    this.showForm = true;

    // 🆕 NUEVO: Cargar datos del job en el formulario incluyendo el estado
    this.job = {
      title: job.title,
      description: job.description,
      requirements: job.requirements || '',
      company_id: job.company_id,
      job_type: job.job_type,
      work_modality: job.work_modality,
      location: job.location || '',
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      positions_available: job.positions_available,
      min_experience_years: job.min_experience_years || 0,
      max_experience_years: job.max_experience_years,
      status: job.status || 'active' // 🆕 NUEVO: Incluir el estado
    };

    // 🆕 Cargar gestión de recruiters (para empresas y recruiters)
    await this.loadRecruiterManagement(job.id);
  }

  // 🆕 Cargar información de recruiters para gestión
  async loadRecruiterManagement(jobId: number): Promise<void> {
    try {
      // Siempre cargar recruiters asignados a esta oferta
      this.assignedRecruiters = await this.jobsService.getJobRecruiters(jobId).toPromise() || [];

      // Solo cargar recruiters disponibles si es empresa
      if (this.currentUserRole === 'empresa' && this.currentUserId) {
        this.availableRecruiters = await this.jobsService.getCompanyRecruiters(this.currentUserId).toPromise() || [];
        // Pre-seleccionar recruiters asignados
        this.selectedRecruiterIds = this.assignedRecruiters.map(r => r.id);
      } else {
        // Si es recruiter, puede cargar los disponibles de la empresa de la oferta
        const companyId = this.job.company_id;
        if (companyId) {
          this.availableRecruiters = await this.jobsService.getCompanyRecruiters(companyId).toPromise() || [];
          this.selectedRecruiterIds = this.assignedRecruiters.map(r => r.id);
        }
      }

      console.log('👔 Available recruiters:', this.availableRecruiters);
      console.log('✅ Assigned recruiters:', this.assignedRecruiters);
    } catch (error) {
      console.error('Error loading recruiter management:', error);
      this.availableRecruiters = [];
      this.assignedRecruiters = [];
    }
  }

  // 🆕 Asignar recruiters a la oferta
  async assignRecruitersToJob(): Promise<void> {
    if (!this.editingJobId) return;

    try {
      await this.jobsService.assignRecruiters(this.editingJobId, this.selectedRecruiterIds).toPromise();
      this.showNotification('Recruiters asignados exitosamente', 'success');

      // Recargar recruiters asignados
      this.assignedRecruiters = await this.jobsService.getJobRecruiters(this.editingJobId).toPromise() || [];
    } catch (error) {
      console.error('Error assigning recruiters:', error);
      this.showNotification('Error al asignar recruiters', 'error');
    }
  }

  // 🆕 Toggle selección de recruiter
  toggleRecruiterSelection(recruiterId: number): void {
    const index = this.selectedRecruiterIds.indexOf(recruiterId);
    if (index > -1) {
      this.selectedRecruiterIds.splice(index, 1);
    } else {
      this.selectedRecruiterIds.push(recruiterId);
    }
  }

  // 🆕 Verificar si un recruiter está seleccionado
  isRecruiterSelected(recruiterId: number): boolean {
    return this.selectedRecruiterIds.includes(recruiterId);
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.editingJobId = null;
    this.showForm = false;
    this.resetForm();
  }

  deleteJob(jobId: number): void {
    if (isPlatformBrowser(this.platformId) && confirm('¿Estás seguro de que quieres eliminar esta oferta?')) {
      this.jobsService.deleteJob(jobId).subscribe({
        next: () => {
          this.showNotification('Oferta eliminada exitosamente', 'success');
          this.loadMyJobs();
        },
        error: () => {
          this.showNotification('Error al eliminar la oferta', 'error');
        }
      });
    }
  }

  resetForm(): void {
    this.job = {
      title: '',
      description: '',
      requirements: '',
      company_id: this.companies.length === 1 ? this.companies[0].id : null,
      job_type: 'full_time',
      work_modality: 'onsite',
      location: '',
      salary_min: null,
      salary_max: null,
      positions_available: 1,
      min_experience_years: 0,
      max_experience_years: null,
      status: 'active' // 🆕 NUEVO: Estado por defecto
    };
    this.errors = [];
  }

  // Métodos para el diseño profesional
  getActiveJobsCount(): number {
    return this.myJobs.filter(job => job.status === 'active').length;
  }

  getTotalApplications(): number {
    return this.myJobs.reduce((total, job) => total + (job.application_count || 0), 0);
  }

  trackByJobId(index: number, job: any): number {
    return job.id;
  }

  // Métodos actualizados para iconos Bootstrap
  getStatusIcon(status: string): string {
    const iconMap: { [key: string]: string } = {
      'active': 'bi-check-circle',
      'paused': 'bi-pause-circle',
      'closed': 'bi-x-circle'
    };
    return iconMap[status] || 'bi-question-circle';
  }

  getStatusText(status: string): string {
    const textMap: { [key: string]: string } = {
      'active': 'Activa',
      'paused': 'Pausada',
      'closed': 'Cerrada'
    };
    return textMap[status] || status;
  }

  getModalityIcon(modality: string): string {
    const iconMap: { [key: string]: string } = {
      'remote': 'bi-laptop',
      'onsite': 'bi-building',
      'hybrid': 'bi-arrow-repeat'
    };
    return iconMap[modality] || 'bi-geo-alt';
  }

  getModalityText(modality: string): string {
    const textMap: { [key: string]: string } = {
      'remote': 'Remoto',
      'onsite': 'Presencial',
      'hybrid': 'Híbrido'
    };
    return textMap[modality] || modality;
  }

  getModalityClass(modality: string): string {
    // Para aplicar diferentes estilos CSS según la modalidad
    const classMap: { [key: string]: string } = {
      'remote': 'active',    // Verde
      'onsite': 'paused',    // Amarillo
      'hybrid': 'closed'     // Rojo/Rosa
    };
    return classMap[modality] || 'active';
  }

  // Método para formatear la experiencia en la tabla
  formatExperienceDisplay(job: any): string {
    const min = job.min_experience_years || 0;
    const max = job.max_experience_years;

    if (min === 0 && !max) {
      return 'Sin experiencia';
    } else if (min > 0 && max) {
      return `${min}-${max} años`;
    } else if (min > 0) {
      return `Mín ${min} años`;
    } else if (max) {
      return `Máx ${max} años`;
    } else {
      return 'No especificada';
    }
  }

  // 🆕 ACTUALIZADO: Ver aplicaciones con nombre de empresa
  viewApplications(job: any): void {
    this.selectedJobId = job.id;
    this.selectedJobTitle = job.title;
    this.selectedCompanyName = job.company_name; // 🆕 NUEVO: Obtener nombre de empresa
    this.showApplicationsModal = true;
  }

  // Cerrar modal de aplicaciones
  closeApplicationsModal(): void {
    this.showApplicationsModal = false;
    this.selectedJobId = null;
    this.selectedJobTitle = '';
    this.selectedCompanyName = ''; // 🆕 NUEVO: Limpiar nombre de empresa
  }

  // Manejar notificaciones del modal
  handleModalNotification(event: {message: string, type: 'success' | 'error'}): void {
    this.showNotification(event.message, event.type);
  }

  // 🤖 Métodos para AI Assistant
  openAiAssistant(): void {
    this.showAiAssistantModal = true;
  }

  closeAiAssistant(): void {
    this.showAiAssistantModal = false;
  }

  handleGeneratedFields(generatedData: GeneratedJobPosting): void {
    console.log('✨ Aplicando campos generados por IA:', generatedData);

    // Aplicar campos generados al formulario
    this.job.title = generatedData.title;
    this.job.description = generatedData.description;
    this.job.requirements = generatedData.requirements;
    this.job.min_experience_years = generatedData.min_experience_years;
    this.job.max_experience_years = generatedData.max_experience_years;

    // Mapear sugerencias si existen
    if (generatedData.suggested_job_type) {
      const jobTypeMap: { [key: string]: string } = {
        'tiempo_completo': 'full_time',
        'medio_tiempo': 'part_time',
        'freelance': 'freelance',
        'pasantia': 'internship'
      };
      this.job.job_type = jobTypeMap[generatedData.suggested_job_type] || 'full_time';
    }

    if (generatedData.suggested_work_modality) {
      const modalityMap: { [key: string]: string } = {
        'presencial': 'onsite',
        'remoto': 'remote',
        'hibrido': 'hybrid'
      };
      this.job.work_modality = modalityMap[generatedData.suggested_work_modality] || 'onsite';
    }

    // Mostrar notificación de éxito
    this.showNotification('Campos completados exitosamente con IA. Revisa y ajusta si es necesario.', 'success');

    // Cerrar modal de IA
    this.showAiAssistantModal = false;
  }

  // Obtener nombre de la empresa seleccionada (para pasar al modal de IA)
  getSelectedCompanyName(): string {
    const company = this.companies.find(c => c.id === parseInt(this.job.company_id));
    return company?.nombre || '';
  }
}
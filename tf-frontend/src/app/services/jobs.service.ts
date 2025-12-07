import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class JobsService {
  private jobsApiUrl = 'http://localhost:8002/api/v1';
  private userApiUrl = 'http://localhost:8000/api/v1';
  private companiesCache = new Map<number, string>(); // Cache para nombres de empresas

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  // REEMPLAZA el método getHeaders() (líneas 18-28 aproximadamente)
// Por esta versión mejorada:

private getHeaders(): HttpHeaders {
  let token = '';
  
  // Verificar si estamos en el navegador
  if (isPlatformBrowser(this.platformId)) {
    token = localStorage.getItem('token') || '';
    
    // Debug: verificar que el token se obtuvo correctamente
    console.log('🔑 Obteniendo headers - Token presente:', !!token);
    if (token) {
      console.log('🔑 Token (primeros 20 chars):', token.substring(0, 20) + '...');
    } else {
      console.error('❌ No se pudo obtener el token de localStorage');
    }
  } else {
    console.warn('⚠️ No está en plataforma navegador');
  }

  const headers = new HttpHeaders({
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  });

  // Debug: verificar headers finales
  console.log('📋 Headers creados:', {
    hasContentType: headers.has('Content-Type'),
    hasAuthorization: headers.has('Authorization')
  });

  return headers;
}

  // Método para obtener información de una empresa desde UserAPI
  private getCompanyInfo(companyId: number): Observable<any> {
    // Si ya está en cache, devolver desde cache
    if (this.companiesCache.has(companyId)) {
      return of({ nombre: this.companiesCache.get(companyId) });
    }

    // Usar headers con autenticación
    return this.http.get(`${this.userApiUrl}/users/${companyId}`, { 
      headers: this.getHeaders() 
    }).pipe(
      map((company: any) => {
        // Guardar en cache
        if (company && company.nombre) {
          this.companiesCache.set(companyId, company.nombre);
        }
        return company;
      }),
      catchError((error) => {
        console.warn(`No se pudo obtener info de empresa ${companyId}:`, error);
        // Si no está autenticado, usar fallback simple
        const fallbackName = `Company ${companyId}`;
        this.companiesCache.set(companyId, fallbackName);
        return of({ nombre: fallbackName });
      })
    );
  }

  // Método para enriquecer un job con nombre real de empresa
  private enrichJobWithCompanyName(job: any): Observable<any> {
    if (!job || !job.company_id) {
      return of(job);
    }

    // Solo intentar enriquecer si hay token (usuario autenticado)
    let token = '';
    if (isPlatformBrowser(this.platformId)) {
      token = localStorage.getItem('token') || '';
    }

    if (!token) {
      // Si no hay token, usar fallback inmediato
      return of({
        ...job,
        company_name: job.company_name || `Company ${job.company_id}`
      });
    }

    return this.getCompanyInfo(job.company_id).pipe(
      map(companyInfo => ({
        ...job,
        company_name: companyInfo?.nombre || job.company_name || `Company ${job.company_id}`
      }))
    );
  }

  // Método para enriquecer múltiples jobs con nombres reales
  private enrichJobsWithCompanyNames(jobs: any[]): Observable<any[]> {
    if (!jobs || jobs.length === 0) {
      return of([]);
    }

    // Solo intentar enriquecer si hay token (usuario autenticado)
    let token = '';
    if (isPlatformBrowser(this.platformId)) {
      token = localStorage.getItem('token') || '';
    }

    if (!token) {
      // Si no hay token, devolver jobs con nombres por defecto
      return of(jobs.map(job => ({
        ...job,
        company_name: job.company_name || `Company ${job.company_id}`
      })));
    }

    // Obtener company_ids únicos
    const uniqueCompanyIds = [...new Set(jobs.map(job => job.company_id))];
    
    // Crear observables para obtener info de cada empresa
    const companyRequests = uniqueCompanyIds.map(companyId => 
      this.getCompanyInfo(companyId).pipe(
        map(info => ({ id: companyId, name: info?.nombre || `Company ${companyId}` }))
      )
    );

    if (companyRequests.length === 0) {
      return of(jobs);
    }

    return forkJoin(companyRequests).pipe(
      map(companies => {
        // Crear mapa de companyId -> nombre
        const companyMap = new Map();
        companies.forEach(company => {
          companyMap.set(company.id, company.name);
        });

        // Enriquecer jobs con nombres reales
        return jobs.map(job => ({
          ...job,
          company_name: companyMap.get(job.company_id) || job.company_name || `Company ${job.company_id}`
        }));
      }),
      catchError((error) => {
        console.warn('Error enriqueciendo jobs con nombres de empresas:', error);
        return of(jobs.map(job => ({
          ...job,
          company_name: job.company_name || `Company ${job.company_id}`
        }))); // Si falla, devolver jobs con nombres por defecto
      })
    );
  }

  // Método privado para enriquecer aplicaciones con datos de usuario
  private enrichApplicationsWithUserData(applications: any[]): Observable<any[]> {
    if (!applications || applications.length === 0) {
      return of([]);
    }

    // Obtener user_ids únicos
    const uniqueUserIds = [...new Set(applications.map(app => app.user_id))];
    
    // Crear observables para obtener info de cada usuario
    const userRequests = uniqueUserIds.map(userId => 
      this.getUserInfo(userId).pipe(
        map(info => ({ 
          id: userId, 
          data: info 
        }))
      )
    );

    if (userRequests.length === 0) {
      return of(applications);
    }

    return forkJoin(userRequests).pipe(
      map(users => {
        // Crear mapa de userId -> datos de usuario
        const userMap = new Map();
        users.forEach(user => {
          userMap.set(user.id, user.data);
        });

        // Enriquecer aplicaciones con datos de usuario
        return applications.map(application => ({
          ...application,
          user_data: userMap.get(application.user_id) || {
            nombre: 'Usuario desconocido',
            apellido: '',
            email: 'email@desconocido.com',
            fecha_nacimiento: null
          }
        }));
      }),
      catchError((error) => {
        console.warn('Error enriqueciendo aplicaciones con datos de usuario:', error);
        return of(applications.map(app => ({
          ...app,
          user_data: {
            nombre: 'Usuario desconocido',
            apellido: '',
            email: 'email@desconocido.com',
            fecha_nacimiento: null
          }
        })));
      })
    );
  }

  // Método para obtener información de un usuario desde UserAPI
  private getUserInfo(userId: number): Observable<any> {
    return this.http.get(`${this.userApiUrl}/users/${userId}`, { 
      headers: this.getHeaders() 
    }).pipe(
      catchError((error) => {
        console.warn(`No se pudo obtener info de usuario ${userId}:`, error);
        return of({
          nombre: 'Usuario desconocido',
          apellido: '',
          email: 'email@desconocido.com',
          fecha_nacimiento: null
        });
      })
    );
  }

  // ===== MÉTODOS BÁSICOS DE JOBS =====

  createJob(jobData: any): Observable<any> {
    return this.http.post(`${this.jobsApiUrl}/jobs`, jobData, { headers: this.getHeaders() });
  }

  updateJob(jobId: number, jobData: any): Observable<any> {
    return this.http.put(`${this.jobsApiUrl}/jobs/${jobId}`, jobData, { headers: this.getHeaders() });
  }

  getMyRecruiterCompanies(): Observable<any> {
    return this.http.get(`${this.userApiUrl}/me/recruiting-for`, { headers: this.getHeaders() });
  }

  getMyJobs(): Observable<any> {
    return this.http.get(`${this.jobsApiUrl}/my-jobs`, { headers: this.getHeaders() });
  }

  deleteJob(jobId: number): Observable<any> {
    return this.http.delete(`${this.jobsApiUrl}/jobs/${jobId}`, { headers: this.getHeaders() });
  }

  // ===== MÉTODOS DE APLICACIONES =====

  // Obtener aplicaciones de un trabajo específico
  getJobApplications(jobId: number, page: number = 1, size: number = 20): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    // 🔒 SEGURIDAD: JobsAPI ya devuelve los datos completos del usuario en user_data
    // No necesitamos hacer llamadas adicionales a UserAPI
    return this.http.get(`${this.jobsApiUrl}/jobs/${jobId}/applications`, {
      params,
      headers: this.getHeaders()
    }).pipe(
      catchError((error) => {
        console.error('Error obteniendo aplicaciones del trabajo:', error);
        throw error;
      })
    );
  }

  // Actualizar estado de una aplicación
  updateApplicationStatus(applicationId: number, newStatus: string): Observable<any> {
    const statusData = { status: newStatus };
    return this.http.put(
      `${this.jobsApiUrl}/applications/${applicationId}/status`, 
      statusData, 
      { headers: this.getHeaders() }
    ).pipe(
      catchError((error) => {
        console.error('Error actualizando estado de aplicación:', error);
        throw error;
      })
    );
  }

  // Agregar notas a una aplicación
  addApplicationNote(applicationId: number, note: string): Observable<any> {
    const noteData = { notes: note };
    return this.http.put(
      `${this.jobsApiUrl}/applications/${applicationId}/notes`, 
      noteData, 
      { headers: this.getHeaders() }
    ).pipe(
      catchError((error) => {
        console.error('Error agregando nota a aplicación:', error);
        throw error;
      })
    );
  }

  // Obtener detalles completos de una aplicación
  getApplicationDetails(applicationId: number): Observable<any> {
    return this.http.get(
      `${this.jobsApiUrl}/applications/${applicationId}`, 
      { headers: this.getHeaders() }
    ).pipe(
      switchMap((application: any) => {
        if (application && application.user_id) {
          return this.getUserInfo(application.user_id).pipe(
            map(userData => ({
              ...application,
              user_data: userData
            }))
          );
        }
        return of(application);
      }),
      catchError((error) => {
        console.error('Error obteniendo detalles de aplicación:', error);
        throw error;
      })
    );
  }

  // Eliminar una aplicación
  deleteApplication(applicationId: number): Observable<any> {
    return this.http.delete(
      `${this.jobsApiUrl}/applications/${applicationId}`, 
      { headers: this.getHeaders() }
    ).pipe(
      catchError((error) => {
        console.error('Error eliminando aplicación:', error);
        throw error;
      })
    );
  }

  // Exportar aplicaciones a CSV
  exportJobApplications(jobId: number, format: string = 'csv'): Observable<Blob> {
    const params = new HttpParams().set('format', format);
    
    return this.http.get(
      `${this.jobsApiUrl}/jobs/${jobId}/applications/export`, 
      { 
        params,
        headers: this.getHeaders(),
        responseType: 'blob'
      }
    ).pipe(
      catchError((error) => {
        console.error('Error exportando aplicaciones:', error);
        throw error;
      })
    );
  }

  // ===== MÉTODOS ACTUALIZADOS CON NOMBRES REALES DE EMPRESAS =====

  searchJobs(filters: any): Observable<any> {
    let params = new HttpParams();

    // Agregar parámetros de filtros
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
        params = params.set(key, filters[key].toString());
      }
    });

    // El backend ya devuelve los nombres reales de las empresas usando el endpoint interno
    return this.http.get(`${this.jobsApiUrl}/jobs`, { params }).pipe(
      catchError((error) => {
        console.error('Error en searchJobs:', error);
        throw error;
      })
    );
  }

  getJobById(jobId: number): Observable<any> {
    // El backend ya devuelve el nombre real de la empresa usando el endpoint interno
    return this.http.get(`${this.jobsApiUrl}/jobs/${jobId}`).pipe(
      catchError((error) => {
        console.error('Error en getJobById:', error);
        throw error;
      })
    );
  }

  getCompanyJobs(companyId: number, page: number = 1, size: number = 20): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    // El backend ya devuelve el nombre real de la empresa usando el endpoint interno
    return this.http.get(`${this.jobsApiUrl}/companies/${companyId}/jobs`, { params }).pipe(
      catchError((error) => {
        console.error('Error en getCompanyJobs:', error);
        throw error;
      })
    );
  }

  // Verificar si ya aplicó
  checkIfApplied(jobId: number): Observable<{ has_applied: boolean }> {
    return this.http.get<{ has_applied: boolean }>(
      `${this.jobsApiUrl}/jobs/${jobId}/check-application`,
      { headers: this.getHeaders() }
    );
  }

  getPlatformStats(): Observable<any> {
    return this.http.get(`${this.jobsApiUrl}/stats/overview`);
  }

  // Método para aplicar a una oferta (requiere autenticación)
  applyToJob(jobId: number, applicationData: any): Observable<any> {
    return this.http.post(
      `${this.jobsApiUrl}/jobs/${jobId}/apply`, 
      applicationData, 
      { headers: this.getHeaders() }
    );
  }

  // Obtener mis aplicaciones (requiere autenticación)
  getMyApplications(page: number = 1, size: number = 20): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get(`${this.jobsApiUrl}/my-applications`, { 
      params, 
      headers: this.getHeaders() 
    });
  }

  // Método para limpiar cache de empresas (útil al hacer logout)
  clearCompaniesCache(): void {
    this.companiesCache.clear();
  }

  // ===== MÉTODOS PARA GESTIÓN DE RECRUITERS (Company-centric) =====

  // Obtener recruiters asignados a una oferta
  getJobRecruiters(jobId: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.jobsApiUrl}/jobs/${jobId}/recruiters`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError((error) => {
        console.error('Error obteniendo recruiters de la oferta:', error);
        throw error;
      })
    );
  }

  // Asignar recruiters a una oferta
  assignRecruiters(jobId: number, recruiterIds: number[]): Observable<any> {
    const data = { recruiter_ids: recruiterIds };
    return this.http.put(
      `${this.jobsApiUrl}/jobs/${jobId}/recruiters`,
      data,
      { headers: this.getHeaders() }
    ).pipe(
      catchError((error) => {
        console.error('Error asignando recruiters a la oferta:', error);
        throw error;
      })
    );
  }

  // Desasignar un recruiter de una oferta
  removeRecruiterFromJob(jobId: number, recruiterId: number): Observable<any> {
    return this.http.delete(
      `${this.jobsApiUrl}/jobs/${jobId}/recruiters/${recruiterId}`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError((error) => {
        console.error('Error desasignando recruiter de la oferta:', error);
        throw error;
      })
    );
  }

  // Obtener recruiters disponibles de la empresa actual
  getCompanyRecruiters(companyId: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.userApiUrl}/companies/${companyId}/recruiters`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError((error) => {
        console.error('Error obteniendo recruiters de la empresa:', error);
        throw error;
      })
    );
  }


}


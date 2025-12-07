import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface JobAssistantRequest {
  recruiter_description: string;
  company_name?: string;
  additional_context?: string;
}

export interface GeneratedJobPosting {
  title: string;
  description: string;
  requirements: string;
  min_experience_years: number;
  max_experience_years: number | null;
  required_skills: string[];
  nice_to_have_skills: string[];
  suggested_education_level: string | null;
  suggested_job_type: string | null;
  suggested_work_modality: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AssistantService {
  private baseUrl = 'http://localhost:8004';

  constructor(private http: HttpClient) {}

  /**
   * Genera campos de oferta laboral usando IA
   * @param request Descripción del recruiter y contexto
   * @returns Campos generados para la oferta
   */
  generateJobPosting(request: JobAssistantRequest): Observable<GeneratedJobPosting> {
    return this.http.post<GeneratedJobPosting>(`${this.baseUrl}/generate-job-posting`, request);
  }
}

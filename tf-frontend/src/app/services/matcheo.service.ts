import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CandidateMatch {
  candidate_id: number;
  candidate_name: string;
  application_id: number;
  match_percentage: number;
  match_details: any;
  application_status: string;
}

export interface MatcheoResponse {
  job_id: number;
  job_title: string;
  total_candidates: number;
  matches: CandidateMatch[];
}

@Injectable({
  providedIn: 'root'
})
export class MatcheoService {
  private matcheoApiUrl = 'http://localhost:8003';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Calcula el matcheo para todos los candidatos de un job
   */
  calculateMatches(jobId: number): Observable<MatcheoResponse> {
    return this.http.post<MatcheoResponse>(
      `${this.matcheoApiUrl}/calculate-matches`,
      { job_id: jobId },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Obtiene un resumen rápido de los top matches
   */
  getQuickMatchSummary(jobId: number): Observable<any> {
    return this.http.get(
      `${this.matcheoApiUrl}/job/${jobId}/quick-match`,
      { headers: this.getHeaders() }
    );
  }
}

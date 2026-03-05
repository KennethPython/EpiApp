import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CustomTriggerOption {
  id?: number;
  label: string;
}

@Injectable({ providedIn: 'root' })
export class CustomTriggerOptionService {
  private readonly apiUrl = '/api/custom-trigger-options';

  constructor(private http: HttpClient) {}

  getAll(): Observable<CustomTriggerOption[]> {
    return this.http.get<CustomTriggerOption[]>(this.apiUrl);
  }

  create(label: string): Observable<CustomTriggerOption> {
    return this.http.post<CustomTriggerOption>(this.apiUrl, { label });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

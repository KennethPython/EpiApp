import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Seizure } from '../models/seizure.model';

@Injectable({ providedIn: 'root' })
export class SeizureService {
  private readonly apiUrl = '/api/seizures';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Seizure[]> {
    return this.http.get<Seizure[]>(this.apiUrl);
  }

  create(seizure: Seizure): Observable<Seizure> {
    return this.http.post<Seizure>(this.apiUrl, seizure);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

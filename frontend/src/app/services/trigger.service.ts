import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Trigger } from '../models/trigger.model';

@Injectable({ providedIn: 'root' })
export class TriggerService {
  private readonly apiUrl = '/api/triggers';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Trigger[]> {
    return this.http.get<Trigger[]>(this.apiUrl);
  }

  getBySeizure(seizureId: number): Observable<Trigger[]> {
    return this.http.get<Trigger[]>(this.apiUrl, { params: { seizureId } });
  }

  create(trigger: Trigger): Observable<Trigger> {
    return this.http.post<Trigger>(this.apiUrl, trigger);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

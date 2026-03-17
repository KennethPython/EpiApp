import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MedicationLog } from '../models/medication.model';

@Injectable({ providedIn: 'root' })
export class MedicationLogService {
  private readonly apiUrl = '/api/medication-logs';

  constructor(private http: HttpClient) {}

  getByDate(date: string): Observable<MedicationLog[]> {
    return this.http.get<MedicationLog[]>(this.apiUrl, { params: { date } });
  }

  getByMonth(yearMonth: string): Observable<MedicationLog[]> {
    return this.http.get<MedicationLog[]>(this.apiUrl, { params: { yearMonth } });
  }

  markTaken(medicationId: number, scheduledTime: string, date: string): Observable<MedicationLog> {
    return this.http.post<MedicationLog>(this.apiUrl, {
      medicationId: String(medicationId),
      scheduledTime,
      date,
    });
  }
}

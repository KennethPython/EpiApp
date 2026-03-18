import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { forkJoin } from 'rxjs';

import { MedicationService } from '../../services/medication.service';
import { MedicationLogService } from '../../services/medication-log.service';
import { Medication, MedicationLog } from '../../models/medication.model';
import { EditMedicationDialogComponent } from '../edit-medication-dialog/edit-medication-dialog.component';

interface MedEntry {
  medication: Medication;
  log?: MedicationLog;
}

interface TimeGroup {
  time: string;
  entries: MedEntry[];
}

@Component({
  selector: 'app-medication-overview',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatCardModule,
EditMedicationDialogComponent,
  ],
  templateUrl: './medication-overview.component.html',
  styleUrls: ['./medication-overview.component.scss'],
})
export class MedicationOverviewComponent implements OnInit {
  @Output() medicationsTaken = new EventEmitter<void>();

  groups: TimeGroup[] = [];
  hasMedications = false;

  constructor(
    private medicationService: MedicationService,
    private medicationLogService: MedicationLogService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    forkJoin({
      medications: this.medicationService.getAll(),
      logs: this.medicationLogService.getByDate(this.todayStr()),
    }).subscribe(({ medications, logs }) => {
      this.hasMedications = medications.length > 0;
      this.buildGroups(medications, logs);
    });
  }

  private buildGroups(medications: Medication[], logs: MedicationLog[]): void {
    const timeSet = new Set<string>();
    medications.forEach(m => m.times.forEach(t => timeSet.add(t)));
    const sortedTimes = [...timeSet].sort();

    this.groups = sortedTimes.map(time => ({
      time,
      entries: medications
        .filter(m => m.times.includes(time))
        .map(m => ({
          medication: m,
          log: logs.find(l => l.medicationId === m.id && l.scheduledTime === time),
        })),
    }));
  }

  openEdit(medication: Medication): void {
    this.dialog.open(EditMedicationDialogComponent, {
      width: '420px',
      data: medication,
    }).afterClosed().subscribe(saved => { if (saved) this.loadData(); });
  }

  allTaken(group: TimeGroup): boolean {
    return group.entries.every(e => !!e.log);
  }

  takeAll(group: TimeGroup): void {
    const untaken = group.entries.filter(e => !e.log);
    if (untaken.length === 0) return;
    forkJoin(
      untaken.map(e =>
        this.medicationLogService.markTaken(e.medication.id!, group.time, this.todayStr())
      )
    ).subscribe(logs => {
      logs.forEach((log, i) => (untaken[i].log = log));
      this.medicationsTaken.emit();
    });
  }

  formatTakenAt(takenAt: string): string {
    return new Date(takenAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  private todayStr(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
}

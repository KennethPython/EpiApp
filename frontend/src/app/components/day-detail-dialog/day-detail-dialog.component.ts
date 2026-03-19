import { Component, Inject } from '@angular/core';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';

import { SeizureService } from '../../services/seizure.service';
import { TriggerService } from '../../services/trigger.service';
import { Seizure, SEIZURE_TYPE_LABELS } from '../../models/seizure.model';
import { Trigger, TRIGGER_LABELS } from '../../models/trigger.model';
import { SeizureFormDialogComponent, SeizureDialogData } from '../seizure-form-dialog/seizure-form-dialog.component';
import { TriggerFormDialogComponent, TriggerDialogData } from '../trigger-form-dialog/trigger-form-dialog.component';

export interface DayDetailData {
  date: Date;
  seizures: Seizure[];
  triggers: Trigger[];
}

@Component({
  selector: 'app-day-detail-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatDividerModule,
  ],
  templateUrl: './day-detail-dialog.component.html',
})
export class DayDetailDialogComponent {
  seizures: Seizure[];
  triggers: Trigger[];
  changed = false;

  readonly triggerLabels = TRIGGER_LABELS;
  readonly seizureTypeLabels = SEIZURE_TYPE_LABELS;

  constructor(
    private dialogRef: MatDialogRef<DayDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DayDetailData,
    private seizureService: SeizureService,
    private triggerService: TriggerService,
    private dialog: MatDialog
  ) {
    this.seizures = [...data.seizures];
    this.triggers = [...data.triggers];
  }

  get formattedDate(): string {
    return this.data.date.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });
  }

  formatTime(dateTime: string): string {
    return new Date(dateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  deleteSeizure(seizure: Seizure): void {
    this.seizureService.delete(seizure.id!).subscribe(() => {
      this.seizures = this.seizures.filter(s => s.id !== seizure.id);
      this.changed = true;
    });
  }

  deleteTrigger(trigger: Trigger): void {
    this.triggerService.delete(trigger.id!).subscribe(() => {
      this.triggers = this.triggers.filter(t => t.id !== trigger.id);
      this.changed = true;
    });
  }

  seizureTypeLabel(seizure: Seizure): string {
    return seizure.type ? this.seizureTypeLabels[seizure.type] : 'Seizure';
  }

  openSeizure(seizure: Seizure): void {
    this.triggerService.getBySeizure(seizure.id!).subscribe(triggers => {
      const data: SeizureDialogData = { seizure, triggers };
      this.dialog.open(SeizureFormDialogComponent, { width: '440px', data })
        .afterClosed().subscribe(saved => { if (saved) { this.changed = true; this.close(); } });
    });
  }

  openAddSeizure(): void {
    const data: SeizureDialogData = { initialDate: this.data.date };
    this.dialog.open(SeizureFormDialogComponent, { width: '440px', data })
      .afterClosed().subscribe(saved => { if (saved) { this.changed = true; this.close(); } });
  }

  openAddTrigger(): void {
    const data: TriggerDialogData = { initialDate: this.data.date };
    this.dialog.open(TriggerFormDialogComponent, { width: '400px', data })
      .afterClosed().subscribe(saved => { if (saved) { this.changed = true; this.close(); } });
  }

  openEditTrigger(trigger: Trigger): void {
    const data: TriggerDialogData = { editTrigger: trigger };
    this.dialog.open(TriggerFormDialogComponent, { width: '400px', data })
      .afterClosed().subscribe(saved => { if (saved) { this.changed = true; this.close(); } });
  }

  getTriggerLabel(trigger: Trigger): string {
    if (trigger.type === 'OTHER' && trigger.label) return trigger.label;
    return TRIGGER_LABELS[trigger.type];
  }

  close(): void {
    this.dialogRef.close(this.changed);
  }
}

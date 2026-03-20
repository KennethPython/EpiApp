import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { forkJoin } from 'rxjs';

import { MedicationService } from '../../services/medication.service';
import { Medication } from '../../models/medication.model';

@Component({
  selector: 'app-add-medication-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
  ],
  templateUrl: './add-medication-dialog.component.html',
})
export class AddMedicationDialogComponent {
  // Form fields for the current entry being built
  name = '';
  dosage = '';
  times: string[] = [];
  newTime = '';

  // Pending list of medications to be saved
  pending: Medication[] = [];

  constructor(
    private dialogRef: MatDialogRef<AddMedicationDialogComponent>,
    private medicationService: MedicationService
  ) {}

  addTime(): void {
    const t = this.newTime.trim();
    if (!t || this.times.includes(t)) return;
    this.times = [...this.times, t].sort();
    this.newTime = '';
  }

  removeTime(time: string): void {
    this.times = this.times.filter(t => t !== time);
  }

  get canAddToList(): boolean {
    return !!this.name.trim() && this.times.length > 0;
  }

  addToList(): void {
    if (!this.canAddToList) return;
    this.pending.push({
      name: this.name.trim(),
      dosage: this.dosage.trim(),
      times: [...this.times],
    });
    // Clear form for next entry
    this.name = '';
    this.dosage = '';
    this.times = [];
    this.newTime = '';
  }

  removePending(index: number): void {
    this.pending.splice(index, 1);
  }

  saveAll(): void {
    if (this.pending.length === 0) return;
    forkJoin(this.pending.map(m => this.medicationService.create(m)))
      .subscribe(() => this.dialogRef.close(true));
  }

  cancel(): void {
    this.dialogRef.close(this.pending.length > 0);
  }
}

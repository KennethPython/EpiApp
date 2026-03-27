import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { ConfirmDeleteDialogComponent } from '../confirm-delete-dialog/confirm-delete-dialog.component';

import { MedicationService } from '../../services/medication.service';
import { Medication } from '../../models/medication.model';

@Component({
  selector: 'app-edit-medication-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatChipsModule,
  ],
  templateUrl: './edit-medication-dialog.component.html',
})
export class EditMedicationDialogComponent {
  name: string;
  dosage: string;
  times: string[];
  newTime = '';

  constructor(
    private dialogRef: MatDialogRef<EditMedicationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public medication: Medication,
    private medicationService: MedicationService,
    private dialog: MatDialog
  ) {
    this.name = medication.name;
    this.dosage = medication.dosage;
    this.times = [...medication.times];
  }

  addTime(): void {
    const t = this.newTime.trim();
    if (!t || this.times.includes(t)) return;
    this.times = [...this.times, t].sort();
    this.newTime = '';
  }

  removeTime(time: string): void {
    this.times = this.times.filter(t => t !== time);
  }

  get canSave(): boolean {
    return !!this.name.trim() && this.times.length > 0;
  }

  save(): void {
    if (!this.canSave) return;
    this.medicationService.update(this.medication.id!, {
      ...this.medication,
      name: this.name.trim(),
      dosage: this.dosage.trim(),
      times: this.times,
    }).subscribe(() => this.dialogRef.close(true));
  }

  delete(): void {
    const timeStr = this.medication.times.join(', ');
    const ref = this.dialog.open(ConfirmDeleteDialogComponent, {
      data: {
        message: `Are you sure you want to delete ${this.medication.name} ${this.medication.dosage} at ${timeStr}?`,
      },
    });
    ref.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.medicationService.delete(this.medication.id!).subscribe(() => this.dialogRef.close(true));
      }
    });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}

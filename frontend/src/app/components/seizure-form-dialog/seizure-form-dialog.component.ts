import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { SeizureService } from '../../services/seizure.service';
import { SeizureType, SEIZURE_TYPE_LABELS } from '../../models/seizure.model';

@Component({
  selector: 'app-seizure-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './seizure-form-dialog.component.html',
})
export class SeizureFormDialogComponent {
  form: FormGroup;

  readonly seizureTypes: { value: SeizureType; label: string }[] = (
    Object.entries(SEIZURE_TYPE_LABELS) as [SeizureType, string][]
  ).map(([value, label]) => ({ value, label }));

  constructor(
    private dialogRef: MatDialogRef<SeizureFormDialogComponent>,
    private fb: FormBuilder,
    private seizureService: SeizureService
  ) {
    this.form = this.fb.group({
      date: [new Date(), Validators.required],
      time: [this.nowTimeString(), Validators.required],
      durationMinutes: [null, [Validators.min(1)]],
      type: [null],
      notes: ['']
    });
  }

  private nowTimeString(): string {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }

  submit(): void {
    if (this.form.invalid) return;
    const { date, time, durationMinutes, type, notes } = this.form.value;
    const [h, m] = (time as string).split(':').map(Number);
    const dt = new Date(date as Date);
    dt.setHours(h, m, 0, 0);

    this.seizureService.create({
      dateTime: this.toLocalIso(dt),
      durationMinutes: durationMinutes ?? undefined,
      type: type ?? undefined,
      notes: notes || undefined,
    }).subscribe(() => this.dialogRef.close(true));
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  /** Format Date as "YYYY-MM-DDTHH:mm:ss" without timezone suffix. */
  private toLocalIso(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
           `T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
  }
}

import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { forkJoin } from 'rxjs';

import { TriggerService } from '../../services/trigger.service';
import { TriggerType, TRIGGER_LABELS } from '../../models/trigger.model';

interface TriggerOption {
  type: TriggerType;
  label: string;
}

@Component({
  selector: 'app-trigger-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './trigger-form-dialog.component.html',
})
export class TriggerFormDialogComponent {
  form: FormGroup;

  readonly options: TriggerOption[] = [
    { type: 'CAFFEINE',  label: TRIGGER_LABELS['CAFFEINE']  },
    { type: 'SLEEP',     label: TRIGGER_LABELS['SLEEP']     },
    { type: 'MEDICATION', label: TRIGGER_LABELS['MEDICATION'] },
  ];

  constructor(
    private dialogRef: MatDialogRef<TriggerFormDialogComponent>,
    private fb: FormBuilder,
    private triggerService: TriggerService
  ) {
    this.form = this.fb.group({
      date: [new Date()],
      CAFFEINE: [false],
      SLEEP: [false],
      MEDICATION: [false],
    });
  }

  submit(): void {
    const { date, CAFFEINE, SLEEP, MEDICATION } = this.form.value as Record<string, unknown>;
    const dateStr = this.toDateStr(new Date(date as Date));

    const selected: TriggerType[] = [];
    if (CAFFEINE)   selected.push('CAFFEINE');
    if (SLEEP)      selected.push('SLEEP');
    if (MEDICATION) selected.push('MEDICATION');

    if (selected.length === 0) {
      this.dialogRef.close(false);
      return;
    }

    forkJoin(selected.map(type => this.triggerService.create({ date: dateStr, type })))
      .subscribe(() => this.dialogRef.close(true));
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  private toDateStr(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }
}

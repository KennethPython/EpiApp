import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { forkJoin } from 'rxjs';

import { TriggerService } from '../../services/trigger.service';
import { CustomTriggerOptionService } from '../../services/custom-trigger-option.service';
import { TRIGGER_LABELS } from '../../models/trigger.model';

interface TriggerOption {
  id?: number;      // set for custom options persisted in DB
  key: string;
  label: string;
  isCustom: boolean;
  checked: boolean;
}

@Component({
  selector: 'app-trigger-form-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './trigger-form-dialog.component.html',
})
export class TriggerFormDialogComponent implements OnInit {
  date = new Date();
  newCustomLabel = '';

  options: TriggerOption[] = [
    { key: 'CAFFEINE',   label: TRIGGER_LABELS['CAFFEINE'],   isCustom: false, checked: false },
    { key: 'SLEEP',      label: TRIGGER_LABELS['SLEEP'],      isCustom: false, checked: false },
    { key: 'MEDICATION', label: TRIGGER_LABELS['MEDICATION'], isCustom: false, checked: false },
  ];

  constructor(
    private dialogRef: MatDialogRef<TriggerFormDialogComponent>,
    private triggerService: TriggerService,
    private customOptionService: CustomTriggerOptionService
  ) {}

  ngOnInit(): void {
    this.customOptionService.getAll().subscribe(customs => {
      customs.forEach(c => this.options.push({
        id: c.id,
        key: 'custom_' + c.id,
        label: c.label,
        isCustom: true,
        checked: false,
      }));
    });
  }

  addCustomTrigger(): void {
    const label = this.newCustomLabel.trim();
    if (!label) return;
    if (this.options.some(o => o.label.toLowerCase() === label.toLowerCase())) return;

    this.customOptionService.create(label).subscribe(saved => {
      this.options.push({
        id: saved.id,
        key: 'custom_' + saved.id,
        label: saved.label,
        isCustom: true,
        checked: true,
      });
      this.newCustomLabel = '';
    });
  }

  submit(): void {
    const dateStr = this.toDateStr(this.date);
    const selected = this.options.filter(o => o.checked);

    if (selected.length === 0) {
      this.dialogRef.close(false);
      return;
    }

    forkJoin(selected.map(o =>
      this.triggerService.create({
        date: dateStr,
        type: o.isCustom ? 'OTHER' : o.key as any,
        label: o.isCustom ? o.label : undefined,
      })
    )).subscribe(() => this.dialogRef.close(true));
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  private toDateStr(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }
}

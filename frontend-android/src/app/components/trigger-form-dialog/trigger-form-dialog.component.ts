import { Component, OnInit, Optional, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { forkJoin } from 'rxjs';

import { TriggerService } from '../../services/trigger.service';
import { CustomTriggerOptionService } from '../../services/custom-trigger-option.service';
import { HealthConnectService } from '../../services/health-connect.service';
import { Trigger, TriggerType, TRIGGER_LABELS } from '../../models/trigger.model';

export interface TriggerDialogData {
  initialDate?: Date;
  editTrigger?: Trigger;
}

interface TriggerOption {
  id?: number;
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
    MatSelectModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './trigger-form-dialog.component.html',
  styleUrls: ['./trigger-form-dialog.component.scss'],
})
export class TriggerFormDialogComponent implements OnInit {
  date = new Date();
  newCustomLabel = '';
  editMode = false;
  sleepHours: number | null = null;

  editType: TriggerType = 'OTHER';
  editLabel = '';

  readonly triggerTypes: { value: TriggerType; label: string }[] = [
    { value: 'CAFFEINE',   label: TRIGGER_LABELS['CAFFEINE'] },
    { value: 'SLEEP',      label: TRIGGER_LABELS['SLEEP'] },
    { value: 'MEDICATION', label: TRIGGER_LABELS['MEDICATION'] },
    { value: 'OTHER',      label: TRIGGER_LABELS['OTHER'] },
  ];

  options: TriggerOption[] = [
    { key: 'CAFFEINE',   label: TRIGGER_LABELS['CAFFEINE'],   isCustom: false, checked: false },
    { key: 'SLEEP',      label: TRIGGER_LABELS['SLEEP'],      isCustom: false, checked: false },
    { key: 'MEDICATION', label: TRIGGER_LABELS['MEDICATION'], isCustom: false, checked: false },
  ];

  private editTrigger: Trigger | undefined;

  constructor(
    private dialogRef: MatDialogRef<TriggerFormDialogComponent>,
    private triggerService: TriggerService,
    private customOptionService: CustomTriggerOptionService,
    private healthConnect: HealthConnectService,
    @Optional() @Inject(MAT_DIALOG_DATA) private dialogData: TriggerDialogData | null
  ) {
    if (dialogData?.editTrigger) {
      this.editMode = true;
      this.editTrigger = dialogData.editTrigger;
      this.date = new Date(dialogData.editTrigger.date);
      this.editType = dialogData.editTrigger.type;
      this.editLabel = dialogData.editTrigger.label ?? '';
    } else if (dialogData?.initialDate) {
      this.date = new Date(dialogData.initialDate);
    }
  }

  ngOnInit(): void {
    if (this.editMode) return;
    this.customOptionService.getAll().subscribe(customs => {
      customs.forEach(c => this.options.push({
        id: c.id,
        key: 'custom_' + c.id,
        label: c.label,
        isCustom: true,
        checked: false,
      }));
    });
    this.healthConnect.getSleepLastNight().then(sleep => {
      if (!sleep) return;
      this.sleepHours = sleep.totalHours;
      if (sleep.belowThreshold) {
        const sleepOption = this.options.find(o => o.key === 'SLEEP');
        if (sleepOption) sleepOption.checked = true;
      }
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

  save(): void {
    const dateStr = this.toDateStr(this.date);
    this.triggerService.update(this.editTrigger!.id!, {
      date: dateStr,
      type: this.editType,
      label: this.editType === 'OTHER' ? (this.editLabel.trim() || undefined) : undefined,
    } as Trigger).subscribe(() => this.dialogRef.close(true));
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

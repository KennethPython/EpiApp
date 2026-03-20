import { Component, OnInit, Optional, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin, of, switchMap } from 'rxjs';

import { SeizureService } from '../../services/seizure.service';
import { TriggerService } from '../../services/trigger.service';
import { CustomTriggerOptionService } from '../../services/custom-trigger-option.service';
import { Seizure, SeizureType, SEIZURE_TYPE_LABELS } from '../../models/seizure.model';
import { Trigger, TRIGGER_LABELS } from '../../models/trigger.model';

export interface SeizureDialogData {
  seizure?: Seizure;
  triggers?: Trigger[];
  initialDate?: Date;
}

interface TriggerOption {
  id?: number;
  key: string;
  label: string;
  isCustom: boolean;
  checked: boolean;
}

@Component({
  selector: 'app-seizure-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatIconModule,
  ],
  templateUrl: './seizure-form-dialog.component.html',
})
export class SeizureFormDialogComponent implements OnInit {
  form: FormGroup;
  newCustomLabel = '';
  editMode = false;

  readonly seizureTypes: { value: SeizureType; label: string }[] = (
    Object.entries(SEIZURE_TYPE_LABELS) as [SeizureType, string][]
  ).map(([value, label]) => ({ value, label }));

  triggerOptions: TriggerOption[] = [
    { key: 'CAFFEINE',   label: TRIGGER_LABELS['CAFFEINE'],   isCustom: false, checked: false },
    { key: 'SLEEP',      label: TRIGGER_LABELS['SLEEP'],      isCustom: false, checked: false },
    { key: 'MEDICATION', label: TRIGGER_LABELS['MEDICATION'], isCustom: false, checked: false },
  ];

  editTriggers: Trigger[] = [];

  constructor(
    private dialogRef: MatDialogRef<SeizureFormDialogComponent>,
    private fb: FormBuilder,
    private seizureService: SeizureService,
    private triggerService: TriggerService,
    private customOptionService: CustomTriggerOptionService,
    @Optional() @Inject(MAT_DIALOG_DATA) private dialogData: SeizureDialogData | null
  ) {
    const existingSeizure = dialogData?.seizure ?? null;
    if (existingSeizure?.id) {
      this.editMode = true;
      this.editTriggers = dialogData?.triggers ?? [];
      const dt = new Date(existingSeizure.dateTime);
      const pad = (n: number) => String(n).padStart(2, '0');
      this.form = this.fb.group({
        date: [dt, Validators.required],
        time: [`${pad(dt.getHours())}:${pad(dt.getMinutes())}`, Validators.required],
        durationMinutes: [existingSeizure.durationMinutes ?? null, [Validators.min(1)]],
        type: [existingSeizure.type ?? null],
        notes: [existingSeizure.notes ?? ''],
      });
    } else {
      const initialDate = dialogData?.initialDate ?? new Date();
      this.form = this.fb.group({
        date: [initialDate, Validators.required],
        time: [this.nowTimeString(), Validators.required],
        durationMinutes: [null, [Validators.min(1)]],
        type: [null],
        notes: [''],
      });
    }
  }

  ngOnInit(): void {
    if (this.editMode) return;
    this.customOptionService.getAll().subscribe(customs => {
      customs.forEach(c => this.triggerOptions.push({
        id: c.id,
        key: 'custom_' + c.id,
        label: c.label,
        isCustom: true,
        checked: false,
      }));
    });
  }

  getTriggerLabel(trigger: Trigger): string {
    if (trigger.type === 'OTHER' && trigger.label) return trigger.label;
    return TRIGGER_LABELS[trigger.type];
  }

  addCustomTrigger(): void {
    const label = this.newCustomLabel.trim();
    if (!label) return;
    if (this.triggerOptions.some(o => o.label.toLowerCase() === label.toLowerCase())) return;

    this.customOptionService.create(label).subscribe(saved => {
      this.triggerOptions.push({
        id: saved.id,
        key: 'custom_' + saved.id,
        label: saved.label,
        isCustom: true,
        checked: true,
      });
      this.newCustomLabel = '';
    });
  }

  private nowTimeString(): string {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }

  save(): void {
    if (this.form.invalid) return;
    const { date, time, durationMinutes, type, notes } = this.form.getRawValue();
    const [h, m] = (time as string).split(':').map(Number);
    const dt = new Date(date as Date);
    dt.setHours(h, m, 0, 0);

    const id = this.dialogData!.seizure!.id!;
    this.seizureService.update(id, {
      dateTime: this.toLocalIso(dt),
      durationMinutes: durationMinutes ?? undefined,
      type: type ?? undefined,
      notes: notes || undefined,
    }).subscribe(() => this.dialogRef.close(true));
  }

  submit(): void {
    if (this.form.invalid) return;
    const { date, time, durationMinutes, type, notes } = this.form.getRawValue();
    const [h, m] = (time as string).split(':').map(Number);
    const dt = new Date(date as Date);
    dt.setHours(h, m, 0, 0);

    const dateStr = this.toDateStr(dt);
    const selectedTriggers = this.triggerOptions.filter(o => o.checked);

    this.seizureService.create({
      dateTime: this.toLocalIso(dt),
      durationMinutes: durationMinutes ?? undefined,
      type: type ?? undefined,
      notes: notes || undefined,
    }).pipe(
      switchMap(savedSeizure => {
        if (selectedTriggers.length === 0) return of(null);
        return forkJoin(selectedTriggers.map(o =>
          this.triggerService.create({
            date: dateStr,
            type: o.isCustom ? 'OTHER' : o.key as any,
            label: o.isCustom ? o.label : undefined,
            seizureId: savedSeizure.id,
          })
        ));
      })
    ).subscribe(() => this.dialogRef.close(true));
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  private toLocalIso(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
           `T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
  }

  private toDateStr(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }
}

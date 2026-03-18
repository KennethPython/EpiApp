import { Component, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog } from '@angular/material/dialog';
import { forkJoin } from 'rxjs';

import { SeizureService } from '../../services/seizure.service';
import { TriggerService } from '../../services/trigger.service';
import { MedicationService } from '../../services/medication.service';
import { MedicationLogService } from '../../services/medication-log.service';
import { Seizure, SEIZURE_TYPE_LABELS } from '../../models/seizure.model';
import { Trigger, TRIGGER_LABELS } from '../../models/trigger.model';
import { Medication, MedicationLog } from '../../models/medication.model';
import { AddEventDialogComponent } from '../add-event-dialog/add-event-dialog.component';
import { SeizureFormDialogComponent } from '../seizure-form-dialog/seizure-form-dialog.component';
import { TriggerFormDialogComponent } from '../trigger-form-dialog/trigger-form-dialog.component';
import { DayDetailDialogComponent } from '../day-detail-dialog/day-detail-dialog.component';
import { AddMedicationDialogComponent } from '../add-medication-dialog/add-medication-dialog.component';
import { MedicationOverviewComponent } from '../medication-overview/medication-overview.component';

export interface MedSlot {
  time: string;
  taken: boolean;
}

export interface CalendarEvent {
  kind: 'seizure' | 'trigger';
  id: number;
  label: string;
}

export interface CalendarDay {
  date: Date | null;
  seizures: Seizure[];
  triggers: Trigger[];
  medSlots: MedSlot[];
  visibleEvents: CalendarEvent[];
  hiddenCount: number;
}

export interface YearDayCell {
  date: Date;
  dateStr: string;
  dayNum: number;
  isToday: boolean;
  isFuture: boolean;
  hasSeizure: boolean;
  hasMeds: boolean;
  allMedsTaken: boolean;
  seizures: Seizure[];
  triggers: Trigger[];
}

export interface YearMonthGrid {
  month: number;
  monthName: string;
  cells: (YearDayCell | null)[];
}

const COLOR_STORAGE_KEY = 'epiapp_colors';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatButtonToggleModule,
    MatTabsModule,
    MedicationOverviewComponent,
  ],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements OnInit {
  @ViewChild(MedicationOverviewComponent) medicationOverview!: MedicationOverviewComponent;
  @ViewChild('seizureInput') seizureInputEl!: ElementRef<HTMLInputElement>;
  @ViewChild('triggerInput') triggerInputEl!: ElementRef<HTMLInputElement>;
  @ViewChild('medInput') medInputEl!: ElementRef<HTMLInputElement>;

  view: 'month' | 'year' = 'month';
  showSettings = false;

  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth();

  seizures: Seizure[] = [];
  triggers: Trigger[] = [];
  medications: Medication[] = [];
  medLogs: MedicationLog[] = [];
  medTimes: string[] = [];
  weeks: CalendarDay[][] = [];

  yearMonths: YearMonthGrid[] = [];
  yearMedLogs: MedicationLog[] = [];

  sidebarMonthGrid: YearMonthGrid | null = null;
  sidebarMedLogs: MedicationLog[] = [];

  colors = { seizure: '#f44336', trigger: '#ff9800', med: '#4caf50' };

  readonly weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  readonly miniWeekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  readonly monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  readonly triggerLabels = TRIGGER_LABELS;
  readonly seizureLabels = SEIZURE_TYPE_LABELS;

  truncate(text: string, max = 6): string {
    return text && text.length > max ? text.slice(0, max) + '...' : (text ?? '');
  }

  seizureLabel(s: Seizure): string {
    return s.type ? this.seizureLabels[s.type] : 'Seizure';
  }

  triggerLabel(t: Trigger): string {
    return t.type === 'OTHER' && t.label ? t.label : this.triggerLabels[t.type];
  }

  updateColor(key: 'seizure' | 'trigger' | 'med', event: Event): void {
    this.colors[key] = (event.target as HTMLInputElement).value;
    localStorage.setItem(COLOR_STORAGE_KEY, JSON.stringify(this.colors));
  }

  @HostListener('window:resize')
  onResize(): void {
    if (window.innerWidth >= 681) this.showSettings = false;
  }

  openColorPicker(type: 'seizure' | 'trigger' | 'med'): void {
    const map = { seizure: this.seizureInputEl, trigger: this.triggerInputEl, med: this.medInputEl };
    map[type]?.nativeElement.click();
  }

  private loadColors(): void {
    try {
      const stored = localStorage.getItem(COLOR_STORAGE_KEY);
      if (stored) this.colors = { ...this.colors, ...JSON.parse(stored) };
    } catch {}
  }

  constructor(
    private seizureService: SeizureService,
    private triggerService: TriggerService,
    private medicationService: MedicationService,
    private medicationLogService: MedicationLogService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadColors();
    this.loadEvents();
  }

  private get todayMonthStr(): string {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}`;
  }

  loadEvents(): void {
    forkJoin({
      seizures: this.seizureService.getAll(),
      triggers: this.triggerService.getAll(),
      medications: this.medicationService.getAll(),
      logs: this.medicationLogService.getByMonth(this.yearMonthStr()),
      sidebarLogs: this.medicationLogService.getByMonth(this.todayMonthStr),
    }).subscribe(({ seizures, triggers, medications, logs, sidebarLogs }) => {
      this.seizures = seizures;
      this.triggers = triggers;
      this.medications = medications;
      this.medLogs = logs;
      this.sidebarMedLogs = sidebarLogs;
      this.medTimes = [...new Set(medications.flatMap(m => m.times))].sort();
      this.buildCalendar();
      this.buildSidebarMonth();
    });
  }

  loadMedData(): void {
    forkJoin({
      medications: this.medicationService.getAll(),
      logs: this.medicationLogService.getByMonth(this.yearMonthStr()),
      sidebarLogs: this.medicationLogService.getByMonth(this.todayMonthStr),
    }).subscribe(({ medications, logs, sidebarLogs }) => {
      this.medications = medications;
      this.medLogs = logs;
      this.sidebarMedLogs = sidebarLogs;
      this.medTimes = [...new Set(medications.flatMap(m => m.times))].sort();
      this.buildCalendar();
      this.buildSidebarMonth();
    });
  }

  setView(v: 'month' | 'year'): void {
    this.view = v;
    if (v === 'year') this.loadYearEvents();
  }

  loadYearEvents(): void {
    const months = Array.from({ length: 12 }, (_, i) =>
      `${this.currentYear}-${String(i + 1).padStart(2, '0')}`
    );
    forkJoin(months.map(m => this.medicationLogService.getByMonth(m)))
      .subscribe(logsPerMonth => {
        this.yearMedLogs = logsPerMonth.flat();
        this.buildYearMonths();
      });
  }

  private buildMonthGrid(year: number, month: number, logs: MedicationLog[]): YearMonthGrid {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = this.localDateString(today);

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDow = firstDay.getDay();
    const cells: (YearDayCell | null)[] = [];

    for (let i = 0; i < startDow; i++) cells.push(null);

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const dateStr = this.localDateString(date);
      const isToday = dateStr === todayStr;
      const isFuture = date > today;

      const seizures = this.seizures.filter(s =>
        this.localDateString(new Date(s.dateTime)) === dateStr
      );
      const triggers = this.triggers.filter(t => t.date === dateStr);
      const hasSeizure = seizures.length > 0;
      const hasMeds = this.medTimes.length > 0;

      let allMedsTaken = false;
      if (hasMeds && !isFuture && !isToday) {
        allMedsTaken = this.medTimes.every(time => {
          const medsAtTime = this.medications.filter(m => m.times.includes(time));
          return medsAtTime.length === 0 || medsAtTime.every(m =>
            logs.some(l => l.medicationId === m.id && l.scheduledTime === time && l.date === dateStr)
          );
        });
      }

      cells.push({ date, dateStr, dayNum: d, isToday, isFuture, hasSeizure, hasMeds, allMedsTaken, seizures, triggers });
    }

    return { month, monthName: this.monthNames[month], cells };
  }

  buildYearMonths(): void {
    this.yearMonths = this.monthNames.map((_, month) =>
      this.buildMonthGrid(this.currentYear, month, this.yearMedLogs)
    );
  }

  buildSidebarMonth(): void {
    const today = new Date();
    this.sidebarMonthGrid = this.buildMonthGrid(
      today.getFullYear(), today.getMonth(), this.sidebarMedLogs
    );
  }

  buildCalendar(): void {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const startDow = firstDay.getDay();

    const weeks: CalendarDay[][] = [];
    let week: CalendarDay[] = [];

    const emptyDay = (): CalendarDay =>
      ({ date: null, seizures: [], triggers: [], medSlots: [], visibleEvents: [], hiddenCount: 0 });

    for (let i = 0; i < startDow; i++) week.push(emptyDay());

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(this.currentYear, this.currentMonth, d);
      const dateStr = this.localDateString(date);

      const daySeizures = this.seizures.filter(s =>
        this.localDateString(new Date(s.dateTime)) === dateStr
      );
      const dayTriggers = this.triggers.filter(t => t.date === dateStr);

      const medSlots: MedSlot[] = this.medTimes.map(time => {
        const medsAtTime = this.medications.filter(m => m.times.includes(time));
        const taken = medsAtTime.length > 0 && medsAtTime.every(m =>
          this.medLogs.some(l => l.medicationId === m.id && l.scheduledTime === time && l.date === dateStr)
        );
        return { time, taken };
      });

      const allEvents: CalendarEvent[] = [
        ...daySeizures.map(s => ({ kind: 'seizure' as const, id: s.id!, label: this.seizureLabel(s) })),
        ...dayTriggers.map(t => ({ kind: 'trigger' as const, id: t.id!, label: this.triggerLabels[t.type] })),
      ];

      week.push({
        date, seizures: daySeizures, triggers: dayTriggers, medSlots,
        visibleEvents: allEvents.slice(0, 5),
        hiddenCount: Math.max(0, allEvents.length - 5),
      });

      if (week.length === 7) { weeks.push(week); week = []; }
    }

    if (week.length > 0) {
      while (week.length < 7) week.push(emptyDay());
      weeks.push(week);
    }

    this.weeks = weeks;
  }

  localDateString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  get monthLabel(): string {
    return `${this.monthNames[this.currentMonth]} ${this.currentYear}`;
  }

  get sidebarMonthLabel(): string {
    const t = new Date();
    return `${this.monthNames[t.getMonth()]} ${t.getFullYear()}`;
  }

  private yearMonthStr(): string {
    return `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}`;
  }

  prevMonth(): void {
    if (this.currentMonth === 0) { this.currentMonth = 11; this.currentYear--; }
    else this.currentMonth--;
    this.loadMedData();
  }

  nextMonth(): void {
    if (this.currentMonth === 11) { this.currentMonth = 0; this.currentYear++; }
    else this.currentMonth++;
    this.loadMedData();
  }

  prevYear(): void { this.currentYear--; this.loadYearEvents(); }
  nextYear(): void { this.currentYear++; this.loadYearEvents(); }

  openAddDialog(): void {
    const addRef = this.dialog.open(AddEventDialogComponent, { width: '320px' });
    addRef.afterClosed().subscribe((choice: 'SEIZURE' | 'TRIGGER' | undefined) => {
      if (choice === 'SEIZURE') {
        this.dialog.open(SeizureFormDialogComponent, { width: '440px' })
          .afterClosed().subscribe(saved => { if (saved) this.loadEvents(); });
      } else if (choice === 'TRIGGER') {
        this.dialog.open(TriggerFormDialogComponent, { width: '400px' })
          .afterClosed().subscribe(saved => { if (saved) this.loadEvents(); });
      }
    });
  }

  openAddMedicationDialog(): void {
    this.dialog.open(AddMedicationDialogComponent, { width: '420px' })
      .afterClosed().subscribe(saved => {
        if (saved) { this.medicationOverview.loadData(); this.loadMedData(); }
      });
  }

  openDayDetail(day: CalendarDay): void {
    if (!day.date) return;
    this.dialog.open(DayDetailDialogComponent, {
      width: '420px',
      data: { date: day.date, seizures: day.seizures, triggers: day.triggers }
    }).afterClosed().subscribe(changed => { if (changed) this.loadEvents(); });
  }

  openDayDetailFromCell(cell: YearDayCell): void {
    this.dialog.open(DayDetailDialogComponent, {
      width: '420px',
      data: { date: cell.date, seizures: cell.seizures, triggers: cell.triggers }
    }).afterClosed().subscribe(changed => { if (changed) this.loadYearEvents(); });
  }

  openDayDetailFromSidebar(cell: YearDayCell): void {
    this.dialog.open(DayDetailDialogComponent, {
      width: '420px',
      data: { date: cell.date, seizures: cell.seizures, triggers: cell.triggers }
    }).afterClosed().subscribe(changed => { if (changed) this.loadEvents(); });
  }

  isToday(date: Date | null): boolean {
    if (!date) return false;
    return this.localDateString(date) === this.localDateString(new Date());
  }
}

import { Component, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
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
import { AuthService } from '../../services/auth.service';
import { HealthService, SleepDay } from '../../services/health.service';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { NotificationService } from '../../services/notification.service';

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

export interface AppTheme {
  id: string; label: string;
  primary: string; primaryBtn: string; secondary: string;
  border: string; cardBg: string; accent: string;
  pageBg: string; navBg: string; hoverBg: string;
  todayBg: string; todayBorder: string; todayText: string;
}

export const THEMES: AppTheme[] = [
  {
    id: 'dark', label: 'Dark',
    primary: '#3C2580', primaryBtn: '#6A4FC0', secondary: '#9F85E0',
    border: '#D5C8F7', cardBg: '#EEEAFC', accent: '#F6A623',
    pageBg: '#EDE8FA', navBg: '#3C2580', hoverBg: 'rgba(106,79,192,0.07)',
    todayBg: 'rgba(106,79,192,0.08)', todayBorder: 'rgba(106,79,192,0.35)', todayText: '#6A4FC0',
  },
  {
    id: 'clinical', label: 'Clinical Blue',
    primary: '#0E3A6E', primaryBtn: '#1A6FC4', secondary: '#4DA3E8',
    border: '#BDD9F4', cardBg: '#E8F3FC', accent: '#1DAF7D',
    pageBg: '#E3EDF7', navBg: '#0E3A6E', hoverBg: 'rgba(26,111,196,0.07)',
    todayBg: 'rgba(26,111,196,0.08)', todayBorder: 'rgba(26,111,196,0.35)', todayText: '#1A6FC4',
  },
  {
    id: 'soft', label: 'Soft',
    primary: '#2D5C40', primaryBtn: '#4A8C63', secondary: '#7DB896',
    border: '#BDD9C8', cardBg: '#E8F4ED', accent: '#C9A96E',
    pageBg: '#E4EDE7', navBg: '#2D5C40', hoverBg: 'rgba(74,140,99,0.07)',
    todayBg: 'rgba(74,140,99,0.08)', todayBorder: 'rgba(74,140,99,0.35)', todayText: '#4A8C63',
  },
];

export interface YearMonthGrid {
  month: number;
  monthName: string;
  cells: (YearDayCell | null)[];
}

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
    RouterLink,
  ],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements OnInit {
  @ViewChild(MedicationOverviewComponent) medicationOverview!: MedicationOverviewComponent;
  @ViewChild('seizureInput') seizureInputEl!: ElementRef<HTMLInputElement>;
  @ViewChild('triggerInput') triggerInputEl!: ElementRef<HTMLInputElement>;
  @ViewChild('medInput') medInputEl!: ElementRef<HTMLInputElement>;

  readonly themes = THEMES;
  selectedThemeId = 'clinical';

  get currentTheme(): AppTheme {
    return THEMES.find(t => t.id === this.selectedThemeId) ?? THEMES[1];
  }

  selectTheme(id: string): void {
    this.selectedThemeId = id;
    this.applyTheme();
    localStorage.setItem(this.colorStorageKey + '_theme', id);
    localStorage.setItem('epiapp_theme', id);
  }

  private applyTheme(): void {
    const t = this.currentTheme;
    const r = document.documentElement;
    r.style.setProperty('--theme-primary',      t.primary);
    r.style.setProperty('--theme-primary-btn',  t.primaryBtn);
    r.style.setProperty('--theme-secondary',    t.secondary);
    r.style.setProperty('--theme-border',       t.border);
    r.style.setProperty('--theme-card-bg',      t.cardBg);
    r.style.setProperty('--theme-accent',       t.accent);
    r.style.setProperty('--theme-page-bg',      t.pageBg);
    r.style.setProperty('--theme-nav-bg',       t.navBg);
    r.style.setProperty('--theme-hover-bg',     t.hoverBg);
    r.style.setProperty('--theme-today-bg',     t.todayBg);
    r.style.setProperty('--theme-today-border', t.todayBorder);
    r.style.setProperty('--theme-today-text',   t.todayText);
  }

  view: 'month' | 'week' | 'year' | 'sleep' = 'month';
  currentWeekStart: Date = (() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  })();
  showSettings = false;
  speedDialOpen = false;
  showExport = false;
  exportYear = new Date().getFullYear();
  selectedExportMonths = new Set<string>();

  readonly exportMonthOptions = [
    { num: 1, label: 'Jan' }, { num: 2, label: 'Feb' }, { num: 3, label: 'Mar' },
    { num: 4, label: 'Apr' }, { num: 5, label: 'May' }, { num: 6, label: 'Jun' },
    { num: 7, label: 'Jul' }, { num: 8, label: 'Aug' }, { num: 9, label: 'Sep' },
    { num: 10, label: 'Oct' }, { num: 11, label: 'Nov' }, { num: 12, label: 'Dec' },
  ];

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

  loadError = false;
  colors = { seizure: '#f44336', trigger: '#ff9800', med: '#4caf50' };

  // ── Samsung Health / Sleep ──────────────────────────────────
  healthAvailable = false;
  sleepPermissionGranted = false;
  sleepData: { [dateStr: string]: SleepDay } = {};
  sleepLoading = false;

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

  private get colorStorageKey(): string {
    return `epiapp_colors_${this.authService.getUsername() ?? 'default'}`;
  }

  updateColor(key: 'seizure' | 'trigger' | 'med', event: Event): void {
    this.colors[key] = (event.target as HTMLInputElement).value;
    localStorage.setItem(this.colorStorageKey, JSON.stringify(this.colors));
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
      const stored = localStorage.getItem(this.colorStorageKey);
      if (stored) this.colors = { ...this.colors, ...JSON.parse(stored) };
      const savedTheme = localStorage.getItem(this.colorStorageKey + '_theme');
      if (savedTheme) this.selectedThemeId = savedTheme;
    } catch {}
    this.applyTheme();
  }

  constructor(
    private seizureService: SeizureService,
    private triggerService: TriggerService,
    private medicationService: MedicationService,
    private medicationLogService: MedicationLogService,
    private dialog: MatDialog,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
    private healthService: HealthService,
  ) {}

  logout(): void {
    this.authService.logout();
    this.showSettings = false;
    this.router.navigate(['/login']);
  }

  ngOnInit(): void {
    this.loadColors();
    this.loadEvents();
    this.checkHealthPermissions();
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
    }).subscribe({
      next: ({ seizures, triggers, medications, logs, sidebarLogs }) => {
        this.loadError = false;
        this.seizures = seizures;
        this.triggers = triggers;
        this.medications = medications;
        this.medLogs = logs;
        this.sidebarMedLogs = sidebarLogs;
        this.medTimes = [...new Set(medications.flatMap(m => m.times))].sort();
        this.buildCalendar();
        this.buildSidebarMonth();
        this.notificationService.scheduleForMedications(medications);
      },
      error: () => { this.loadError = true; },
    });
  }

  loadMedData(): void {
    forkJoin({
      medications: this.medicationService.getAll(),
      logs: this.medicationLogService.getByMonth(this.yearMonthStr()),
      sidebarLogs: this.medicationLogService.getByMonth(this.todayMonthStr),
    }).subscribe({
      next: ({ medications, logs, sidebarLogs }) => {
        this.loadError = false;
        this.medications = medications;
        this.medLogs = logs;
        this.sidebarMedLogs = sidebarLogs;
        this.medTimes = [...new Set(medications.flatMap(m => m.times))].sort();
        this.buildCalendar();
        this.buildSidebarMonth();
      },
      error: () => { this.loadError = true; },
    });
  }

  setView(v: 'month' | 'week' | 'year' | 'sleep'): void {
    this.view = v;
    if (v === 'year')  this.loadYearEvents();
    if (v === 'week')  this.syncMonthToWeek();
    if (v === 'sleep') this.loadSleepData();
  }

  // ── Samsung Health / Sleep ──────────────────────────────────

  private async checkHealthPermissions(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    const { available, granted } = await this.healthService.checkPermissions();
    this.healthAvailable = available;
    this.sleepPermissionGranted = granted;
  }

  async requestSleepPermission(): Promise<void> {
    const granted = await this.healthService.requestPermissions();
    this.sleepPermissionGranted = granted;
    if (granted) this.loadSleepData();
  }

  async loadSleepData(): Promise<void> {
    if (!this.healthAvailable || !this.sleepPermissionGranted) return;
    this.sleepLoading = true;
    // month+1 because currentMonth is 0-indexed, plugin expects 1-indexed
    const days = await this.healthService.getSleepForMonth(this.currentYear, this.currentMonth + 1);
    this.sleepData = {};
    for (const d of days) {
      this.sleepData[d.date] = d;
    }
    this.sleepLoading = false;
  }

  sleepForDate(date: Date | null): SleepDay | null {
    if (!date) return null;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return this.sleepData[key] ?? null;
  }

  get weekDays(): CalendarDay[] {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(this.currentWeekStart);
      date.setDate(date.getDate() + i);
      return this.buildDay(date);
    });
  }

  get weekLabel(): string {
    const s = this.currentWeekStart;
    const e = new Date(s);
    e.setDate(e.getDate() + 6);
    const sm = this.monthNames[s.getMonth()];
    const em = this.monthNames[e.getMonth()];
    const sy = s.getFullYear(), ey = e.getFullYear();
    if (sy !== ey) return `${sm} ${s.getDate()}, ${sy} – ${em} ${e.getDate()}, ${ey}`;
    if (s.getMonth() !== e.getMonth()) return `${sm} ${s.getDate()} – ${em} ${e.getDate()}, ${sy}`;
    return `${sm} ${s.getDate()} – ${e.getDate()}, ${sy}`;
  }

  prevWeek(): void {
    const d = new Date(this.currentWeekStart);
    d.setDate(d.getDate() - 7);
    this.currentWeekStart = d;
    this.syncMonthToWeek();
  }

  nextWeek(): void {
    const d = new Date(this.currentWeekStart);
    d.setDate(d.getDate() + 7);
    this.currentWeekStart = d;
    this.syncMonthToWeek();
  }

  private syncMonthToWeek(): void {
    const y = this.currentWeekStart.getFullYear();
    const m = this.currentWeekStart.getMonth();
    if (y !== this.currentYear || m !== this.currentMonth) {
      this.currentYear = y;
      this.currentMonth = m;
      this.loadMedData();
    }
  }

  loadYearEvents(): void {
    const months = Array.from({ length: 12 }, (_, i) =>
      `${this.currentYear}-${String(i + 1).padStart(2, '0')}`
    );
    forkJoin(months.map(m => this.medicationLogService.getByMonth(m)))
      .subscribe({
        next: logsPerMonth => {
          this.loadError = false;
          this.yearMedLogs = logsPerMonth.flat();
          this.buildYearMonths();
        },
        error: () => { this.loadError = true; },
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
      const activeMeds = this.medications.filter(m => !m.startDate || m.startDate <= dateStr);
      const activeTimes = [...new Set(activeMeds.flatMap(m => m.times))].sort();
      const hasMeds = activeTimes.length > 0;

      let allMedsTaken = false;
      if (hasMeds && !isFuture && !isToday) {
        allMedsTaken = activeTimes.every(time => {
          const medsAtTime = activeMeds.filter(m => m.times.includes(time));
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

  buildDay(date: Date): CalendarDay {
    const dateStr = this.localDateString(date);
    const daySeizures = this.seizures.filter(s =>
      this.localDateString(new Date(s.dateTime)) === dateStr
    );
    const dayTriggers = this.triggers.filter(t => t.date === dateStr);
    const activeMeds = this.medications.filter(m => !m.startDate || m.startDate <= dateStr);
    const activeTimes = [...new Set(activeMeds.flatMap(m => m.times))].sort();
    const medSlots: MedSlot[] = activeTimes.map(time => {
      const medsAtTime = activeMeds.filter(m => m.times.includes(time));
      const taken = medsAtTime.length > 0 && medsAtTime.every(m =>
        this.medLogs.some(l => l.medicationId === m.id && l.scheduledTime === time && l.date === dateStr)
      );
      return { time, taken };
    });
    const allEvents: CalendarEvent[] = [
      ...daySeizures.map(s => ({ kind: 'seizure' as const, id: s.id!, label: this.seizureLabel(s) })),
      ...dayTriggers.map(t => ({ kind: 'trigger' as const, id: t.id!, label: this.triggerLabels[t.type] })),
    ];
    return {
      date, seizures: daySeizures, triggers: dayTriggers, medSlots,
      visibleEvents: allEvents.slice(0, 5),
      hiddenCount: Math.max(0, allEvents.length - 5),
    };
  }

  buildCalendar(): void {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const startDow = firstDay.getDay();
    const emptyDay = (): CalendarDay =>
      ({ date: null, seizures: [], triggers: [], medSlots: [], visibleEvents: [], hiddenCount: 0 });

    const weeks: CalendarDay[][] = [];
    let week: CalendarDay[] = [];
    for (let i = 0; i < startDow; i++) week.push(emptyDay());
    for (let d = 1; d <= lastDay.getDate(); d++) {
      week.push(this.buildDay(new Date(this.currentYear, this.currentMonth, d)));
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

  get daysSinceLastSeizure(): number | null {
    if (this.seizures.length === 0) return null;
    const last = new Date([...this.seizures].sort((a, b) =>
      new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
    )[0].dateTime);
    last.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
  }

  get todayMedStatus(): { total: number; taken: number } {
    const todayStr = this.localDateString(new Date());
    const activeMeds = this.medications.filter(m => !m.startDate || m.startDate <= todayStr);
    const activeTimes = [...new Set(activeMeds.flatMap(m => m.times))].sort();
    const taken = activeTimes.filter(time => {
      const medsAtTime = activeMeds.filter(m => m.times.includes(time));
      return medsAtTime.every(m =>
        this.sidebarMedLogs.some(l => l.medicationId === m.id && l.scheduledTime === time && l.date === todayStr)
      );
    }).length;
    return { total: activeTimes.length, taken };
  }

  get daysAllMedsTakenThisMonth(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let count = 0;
    for (let d = 1; d < today.getDate(); d++) {
      const date = new Date(today.getFullYear(), today.getMonth(), d);
      const dateStr = this.localDateString(date);
      const activeMeds = this.medications.filter(m => !m.startDate || m.startDate <= dateStr);
      const activeTimes = [...new Set(activeMeds.flatMap(m => m.times))].sort();
      if (activeTimes.length === 0) continue;
      const allTaken = activeTimes.every(time => {
        const medsAtTime = activeMeds.filter(m => m.times.includes(time));
        return medsAtTime.every(m =>
          this.sidebarMedLogs.some(l => l.medicationId === m.id && l.scheduledTime === time && l.date === dateStr)
        );
      });
      if (allTaken) count++;
    }
    return count;
  }

  isToday(date: Date | null): boolean {
    if (!date) return false;
    return this.localDateString(date) === this.localDateString(new Date());
  }

  toggleExportMonth(month: number) {
    const key = `${this.exportYear}-${month}`;
    if (this.selectedExportMonths.has(key)) {
      this.selectedExportMonths.delete(key);
    } else {
      this.selectedExportMonths.add(key);
    }
  }

  isExportMonthSelected(month: number): boolean {
    return this.selectedExportMonths.has(`${this.exportYear}-${month}`);
  }

  exportSelected() {
    const months = [...this.selectedExportMonths];
    if (months.length === 0) return;
    this.doExport(months);
  }

  exportAll() {
    const allDates = [
      ...this.seizures.map(s => s.dateTime.substring(0, 10)),
      ...this.triggers.map(t => t.date),
      ...this.medLogs.map(l => l.date),
    ].filter(Boolean).sort();

    if (allDates.length === 0) return;

    const [startYear, startMonth] = allDates[0].split('-').map(Number);
    const today = new Date();
    const endYear = today.getFullYear();
    const endMonth = today.getMonth() + 1;

    const months: string[] = [];
    let y = startYear, m = startMonth;
    while (y < endYear || (y === endYear && m <= endMonth)) {
      months.push(`${y}-${m}`);
      m++;
      if (m > 12) { m = 1; y++; }
    }

    this.doExport(months);
  }

  private async doExport(months: string[]) {
    const inRange = (dateStr: string) => {
      const [year, month] = dateStr.substring(0, 7).split('-').map(Number);
      return months.includes(`${year}-${month}`);
    };

    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;

    const lines: string[] = ['Type,Date,Time,Detail,Duration (min),Notes'];

    for (const s of this.seizures.filter(s => inRange(s.dateTime))) {
      const [date, time] = s.dateTime.split('T');
      const detail = s.type ? SEIZURE_TYPE_LABELS[s.type] : '';
      lines.push(`Seizure,${date},${time ?? ''},${esc(detail)},${s.durationMinutes ?? ''},${esc(s.notes ?? '')}`);
    }

    for (const t of this.triggers.filter(t => inRange(t.date))) {
      const detail = t.type === 'OTHER' ? (t.label ?? '') : TRIGGER_LABELS[t.type];
      lines.push(`Trigger,${t.date},,${esc(detail)},,`);
    }

    for (const l of this.medLogs.filter(l => inRange(l.date))) {
      const med = this.medications.find(m => m.id === l.medicationId);
      const name = med ? `${med.name} ${med.dosage}` : `Med #${l.medicationId}`;
      const status = l.takenAt ? 'Taken' : 'Missed';
      lines.push(`Medication,${l.date},${l.scheduledTime},${esc(name)},,${status}`);
    }

    const csv = lines.join('\n');
    const filename = `epilappsy-export-${new Date().toISOString().substring(0, 10)}.csv`;

    if (Capacitor.isNativePlatform()) {
      await Filesystem.writeFile({
        path: filename,
        data: csv,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });
      const { uri } = await Filesystem.getUri({ path: filename, directory: Directory.Cache });
      await Share.share({ title: filename, url: uri, dialogTitle: 'Save or share CSV' });
    } else {
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  }
}

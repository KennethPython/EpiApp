import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { firstValueFrom } from 'rxjs';
import { Medication } from '../models/medication.model';
import { MedicationService } from './medication.service';
import { MedicationLogService } from './medication-log.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {

  constructor(
    private medicationService: MedicationService,
    private medicationLogService: MedicationLogService,
  ) {}

  /**
   * Registers the action listener for medication notifications.
   * Call once on app init — handles "Take now" taps even when
   * the app was in the background.
   */
  init(): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    LocalNotifications.addListener('localNotificationActionPerformed', async (event: any) => {
      if (
        event.actionId === 'TAKE_NOW' &&
        event.notification?.extra?.isMedReminder === true
      ) {
        await this.handleTakeNow(event.notification.extra.time as string);
      }
    });
  }

  /**
   * Marks all medications scheduled at `time` as taken for today.
   * Called when the user taps "Take now" on a notification.
   */
  async handleTakeNow(time: string): Promise<void> {
    const dateStr = this.todayDateStr();
    let medications: Medication[];
    try {
      medications = await firstValueFrom(this.medicationService.getAll());
    } catch {
      return;
    }

    const medsAtTime = medications.filter(m => m.times.includes(time));
    for (const med of medsAtTime) {
      if (med.id == null) continue;
      try {
        await firstValueFrom(this.medicationLogService.markTaken(med.id, time, dateStr));
      } catch {
        // Already taken or network error — continue with remaining meds
      }
    }
  }

  async requestPermission(): Promise<boolean> {
    const { display } = await LocalNotifications.requestPermissions();
    return display === 'granted';
  }

  async scheduleForMedications(medications: Medication[]): Promise<void> {
    const granted = await this.requestPermission();
    if (!granted) return;

    await LocalNotifications.registerActionTypes({
      types: [{
        id: 'MEDICATION_REMINDER',
        actions: [
          { id: 'TAKE_NOW', title: 'Take now' },
          { id: 'CANCEL', title: 'Cancel', destructive: true },
        ],
      }],
    });

    // Cancel previous medication notifications before rescheduling
    const pending = await LocalNotifications.getPending();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toCancel = (pending.notifications as any[])
      .filter((n: any) => n.extra?.isMedReminder)
      .map((n: any) => ({ id: n.id as number }));
    if (toCancel.length > 0) {
      await LocalNotifications.cancel({ notifications: toCancel });
    }

    // Collect unique time slots across all medications
    const times = new Set<string>();
    for (const med of medications) {
      for (const time of med.times) {
        times.add(time);
      }
    }

    if (times.size === 0) return;

    const notifications = [...times].map(time => {
      const [hours, minutes] = time.split(':').map(Number);
      const at = new Date();
      at.setHours(hours, minutes, 0, 0);
      if (at <= new Date()) {
        at.setDate(at.getDate() + 1);
      }
      return {
        id: this.timeToId(time),
        title: '💊 Medication reminder',
        body: `Have you taken your ${time} meds yet?`,
        schedule: { at, repeats: true, every: 'day' as const },
        actionTypeId: 'MEDICATION_REMINDER',
        extra: { isMedReminder: true, time },
      };
    });

    await LocalNotifications.schedule({ notifications });
  }

  private todayDateStr(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private timeToId(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return 10000 + h * 100 + m;
  }
}

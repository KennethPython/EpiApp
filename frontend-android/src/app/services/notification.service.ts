import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Medication } from '../models/medication.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {

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
    const toCancel = pending.notifications
      .filter(n => n.extra?.isMedReminder)
      .map(n => ({ id: n.id }));
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

  private timeToId(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return 10000 + h * 100 + m;
  }
}

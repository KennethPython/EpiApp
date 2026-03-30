import { Injectable } from '@angular/core';
import { registerPlugin } from '@capacitor/core';

export interface SleepDay {
  date: string;          // 'YYYY-MM-DD'
  totalMinutes: number;
  totalHours: number;
  belowThreshold: boolean;  // true when < 8 hours
}

interface HealthConnectPlugin {
  checkAvailability(): Promise<{ available: boolean; status: number }>;
  checkPermissions(): Promise<{ available: boolean; granted: boolean }>;
  requestHealthPermissions(): Promise<{ granted: boolean }>;
  openHealthConnectSettings(): Promise<void>;
  getSleepForMonth(options: { year: number; month: number }): Promise<{ days: string }>;
}

const HealthConnect = registerPlugin<HealthConnectPlugin>('HealthConnect');

@Injectable({ providedIn: 'root' })
export class HealthService {

  /** True when Health Connect SDK is installed and available on device. */
  async checkAvailability(): Promise<boolean> {
    try {
      const { available } = await HealthConnect.checkAvailability();
      return available;
    } catch {
      return false;
    }
  }

  /**
   * Silent permission check — no dialog shown.
   * Returns { available, granted }.
   */
  async checkPermissions(): Promise<{ available: boolean; granted: boolean }> {
    try {
      return await HealthConnect.checkPermissions();
    } catch {
      return { available: false, granted: false };
    }
  }

  /**
   * Shows the Health Connect permission dialog.
   * If the permission was already granted the call resolves immediately.
   * Must be triggered from a user gesture (button tap).
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { granted } = await HealthConnect.requestHealthPermissions();
      return granted;
    } catch {
      return false;
    }
  }

  /** Opens the Health Connect settings page for this app. */
  async openSettings(): Promise<void> {
    try {
      await HealthConnect.openHealthConnectSettings();
    } catch {}
  }

  /**
   * Returns sleep data grouped by wakeup day for the given month.
   * @param year  4-digit year
   * @param month 1-indexed (1 = January … 12 = December)
   */
  async getSleepForMonth(year: number, month: number): Promise<SleepDay[]> {
    try {
      const { days } = await HealthConnect.getSleepForMonth({ year, month });
      return JSON.parse(days) as SleepDay[];
    } catch {
      return [];
    }
  }
}

import { Injectable } from '@angular/core';
import { Capacitor, registerPlugin } from '@capacitor/core';

interface HealthConnectPlugin {
  checkAvailability(): Promise<{ available: boolean; status: number }>;
  requestHealthPermissions(): Promise<{ granted: boolean }>;
  openHealthConnectSettings(): Promise<void>;
  getSleepLastNight(): Promise<{
    totalMinutes: number;
    totalHours: number;
    belowThreshold: boolean;
    sessions: string;
    sessionCount: number;
  }>;
}

const HealthConnect = registerPlugin<HealthConnectPlugin>('HealthConnect');

export interface SleepResult {
  totalHours: number;
  totalMinutes: number;
  sessionCount: number;
  sessions: string;
  belowThreshold: boolean;
}

@Injectable({ providedIn: 'root' })
export class HealthConnectService {

  async isAvailable(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;
    try {
      const { available } = await HealthConnect.checkAvailability();
      return available;
    } catch {
      return false;
    }
  }

  async requestPermissions(): Promise<{ granted: boolean; error?: string }> {
    try {
      const { granted } = await HealthConnect.requestHealthPermissions();
      return { granted };
    } catch (e: any) {
      return { granted: false, error: e?.message ?? String(e) };
    }
  }

  async openHealthConnectSettings(): Promise<void> {
    try { await HealthConnect.openHealthConnectSettings(); } catch {}
  }

  async getSleepLastNight(): Promise<SleepResult | null> {
    try {
      const data = await HealthConnect.getSleepLastNight();
      return {
        totalHours: Math.round(data.totalHours * 10) / 10,
        totalMinutes: data.totalMinutes,
        sessionCount: data.sessionCount,
        sessions: data.sessions,
        belowThreshold: data.belowThreshold,
      };
    } catch {
      return null;
    }
  }
}

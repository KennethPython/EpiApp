import { Injectable } from '@angular/core';
import { Capacitor, registerPlugin } from '@capacitor/core';

interface HealthConnectPlugin {
  checkAvailability(): Promise<{ available: boolean; status: number }>;
  requestPermissions(): Promise<{ granted: boolean }>;
  getSleepLastNight(): Promise<{
    totalMinutes: number;
    totalHours: number;
    belowThreshold: boolean;
    sessions: string;
  }>;
  getStepsToday(): Promise<{ steps: number }>;
}

const HealthConnect = registerPlugin<HealthConnectPlugin>('HealthConnect');

export interface SleepResult {
  totalHours: number;
  belowThreshold: boolean; // true when < 6 hours
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

  async requestPermissions(): Promise<boolean> {
    try {
      const { granted } = await HealthConnect.requestPermissions();
      return granted;
    } catch {
      return false;
    }
  }

  async getSleepLastNight(): Promise<SleepResult | null> {
    try {
      const data = await HealthConnect.getSleepLastNight();
      return {
        totalHours: Math.round(data.totalHours * 10) / 10,
        belowThreshold: data.belowThreshold,
      };
    } catch {
      return null;
    }
  }

  async getStepsToday(): Promise<number | null> {
    try {
      const { steps } = await HealthConnect.getStepsToday();
      return steps;
    } catch {
      return null;
    }
  }
}

import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { App } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';
import { firstValueFrom } from 'rxjs';
import { MedicationService } from './services/medication.service';
import { MedicationLogService } from './services/medication-log.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`
})
export class AppComponent implements OnInit {
  constructor(
    private location: Location,
    private router: Router,
    private medicationService: MedicationService,
    private medicationLogService: MedicationLogService,
  ) {}

  ngOnInit() {
    App.addListener('backButton', () => {
      if (window.history.length > 1) {
        this.location.back();
      } else {
        App.exitApp();
      }
    });

    LocalNotifications.addListener('localNotificationActionPerformed', async event => {
      const { actionId, notification } = event;
      const time: string = notification.extra?.time;

      if (actionId === 'TAKE_NOW' && time) {
        await this.takeAllMedsForTime(time);
      } else if (actionId === 'tap') {
        this.router.navigate(['/calendar']);
      }
      // CANCEL — do nothing
    });
  }

  private async takeAllMedsForTime(time: string): Promise<void> {
    const today = new Date().toISOString().substring(0, 10);
    const medications = await firstValueFrom(this.medicationService.getAll());
    const medsAtTime = medications.filter(m => m.times.includes(time));
    await Promise.all(
      medsAtTime.map(m =>
        firstValueFrom(this.medicationLogService.markTaken(m.id!, time, today))
      )
    );
  }
}

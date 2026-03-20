import { Component } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-add-event-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>Add Event</h2>
    <mat-dialog-content>
      <p class="prompt">What would you like to record?</p>
      <div class="choices">
        <button mat-raised-button color="warn" (click)="choose('SEIZURE')">
          <mat-icon>bolt</mat-icon>
          Seizure
        </button>
        <button mat-raised-button color="accent" (click)="choose('TRIGGER')">
          <mat-icon>warning</mat-icon>
          Trigger
        </button>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .prompt { margin-top: 0; color: rgba(0,0,0,0.6); }
    .choices { display: flex; gap: 16px; justify-content: center; padding: 8px 0 4px; }
    .choices button { flex: 1; }
    mat-icon { margin-right: 6px; }
  `]
})
export class AddEventDialogComponent {
  constructor(private dialogRef: MatDialogRef<AddEventDialogComponent>) {}

  choose(choice: 'SEIZURE' | 'TRIGGER'): void {
    this.dialogRef.close(choice);
  }
}

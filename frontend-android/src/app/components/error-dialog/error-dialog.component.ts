import { Component } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-error-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <div class="error-dialog">
      <svg viewBox="0 0 220 170" xmlns="http://www.w3.org/2000/svg" class="cat-svg">
        <!-- Ball of wool -->
        <circle cx="160" cy="125" r="22" fill="#e57373" stroke="#c62828" stroke-width="1.5"/>
        <path d="M143 113 Q160 102 177 118" stroke="white" stroke-width="1.5" fill="none"/>
        <path d="M140 124 Q160 111 180 123" stroke="white" stroke-width="1.5" fill="none"/>
        <path d="M142 134 Q160 122 178 132" stroke="white" stroke-width="1.5" fill="none"/>
        <path d="M148 140 Q160 133 173 138" stroke="white" stroke-width="1.4" fill="none"/>

        <!-- Yarn string to paw -->
        <path d="M140 118 Q115 95 95 90" stroke="#e57373" stroke-width="2" fill="none" stroke-dasharray="5,3"/>

        <!-- Cat body -->
        <ellipse cx="65" cy="128" rx="48" ry="32" fill="#ffcc80"/>

        <!-- Tail -->
        <path d="M108 132 Q145 150 138 118" stroke="#ffcc80" stroke-width="9" stroke-linecap="round" fill="none"/>

        <!-- Cat head -->
        <circle cx="52" cy="88" r="26" fill="#ffcc80"/>

        <!-- Ears -->
        <polygon points="32,72 22,50 44,65" fill="#ffcc80"/>
        <polygon points="36,71 29,54 44,65" fill="#ffb74d" opacity="0.7"/>
        <polygon points="68,68 74,47 82,66" fill="#ffcc80"/>
        <polygon points="69,68 74,51 80,66" fill="#ffb74d" opacity="0.7"/>

        <!-- Eyes -->
        <ellipse cx="43" cy="86" rx="5" ry="6" fill="#333"/>
        <ellipse cx="61" cy="86" rx="5" ry="6" fill="#333"/>
        <ellipse cx="44" cy="85" rx="2" ry="2.5" fill="white"/>
        <ellipse cx="62" cy="85" rx="2" ry="2.5" fill="white"/>

        <!-- Nose -->
        <polygon points="52,93 49,96 55,96" fill="#e91e63"/>
        <!-- Mouth -->
        <path d="M49,96 Q52,100 55,96" stroke="#888" stroke-width="1" fill="none"/>

        <!-- Whiskers -->
        <line x1="26" y1="91" x2="46" y2="93" stroke="#aaa" stroke-width="1"/>
        <line x1="26" y1="94" x2="46" y2="94" stroke="#aaa" stroke-width="1"/>
        <line x1="58" y1="93" x2="78" y2="91" stroke="#aaa" stroke-width="1"/>
        <line x1="58" y1="94" x2="78" y2="94" stroke="#aaa" stroke-width="1"/>

        <!-- Arm reaching -->
        <path d="M88 118 Q100 108 113 112" stroke="#ffcc80" stroke-width="11" stroke-linecap="round" fill="none"/>
        <!-- Paw -->
        <ellipse cx="117" cy="113" rx="11" ry="8" fill="#ffcc80"/>
        <line x1="110" y1="119" x2="113" y2="122" stroke="#ffb74d" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="117" y1="120" x2="117" y2="123" stroke="#ffb74d" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="124" y1="119" x2="121" y2="122" stroke="#ffb74d" stroke-width="1.5" stroke-linecap="round"/>
      </svg>

      <h2 class="title">Oops, something went wrong!</h2>
      <p class="message">We're working on it — please try again later.</p>

      <button mat-flat-button (click)="close()">Close</button>
    </div>
  `,
  styles: [`
    .error-dialog {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 32px 20px;
      background: #fff5f5;
      border-radius: 12px;
      text-align: center;
      max-width: 320px;
    }
    .cat-svg {
      width: 180px;
      height: auto;
      margin-bottom: 12px;
    }
    .title {
      margin: 0 0 8px;
      font-size: 1.1rem;
      font-weight: 600;
      color: #c62828;
    }
    .message {
      margin: 0 0 20px;
      font-size: 0.9rem;
      color: #b71c1c;
    }
    button {
      background-color: #e57373 !important;
      color: white !important;
      border-radius: 20px;
    }
  `],
})
export class ErrorDialogComponent {
  constructor(private dialogRef: MatDialogRef<ErrorDialogComponent>) {}

  close(): void {
    this.dialogRef.close();
  }
}

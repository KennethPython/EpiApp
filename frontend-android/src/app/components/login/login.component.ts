import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

import { AuthService } from '../../services/auth.service';

const THEME_VARS: Record<string, Record<string, string>> = {
  dark:     { primary: '#3C2580', btn: '#6A4FC0', pageBg: '#EDE8FA', cardBg: '#EEEAFC', border: '#D5C8F7' },
  clinical: { primary: '#0E3A6E', btn: '#1A6FC4', pageBg: '#E3EDF7', cardBg: '#E8F3FC', border: '#BDD9F4' },
  soft:     { primary: '#2D5C40', btn: '#4A8C63', pageBg: '#E4EDE7', cardBg: '#E8F4ED', border: '#BDD9C8' },
};

function applyStoredTheme(): void {
  const id = localStorage.getItem('epiapp_theme') ?? 'clinical';
  const t = THEME_VARS[id] ?? THEME_VARS['clinical'];
  const r = document.documentElement;
  r.style.setProperty('--theme-primary', t['primary']);
  r.style.setProperty('--theme-primary-btn', t['btn']);
  r.style.setProperty('--theme-page-bg', t['pageBg']);
  r.style.setProperty('--theme-card-bg', t['cardBg']);
  r.style.setProperty('--theme-border', t['border']);
  document.body.style.backgroundColor = t['pageBg'];
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  errorMessage = '';

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    applyStoredTheme();
  }

  login(): void {
    this.errorMessage = '';
    this.auth.login(this.username, this.password).subscribe({
      next: () => this.router.navigate(['/calendar']),
      error: (err) => {
        this.errorMessage = err.error?.message ?? 'Login failed. Please try again.';
      },
    });
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }
}

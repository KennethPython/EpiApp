import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, ReactiveFormsModule, FormBuilder, FormGroup, Validators, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

import { AuthService } from '../../services/auth.service';

function passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
  const value: string = control.value ?? '';
  if (!value) return null;
  const hasNumber = /[0-9]/.test(value);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);
  if (!hasNumber || !hasSpecial) {
    return { passwordStrength: true };
  }
  return null;
}

const THEME_VARS: Record<string, Record<string, string>> = {
  dark:     { primary: '#3C2580', btn: '#6A4FC0', pageBg: '#EDE8FA', cardBg: '#EEEAFC', border: '#D5C8F7' },
  clinical: { primary: '#0E3A6E', btn: '#1A6FC4', pageBg: '#E3EDF7', cardBg: '#E8F3FC', border: '#BDD9F4' },
  soft:     { primary: '#2D5C40', btn: '#4A8C63', pageBg: '#E4EDE7', cardBg: '#E8F4ED', border: '#BDD9C8' },
};

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent implements OnInit {
  form: FormGroup;
  errorMessage = '';

  ngOnInit(): void {
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

  constructor(private auth: AuthService, private router: Router, private fb: FormBuilder) {
    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(8), passwordStrengthValidator]],
    });
  }

  get passwordErrors() {
    const ctrl = this.form.get('password')!;
    if (!ctrl.touched || !ctrl.errors) return null;
    if (ctrl.errors['required']) return 'Password is required.';
    if (ctrl.errors['minlength']) return 'Password must be at least 8 characters.';
    if (ctrl.errors['passwordStrength']) return 'Password must contain at least 1 number and 1 special character.';
    return null;
  }

  register(): void {
    if (this.form.invalid) return;
    this.errorMessage = '';
    const { username, password } = this.form.value;
    this.auth.register(username, password).subscribe({
      next: () => this.router.navigate(['/calendar']),
      error: (err) => {
        this.errorMessage = err.error?.message ?? 'Registration failed. Please try again.';
      },
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}

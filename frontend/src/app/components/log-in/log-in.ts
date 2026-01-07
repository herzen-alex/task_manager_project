import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service'; // поправь путь под свой проект

@Component({
  selector: 'app-log-in',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './log-in.html',
  styleUrl: './log-in.scss',
})
export class LogIn {
  loading = false;
  error = '';
  showPassword = false;

  form;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private auth: AuthService
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      remember: [true],
    });
  }

  get f() { return this.form.controls; }

  submit() {
    this.error = '';
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.loading = true;

    const email = this.f.email.value!.trim().toLowerCase();
    const password = this.f.password.value!;

    this.auth.login({ email, password }).subscribe({
      next: (user) => {
        // user уже сохранён в localStorage внутри AuthService (tap)
        // на всякий: убираем старый мок-ключ
        localStorage.removeItem('auth');

        this.loading = false;
        this.router.navigate(['/main']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Login failed';
      }
    });
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }
}

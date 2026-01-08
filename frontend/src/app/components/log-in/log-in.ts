import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service';

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
    if (this.form.invalid || this.loading) return;
    this.error = '';
    this.loading = true;
    const email = (this.form.get('email')?.value ?? '').toString().trim();
    const password = (this.form.get('password')?.value ?? '').toString();
    this.auth.login({ email, password }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/app/main']);
      },
      error: (err) => {
        this.loading = false;
        console.warn('Login failed', err);
        if (err.status === 401) {
          this.error = 'Wrong email or password.';
        } else {
          this.error = 'Login failed. Please try again.';
        }
      },
    });
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  loginAsGuest() {
    if (this.loading) return;
    this.error = '';
    this.form.patchValue({
      email: 'guest@example.com',
      password: 'guest123',
      remember: false,
    });
    this.submit();
  }

}

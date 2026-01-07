import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service';

type RegisterModel = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})

export class Register {
  model: RegisterModel = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  };

  error = '';
  loading = false;

  constructor(private router: Router, private auth: AuthService) {}

  submit() {
    this.error = '';

    const name = this.model.name.trim();
    const email = this.model.email.trim().toLowerCase();
    const password = this.model.password;
    const confirm = this.model.confirmPassword;

    if (!name || !email || !password || !confirm) {
      this.error = 'Please fill in all fields.';
      return;
    }
    if (!email.includes('@')) {
      this.error = 'Please enter a valid email.';
      return;
    }
    if (password.length < 6) {
      this.error = 'Password must be at least 6 characters.';
      return;
    }
    if (password !== confirm) {
      this.error = 'Passwords do not match.';
      return;
    }

    this.loading = true;

    this.auth.register({ name, email, password }).subscribe({
      next: () => {
        this.loading = false;
        // после успешной регистрации -> на логин
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading = false;

        // красивое сообщение
        const msg =
          err?.error?.message ||
          (err?.status === 409 ? 'Email already exists.' : 'Registration failed.');
        this.error = msg;
      },
    });
  }

  goToLogin() {
    this.router.navigate(['/']);
  }
}

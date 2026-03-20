import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SettingsService } from '../../services/settings.service';

type SettingsTab = 'profile' | 'account';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings {
  private router = inject(Router);
  private auth = inject(AuthService);
  private settingsService = inject(SettingsService);

  activeTab: SettingsTab = 'profile';

  saving = false;
  status = '';

  openPassword = false;
  savingPass = false;
  passError = '';
  passOk = '';

  profile = {
    name: '',
    email: '',
  };

  password = {
    current: '',
    next: '',
    confirm: '',
  };

  isGuest = false;

  constructor() {
    this.loadProfile();
  }

  loadProfile() {
    this.status = '';
    this.settingsService.getMe().subscribe({
      next: (user) => {
        this.profile = {
          name: user.name,
          email: user.email,
        };
        this.isGuest = user.email === 'guest@example.com';
        if (this.isGuest) {
          this.openPassword = false;
        }
      },
      error: (err) => {
        console.error('Failed to load profile', err);
        this.status = err?.error?.message || 'Failed to load profile';
      },
    });
  }

  saveProfile() {
    if (this.isGuest) {
      this.status = 'Guest account cannot be edited.';
      return;
    }
    this.status = '';
    this.saving = true;
    this.settingsService.updateProfile({ name: this.profile.name }).subscribe({
      next: (response) => {
        this.auth.setUser({
          id: response.user.id,
          name: response.user.name,
          email: response.user.email,
        });
        this.profile = {
          name: response.user.name,
          email: response.user.email,
        };
        this.saving = false;
        this.status = 'Saved ✅';
        setTimeout(() => (this.status = ''), 1500);
      },
      error: (err) => {
        this.saving = false;
        this.status = err?.error?.message || 'Failed to save profile';
      },
    });
  }

  changePassword() {
    if (this.isGuest) {
      this.passError = 'Guest account password cannot be changed.';
      return;
    }
    this.passError = '';
    this.passOk = '';
    if (this.password.next !== this.password.confirm) {
      this.passError = 'Passwords do not match.';
      return;
    }
    this.savingPass = true;
    this.settingsService.updatePassword({
      current_password: this.password.current,
      new_password: this.password.next,
    }).subscribe({
      next: () => {
        this.savingPass = false;
        this.passOk = 'Password updated ✅';
        this.password = { current: '', next: '', confirm: '' };
        setTimeout(() => (this.passOk = ''), 1500);
      },
      error: (err) => {
        this.savingPass = false;
        this.passError = err?.error?.message || 'Failed to update password.';
      },
    });
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/log_in']);
  }

  deleteAccount() {
    if (this.isGuest) {
      alert('Guest account cannot be deleted.');
      return;
    }
    const confirmed = confirm(
      'Are you sure you want to delete your account? This will permanently remove your profile, tasks, contacts, and notes.'
    );
    if (!confirmed) return;
    this.settingsService.deleteAccount().subscribe({
      next: () => {
        this.auth.logout();
        this.router.navigate(['/log_in']);
      },
      error: (err) => {
        alert(err?.error?.message || 'Failed to delete account.');
      },
    });
  }

  resetLocal() {
    this.auth.logout();
    location.reload();
  }
}
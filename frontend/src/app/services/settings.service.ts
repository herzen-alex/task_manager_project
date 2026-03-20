import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export interface MeResponse {
  id: number;
  name: string;
  email: string;
  createdAt?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private apiUrl = 'http://127.0.0.1:5000';

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) { }

  private requireAuthOptions() {
    const opts = this.auth.authOptions;
    if (!opts) {
      return null;
    }
    return opts;
  }

  getMe(): Observable<MeResponse> {
    const opts = this.requireAuthOptions();
    if (!opts) {
      return throwError(() => new Error('Not logged in: missing user id'));
    }

    return this.http.get<MeResponse>(`${this.apiUrl}/me`, opts);
  }

  updateProfile(data: { name: string }): Observable<{ message: string; user: MeResponse }> {
    const opts = this.requireAuthOptions();
    if (!opts) {
      return throwError(() => new Error('Not logged in: missing user id'));
    }

    return this.http.put<{ message: string; user: MeResponse }>(
      `${this.apiUrl}/me`,
      data,
      opts
    );
  }

  updatePassword(data: { current_password: string; new_password: string }): Observable<{ message: string }> {
    const opts = this.requireAuthOptions();
    if (!opts) {
      return throwError(() => new Error('Not logged in: missing user id'));
    }

    return this.http.put<{ message: string }>(
      `${this.apiUrl}/me/password`,
      data,
      opts
    );
  }

  deleteAccount(): Observable<{ message: string }> {
    const opts = this.requireAuthOptions();
    if (!opts) {
      return throwError(() => new Error('Not logged in: missing user id'));
    }

    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/me`,
      opts
    );
  }
}
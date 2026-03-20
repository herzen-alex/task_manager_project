import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export type UserDto = { id: number; name: string; email: string };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = 'http://localhost:5000';

  private userSubject = new BehaviorSubject<UserDto | null>(this.getUserFromStorage());
  user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {}

  private getUserFromStorage(): UserDto | null {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  }

  private saveUserToStorage(user: UserDto | null): void {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }

  setUser(user: UserDto | null): void {
    this.saveUserToStorage(user);
    this.userSubject.next(user);
  }

  register(payload: { name: string; email: string; password: string }): Observable<UserDto> {
    return this.http.post<UserDto>(`${this.api}/auth/register`, payload);
  }

  login(payload: { email: string; password: string }): Observable<UserDto> {
    return this.http.post<UserDto>(`${this.api}/auth/login`, payload).pipe(
      tap(user => this.setUser(user))
    );
  }

  logout(): void {
    this.setUser(null);
  }

  get currentUser(): UserDto | null {
    return this.userSubject.value;
  }

  get authOptions(): { headers: HttpHeaders } | null {
    const user = this.currentUser;
    if (!user?.id) return null;

    return {
      headers: new HttpHeaders({
        'X-User-Id': String(user.id),
      }),
    };
  }
}
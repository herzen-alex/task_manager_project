import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export type UserDto = { id: number; name: string; email: string };

@Injectable({ providedIn: 'root' })
export class AuthService {
    private api = 'http://localhost:5000';

    constructor(private http: HttpClient) { }

    register(payload: { name: string; email: string; password: string }): Observable<UserDto> {
        return this.http.post<UserDto>(`${this.api}/auth/register`, payload);
    }

    login(payload: { email: string; password: string }): Observable<UserDto> {
        return this.http.post<UserDto>(`${this.api}/auth/login`, payload).pipe(
            tap(user => localStorage.setItem('user', JSON.stringify(user)))
        );
    }

    logout() {
        localStorage.removeItem('user');
    }

    get currentUser(): UserDto | null {
        const raw = localStorage.getItem('user');
        return raw ? JSON.parse(raw) : null;
    }
}
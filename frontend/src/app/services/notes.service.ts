import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export interface Note {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId?: number;
  user?: { id: number; name: string; email: string } | null;
}

@Injectable({
  providedIn: 'root',
})
export class NotesService {
  private baseUrl = 'http://localhost:5000/notes';

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  getNotes(): Observable<Note[]> {
    return this.http.get<Note[]>(this.baseUrl);
  }

  getNote(id: number): Observable<Note> {
    return this.http.get<Note>(`${this.baseUrl}/${id}`);
  }

  createNote(payload: { title: string; content: string }): Observable<Note> {
    const opts = this.auth.authOptions;
    if (!opts) return throwError(() => new Error('Not logged in: missing user id'));
    return this.http.post<Note>(this.baseUrl, payload, opts);
  }

  updateNote(id: number, payload: { title: string; content: string }): Observable<Note> {
    const opts = this.auth.authOptions;
    if (!opts) return throwError(() => new Error('Not logged in: missing user id'));
    return this.http.put<Note>(`${this.baseUrl}/${id}`, payload, opts);
  }

  deleteNote(id: number): Observable<void> {
    const opts = this.auth.authOptions;
    if (!opts) return throwError(() => new Error('Not logged in: missing user id'));
    return this.http.delete<void>(`${this.baseUrl}/${id}`, opts);
  }
}
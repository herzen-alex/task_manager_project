import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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
  ) { }

  /** Только для create/update/delete */
  private buildAuthHeaders() {
    const user = this.auth.currentUser;
    if (!user?.id) return null;

    return {
      headers: new HttpHeaders({
        'X-User-Id': String(user.id),
      }),
    };
  }

  // 🔓 PUBLIC: все могут смотреть заметки
  getNotes(): Observable<Note[]> {
    return this.http.get<Note[]>(this.baseUrl);
  }

  getNote(id: number): Observable<Note> {
    return this.http.get<Note>(`${this.baseUrl}/${id}`);
  }

  // 🔐 PRIVATE: создавать/редактировать может только залогиненный
  createNote(payload: { title: string; content: string }): Observable<Note> {
    const opts = this.buildAuthHeaders();
    if (!opts) return throwError(() => new Error('Not logged in: missing user id'));
    return this.http.post<Note>(this.baseUrl, payload, opts);
  }

  updateNote(id: number, payload: { title: string; content: string }): Observable<Note> {
    const opts = this.buildAuthHeaders();
    if (!opts) return throwError(() => new Error('Not logged in: missing user id'));
    return this.http.put<Note>(`${this.baseUrl}/${id}`, payload, opts);
  }

  deleteNote(id: number): Observable<void> {
    const opts = this.buildAuthHeaders();
    if (!opts) return throwError(() => new Error('Not logged in: missing user id'));
    return this.http.delete<void>(`${this.baseUrl}/${id}`, opts);
  }

}

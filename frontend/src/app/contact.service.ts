// frontend/src/app/contact.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export interface Contact {
  id?: number;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  position?: string | null;
  avatarColor?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  // на будущее, если привяжем к пользователю:
  userId?: number;
  user?: { id: number; name: string; email: string };
}

@Injectable({ providedIn: 'root' })
export class ContactService {
  private apiUrl = 'http://127.0.0.1:5000/contacts';

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  /** Headers только для операций записи (create/update/delete) */
  private buildAuthHeaders() {
    const user = this.auth.currentUser;
    if (!user?.id) return null;

    return {
      headers: new HttpHeaders({
        'X-User-Id': String(user.id),
      }),
    };
  }

  // ✅ PUBLIC: все могут видеть список контактов
  getContacts(): Observable<Contact[]> {
    return this.http.get<Contact[]>(this.apiUrl);
  }

  // ✅ получить один контакт по id
  getContact(id: number): Observable<Contact> {
    return this.http.get<Contact>(`${this.apiUrl}/${id}`);
  }

  // ✅ PRIVATE: только залогиненный может создавать
  addContact(contact: Contact): Observable<Contact> {
    const opts = this.buildAuthHeaders();
    if (!opts) return throwError(() => new Error('Not logged in: missing user id'));
    return this.http.post<Contact>(this.apiUrl, contact, opts);
  }

  updateContact(id: number, data: Partial<Contact>): Observable<Contact> {
    const opts = this.buildAuthHeaders();
    if (!opts) return throwError(() => new Error('Not logged in: missing user id'));
    return this.http.put<Contact>(`${this.apiUrl}/${id}`, data, opts);
  }

  deleteContact(id: number): Observable<any> {
    const opts = this.buildAuthHeaders();
    if (!opts) return throwError(() => new Error('Not logged in: missing user id'));
    return this.http.delete(`${this.apiUrl}/${id}`, opts);
  }
}

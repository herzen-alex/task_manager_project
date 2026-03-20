import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  getContacts(): Observable<Contact[]> {
    return this.http.get<Contact[]>(this.apiUrl);
  }

  getContact(id: number): Observable<Contact> {
    return this.http.get<Contact>(`${this.apiUrl}/${id}`);
  }

  addContact(contact: Contact): Observable<Contact> {
    const opts = this.auth.authOptions;
    if (!opts) return throwError(() => new Error('Not logged in: missing user id'));
    return this.http.post<Contact>(this.apiUrl, contact, opts);
  }

  updateContact(id: number, data: Partial<Contact>): Observable<Contact> {
    const opts = this.auth.authOptions;
    if (!opts) return throwError(() => new Error('Not logged in: missing user id'));
    return this.http.put<Contact>(`${this.apiUrl}/${id}`, data, opts);
  }

  deleteContact(id: number): Observable<any> {
    const opts = this.auth.authOptions;
    if (!opts) return throwError(() => new Error('Not logged in: missing user id'));
    return this.http.delete(`${this.apiUrl}/${id}`, opts);
  }
}
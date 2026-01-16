import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export interface SubTask {
  id: number;
  title: string;
  done: boolean;
}

// 🔹 Новый тип — один исполнитель
export interface TaskAssignee {
  id: number;
  name: string;
  email: string;
  avatarColor?: string | null;
}

export interface Task {
  id?: number;
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'urgent';
  status?: 'todo' | 'in-progress' | 'done';
  createdAt: Date;
  dueDate?: Date;
  done: boolean;
  subTasks?: SubTask[];

  // приходит с backend:
  assignedContacts?: TaskAssignee[];

  // уходим на backend при POST/PUT:
  assignedContactIds?: number[];

  // если бэкенд начнёт отдавать:
  userId?: number;
  user?: { id: number; name: string; email: string };
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private apiUrl = 'http://127.0.0.1:5000/tasks';

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  /** Headers only for write-operations (create/update/delete) */
  private buildAuthHeaders() {
    const user = this.auth.currentUser;
    if (!user?.id) return null;

    return {
      headers: new HttpHeaders({
        'X-User-Id': String(user.id),
      }),
    };
  }

  // ✅ PUBLIC: everyone can see all tasks
  getTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(this.apiUrl);
  }

  // ✅ PRIVATE(ish): only logged-in user can create
  addTask(task: Task): Observable<any> {
    const opts = this.buildAuthHeaders();
    if (!opts) return throwError(() => new Error('Not logged in: missing user id'));
    return this.http.post(this.apiUrl, task, opts);
  }

  updateTask(id: number, data: Partial<Task>): Observable<any> {
    const opts = this.buildAuthHeaders();
    if (!opts) return throwError(() => new Error('Not logged in: missing user id'));
    return this.http.put(`${this.apiUrl}/${id}`, data, opts);
  }

  deleteTask(id: number): Observable<any> {
    const opts = this.buildAuthHeaders();
    if (!opts) return throwError(() => new Error('Not logged in: missing user id'));
    return this.http.delete(`${this.apiUrl}/${id}`, opts);
  }
}

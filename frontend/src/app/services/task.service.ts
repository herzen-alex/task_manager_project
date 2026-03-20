import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export interface SubTask {
  id: number;
  title: string;
  done: boolean;
}

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
  assignedContacts?: TaskAssignee[];
  assignedContactIds?: number[];
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

  getTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(this.apiUrl);
  }

  addTask(task: Task): Observable<any> {
    const opts = this.auth.authOptions;
    if (!opts) return throwError(() => new Error('Not logged in: missing user id'));
    return this.http.post(this.apiUrl, task, opts);
  }

  updateTask(id: number, data: Partial<Task>): Observable<any> {
    const opts = this.auth.authOptions;
    if (!opts) return throwError(() => new Error('Not logged in: missing user id'));
    return this.http.put(`${this.apiUrl}/${id}`, data, opts);
  }

  deleteTask(id: number): Observable<any> {
    const opts = this.auth.authOptions;
    if (!opts) return throwError(() => new Error('Not logged in: missing user id'));
    return this.http.delete(`${this.apiUrl}/${id}`, opts);
  }
}
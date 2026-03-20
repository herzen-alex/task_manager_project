import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { Task, SubTask, TaskService, TaskAssignee } from '../../services/task.service';
import { EditCard } from './edit-card/edit-card';
import { Contact } from '../../services/contact.service';
import { ColorService } from '../../services/color.service';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, EditCard],
  templateUrl: './task-card.html',
  styleUrl: './task-card.scss',
})
export class TaskCard {
  @Input() task!: Task;
  @Input() contacts: Contact[] = [];

  @Output() toggleDone = new EventEmitter<Task>();
  @Output() delete = new EventEmitter<Task>();
  @Output() updated = new EventEmitter<Task>();

  newSubTaskTitle: string = '';
  isEditing = false;

  constructor(
    private taskService: TaskService,
    private colors: ColorService,        // 🔹 добавили
  ) {}

  get canMarkDone(): boolean {
    if (this.task.done) return true;
    if (!this.task.subTasks || this.task.subTasks.length === 0) return true;
    return this.task.subTasks.every((sub) => sub.done);
  }

  addSubTask() {
    if (this.task.done) return;
    const title = this.newSubTaskTitle.trim();
    if (!title) return;
    if (!this.task.subTasks) this.task.subTasks = [];
    const sub: SubTask = {
      id: Date.now(),
      title,
      done: false,
    };
    this.task.subTasks.push(sub);
    this.newSubTaskTitle = '';
    this.saveSubTasks();
  }

  updateProgress() {
    if (this.task.done) return;
    this.saveSubTasks();
  }

  private saveSubTasks() {
    if (!this.task.id) return;
    this.taskService.updateTask(this.task.id, { subTasks: this.task.subTasks }).subscribe({
      next: () => console.log('Subtasks updated on server'),
      error: () => console.error('Error updating subtasks'),
    });
  }

  get progress(): number {
    if (!this.task.subTasks || this.task.subTasks.length === 0) return 0;
    const doneCount = this.task.subTasks.filter((s) => s.done).length;
    return Math.round((doneCount / this.task.subTasks.length) * 100);
  }

  deleteSubTask(index: number) {
    if (this.task.done) return;
    if (!this.task.subTasks) return;
    this.task.subTasks.splice(index, 1);
    this.saveSubTasks();
  }

  // 🔧 Edit modal handling
  openEdit() {
    if (this.task.done) return;
    this.isEditing = true;
  }

  closeEdit() {
    this.isEditing = false;
  }

  onTaskUpdated(updatedTask: Task) {
    Object.assign(this.task, updatedTask);
    this.updated.emit(updatedTask);
    this.isEditing = false;
  }

  // 👥 Нормализованный список исполнителей
  get assignees(): TaskAssignee[] {
    return this.task.assignedContacts ?? [];
  }

  // 🔤 Инициалы для аватарки
  getAvatarInitials(name?: string | null): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  // 🎨 Цвет берём из общего ColorService
  private getAssigneeColor(a: TaskAssignee): string {
    const key = (a as any).email || a.name || 'assignee';
    return this.colors.getColor(key);
  }

  /**
   * Массив для *ngFor: initials + цвет на основе имени
   */
  get assigneeChips(): { initials: string; color: string; name: string }[] {
    if (!this.assignees.length) return [];
    return this.assignees.map((a) => {
      const name = a.name ?? '';
      const initials = this.getAvatarInitials(name);
      const color = this.getAssigneeColor(a);
      return { initials, color, name };
    });
  }
}



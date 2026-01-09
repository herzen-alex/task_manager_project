import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Task, SubTask, TaskService } from '../../task.service';
import { EditCard } from './edit-card/edit-card'; // 👈 новый компонент

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule, FormsModule, EditCard],
  templateUrl: './task-card.html',
  styleUrl: './task-card.scss',
})
export class TaskCard {
  @Input() task!: Task;

  @Output() toggleDone = new EventEmitter<Task>();
  @Output() delete = new EventEmitter<Task>();
  @Output() updated = new EventEmitter<Task>();

  newSubTaskTitle: string = '';
  isEditing = false;

  constructor(private taskService: TaskService) { }

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
    this.taskService
      .updateTask(this.task.id, { subTasks: this.task.subTasks })
      .subscribe({
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
    // Wir aktualisieren die lokalen Daten, damit die Karte sofort neu gezeichnet wird.
    Object.assign(this.task, updatedTask);
    this.updated.emit(updatedTask);
    this.isEditing = false;
  }
}

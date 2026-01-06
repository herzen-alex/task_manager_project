import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Task, SubTask, TaskService } from '../../task.service';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-card.html',
  styleUrl: './task-card.scss',
})

export class TaskCard {
  @Input() task!: Task;

  @Output() toggleDone = new EventEmitter<Task>();
  @Output() delete = new EventEmitter<Task>();

  newSubTaskTitle: string = '';

  constructor(private taskService: TaskService) { }

  get canMarkDone(): boolean {
    if (this.task.done) return true;
    if (!this.task.subTasks || this.task.subTasks.length === 0) return true;
    return this.task.subTasks.every(sub => sub.done);
  }

  // Hinzufügen einer neuen Subtask
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

  // Fortschritt aktualisieren, wenn sich das Checkbox ändert
  updateProgress() {
    if (this.task.done) return;
    this.saveSubTasks();
  }


  // Speichern von Subtasks auf dem Server
  private saveSubTasks() {
    if (!this.task.id) return;
    this.taskService.updateTask(this.task.id, { subTasks: this.task.subTasks }).subscribe({
      next: () => console.log('Subtasks updated on server'),
      error: () => console.error('Error updating subtasks')
    });
  }

  // Fortschritte machen
  get progress(): number {
    if (!this.task.subTasks || this.task.subTasks.length === 0) return 0;
    const doneCount = this.task.subTasks.filter(s => s.done).length;
    return Math.round((doneCount / this.task.subTasks.length) * 100);
  }

  deleteSubTask(index: number) {
    if (this.task.done) return;
    if (!this.task.subTasks) return;
    this.task.subTasks.splice(index, 1);
    this.saveSubTasks();
  }

}

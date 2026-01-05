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

  constructor(private taskService: TaskService) {}

  // Добавляем новую субтаску
  addSubTask() {
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

  // Обновляем прогресс при изменении чекбокса
  updateProgress() {
    this.saveSubTasks();
  }

  // Сохраняем субтаски на сервер
  private saveSubTasks() {
    if (!this.task.id) return;

    this.taskService.updateTask(this.task.id, { subTasks: this.task.subTasks }).subscribe({
      next: () => console.log('Subtasks updated on server'),
      error: () => console.error('Error updating subtasks')
    });
  }

  // Получаем прогресс
  get progress(): number {
    if (!this.task.subTasks || this.task.subTasks.length === 0) return 0;
    const doneCount = this.task.subTasks.filter(s => s.done).length;
    return Math.round((doneCount / this.task.subTasks.length) * 100);
  }
}

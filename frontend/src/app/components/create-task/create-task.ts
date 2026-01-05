import { Component, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Task, SubTask } from '../../task.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-create-task',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './create-task.html',
  styleUrl: './create-task.scss',
})
export class CreateTaskComponent {
  title = '';
  description = '';
  priority: 'low' | 'medium' | 'urgent' = 'low';
  dueDate: string = ''; // string из <input type="date">

  subtasks: { title: string; done: boolean }[] = [];

  @Output() close = new EventEmitter<void>();
  @Output() created = new EventEmitter<Task>();

  today: string = new Date().toISOString().split('T')[0]; // формат yyyy-MM-dd

  addSubtask() {
    this.subtasks.push({ title: '', done: false });
  }

  removeSubtask(index: number) {
    this.subtasks.splice(index, 1);
  }

  createTask() {
    if (!this.title.trim()) return alert('Title required');

    const task: Task = {
      id: Date.now() + Math.random(),
      title: this.title.trim(),
      description: this.description.trim(),
      priority: this.priority,
      createdAt: new Date(), // дата создания сразу сейчас
      dueDate: this.dueDate ? new Date(this.dueDate) : undefined, // преобразуем в Date
      subTasks: this.subtasks
        .filter(s => s.title.trim() !== '')
        .map<SubTask>(s => ({
          id: Date.now() + Math.random(),
          title: s.title.trim(),
          done: s.done,
        })),
      done: false,
      status: 'todo',
    };

    this.created.emit(task);

    // очистка формы
    this.title = '';
    this.description = '';
    this.priority = 'low';
    this.dueDate = '';
    this.subtasks = [];
  }

  closeModal() {
    this.close.emit();
  }
}

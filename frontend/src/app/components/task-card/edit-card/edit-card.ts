import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Task, SubTask, TaskService } from '../../../task.service';

@Component({
  selector: 'app-edit-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-card.html',
  styleUrl: './edit-card.scss',
})
export class EditCard implements OnChanges {
  @Input() task!: Task;

  @Output() close = new EventEmitter<void>();
  @Output() updated = new EventEmitter<Task>();

  title = '';
  description = '';
  priority: 'low' | 'medium' | 'urgent' = 'medium';
  dueDate = ''; // yyyy-MM-dd
  subtasks: SubTask[] = [];

  today = new Date().toISOString().slice(0, 10);

  constructor(private taskService: TaskService) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['task'] && this.task) {
      this.patchFromTask();
    }
  }

  private patchFromTask() {
    this.title = this.task.title ?? '';
    this.description = this.task.description ?? '';
    this.priority = (this.task.priority as any) || 'medium';

    if (this.task.dueDate) {
      const d = new Date(this.task.dueDate as any);
      this.dueDate = d.toISOString().slice(0, 10);
    } else {
      this.dueDate = '';
    }

    this.subtasks = this.task.subTasks
      ? this.task.subTasks.map((s) => ({ ...s }))
      : [];
  }


  addSubtask() {
    const title = '';
    const sub: SubTask = {
      id: Date.now(),
      title,
      done: false,
    };
    this.subtasks.push(sub);
  }

  removeSubtask(index: number) {
    this.subtasks.splice(index, 1);
  }

  onCancel() {
    this.close.emit();
  }

  onSave() {
  if (!this.task.id) return;

  const cleanedSubtasks = this.subtasks
    .map(s => ({ ...s, title: s.title.trim() }))
    .filter(s => s.title);  // убираем пустые

  const payload: Partial<Task> = {
    title: this.title.trim(),
    description: this.description.trim(),
    priority: this.priority,
    dueDate: this.dueDate ? new Date(this.dueDate) : undefined,
    subTasks: cleanedSubtasks,
  };

  this.taskService.updateTask(this.task.id, payload).subscribe({
    next: (updatedTask) => {
      this.updated.emit(updatedTask);
    },
    error: (err) => {
      console.error('Error updating task', err);
    },
  });
}


}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService, Task, SubTask } from '../../task.service';
import { CreateTaskComponent } from '../create-task/create-task';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { TaskCard } from '../task-card/task-card';

@Component({
  selector: 'app-task',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, TaskCard, CreateTaskComponent],
  templateUrl: './task.html',
  styleUrl: './task.scss',
})

export class TaskComponent implements OnInit {
  tasks: Task[] = [];
  todoTasks: Task[] = [];
  inProgressTasks: Task[] = [];
  doneTasks: Task[] = [];
  showCreateTask = false;

  // 🔹 Eigenschaften des Aufgabenerstellungsformulars
  title: string = '';
  description: string = '';
  priority: 'low' | 'medium' | 'urgent' = 'low';
  dueDate: string = '';
  subtasks: { title: string; done: boolean }[] = [];

  constructor(private taskService: TaskService) { }

  trackByTaskId(index: number, task: Task): string | number {
    return task.id ?? index;
  }


  ngOnInit() {
    this.loadTasks();
  }

  loadTasks() {
    this.taskService.getTasks().subscribe(tasks => {
      this.tasks = tasks;
      this.updateColumns();
    });
  }

  updateColumns() {
    this.todoTasks = this.tasks.filter(t => !t.status || t.status === 'todo');
    this.inProgressTasks = this.tasks.filter(t => t.status === 'in-progress');
    this.doneTasks = this.tasks.filter(t => t.status === 'done');
  }

  toggleDone(task: Task) {
    // нельзя завершать, если есть незавершённые subtasks
    if (!task.done && task.subTasks?.some(s => !s.done)) {
      return;
    }

    const newDone = !task.done;
    task.done = newDone;

    if (task.id) {
      this.taskService.updateTask(task.id, { done: newDone }).subscribe({
        error: () => {
          // откат, если сервер не принял
          task.done = !newDone;
        }
      });
    }
  }


  deleteTask(task: Task) {
    if (!task.id) return;
    this.taskService.deleteTask(task.id).subscribe(() => {
      this.loadTasks();
    });
  }

  openCreateTask() { this.showCreateTask = true; }
  closeCreateTask() { this.showCreateTask = false; }

  // ✅ Erstellen einer neuen Task über den Server
  onTaskCreated(task: Task & { subtasks?: { title: string; done: boolean }[] }) {
    // Datum und Status hinzufügen
    task.status = 'todo';
    task.createdAt = new Date();
    if (task.dueDate) task.dueDate = new Date(task.dueDate);
    // Generieren eindeutiger IDs für Subtasks
    if (task.subtasks && task.subtasks.length > 0) {
      task.subTasks = task.subtasks.map(sub => ({
        id: Date.now() + Math.random(),
        title: sub.title,
        done: sub.done || false
      }));
    }
    this.taskService.addTask(task).subscribe(() => {
      this.loadTasks();
      this.showCreateTask = false;
    });
  }

  // 🔥 Drag & Drop
  drop(event: CdkDragDrop<Task[]>, status: 'todo' | 'in-progress' | 'done') {
    const task = event.item.data as Task;
    if (!task || !task.id) return;
    const mainTask = this.tasks.find(t => t.id === task.id);
    if (mainTask) mainTask.status = status;
    if (event.previousContainer !== event.container) {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    }
    // Auf dem Server speichern
    this.taskService.updateTask(task.id, { status }).subscribe({
      next: () => { },
      error: () => {
        if (mainTask) {
          mainTask.status = event.previousContainer.id as any;
          this.updateColumns();
        }
      }
    });
  }
}

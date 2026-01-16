import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService, Task } from '../../task.service';
import { CreateTaskComponent } from '../create-task/create-task';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { TaskCard } from '../task-card/task-card';
import { ContactService, Contact } from '../../contact.service';

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
  contacts: Contact[] = [];
  showCreateTask = false;

  // 🔥 флаг: открыта ли где-то модалка редактирования
  isEditOpen = false;

  constructor(
    private taskService: TaskService,
    private contactService: ContactService,
  ) {}

  trackByTaskId(index: number, task: Task): string | number {
    return task.id ?? index;
  }

  ngOnInit() {
    this.loadContacts();
    this.loadTasks();
  }

  loadContacts() {
    this.contactService.getContacts().subscribe({
      next: (contacts) => (this.contacts = contacts),
      error: (err) => console.error('Error loading contacts', err),
    });
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
    if (!task.done && task.subTasks?.some(s => !s.done)) {
      return;
    }
    const newDone = !task.done;
    task.done = newDone;
    if (task.id) {
      this.taskService.updateTask(task.id, { done: newDone }).subscribe({
        error: () => {
          task.done = !newDone;
        },
      });
    }
  }

  deleteTask(task: Task) {
    if (!task.id) return;
    this.taskService.deleteTask(task.id).subscribe(() => {
      this.loadTasks();
    });
  }

  openCreateTask() {
    this.showCreateTask = true;
  }

  closeCreateTask() {
    this.showCreateTask = false;
  }

  onTaskCreated(task: Task) {
    if (!task.status) {
      task.status = 'todo';
    }
    if (!task.createdAt) {
      task.createdAt = new Date();
    }
    this.taskService.addTask(task).subscribe({
      next: () => {
        this.loadTasks();
        this.showCreateTask = false;
      },
      error: (err) => {
        console.error('Error creating task', err);
      },
    });
  }

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

    this.taskService.updateTask(task.id, { status }).subscribe({
      next: () => {},
      error: () => {
        if (mainTask) {
          mainTask.status = event.previousContainer.id as any;
          this.updateColumns();
        }
      },
    });
  }
}



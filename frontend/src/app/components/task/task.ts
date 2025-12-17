import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService, Task } from '../../task.service';

@Component({
  selector: 'app-task',   // ← КРИТИЧНО
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task.html',
  styleUrl: './task.scss',
})
export class TaskComponent implements OnInit {

  tasks: Task[] = [];
  newTitle = '';
  newDescription = '';

  constructor(private taskService: TaskService) {}

  ngOnInit() {
    this.loadTasks();
  }

  loadTasks() {
    this.taskService.getTasks().subscribe(tasks => {
      this.tasks = tasks;
    });
  }

  addTask() {
    if (!this.newTitle.trim()) return;

    this.taskService.addTask({
      title: this.newTitle,
      description: this.newDescription
    }).subscribe(() => {
      this.newTitle = '';
      this.newDescription = '';
      this.loadTasks();
    });
  }

  toggleDone(task: Task) {
    if (!task.id) return;

    this.taskService.updateTask(task.id, {
      done: !task.done
    }).subscribe(() => this.loadTasks());
  }

  deleteTask(task: Task) {
    if (!task.id) return;

    this.taskService.deleteTask(task.id)
      .subscribe(() => this.loadTasks());
  }
}


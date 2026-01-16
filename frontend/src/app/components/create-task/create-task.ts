import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContactService, Contact as ApiContact } from '../../contact.service';
import { SubTask, Task, TaskAssignee } from '../../task.service';

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
  dueDate: string = ''; // string aus <input type="date">

  subtasks: { title: string; done: boolean }[] = [];

  contacts: ApiContact[] = [];

  // выбранные исполнители
  selectedContactIds: number[] = [];

  // состояние дропдауна
  assigneeDropdownOpen = false;

  @Output() close = new EventEmitter<void>();
  @Output() created = new EventEmitter<Task>();

  today: string = new Date().toISOString().split('T')[0]; // Format yyyy-MM-dd

  constructor(private contactService: ContactService) {
    this.loadContacts();
  }

  private loadContacts() {
    this.contactService.getContacts().subscribe({
      next: (data) => {
        this.contacts = data;
      },
      error: (err) => {
        console.error('Error loading contacts for task create', err);
      },
    });
  }

  // 🧠 Текст в "закрытом" селекте
  get assigneeSummary(): string {
    const count = this.selectedContactIds.length;
    if (count === 0) {
      return 'Select assignees…';
    }
    if (count === 1) {
      const id = this.selectedContactIds[0];
      const contact = this.contacts.find((c) => c.id === id);
      return contact?.name ?? '1 selected';
    }
    return `${count} assignees selected`;
  }

  addSubtask() {
    this.subtasks.push({ title: '', done: false });
  }

  removeSubtask(index: number) {
    this.subtasks.splice(index, 1);
  }

  // ✅ открыть/закрыть дропдаун по клику на "селект"
  toggleAssigneeDropdown(event: MouseEvent) {
    event.stopPropagation();
    this.assigneeDropdownOpen = !this.assigneeDropdownOpen;
  }

  // ✅ закрыть дропдаун по клику вне компонента
  @HostListener('document:click')
  onDocumentClick() {
    if (this.assigneeDropdownOpen) {
      this.assigneeDropdownOpen = false;
    }
  }

  // ✅ чекбоксы: проверка выбран ли контакт
  isSelected(id: number): boolean {
    return this.selectedContactIds.includes(id);
  }

  // ✅ чекбоксы: переключение выбора
  toggleAssignee(id: number) {
    if (this.isSelected(id)) {
      this.selectedContactIds = this.selectedContactIds.filter((x) => x !== id);
    } else {
      this.selectedContactIds = [...this.selectedContactIds, id];
    }
  }

  createTask() {
  if (!this.title.trim()) return alert('Title required');

  // 🔹 находим всех выбранных контактов
  const selectedContacts = this.contacts.filter((c) =>
    this.selectedContactIds.includes(c.id!)
  );

  // массив для Task.assignedContacts (для UI)
  const assignees: TaskAssignee[] = selectedContacts.map((c) => ({
    id: c.id!,
    name: c.name,
    email: c.email,
  }));

  const task: Task = {
    // id отдаст backend, можно не ставить
    title: this.title.trim(),
    description: this.description.trim(),
    priority: this.priority,
    createdAt: new Date(),
    dueDate: this.dueDate ? new Date(this.dueDate) : undefined,
    subTasks: this.subtasks
      .filter((s) => s.title.trim() !== '')
      .map<SubTask>((s) => ({
        id: Date.now() + Math.random(),
        title: s.title.trim(),
        done: s.done,
      })),
    done: false,
    status: 'todo',

    // 🔥 то, что реально читает backend
    assignedContactIds: [...this.selectedContactIds],

    // для удобства на фронте (не обязательно для backend)
    assignedContacts: assignees,
  };

  this.created.emit(task);

  // очистка формы
  this.title = '';
  this.description = '';
  this.priority = 'low';
  this.dueDate = '';
  this.subtasks = [];
  this.selectedContactIds = [];
  this.assigneeDropdownOpen = false;
}

  closeModal() {
    this.close.emit();
  }
}

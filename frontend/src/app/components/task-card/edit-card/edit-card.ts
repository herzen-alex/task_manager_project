import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, HostListener} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Task, SubTask, TaskService, TaskAssignee } from '../../../task.service';
import { Contact } from '../../../contact.service';

@Component({
  selector: 'app-edit-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-card.html',
  styleUrl: './edit-card.scss',
})

export class EditCard implements OnChanges {
  @Input() task!: Task;
  @Input() contacts: Contact[] = [];

  @Output() close = new EventEmitter<void>();
  @Output() updated = new EventEmitter<Task>();

  title = '';
  description = '';
  priority: 'low' | 'medium' | 'urgent' = 'medium';
  dueDate = ''; // yyyy-MM-dd
  subtasks: SubTask[] = [];

  today = new Date().toISOString().slice(0, 10);

  // 👥 выбранные контакты в модалке
  selectedContactIds: number[] = [];
  assigneeDropdownOpen = false;

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

    // 👥 инициализируем выбранные контакты из задачи
    if (this.task.assignedContacts && this.task.assignedContacts.length > 0) {
      this.selectedContactIds = this.task.assignedContacts
        .map((a) => a.id)
        .filter((id) => id != null);
    } else if ((this.task as any).assignedContactId) {
      // старый вариант схемы, на всякий случай
      this.selectedContactIds = [(this.task as any).assignedContactId];
    } else {
      this.selectedContactIds = [];
    }
  }

  // =============================
  //      Subtasks
  // =============================

  addSubtask() {
    const sub: SubTask = {
      id: Date.now(),
      title: '',
      done: false,
    };
    this.subtasks.push(sub);
  }

  removeSubtask(index: number) {
    this.subtasks.splice(index, 1);
  }

  // =============================
  //      Assignees UI
  // =============================

  get assigneeSummary(): string {
    const count = this.selectedContactIds.length;
    if (count === 0) return 'Select assignees…';
    if (count === 1) {
      const id = this.selectedContactIds[0];
      const c = this.contacts.find((x) => x.id === id);
      return c?.name ?? '1 selected';
    }
    return `${count} assignees selected`;
  }

  toggleAssigneeDropdown(event: MouseEvent) {
    event.stopPropagation();
    this.assigneeDropdownOpen = !this.assigneeDropdownOpen;
  }

  @HostListener('document:click')
  onDocumentClick() {
    if (this.assigneeDropdownOpen) {
      this.assigneeDropdownOpen = false;
    }
  }

  isSelected(id: number): boolean {
    return this.selectedContactIds.includes(id);
  }

  toggleAssignee(id: number) {
    if (this.isSelected(id)) {
      this.selectedContactIds = this.selectedContactIds.filter((x) => x !== id);
    } else {
      this.selectedContactIds = [...this.selectedContactIds, id];
    }
  }

  // =============================
  //      Actions
  // =============================

  onCancel() {
    this.close.emit();
  }

  onSave() {
    if (!this.task.id) return;

    const cleanedSubtasks = this.subtasks
      .map((s) => ({ ...s, title: s.title.trim() }))
      .filter((s) => s.title);

    // 👥 строим массив исполнителей для фронта (как в CreateTask)
    const selectedContacts = this.contacts.filter((c) =>
      this.selectedContactIds.includes(c.id!)
    );

    const assignees: TaskAssignee[] = selectedContacts.map((c) => ({
      id: c.id!,
      name: c.name,
      email: c.email,
    }));

    const payload: Partial<Task> = {
      title: this.title.trim(),
      description: this.description.trim(),
      priority: this.priority,
      dueDate: this.dueDate ? new Date(this.dueDate) : undefined,
      subTasks: cleanedSubtasks,

      // 👇 главное для бэка
      assignedContactIds: [...this.selectedContactIds],

      // 👇 бонус для UI (можно убрать, если бэк сам вернёт)
      assignedContacts: assignees,
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

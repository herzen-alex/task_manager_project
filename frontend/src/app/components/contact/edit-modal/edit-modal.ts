import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';

export type ContactModel = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  company?: string;      // 👈 NEW
  // avatarColor?: string; // если позже захотим сохранять в БД
};

@Component({
  selector: 'app-edit-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-modal.html',
  styleUrl: './edit-modal.scss',
})
export class EditModal implements OnChanges {

  errorMessage = '';

  @Input() isOpen = false;
  @Input() isAdding = false;
  @Input() contact: ContactModel | null = null;

  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<ContactModel>();

  draft: ContactModel | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (this.isOpen && this.contact) {
      this.draft = { ...this.contact };
    }

    if (!this.isOpen) {
      this.draft = null;
    }
  }

  // ===========================
  //     VALIDATION HELPERS
  // ===========================

  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  isValidPhone(phone: string): boolean {
    const cleaned = phone.replace(/[\s-]/g, '');
    return /^[+]?\d{6,}$/.test(cleaned);
  }

  // ===========================
  //      AVATAR UTILITIES
  // ===========================

  getAvatarColor(name?: string | null): string {
    const palette = [
      '#f97316', '#f59e0b', '#22c55e', '#0ea5e9',
      '#6366f1', '#ec4899', '#14b8a6', '#a855f7',
      '#2dd4bf', '#fb7185', '#10b981', '#3b82f6'
    ];

    // делаем ключ: либо нормализованное имя, либо 'default'
    const key = (name ?? '').trim() || 'default';

    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }

    return palette[Math.abs(hash) % palette.length];
  }


  // ===========================
  //       MODAL ACTIONS
  // ===========================

  onCancel() {
    this.cancel.emit();
    this.errorMessage = '';
  }

  onSave() {
    if (!this.draft) return;

    const name = this.draft.name.trim();
    const email = this.draft.email.trim();
    const phone = this.draft.phone?.trim() ?? '';
    const company = this.draft.company?.trim() ?? '';
    const role = this.draft.role?.trim() ?? '';

    this.errorMessage = '';

    if (!name || !email) {
      this.errorMessage = 'Bitte fülle alle erforderlichen Felder aus.';
      return;
    }

    if (!this.isValidEmail(email)) {
      this.errorMessage = 'Bitte gib eine gültige E-Mail-Adresse ein.';
      return;
    }

    if (phone && !this.isValidPhone(phone)) {
      this.errorMessage = 'Bitte gib eine gültige Telefonnummer ein.';
      return;
    }

    this.save.emit({
      ...this.draft,
      name,
      email,
      phone,
      role,
      company,
    });
  }
}

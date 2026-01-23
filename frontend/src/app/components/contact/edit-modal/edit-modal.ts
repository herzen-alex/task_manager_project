import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ColorService } from '../../../color.service';

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

  constructor(private colors: ColorService) {}

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

  getAvatarColor(): string {
    if (!this.draft) {
      return this.colors.getColor('contact');
    }
    const key = this.draft.email || this.draft.name || 'contact';
    return this.colors.getColor(key);
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

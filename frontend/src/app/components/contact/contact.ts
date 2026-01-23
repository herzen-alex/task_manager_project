import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { EditModal, ContactModel } from './edit-modal/edit-modal';
import { ContactService, Contact as ApiContact } from '../../contact.service';
import { ColorService } from '../../color.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, EditModal],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class Contact implements OnInit {
  contacts: ContactModel[] = [];

  isModalOpen = false;
  isAdding = false;
  editingContact: ContactModel | null = null;

  loading = false;
  error = '';

  constructor(
    private contactService: ContactService,
    private colors: ColorService
  ) { }

  ngOnInit(): void {
    this.loadContacts();
  }

  private loadContacts() {
    this.loading = true;
    this.error = '';

    this.contactService.getContacts().subscribe({
      next: (data: ApiContact[]) => {
        this.contacts = data.map((c) => this.mapApiToModel(c));
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading contacts', err);
        this.error = 'Failed to load contacts.';
        this.loading = false;
      },
    });
  }

    /** 🎨 Цвет аватара на основе имени */
  getAvatarColor(c: ContactModel): string {
    const key = c.email || c.name || 'contact';
    return this.colors.getColor(key);
  }

  getInitial(name?: string | null): string {
    if (!name) return '?';
    const trimmed = name.trim();
    return trimmed ? trimmed.charAt(0).toUpperCase() : '?';
  }

  /** Маппинг: API → UI-модель */
  private mapApiToModel(c: ApiContact): ContactModel {
    return {
      id: c.id!,
      name: c.name,
      email: c.email,
      phone: c.phone ?? '',
      role: c.position ?? '',      // position с бэка → role в UI
      company: c.company ?? '',    // company с бэка → company в UI
    };
  }

  /** Маппинг: UI-модель → API-пейлоад */
  private mapModelToApiPayload(model: ContactModel): Partial<ApiContact> {
    return {
      name: model.name,
      email: model.email,
      phone: model.phone || null,
      position: model.role || null,
      company: model.company || null,
      // avatarColor можно будет добавить позже
    };
  }

  openAdd() {
    this.isAdding = true;
    this.editingContact = {
      id: Date.now(), // временный id только для модалки, реальный вернёт бэк
      name: '',
      email: '',
      phone: '',
      role: '',
      company: '',
    };
    this.isModalOpen = true;
  }

  openEdit(c: ContactModel) {
    this.isAdding = false;
    this.editingContact = { ...c };
    this.isModalOpen = true;
  }

  onCancelModal() {
    this.isModalOpen = false;
    this.editingContact = null;
  }

  onSaveModal(updated: ContactModel) {
    const payload = this.mapModelToApiPayload(updated);

    if (this.isAdding) {
      // ▶ CREATE
      this.contactService.addContact(payload as ApiContact).subscribe({
        next: (created) => {
          const model = this.mapApiToModel(created);
          this.contacts.push(model);
          this.isModalOpen = false;
          this.editingContact = null;
        },
        error: (err) => {
          console.error('Error creating contact', err);
        },
      });
    } else {
      if (!updated.id) return;

      this.contactService.updateContact(updated.id, payload).subscribe({
        next: (saved) => {
          const model = this.mapApiToModel(saved);
          this.contacts = this.contacts.map((c) =>
            c.id === model.id ? model : c
          );
          this.isModalOpen = false;
          this.editingContact = null;
        },
        error: (err) => {
          console.error('Error updating contact', err);
        },
      });
    }
  }

  deleteContact(c: ContactModel) {
    if (!c.id) return;
    if (!confirm(`Kontakt "${c.name}" wirklich löschen?`)) return;

    this.contactService.deleteContact(c.id).subscribe({
      next: () => {
        this.contacts = this.contacts.filter((x) => x.id !== c.id);
      },
      error: (err) => {
        console.error('Error deleting contact', err);
      },
    });
  }
}

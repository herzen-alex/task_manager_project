import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Note } from '../../../notes.service';

@Component({
  selector: 'app-notes-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notes-card.html',
  styleUrl: './notes-card.scss',
})
export class NotesCard {
  @Input() note!: Note;
  @Input() selected = false;
  @Input() authorColor: string | null = null;

  @Output() select = new EventEmitter<void>();

  onClick() {
    this.select.emit();
  }

  get preview(): string {
    if (!this.note?.content) return '';
    const s = this.note.content.replace(/\s+/g, ' ').trim();
    return s.length > 80 ? s.slice(0, 80) + '…' : s;
  }

  get author(): string {
    return this.note?.user?.name || 'Guest';
  }

    get authorName(): string {
    return this.note.user?.name || 'Guest';
  }
}

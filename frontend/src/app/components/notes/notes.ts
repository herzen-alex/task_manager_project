import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NotesService, Note } from '../../notes.service';
import { NotesCard } from './notes-card/notes-card';
import { ColorService } from '../../color.service';

@Component({
  selector: 'app-notes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NotesCard],
  templateUrl: './notes.html',
  styleUrl: './notes.scss',
})

export class Notes implements OnInit {
  notes: Note[] = [];
  filteredNotes: Note[] = [];

  selectedNote: Note | null = null;

  editTitle = '';
  editContent = '';
  searchTerm = '';

  loading = false;
  saving = false;
  error = '';

  constructor(
    private notesService: NotesService,
    private colors: ColorService
  ) { }

  ngOnInit(): void {
    this.loadNotes();
  }

  loadNotes() {
    this.loading = true;
    this.error = '';
    this.notesService.getNotes().subscribe({
      next: (notes) => this.onLoadNotesSuccess(notes),
      error: (err) => this.onLoadNotesError(err),
    });
  }

  private onLoadNotesSuccess(notes: Note[]) {
    this.notes = this.sortByUpdatedDesc([...notes]);
    this.applyFilter();
    this.selectFirstNoteIfNone();
    this.loading = false;
  }

  private sortByUpdatedDesc(list: Note[]): Note[] {
    return list.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() -
        new Date(a.updatedAt).getTime()
    );
  }

  private selectFirstNoteIfNone() {
    if (!this.selectedNote && this.notes.length > 0) {
      this.selectNote(this.notes[0]);
    }
  }

  private onLoadNotesError(err: any) {
    console.warn('Failed to load notes', err);
    this.error = 'Could not load notes.';
    this.loading = false;
  }


  applyFilter() {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.filteredNotes = this.notes;
      return;
    }
    this.filteredNotes = this.notes.filter((n) => {
      return (
        (n.title || '').toLowerCase().includes(term) ||
        (n.content || '').toLowerCase().includes(term) ||
        (n.user?.name || '').toLowerCase().includes(term)
      );
    });
  }

  onSearchChange() {
    this.applyFilter();
  }

  newNote() {
    this.selectedNote = null;
    this.editTitle = '';
    this.editContent = '';
  }

  selectNote(note: Note) {
    this.selectedNote = note;
    this.editTitle = note.title || '';
    this.editContent = note.content || '';
  }

  get isEditMode(): boolean {
    return !!this.selectedNote && !!this.selectedNote.id;
  }

  saveNote() {
    const { title, content } = this.getTrimmedNoteData();
    if (!title && !content) return;
    this.saving = true;
    this.error = '';
    if (this.isEditMode && this.selectedNote) {
      this.updateExistingNote(title, content);
    } else {
      this.createNewNote(title, content);
    }
  }

  private getTrimmedNoteData() {
    return {
      title: this.editTitle.trim(),
      content: this.editContent.trim(),
    };
  }

  private updateExistingNote(title: string, content: string) {
    if (!this.selectedNote) return;
    this.notesService
      .updateNote(this.selectedNote.id, { title, content })
      .subscribe({
        next: (updated) => this.onUpdateSuccess(updated),
        error: (err) => this.handleSaveError(err, 'edit'),
      });
  }

  private createNewNote(title: string, content: string) {
    this.notesService
      .createNote({ title, content })
      .subscribe({
        next: (created) => this.onCreateSuccess(created),
        error: (err) => this.handleSaveError(err, 'create'),
      });
  }

  private onUpdateSuccess(updated: Note) {
    const idx = this.notes.findIndex((n) => n.id === updated.id);
    if (idx >= 0) this.notes[idx] = updated;
    this.sortNotesByUpdated();
    this.applyFilter();
    this.selectNote(updated);
    this.saving = false;
  }

  private onCreateSuccess(created: Note) {
    this.notes.unshift(created);
    this.applyFilter();
    this.selectNote(created);
    this.saving = false;
  }

  private sortNotesByUpdated() {
    this.notes.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() -
        new Date(a.updatedAt).getTime()
    );
  }

  private handleSaveError(err: any, mode: 'edit' | 'create') {
    console.warn('Failed to save note', err);
    const notLoggedMsg =
      mode === 'edit'
        ? 'You must be logged in to edit notes.'
        : 'You must be logged in to create notes.';
    const genericMsg =
      mode === 'edit'
        ? 'Could not update note.'
        : 'Could not create note.';
    this.error =
      err?.message === 'Not logged in: missing user id'
        ? notLoggedMsg
        : genericMsg;
    this.saving = false;
  }

  deleteSelected() {
    if (!this.selectedNote?.id) return;
    this.saving = true;
    this.error = '';
    const id = this.selectedNote.id;
    this.notesService.deleteNote(id).subscribe({
      next: () => this.onDeleteSuccess(id),
      error: (err) => this.onDeleteError(err),
    });
  }

  private onDeleteSuccess(id: number) {
    this.notes = this.notes.filter((n) => n.id !== id);
    this.applyFilter();
    this.selectedNote = this.notes[0] || null;
    this.editTitle = this.selectedNote?.title || '';
    this.editContent = this.selectedNote?.content || '';
    this.saving = false;
  }

  private onDeleteError(err: any) {
    console.warn('Failed to delete note:', err);
    this.error = 'Could not delete note.';
    this.saving = false;
  }

  cancelEdit() {
    if (this.selectedNote) {
      this.editTitle = this.selectedNote.title || '';
      this.editContent = this.selectedNote.content || '';
    } else {
      this.editTitle = '';
      this.editContent = '';
    }
  }

  private getAuthorKey(note: Note): string {
    return note.user?.email || note.user?.name || 'Guest';
  }

  getAuthorColor(note: Note): string {
    const key = this.getAuthorKey(note);
    return this.colors.getColor(key);
  }
}

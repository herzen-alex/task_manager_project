import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

type ContactModel = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role?: string;
};

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class Contact {

  contacts: ContactModel[] = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Frontend Dev', phone: '+49 123 456 78' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Product Owner' },
    { id: 3, name: 'Max Mustermann', email: 'max@example.com', phone: '+49 987 654 32' },
  ];

  editContact(c: ContactModel) {
    console.log('Edit contact', c);
    // потом сделаем модалку/форму
  }

  deleteContact(c: ContactModel) {
    console.log('Delete contact', c);
    // потом повесим запрос на бекенд
  }

}

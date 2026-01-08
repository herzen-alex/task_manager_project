import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
})
export class Topbar {

  user: any = null;

  constructor() {
    const saved = localStorage.getItem('user');
    if (saved) {
      this.user = JSON.parse(saved);
    }
  }

  logout() {
    localStorage.removeItem('user');
    window.location.href = '/';
  }

}

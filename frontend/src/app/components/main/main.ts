import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskComponent } from '../task/task';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, FormsModule, TaskComponent],
  templateUrl: './main.html',
  styleUrl: './main.scss',
})
export class Main {

}

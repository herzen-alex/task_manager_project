import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskComponent } from '../task/task';
import { LogIn } from "../log-in/log-in";

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, FormsModule, TaskComponent, LogIn],
  templateUrl: './main.html',
  styleUrl: './main.scss',
})
export class Main {

}

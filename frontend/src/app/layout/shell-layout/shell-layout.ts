import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Topbar } from '../../shared/topbar/topbar';
import { Sidebar } from '../../shared/sidebar/sidebar';

@Component({
  selector: 'app-shell-layout',
  standalone: true,
  imports: [RouterOutlet, Topbar, Sidebar],
  templateUrl: './shell-layout.html',
  styleUrl: './shell-layout.scss',
})
export class ShellLayout {}

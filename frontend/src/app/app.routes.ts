// import { Routes } from '@angular/router';
// import { Main } from './components/main/main';
// import { LogIn } from './components/log-in/log-in';
// import { Register } from './components/register/register';
// import { Contact } from './components/contact/contact';
// import { Notes } from './components/notes/notes';
// import { Settings } from './components/settings/settings';

// export const routes: Routes = [
//   { path: '', component: LogIn },
//   { path: 'register', component: Register },
//   { path: 'main', component: Main },
//   { path: 'contacts', component: Contact },
//   { path: 'notes', component: Notes },
//   { path: 'settings', component: Settings },
// ];


import { Routes } from '@angular/router';
import { LogIn } from './components/log-in/log-in';
import { Register } from './components/register/register';
import { Main } from './components/main/main';
import { Contact } from './components/contact/contact';
import { Notes } from './components/notes/notes';
import { Settings } from './components/settings/settings';
import { ShellLayout } from './layout/shell-layout/shell-layout';
import { PrivacyPolicy } from './shared/privacy-policy/privacy-policy';
import { Imprint } from './shared/imprint/imprint';

export const routes: Routes = [
  // public (ohne layout)
  { path: '', component: LogIn },
  { path: 'register', component: Register },

  // protected zone (mit layout)
  {
    path: 'app',
    component: ShellLayout,
    children: [
      { path: 'main', component: Main },
      { path: 'contacts', component: Contact },
      { path: 'notes', component: Notes },
      { path: 'settings', component: Settings },
      { path: '', redirectTo: 'main', pathMatch: 'full' },

      { path: 'datenschutz', component: PrivacyPolicy },
      { path: 'impressum', component: Imprint },
    ],
  },

  { path: '**', redirectTo: '' },
];

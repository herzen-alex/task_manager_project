import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  importProvidersFrom        // ← ДОБАВИЛИ
} from '@angular/core';

import { provideRouter } from '@angular/router';
import { HttpClientModule } from '@angular/common/http'; // ← ДОБАВИЛИ

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),

    importProvidersFrom(HttpClientModule) // ← ВОТ ОН, КЛЮЧ
  ]
};

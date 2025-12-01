import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

/**
 * Punto de entrada principal de la aplicación.
 * Inicializa la aplicación Angular con AppComponent y la configuración global.
 */
bootstrapApplication(AppComponent, appConfig)
  .catch((err: unknown) => {
    console.error('Error al inicializar la aplicación:', err);
  });

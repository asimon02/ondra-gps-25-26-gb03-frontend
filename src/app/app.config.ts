import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { tokenRefreshInterceptor } from './core/interceptors/token-refresh.interceptor';

/**
 * Configuración principal de la aplicación.
 * Proporciona el router, cliente HTTP con interceptores, animaciones y optimizaciones de cambio de zona.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    /**
     * Optimización de detección de cambios usando zone.js
     * @param eventCoalescing Agrupa múltiples eventos para mejorar rendimiento
     */
    provideZoneChangeDetection({ eventCoalescing: true }),

    /** Configuración del router con las rutas definidas */
    provideRouter(routes),

    /** Proveedor de animaciones asincrónicas */
    provideAnimationsAsync(),

    /**
     * Proveedor del cliente HTTP con interceptores
     * - authInterceptor: agrega token de autenticación a cada petición
     * - tokenRefreshInterceptor: maneja renovación de token si expira
     */
    provideHttpClient(
      withInterceptors([
        authInterceptor,
        tokenRefreshInterceptor
      ])
    )
  ]
};

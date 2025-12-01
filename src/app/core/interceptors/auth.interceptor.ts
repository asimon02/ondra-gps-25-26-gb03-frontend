import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthStateService } from '../../core/services/auth-state.service';

/**
 * Interceptor HTTP que agrega automáticamente el token JWT de autorización
 * a las peticiones dirigidas a la API.
 *
 * Solo añade el header Authorization si:
 * - Existe un token válido en el estado de autenticación
 * - La URL de la petición incluye '/api/'
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authState = inject(AuthStateService);
  const fullToken = authState.getFullAuthToken();

  if (fullToken && req.url.includes('/api/')) {
    const clonedRequest = req.clone({
      setHeaders: { Authorization: fullToken }
    });
    return next(clonedRequest);
  }

  return next(req);
};

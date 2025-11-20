import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthStateService } from '../../core/services/auth-state.service';

/**
 * Interceptor que agrega el token JWT a las peticiones
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authState = inject(AuthStateService);
  const fullToken = authState.getFullAuthToken();

  // Solo agregar token si existe y la URL es de la API
  if (fullToken && req.url.includes('/api/')) {
    const clonedRequest = req.clone({
      setHeaders: { Authorization: fullToken }
    });
    return next(clonedRequest);
  }

  return next(req);
};

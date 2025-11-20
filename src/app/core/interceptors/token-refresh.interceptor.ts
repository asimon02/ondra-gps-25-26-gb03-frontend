import { HttpInterceptorFn, HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take, Observable } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { AuthStateService } from '../../core/services/auth-state.service';

/**
 * Interceptor que maneja el refresh automático de tokens expirados
 * Evita múltiples llamadas simultáneas de refresh
 */

// Estado compartido para evitar múltiples refreshes simultáneos
let isRefreshing = false;
let refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const tokenRefreshInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const authStateService = inject(AuthStateService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Solo manejar errores 401 con TOKEN_EXPIRED
      if (error.status === 401 && error.error?.error === 'TOKEN_EXPIRED') {
        console.log('🔄 Token expirado detectado');

        // Si ya estamos renovando, esperar a que termine
        if (isRefreshing) {
          console.log('⏳ Esperando renovación en curso...');
          return refreshTokenSubject.pipe(
            filter(token => token !== null),
            take(1),
            switchMap(token => retryRequestWithNewToken(req, next, token!))
          );
        }

        // Iniciar proceso de renovación
        isRefreshing = true;
        refreshTokenSubject.next(null);

        console.log('🔄 Iniciando renovación de token...');

        return authService.refreshToken().pipe(
          switchMap(() => {
            console.log('✅ Token renovado exitosamente');
            const newToken = authStateService.getFullAuthToken();

            isRefreshing = false;
            refreshTokenSubject.next(newToken);

            return retryRequestWithNewToken(req, next, newToken!);
          }),
          catchError((refreshError) => {
            console.error('❌ Error al renovar token:', refreshError);

            isRefreshing = false;
            refreshTokenSubject.next(null);

            // Cerrar sesión si falla el refresh
            authService.logout();

            return throwError(() => refreshError);
          })
        );
      }

      // Otros errores se propagan sin modificar
      return throwError(() => error);
    })
  );
};

/**
 * Reintenta una petición con el nuevo token
 */
function retryRequestWithNewToken(
  req: HttpRequest<any>,
  next: any,
  newToken: string
): Observable<any> {
  const clonedRequest = req.clone({
    setHeaders: {
      Authorization: newToken
    }
  });

  console.log('🔁 Reintentando petición con nuevo token:', req.url);
  return next(clonedRequest);
}

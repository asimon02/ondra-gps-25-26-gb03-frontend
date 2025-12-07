import { HttpInterceptorFn, HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take, Observable } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { AuthStateService } from '../../core/services/auth-state.service';

/**
 * Interceptor encargado de gestionar la renovación automática del token
 * cuando expira y evitar múltiples solicitudes simultáneas de refresh.
 */

/**
 * Indica si un proceso de refresh de token está en ejecución.
 */
let isRefreshing = false;

/**
 * Estado compartido para almacenar el token renovado
 * y permitir a otras solicitudes esperar su actualización.
 */
let refreshTokenSubject = new BehaviorSubject<string | null>(null);

/**
 * Interceptor que captura errores 401 relacionados con expiración de token
 * y ejecuta el proceso de renovación si corresponde.
 *
 * @param req Petición HTTP original.
 * @param next Siguiente manejador en la cadena de interceptores.
 * @returns Observable con la respuesta HTTP o un error propagado.
 */
export const tokenRefreshInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const authStateService = inject(AuthStateService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {

      // Manejo exclusivo de errores 401 con indicador de token expirado
      if (error.status === 401 && error.error?.error === 'TOKEN_EXPIRED') {

        // Si ya existe un proceso de refresh, otras solicitudes esperan
        if (isRefreshing) {
          return refreshTokenSubject.pipe(
            filter(token => token !== null),
            take(1),
            switchMap(token => retryRequestWithNewToken(req, next, token!))
          );
        }

        // Inicia el proceso de renovación
        isRefreshing = true;
        refreshTokenSubject.next(null);

        return authService.refreshToken().pipe(
          switchMap(() => {
            const newToken = authStateService.getFullAuthToken();

            isRefreshing = false;
            refreshTokenSubject.next(newToken);

            return retryRequestWithNewToken(req, next, newToken!);
          }),
          catchError((refreshError) => {
            console.error('Error al renovar token:', refreshError);

            isRefreshing = false;
            refreshTokenSubject.next(null);

            authService.logout();

            return throwError(() => refreshError);
          })
        );
      }

      // Otros errores se propagan sin intervenir
      return throwError(() => error);
    })
  );
};

/**
 * Reintenta una solicitud HTTP utilizando un nuevo token.
 *
 * @param req Petición original que falló por token expirado.
 * @param next Manejador siguiente del interceptor.
 * @param newToken Token renovado que será agregado a la cabecera Authorization.
 * @returns Observable con la reejecución de la solicitud.
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

  return next(clonedRequest);
}

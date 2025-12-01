import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthStateService } from '../../core/services/auth-state.service';

/**
 * Guard que protege rutas que requieren autenticación.
 * Solo permite acceso si el usuario está autenticado.
 * Redirige al login guardando la URL de destino original.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  if (authState.isAuthenticated()) {
    return true;
  }

  router.navigate(['/login'], {
    queryParams: { returnUrl: state.url }
  });
  return false;
};

/**
 * Guard que previene el acceso a rutas cuando el usuario ya está autenticado.
 * Útil para páginas de login y registro.
 * Redirige al home si el usuario está autenticado.
 */
export const noAuthGuard: CanActivateFn = (route, state) => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  if (!authState.isAuthenticated()) {
    return true;
  }

  router.navigate(['/']);
  return false;
};

/**
 * Factory que crea un guard basado en roles de usuario.
 *
 * @param allowedRoles - Array de tipos de usuario permitidos
 * @returns CanActivateFn que valida si el usuario tiene uno de los roles permitidos
 *
 * @example
 * ```typescript
 * {
 *   path: 'admin',
 *   canActivate: [roleGuard(['ADMIN', 'SUPERADMIN'])]
 * }
 * ```
 */
export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return (route, state) => {
    const authState = inject(AuthStateService);
    const router = inject(Router);

    const user = authState.currentUser();

    if (!user) {
      router.navigate(['/login']);
      return false;
    }

    if (allowedRoles.includes(user.tipoUsuario)) {
      return true;
    }

    router.navigate(['/']);
    return false;
  };
};

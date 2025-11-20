import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthStateService } from '../../core/services/auth-state.service';

/**
 * Guard para proteger rutas que requieren autenticación
 * Solo permite acceso si el usuario está autenticado
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  if (authState.isAuthenticated()) {
    return true;
  }

  // Redirigir al login y guardar la URL a la que intentaba acceder
  router.navigate(['/login'], {
    queryParams: { returnUrl: state.url }
  });
  return false;
};

/**
 * Guard para rutas que NO deben ser accesibles si ya estás autenticado
 * Ejemplo: página de login, registro
 */
export const noAuthGuard: CanActivateFn = (route, state) => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  if (!authState.isAuthenticated()) {
    return true;
  }

  // Si ya está autenticado, redirigir al home
  router.navigate(['/']);
  return false;
};

/**
 * Guard para verificar el tipo de usuario
 * Solo permite acceso si el usuario tiene el tipo especificado
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

    // No tiene el rol necesario
    router.navigate(['/']);
    return false;
  };
};

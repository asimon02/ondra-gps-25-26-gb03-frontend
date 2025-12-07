import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthStateService } from '../../core/services/auth-state.service';

/**
 * Guard que verifica si el usuario ha completado el proceso de onboarding inicial.
 *
 * Si el usuario autenticado no ha completado el onboarding (onboardingCompletado = false),
 * lo redirige a la ruta de configuración de preferencias.
 *
 * Este guard debe aplicarse en rutas principales que requieran que el usuario
 * haya completado el wizard de configuración inicial.
 *
 * @example
 * ```typescript
 * {
 *   path: '',
 *   component: HomeComponent,
 *   canActivate: [authGuard, onboardingGuard]
 * }
 * ```
 */
export const onboardingGuard: CanActivateFn = (route, state) => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  const usuario = authState.currentUser();

  if (!usuario) {
    return true;
  }

  if (!usuario.onboardingCompletado) {
    router.navigate(['/preferencias/configurar']);
    return false;
  }

  return true;
};

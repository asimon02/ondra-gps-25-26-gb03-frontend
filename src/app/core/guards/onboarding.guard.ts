import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthStateService } from '../../core/services/auth-state.service';

/**
 * Guard que verifica si el usuario ha completado el onboarding inicial.
 *
 * Si el usuario no ha completado el onboarding (onboardingCompletado = false),
 * lo redirige a /preferencias/configurar.
 *
 * Úsalo en rutas principales como:
 * - / (home)
 * - /dashboard-artista
 * - Cualquier ruta que requiera que el usuario haya pasado por el wizard
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

  // Si no hay usuario autenticado, permitir acceso
  // (authGuard ya se encargará de redirigir al login)
  if (!usuario) {
    return true;
  }

  // Si el usuario no ha completado el onboarding, redirigir
  if (!usuario.onboardingCompletado) {
    console.log('⚠️ Onboarding no completado, redirigiendo a configurar preferencias');
    router.navigate(['/preferencias/configurar']);
    return false;
  }

  // Usuario ha completado onboarding, permitir acceso
  console.log('✅ Onboarding completado, permitiendo acceso');
  return true;
};

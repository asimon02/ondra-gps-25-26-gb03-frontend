import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthStateService } from '../../core/services/auth-state.service';

/**
 * Guard que restringe el acceso solo a usuarios de tipo ARTISTA.
 * Redirige al home si el usuario no es artista.
 */
export const artistOnlyGuard: CanActivateFn = () => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  const user = authState.currentUser();

  if (user?.tipoUsuario === 'ARTISTA') {
    return true;
  }

  router.navigate(['/']);
  return false;
};

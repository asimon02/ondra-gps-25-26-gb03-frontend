// artist-only.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthStateService } from '../../core/services/auth-state.service';

export const artistOnlyGuard: CanActivateFn = () => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  const user = authState.currentUser();

  console.log('🔍 Artist Guard - Usuario actual:', user); // 👈 Debug

  if (user?.tipoUsuario === 'ARTISTA') {
    return true;
  }

  console.warn('❌ Acceso denegado: solo artistas. Tipo actual:', user?.tipoUsuario);
  router.navigate(['/']);
  return false;
};

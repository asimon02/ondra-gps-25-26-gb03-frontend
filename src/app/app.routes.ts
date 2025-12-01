import { Routes } from '@angular/router';
import { authGuard, noAuthGuard } from './core/guards/auth.guard';
import { artistOnlyGuard } from './core/guards/artist-only.guard';
import { ConfigurarPreferenciasComponent } from './features/auth/configurar-preferencias/configurar-preferencias.component';

/**
 * Definición de rutas de la aplicación
 */
export const routes: Routes = [
  {
    /** Página principal */
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  },
  {
    /** Página de login, accesible solo para usuarios no autenticados */
    path: 'login',
    loadComponent: () => import('./features/auth/components/login.component').then(m => m.LoginComponent),
    canActivate: [noAuthGuard]
  },
  {
    /** Perfil de usuario (información) */
    path: 'perfil/info',
    loadComponent: () => import('./features/user-profile/user-profile.component').then(m => m.UserProfileComponent),
    canActivate: [authGuard]
  },
  {
    /** Panel de pagos del usuario */
    path: 'perfil/pagos',
    loadComponent: () => import('./features/payments/payment-dashboard/payment-dashboard.component').then(m => m.PaymentDashboardComponent),
    canActivate: [authGuard]
  },
  {
    /** Subir canción (solo artistas) */
    path: 'perfil/subir-cancion',
    loadComponent: () => import('./features/songs/upload-song/upload-song.component').then(m => m.UploadSongComponent),
    canActivate: [authGuard, artistOnlyGuard]
  },
  {
    /** Subir álbum (solo artistas) */
    path: 'perfil/subir-album',
    loadComponent: () => import('./features/albums/upload-album/upload-album.component').then(m => m.UploadAlbumComponent),
    canActivate: [authGuard, artistOnlyGuard]
  },
  {
    /** Configuración de preferencias del usuario */
    path: 'preferencias/configurar',
    component: ConfigurarPreferenciasComponent,
    canActivate: [authGuard]
  },
  {
    /** Perfil público de un usuario */
    path: 'usuario/:slug',
    loadComponent: () => import('./features/public-profile/public-profile.component').then(m => m.PublicProfileComponent)
  },
  {
    /** Perfil público de un artista */
    path: 'artista/:slug',
    loadComponent: () => import('./features/public-profile/public-profile.component').then(m => m.PublicProfileComponent)
  },
  {
    /** Política de privacidad */
    path: 'politica-privacidad',
    loadComponent: () => import('./features/legal/privacy-policy/privacy-policy.component').then(m => m.PrivacyPolicyComponent)
  },
  {
    /** Política de cookies */
    path: 'politica-cookies',
    loadComponent: () => import('./features/legal/cookies-policy/cookies-policy.component').then(m => m.CookiesPolicyComponent)
  },
  {
    /** Términos de servicio */
    path: 'terminos-servicio',
    loadComponent: () => import('./features/legal/terms-of-service/terms-of-service.component').then(m => m.TermsOfServiceComponent)
  },
  {
    /** Página de soporte y FAQ */
    path: 'soporte',
    loadComponent: () => import('./features/support/faq-support/faq-support.component').then(m => m.FaqSupportComponent)
  },
  {
    /** Explorar música */
    path: 'explorar',
    loadComponent: () => import('./features/music/pages/explore/explore.component').then(m => m.ExploreComponent)
  },
  {
    /** Detalle de una canción */
    path: 'cancion/:id',
    loadComponent: () => import('./features/music/pages/song-detail/song-detail.component').then(m => m.SongDetailComponent)
  },
  {
    /** Página de recomendaciones personalizadas, requiere autenticación */
    path: 'para-ti',
    loadComponent: () => import('./features/recomendaciones/recomendaciones-page.component').then(m => m.RecomendacionesPageComponent),
    canActivate: [authGuard]
  },
  {
    /** Detalle de un álbum */
    path: 'album/:id',
    loadComponent: () => import('./features/music/pages/album-detail/album-detail.component').then(m => m.AlbumDetailComponent)
  },
  {
    /** Carrito de compras */
    path: 'carrito',
    loadComponent: () => import('./features/carrito/carrito/carrito.component').then(m => m.CarritoComponent),
    canActivate: [authGuard]
  },
  {
    /** Pasarela de pago */
    path: 'pasarela-pago',
    loadComponent: () => import('./features/carrito/pasarela-pago/pasarela-pago.component').then(m => m.PasarelaPagoComponent),
    canActivate: [authGuard]
  },
  {
    /** Verificación de pago */
    path: 'verificacion-pago',
    loadComponent: () => import('./features/carrito/verificacion-pago/verificacion-pago.component').then(m => m.VerificacionPagoComponent),
    canActivate: [authGuard]
  },
  {
    /** Redirección por defecto a la página principal para rutas no definidas */
    path: '**',
    redirectTo: ''
  }
];

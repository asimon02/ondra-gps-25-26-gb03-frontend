// src/app/app.routes.ts

import { Routes } from '@angular/router';
import { authGuard, noAuthGuard } from './core/guards/auth.guard';
import { artistOnlyGuard } from './core/guards/artist-only.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/components/login.component').then(m => m.LoginComponent),
    canActivate: [noAuthGuard]
  },
  {
    path: 'perfil/info',
    loadComponent: () => import('./features/user-profile/user-profile.component').then(m => m.UserProfileComponent),
    canActivate: [authGuard]
  },
  {
    path: 'perfil/pagos',
    loadComponent: () => import('./features/payments/payment-dashboard/payment-dashboard.component').then(m => m.PaymentDashboardComponent),
    canActivate: [authGuard]
  },
  {
  path: 'perfil/subir-cancion',
  loadComponent: () => import('./features/songs/upload-song/upload-song.component')
  .then(m => m.UploadSongComponent),
  canActivate: [authGuard, artistOnlyGuard]
  },
  {
    path: 'perfil/subir-album',
      loadComponent: () => import('./features/albums/upload-album/upload-album.component')
    .then(m => m.UploadAlbumComponent),
    canActivate: [authGuard, artistOnlyGuard]
  },
  {
    path: 'usuario/:slug',
    loadComponent: () => import('./features/public-profile/public-profile.component').then(m => m.PublicProfileComponent)
  },
  {
    path: 'artista/:slug',
    loadComponent: () => import('./features/public-profile/public-profile.component').then(m => m.PublicProfileComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];

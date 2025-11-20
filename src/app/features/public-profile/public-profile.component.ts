// src/app/features/public-profile/public-profile.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PublicProfileService } from '../user-profile/services/public-profile.service';
import { UserSeguimientoService } from '../user-profile/services/user-seguimiento.service';
import { SongService } from '../songs/services/song.service';
import { UsuarioPublico } from '../user-profile/models/usuario-publico.model';
import { EstadisticasSeguimiento, ModalType } from '../user-profile/models/seguimiento.model';
import { AuthStateService } from '../../core/services/auth-state.service';

import { ProfileHeaderComponent } from '../user-profile/components/profile-header/profile-header.component';
import { FollowersModalComponent } from '../user-profile/components/followers-modal/followers-modal.component';
import { FavoritesPreviewComponent } from '../user-profile/components/favorites-preview/favorites-preview.component';
import { CancionesPreviewComponent } from '../user-profile/components/canciones-preview/canciones-preview.component';
import { AlbumesPreviewComponent } from '../user-profile/components/albumes-preview/albumes-preview.component';

@Component({
  selector: 'app-public-profile',
  standalone: true,
  imports: [
    CommonModule,
    ProfileHeaderComponent,
    FollowersModalComponent,
    FavoritesPreviewComponent,
    CancionesPreviewComponent,
    AlbumesPreviewComponent
  ],
  templateUrl: './public-profile.component.html',
  styleUrls: ['./public-profile.component.scss']
})
export class PublicProfileComponent implements OnInit, OnDestroy {
  userProfile: UsuarioPublico | null = null;
  estadisticas: EstadisticasSeguimiento | null = null;
  isLoading = true;
  modalType: ModalType = null;
  isOwnProfile = false;
  isFollowing = false;
  isProcessingFollow = false;
  isArtistProfile = false;
  totalReproducciones: number | null = null;

  private routeSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public publicProfileService: PublicProfileService,
    public seguimientoService: UserSeguimientoService,
    public authStateService: AuthStateService,
    private location: Location,
    private songService: SongService
  ) {}

  ngOnInit(): void {
    // ✅ Scroll inicial
    window.scrollTo(0, 0);

    this.routeSubscription = this.route.params.subscribe(params => {
      const slug = params['slug'];

      // ✅ Scroll al inicio cada vez que cambia el perfil
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Resetear estado
      this.userProfile = null;
      this.estadisticas = null;
      this.isFollowing = false;
      this.totalReproducciones = null;
      this.isLoading = true;

      // Determinar si es perfil de artista
      this.isArtistProfile = this.route.snapshot.url[0]?.path === 'artista';

      if (slug) {
        this.cargarPerfilPublico(slug);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  get isArtist(): boolean {
    return this.userProfile?.tipoUsuario === 'ARTISTA';
  }

  get showFollowButton(): boolean {
    if (!this.authStateService.isAuthenticated()) {
      return true;
    }
    const currentUser = this.authStateService.getUserInfo();
    return currentUser?.tipoUsuario !== 'ARTISTA';
  }

  cargarPerfilPublico(slug: string): void {
    this.isLoading = true;

    const profileObservable = this.isArtistProfile
      ? this.publicProfileService.obtenerPerfilArtista(slug)
      : this.publicProfileService.obtenerPerfilUsuario(slug);

    profileObservable.subscribe({
      next: (profile) => {
        console.log('🔍 Perfil público cargado:', profile);

        this.userProfile = profile;
        this.cargarEstadisticas(profile.idUsuario);
        this.verificarSiEsPropioYSeguimiento(profile.idUsuario);

        const esArtista = profile.tipoUsuario === 'ARTISTA';

        if (esArtista) {
          const artistaId = profile.idArtista || profile.idUsuario;
          console.log('✅ Cargando reproducciones para artista:', artistaId);
          this.cargarReproducciones(artistaId);
        }

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar perfil público:', error);
        this.isLoading = false;
        this.router.navigate(['/']);
      }
    });
  }

  cargarEstadisticas(idUsuario: number): void {
    this.seguimientoService.obtenerEstadisticas(idUsuario).subscribe({
      next: (stats) => {
        this.estadisticas = stats;
      },
      error: (error) => {
        console.error('Error al cargar estadísticas:', error);
      }
    });
  }

  /**
   * ✅ Carga las reproducciones totales del artista desde el endpoint real
   */
  cargarReproducciones(idArtista: number): void {
    console.log(`🎵 Consultando estadísticas del artista ${idArtista}...`);

    this.songService.obtenerEstadisticasArtista(idArtista).subscribe({
      next: (estadisticas) => {
        this.totalReproducciones = estadisticas.totalReproducciones;
        console.log(`✅ Total reproducciones cargadas: ${this.totalReproducciones}`);
      },
      error: (error) => {
        console.error('❌ Error al cargar reproducciones:', error);
        this.totalReproducciones = 0;
      }
    });
  }

  verificarSiEsPropioYSeguimiento(idUsuario: number): void {
    const currentUser = this.authStateService.getUserInfo();

    if (currentUser) {
      this.isOwnProfile = currentUser.idUsuario === idUsuario;

      if (!this.isOwnProfile && currentUser.tipoUsuario !== 'ARTISTA') {
        this.seguimientoService.verificarSeguimiento(idUsuario).subscribe({
          next: (siguiendo) => {
            this.isFollowing = siguiendo;
          },
          error: () => {
            this.isFollowing = false;
          }
        });
      }
    }
  }

  toggleFollow(): void {
    if (!this.authStateService.isAuthenticated()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: this.router.url }
      });
      return;
    }

    const currentUser = this.authStateService.getUserInfo();
    if (currentUser?.tipoUsuario === 'ARTISTA') {
      alert('Los artistas no pueden seguir a otros usuarios');
      return;
    }

    if (!this.userProfile || this.isProcessingFollow) return;

    this.isProcessingFollow = true;

    if (this.isFollowing) {
      this.seguimientoService.dejarDeSeguir(this.userProfile.idUsuario).subscribe({
        next: () => {
          this.isFollowing = false;
          this.cargarEstadisticas(this.userProfile!.idUsuario);
          this.isProcessingFollow = false;
        },
        error: (error) => {
          console.error('Error al dejar de seguir:', error);
          this.isProcessingFollow = false;
        }
      });
    } else {
      this.seguimientoService.seguirUsuario(this.userProfile.idUsuario).subscribe({
        next: () => {
          this.isFollowing = true;
          this.cargarEstadisticas(this.userProfile!.idUsuario);
          this.isProcessingFollow = false;
        },
        error: (error) => {
          console.error('Error al seguir:', error);
          this.isProcessingFollow = false;
        }
      });
    }
  }

  recargarEstadisticas(): void {
    if (this.userProfile?.idUsuario) {
      this.cargarEstadisticas(this.userProfile.idUsuario);
    }
  }

  openModal(type: ModalType): void {
    this.modalType = type;
  }

  closeModal(): void {
    this.modalType = null;
  }

  goBack(): void {
    this.location.back();
  }

  irAMiPerfil(): void {
    this.router.navigate(['/perfil/info']);
  }
}

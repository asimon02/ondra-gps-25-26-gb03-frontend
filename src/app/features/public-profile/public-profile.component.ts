import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { BackButtonComponent } from '../../shared/components/back-button/back-button.component';
import { PublicSocialNetworksComponent } from './components/public-social-networks/public-social-networks.component';

/**
 * Componente principal de perfil público.
 * Muestra información del usuario/artista, estadísticas y redes sociales.
 */
@Component({
  selector: 'app-public-profile',
  standalone: true,
  imports: [
    CommonModule,
    ProfileHeaderComponent,
    FollowersModalComponent,
    CancionesPreviewComponent,
    AlbumesPreviewComponent,
    BackButtonComponent,
    PublicSocialNetworksComponent
  ],
  templateUrl: './public-profile.component.html',
  styleUrls: ['./public-profile.component.scss']
})
export class PublicProfileComponent implements OnInit, OnDestroy {
  /** Perfil público cargado */
  userProfile: UsuarioPublico | null = null;

  /** Estadísticas de seguimiento del usuario */
  estadisticas: EstadisticasSeguimiento | null = null;

  /** Indicador de carga */
  isLoading = true;

  /** Modal activo (followers, etc.) */
  modalType: ModalType = null;

  /** Indica si el perfil pertenece al usuario actual */
  isOwnProfile = false;

  /** Indica si el usuario actual sigue este perfil */
  isFollowing = false;

  /** Flag para evitar múltiples peticiones de follow/unfollow simultáneas */
  isProcessingFollow = false;

  /** Indica si el perfil corresponde a un artista */
  isArtistProfile = false;

  /** Total de reproducciones del artista (si aplica) */
  totalReproducciones: number | null = null;

  /** Suscripción a los parámetros de ruta */
  private routeSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public publicProfileService: PublicProfileService,
    public seguimientoService: UserSeguimientoService,
    public authStateService: AuthStateService,
    private songService: SongService
  ) {}

  /**
   * Inicializa el componente y suscribirse a los cambios de ruta
   */
  ngOnInit(): void {
    window.scrollTo(0, 0);

    this.routeSubscription = this.route.params.subscribe(params => {
      const slug = params['slug'];

      window.scrollTo({ top: 0, behavior: 'smooth' });

      this.resetState();

      this.isArtistProfile = this.route.snapshot.url[0]?.path === 'artista';

      if (slug) {
        this.cargarPerfilPublico(slug);
      }
    });
  }

  /**
   * Limpia la suscripción al destruir el componente
   */
  ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  /** Indica si el perfil pertenece a un artista */
  get isArtist(): boolean {
    return this.userProfile?.tipoUsuario === 'ARTISTA';
  }

  /** Determina si se debe mostrar el botón de seguir */
  get showFollowButton(): boolean {
    const currentUser = this.authStateService.getUserInfo();
    return !!currentUser && currentUser.tipoUsuario !== 'ARTISTA';
  }

  /**
   * Carga el perfil público de un usuario o artista según el slug
   * @param slug Slug del usuario/artista
   */
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

        if (profile.tipoUsuario === 'ARTISTA') {
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

  /**
   * Carga las estadísticas de seguimiento de un usuario
   * @param idUsuario ID del usuario
   */
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
   * Carga las reproducciones totales del artista
   * @param idArtista ID del artista
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

  /**
   * Verifica si el perfil pertenece al usuario actual y si ya lo sigue
   * @param idUsuario ID del usuario a verificar
   */
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

  /**
   * Alterna entre seguir y dejar de seguir un perfil
   */
  toggleFollow(): void {
    if (!this.showFollowButton) return;

    if (!this.authStateService.isAuthenticated()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: this.router.url }
      });
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

  /** Recarga las estadísticas del perfil */
  recargarEstadisticas(): void {
    if (this.userProfile?.idUsuario) {
      this.cargarEstadisticas(this.userProfile.idUsuario);
    }
  }

  /** Abre un modal específico */
  openModal(type: ModalType): void {
    this.modalType = type;
  }

  /** Cierra cualquier modal abierto */
  closeModal(): void {
    this.modalType = null;
  }

  /** Navega al perfil propio del usuario */
  irAMiPerfil(): void {
    this.router.navigate(['/perfil/info']);
  }

  /** Resetea el estado interno del componente */
  private resetState(): void {
    this.userProfile = null;
    this.estadisticas = null;
    this.isFollowing = false;
    this.totalReproducciones = null;
    this.isLoading = true;
  }
}

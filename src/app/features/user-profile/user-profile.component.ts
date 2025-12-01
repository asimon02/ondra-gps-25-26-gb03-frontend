import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthStateService } from '../../core/services/auth-state.service';
import { AuthService } from '../../core/services/auth.service';
import { UserProfileService } from './services/user-profile.service';
import { UserSeguimientoService } from './services/user-seguimiento.service';
import { SongService } from '../songs/services/song.service';
import { UserProfile } from './models/user-profile.model';
import { EstadisticasSeguimiento, ModalType } from './models/seguimiento.model';

import { ProfileHeaderComponent } from './components/profile-header/profile-header.component';
import { PersonalInfoSectionComponent } from './components/personal-info-section/personal-info-section.component';
import { BecomeArtistModalComponent } from './components/become-artist-modal/become-artist-modal.component';
import { FollowersModalComponent } from './components/followers-modal/followers-modal.component';
import { PurchasesPreviewComponent } from './components/purchases-preview/purchases-preview.component';
import { FavoritesPreviewComponent } from './components/favorites-preview/favorites-preview.component';
import { CancionesPreviewComponent } from './components/canciones-preview/canciones-preview.component';
import { AlbumesPreviewComponent } from './components/albumes-preview/albumes-preview.component';
import { LeaveArtistModalComponent } from './components/leave-artist-modal/leave-artist-modal.component';
import { SocialNetworksSectionComponent } from './components/social-networks-section/social-networks-section.component';
import { BackButtonComponent } from '../../shared/components/back-button/back-button.component';

/**
 * Componente principal del perfil de usuario.
 * Gestiona la visualización y edición del perfil, incluyendo información personal,
 * estadísticas de seguimiento, y funcionalidades específicas para artistas.
 */
@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    CommonModule,
    ProfileHeaderComponent,
    PersonalInfoSectionComponent,
    SocialNetworksSectionComponent,
    BecomeArtistModalComponent,
    FollowersModalComponent,
    PurchasesPreviewComponent,
    FavoritesPreviewComponent,
    CancionesPreviewComponent,
    AlbumesPreviewComponent,
    LeaveArtistModalComponent,
    BackButtonComponent
  ],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit {
  /** Información del perfil del usuario actual */
  userProfile: UserProfile | null = null;

  /** Estadísticas de seguidores y seguidos del usuario */
  estadisticas: EstadisticasSeguimiento | null = null;

  /** Indicador de carga inicial del perfil */
  isLoading = true;

  /** Tipo de modal actualmente abierto */
  modalType: ModalType = null;

  /** Control de visibilidad del modal de dejar de ser artista */
  mostrarLeaveArtistModal = false;

  /** Control de visibilidad del modal de convertirse en artista */
  mostrarBecomeArtistModal = false;

  /** Total de reproducciones del artista */
  totalReproducciones: number | null = null;

  /** Indicador de carga de reproducciones */
  cargandoReproducciones = false;

  /** Indicador de actualización del perfil en progreso */
  actualizandoPerfil = signal(false);

  constructor(
    private router: Router,
    private authStateService: AuthStateService,
    private authService: AuthService,
    private userProfileService: UserProfileService,
    private seguimientoService: UserSeguimientoService,
    private songService: SongService
  ) {}

  ngOnInit(): void {
    window.scrollTo(0, 0);
    const user = this.authStateService.getUserInfo();
    if (user?.idUsuario) {
      this.cargarPerfil(user.idUsuario);
      this.cargarEstadisticas(user.idUsuario);
    } else {
      this.router.navigate(['/login']);
    }
  }

  /**
   * Verifica si el usuario actual es un artista
   */
  get isArtist(): boolean {
    return this.userProfile?.tipoUsuario === 'ARTISTA';
  }

  /**
   * Carga el perfil completo del usuario
   * Incluye manejo de renovación de token en caso de expiración
   * @param idUsuario ID del usuario a cargar
   */
  cargarPerfil(idUsuario: number): void {
    this.userProfileService.obtenerPerfil(idUsuario).subscribe({
      next: (profile) => {
        this.userProfile = profile;

        if (this.isArtist && profile.idArtista) {
          this.cargarReproducciones(profile.idArtista);
        } else if (this.isArtist && !profile.idArtista) {
          console.error('El usuario es ARTISTA pero no tiene idArtista');
        }

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar perfil:', error);

        if (error.status === 401 && error.error?.error === 'TOKEN_EXPIRED') {
          this.authService.refreshToken().subscribe({
            next: () => {
              this.cargarPerfil(idUsuario);
            },
            error: (refreshError) => {
              console.error('Error al renovar token:', refreshError);
              alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
              this.authService.logout();
              this.router.navigate(['/login']);
            }
          });
        } else {
          this.isLoading = false;
        }
      }
    });
  }

  /**
   * Carga las estadísticas de seguimiento del usuario
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
   * Carga el total de reproducciones del artista
   * @param idArtista ID del artista
   */
  cargarReproducciones(idArtista: number): void {
    this.cargandoReproducciones = true;

    this.songService.obtenerEstadisticasArtista(idArtista).subscribe({
      next: (estadisticas) => {
        this.totalReproducciones = estadisticas.totalReproducciones;
        this.cargandoReproducciones = false;
      },
      error: (error) => {
        console.error('Error al cargar reproducciones:', error);
        this.totalReproducciones = 0;
        this.cargandoReproducciones = false;
      }
    });
  }

  /**
   * Recarga las estadísticas de seguimiento del usuario actual
   */
  recargarEstadisticas(): void {
    if (this.userProfile?.idUsuario) {
      this.cargarEstadisticas(this.userProfile.idUsuario);
    }
  }

  /**
   * Maneja la actualización del perfil desde componentes hijos
   * Actualiza el estado local y sincroniza con el servicio de autenticación
   * @param updatedProfile Perfil actualizado
   */
  onProfileUpdated(updatedProfile: UserProfile): void {
    this.userProfile = updatedProfile;

    this.authStateService.updateUserInfo({
      nombreUsuario: updatedProfile.nombreUsuario,
      apellidosUsuario: updatedProfile.apellidosUsuario,
      fotoPerfil: updatedProfile.fotoPerfil,
      tipoUsuario: updatedProfile.tipoUsuario,
      nombreArtistico: updatedProfile.nombreArtistico,
      fotoPerfilArtistico: updatedProfile.fotoPerfilArtistico,
      idArtista: updatedProfile.idArtista,
      biografiaArtistico: updatedProfile.biografiaArtistico
    });
  }

  /**
   * Abre un modal específico
   * @param type Tipo de modal a abrir
   */
  openModal(type: ModalType): void {
    this.modalType = type;
  }

  /**
   * Cierra el modal actualmente abierto
   */
  closeModal(): void {
    this.modalType = null;
  }

  /**
   * Navega a la vista de historial de pagos
   */
  navegarAPagos(): void {
    this.router.navigate(['/perfil/pagos']);
  }

  /**
   * Navega al configurador de preferencias en modo reconfiguración
   */
  navegarAPreferencias(): void {
    this.router.navigate(['/preferencias/configurar'], {
      queryParams: {
        reconfig: 'true',
        from: 'perfil'
      }
    });
  }

  /**
   * Abre el modal para dejar de ser artista
   */
  abrirLeaveArtistModal(): void {
    this.mostrarLeaveArtistModal = true;
  }

  /**
   * Cierra el modal para dejar de ser artista
   */
  cerrarLeaveArtistModal(): void {
    this.mostrarLeaveArtistModal = false;
  }

  /**
   * Maneja el evento de abandono del rol de artista
   * Recarga el perfil y estadísticas actualizados
   */
  onArtistLeft(): void {
    this.cerrarLeaveArtistModal();
    if (this.userProfile?.idUsuario) {
      this.cargarPerfil(this.userProfile.idUsuario);
      this.cargarEstadisticas(this.userProfile.idUsuario);
    }
  }

  /**
   * Abre el modal para convertirse en artista
   */
  abrirBecomeArtistModal(): void {
    this.mostrarBecomeArtistModal = true;
  }

  /**
   * Cierra el modal para convertirse en artista
   */
  cerrarBecomeArtistModal(): void {
    this.mostrarBecomeArtistModal = false;
  }

  /**
   * Maneja la creación exitosa del perfil de artista
   * Actualiza el perfil local o recarga desde el servidor si es necesario
   * @param perfilActualizado Perfil actualizado del nuevo artista, o null si requiere recarga
   */
  onArtistCreated(perfilActualizado: UserProfile | null): void {
    this.cerrarBecomeArtistModal();

    if (perfilActualizado) {
      this.userProfile = perfilActualizado;

      if (perfilActualizado.idUsuario) {
        this.cargarEstadisticas(perfilActualizado.idUsuario);

        if (perfilActualizado.idArtista) {
          this.cargarReproducciones(perfilActualizado.idArtista);
        }
      }

      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    } else if (this.userProfile?.idUsuario) {
      this.isLoading = true;

      setTimeout(() => {
        this.cargarPerfil(this.userProfile!.idUsuario);
        this.cargarEstadisticas(this.userProfile!.idUsuario);

        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      }, 500);
    }
  }
}

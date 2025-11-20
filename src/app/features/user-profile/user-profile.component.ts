// src/app/features/user-profile/user-profile.component.ts

import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
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
    LeaveArtistModalComponent
  ],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit {
  userProfile: UserProfile | null = null;
  estadisticas: EstadisticasSeguimiento | null = null;
  isLoading = true;
  modalType: ModalType = null;
  mostrarLeaveArtistModal = false;
  mostrarBecomeArtistModal = false;
  totalReproducciones: number | null = null;
  cargandoReproducciones = false;
  actualizandoPerfil = signal(false);

  constructor(
    private router: Router,
    private authStateService: AuthStateService,
    private authService: AuthService,
    private userProfileService: UserProfileService,
    private location: Location,
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

  get isArtist(): boolean {
    return this.userProfile?.tipoUsuario === 'ARTISTA';
  }

  cargarPerfil(idUsuario: number): void {
    this.userProfileService.obtenerPerfil(idUsuario).subscribe({
      next: (profile) => {
        this.userProfile = profile;

        console.log('📋 Perfil cargado:', {
          idUsuario: profile.idUsuario,
          idArtista: profile.idArtista,
          tipoUsuario: profile.tipoUsuario,
          nombreArtistico: profile.nombreArtistico,
          isArtist: this.isArtist
        });

        // ✅ Cargar reproducciones si es artista
        if (this.isArtist && profile.idArtista) {
          console.log(`🎵 Cargando reproducciones para artista ID: ${profile.idArtista}`);
          this.cargarReproducciones(profile.idArtista);
        } else if (this.isArtist && !profile.idArtista) {
          console.error('⚠️ El usuario es ARTISTA pero no tiene idArtista');
        }

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar perfil:', error);

        if (error.status === 401 && error.error?.error === 'TOKEN_EXPIRED') {
          console.log('🔄 Token expirado, intentando renovar...');
          this.authService.refreshToken().subscribe({
            next: () => {
              console.log('✅ Token renovado, recargando perfil...');
              this.cargarPerfil(idUsuario);
            },
            error: (refreshError) => {
              console.error('❌ Error al renovar token:', refreshError);
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
    this.cargandoReproducciones = true;
    console.log(`🎵 Consultando estadísticas del artista ${idArtista}...`);

    this.songService.obtenerEstadisticasArtista(idArtista).subscribe({
      next: (estadisticas) => {
        this.totalReproducciones = estadisticas.totalReproducciones;
        this.cargandoReproducciones = false;
        console.log(`✅ Total reproducciones cargadas: ${this.totalReproducciones}`);
      },
      error: (error) => {
        console.error('❌ Error al cargar reproducciones:', error);
        this.totalReproducciones = 0;
        this.cargandoReproducciones = false;
      }
    });
  }

  recargarEstadisticas(): void {
    if (this.userProfile?.idUsuario) {
      this.cargarEstadisticas(this.userProfile.idUsuario);
    }
  }

  onProfileUpdated(updatedProfile: UserProfile): void {
    this.userProfile = updatedProfile;

    console.log('🔄 Perfil actualizado:', {
      idUsuario: updatedProfile.idUsuario,
      idArtista: updatedProfile.idArtista,
      tipoUsuario: updatedProfile.tipoUsuario
    });

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

  openModal(type: ModalType): void {
    this.modalType = type;
  }

  closeModal(): void {
    this.modalType = null;
  }

  goBack(): void {
    this.location.back();
  }

  navegarAPagos(): void {
    this.router.navigate(['/perfil/pagos']);
  }

  abrirLeaveArtistModal(): void {
    this.mostrarLeaveArtistModal = true;
  }

  cerrarLeaveArtistModal(): void {
    this.mostrarLeaveArtistModal = false;
  }

  onArtistLeft(): void {
    this.cerrarLeaveArtistModal();
    if (this.userProfile?.idUsuario) {
      this.cargarPerfil(this.userProfile.idUsuario);
      this.cargarEstadisticas(this.userProfile.idUsuario);
    }
  }

  abrirBecomeArtistModal(): void {
    this.mostrarBecomeArtistModal = true;
  }

  cerrarBecomeArtistModal(): void {
    this.mostrarBecomeArtistModal = false;
  }

  onArtistCreated(perfilActualizado: UserProfile | null): void {
    this.cerrarBecomeArtistModal();

    if (perfilActualizado) {
      // Usar el perfil actualizado que ya tenemos
      this.userProfile = perfilActualizado;

      console.log('✅ Perfil de artista actualizado localmente:', {
        idUsuario: perfilActualizado.idUsuario,
        idArtista: perfilActualizado.idArtista,
        tipoUsuario: perfilActualizado.tipoUsuario,
        nombreArtistico: perfilActualizado.nombreArtistico
      });

      // Actualizar estadísticas y reproducciones si es artista
      if (perfilActualizado.idUsuario) {
        this.cargarEstadisticas(perfilActualizado.idUsuario);

        if (perfilActualizado.idArtista) {
          this.cargarReproducciones(perfilActualizado.idArtista);
        }
      }

      // Scroll hacia arriba para ver los cambios
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    } else if (this.userProfile?.idUsuario) {
      // Fallback: recargar desde el servidor con un pequeño delay
      this.isLoading = true;
      console.log('⚠️ No se recibió perfil actualizado, recargando desde servidor...');

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

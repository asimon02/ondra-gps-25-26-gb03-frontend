import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserProfile } from '../../models/user-profile.model';
import { UsuarioPublico } from '../../models/usuario-publico.model';
import { EstadisticasSeguimiento, ModalType } from '../../models/seguimiento.model';
import { UserProfileService } from '../../services/user-profile.service';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-profile-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-header.component.html',
  styleUrls: ['./profile-header.component.scss']
})
export class ProfileHeaderComponent implements OnInit {
  /**
   * Perfil del usuario (público o completo, según el contexto).
   */
  @Input() userProfile!: UserProfile | UsuarioPublico;

  /**
   * Estadísticas de seguidores y seguidos del usuario.
   */
  @Input() estadisticas: EstadisticasSeguimiento | null = null;

  /**
   * Indica si el perfil visualizado pertenece al usuario autenticado.
   */
  @Input() isOwnProfile: boolean = true;

  /**
   * Indica si se está visualizando la versión pública del perfil.
   */
  @Input() isPublicView: boolean = false;

  /**
   * Indica si el usuario autenticado sigue al perfil.
   */
  @Input() isFollowing: boolean = false;

  /**
   * Indica si una acción de seguir/dejar de seguir está en proceso.
   */
  @Input() isProcessingFollow: boolean = false;

  /**
   * Controla si debe mostrarse el botón de seguir.
   */
  @Input() showFollowButton: boolean = false;

  /**
   * Total de reproducciones del artista.
   */
  @Input() totalReproducciones: number | null = null;

  /**
   * Emite el tipo de modal a abrir: seguidores o seguidos.
   */
  @Output() openModalEvent = new EventEmitter<ModalType>();

  /**
   * Emite cuando el perfil ha sido actualizado.
   */
  @Output() profileUpdated = new EventEmitter<UserProfile>();

  /**
   * Emite cuando se hace clic en seguir/dejar de seguir.
   */
  @Output() followClick = new EventEmitter<void>();

  /**
   * Indica si una foto se está subiendo actualmente.
   */
  isUploadingPhoto = false;

  constructor(private userProfileService: UserProfileService) {}

  /**
   * Hook de inicialización.
   */
  ngOnInit(): void {}

  /**
   * Determina si el objeto recibido es un UserProfile completo.
   */
  private isUserProfile(profile: UserProfile | UsuarioPublico): profile is UserProfile {
    return 'emailUsuario' in profile;
  }

  /**
   * Indica si el usuario tiene foto de perfil.
   */
  get hasPhoto(): boolean {
    if (this.userProfile.tipoUsuario === 'ARTISTA') {
      const fotoArtista = this.userProfile.fotoPerfilArtistico;
      return !!(fotoArtista && fotoArtista.trim() !== '');
    }
    return !!(this.userProfile.fotoPerfil && this.userProfile.fotoPerfil.trim() !== '');
  }

  /**
   * Devuelve la foto de perfil a mostrar.
   */
  get displayPhoto(): string {
    if (this.userProfile.tipoUsuario === 'ARTISTA' && this.userProfile.fotoPerfilArtistico) {
      return this.userProfile.fotoPerfilArtistico;
    }
    return this.userProfile.fotoPerfil || '';
  }

  /**
   * Genera las iniciales según el tipo de usuario y los datos disponibles.
   */
  get userInitials(): string {
    if (this.userProfile.tipoUsuario === 'ARTISTA' && this.userProfile.nombreArtistico) {
      const parts = this.userProfile.nombreArtistico.trim().split(' ').filter(p => p.length > 0);
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      if (parts.length === 1 && parts[0].length >= 2) return parts[0].substring(0, 2).toUpperCase();
    }

    const nombre = (this.userProfile.nombreUsuario || '').trim();
    const apellido = (this.userProfile.apellidosUsuario || '').trim();

    if (nombre && apellido) return `${nombre[0]}${apellido[0]}`.toUpperCase();
    if (nombre && nombre.length >= 2) return nombre.substring(0, 2).toUpperCase();
    if (nombre) return `${nombre[0]}${nombre[0]}`.toUpperCase();

    return 'U?';
  }

  /**
   * Devuelve el nombre a mostrar según el tipo de usuario.
   */
  get displayName(): string {
    if (this.userProfile.tipoUsuario === 'ARTISTA' && this.userProfile.nombreArtistico) {
      return this.userProfile.nombreArtistico;
    }
    return `${this.userProfile.nombreUsuario} ${this.userProfile.apellidosUsuario}`;
  }

  /**
   * Indica si el usuario es artista.
   */
  get isArtist(): boolean {
    return this.userProfile.tipoUsuario === 'ARTISTA';
  }

  /**
   * Formatea la fecha de registro a mes y año.
   */
  get memberSince(): string {
    if (!this.userProfile.fechaRegistro) return '';

    try {
      let date: Date;

      if (typeof this.userProfile.fechaRegistro === 'string') {
        date = new Date(this.userProfile.fechaRegistro);
      } else if (Array.isArray(this.userProfile.fechaRegistro)) {
        const [year, month, day] = this.userProfile.fechaRegistro;
        date = new Date(year, month - 1, day);
      } else {
        date = new Date(this.userProfile.fechaRegistro as any);
      }

      if (isNaN(date.getTime())) return '';

      return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    } catch {
      return '';
    }
  }

  /**
   * Formatea números grandes (reproducciones).
   */
  formatNumber(num: number): string {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toString();
  }

  /**
   * Maneja el clic para seguir o dejar de seguir.
   */
  onFollowClick(): void {
    this.followClick.emit();
  }

  /**
   * Maneja el clic en la foto para seleccionar un archivo.
   */
  onPhotoClick(): void {
    if (!this.isOwnProfile || this.isPublicView || !this.isUserProfile(this.userProfile)) {
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/jpg,image/webp';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) this.uploadPhoto(file);
    };
    input.click();
  }

  /**
   * Sube una foto de perfil y actualiza el perfil del usuario.
   */
  uploadPhoto(file: File): void {
    if (!this.isUserProfile(this.userProfile)) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no puede superar los 5MB');
      return;
    }

    const validFormats = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validFormats.includes(file.type)) {
      alert('Solo se permiten imágenes JPG, PNG o WEBP');
      return;
    }

    this.isUploadingPhoto = true;

    const uploadObservable = this.isArtist
      ? this.userProfileService.subirImagenPerfilArtista(file)
      : this.userProfileService.subirImagenPerfil(file);

    uploadObservable.subscribe({
      next: (response) => {
        const updateData = this.isArtist
          ? { fotoPerfilArtistico: response.url }
          : { fotoPerfil: response.url };

        const updateObservable = this.isArtist && this.userProfile.idArtista
          ? this.userProfileService.editarPerfilArtista(this.userProfile.idArtista, updateData).pipe(
              switchMap(() => this.userProfileService.obtenerPerfil(this.userProfile.idUsuario))
            )
          : this.userProfileService.editarPerfilUsuario(this.userProfile.idUsuario, updateData);

        updateObservable.subscribe({
          next: (updatedProfile: UserProfile) => {
            this.profileUpdated.emit(updatedProfile);
            this.isUploadingPhoto = false;
            alert('Foto de perfil actualizada correctamente');
          },
          error: () => {
            alert('Error al actualizar la foto');
            this.isUploadingPhoto = false;
          }
        });
      },
      error: () => {
        alert('Error al subir la imagen');
        this.isUploadingPhoto = false;
      }
    });
  }

  /**
   * Abre el modal correspondiente, excepto si se intenta ver “seguidos” en perfil de artista.
   */
  openModal(type: ModalType): void {
    if (this.isArtist && type === 'seguidos') return;
    this.openModalEvent.emit(type);
  }
}

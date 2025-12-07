import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UsuarioBasico } from '../../models/seguimiento.model';
import { UserSeguimientoService } from '../../services/user-seguimiento.service';

@Component({
  selector: 'app-user-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-card.component.html',
  styleUrls: ['./user-card.component.scss']
})
export class UserCardComponent {
  /**
   * Datos básicos del usuario mostrado en la tarjeta.
   */
  @Input() usuario!: UsuarioBasico;

  /**
   * Indica si el usuario actual está siguiendo al usuario de la tarjeta.
   */
  @Input() siguiendo: boolean = false;

  /**
   * ID del usuario autenticado.
   */
  @Input() currentUserId: number = 0;

  /**
   * Tipo de usuario autenticado.
   */
  @Input() currentUserTipoUsuario: 'NORMAL' | 'ARTISTA' = 'NORMAL';

  /**
   * Evento emitido cuando cambia el estado de seguimiento.
   */
  @Output() followStatusChanged = new EventEmitter<void>();

  /**
   * Evento emitido cuando se hace clic para ver un perfil.
   */
  @Output() profileClick = new EventEmitter<void>();

  /**
   * Indica si una acción de seguir/dejar de seguir está en proceso.
   */
  isProcessing = false;

  constructor(
    private seguimientoService: UserSeguimientoService,
    private router: Router
  ) {}

  /**
   * Determina si la tarjeta representa al propio usuario autenticado.
   */
  get isOwnProfile(): boolean {
    return this.usuario.idUsuario === this.currentUserId;
  }

  /**
   * Indica si el usuario autenticado es artista.
   */
  get isCurrentUserArtist(): boolean {
    return this.currentUserTipoUsuario === 'ARTISTA';
  }

  /**
   * Indica si debe mostrarse el botón de seguir.
   */
  get showFollowButton(): boolean {
    return !this.isOwnProfile && !this.isCurrentUserArtist;
  }

  /**
   * Nombre visible del usuario en la tarjeta.
   */
  get displayName(): string {
    if (this.usuario.tipoUsuario === 'ARTISTA' && this.usuario.nombreArtistico) {
      return this.usuario.nombreArtistico;
    }
    return `${this.usuario.nombreUsuario} ${this.usuario.apellidosUsuario}`;
  }

  /**
   * Texto descriptivo del usuario según su tipo.
   */
  get displaySubtitle(): string {
    if (this.isOwnProfile) return 'Tú';
    return this.usuario.tipoUsuario === 'ARTISTA' ? 'Artista' : 'Usuario';
  }

  /**
   * Foto de perfil mostrada en la tarjeta.
   */
  get displayPhoto(): string {
    return (
      this.usuario.fotoPerfil ||
      'https://ui-avatars.com/api/?name=User&background=1E3A8A&color=fff&size=80'
    );
  }

  /**
   * Alterna entre seguir y dejar de seguir al usuario.
   */
  toggleFollow(): void {
    if (this.isProcessing) return;

    this.isProcessing = true;

    if (this.siguiendo) {
      this.seguimientoService.dejarDeSeguir(this.usuario.idUsuario).subscribe({
        next: () => {
          this.isProcessing = false;
          this.followStatusChanged.emit();
        },
        error: (error) => {
          console.error('Error al dejar de seguir:', error);
          this.isProcessing = false;
        }
      });
    } else {
      this.seguimientoService.seguirUsuario(this.usuario.idUsuario).subscribe({
        next: () => {
          this.isProcessing = false;
          this.followStatusChanged.emit();
        },
        error: (error) => {
          console.error('Error al seguir usuario:', error);
          this.isProcessing = false;
        }
      });
    }
  }

  /**
   * Abre el perfil del usuario al hacer clic.
   */
  verPerfil(): void {
    this.profileClick.emit();

    setTimeout(() => {
      if (this.usuario.tipoUsuario === 'ARTISTA' && this.usuario.slugArtistico) {
        this.router.navigate(['/artista', this.usuario.slugArtistico]);
      } else if (this.usuario.slug) {
        this.router.navigate(['/usuario', this.usuario.slug]);
      } else {
        console.error('Usuario sin slug:', this.usuario);
      }
    }, 100);
  }
}

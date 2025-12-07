import { Component, EventEmitter, inject, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserProfileService } from '../../services/user-profile.service';
import { AuthStateService } from '../../../../core/services/auth-state.service';
import { AuthService } from '../../../../core/services/auth.service';
import { TipoUsuario } from '../../../../core/models/auth.model';
import { BackButtonComponent } from '../../../../shared/components/back-button/back-button.component';

type OpcionSalida = 'seguir_usuario' | 'eliminar_cuenta' | null;

@Component({
  selector: 'app-leave-artist-modal',
  standalone: true,
  imports: [CommonModule, BackButtonComponent],
  templateUrl: './leave-artist-modal.component.html',
  styleUrls: ['./leave-artist-modal.component.scss']
})
export class LeaveArtistModalComponent {
  /**
   * Evento emitido para cerrar el modal.
   */
  @Output() closeModal = new EventEmitter<void>();

  /**
   * Evento emitido cuando el usuario deja de ser artista.
   */
  @Output() artistLeft = new EventEmitter<void>();

  private userProfileService = inject(UserProfileService);
  private authState = inject(AuthStateService);
  private authService = inject(AuthService);
  private router = inject(Router);

  /**
   * Paso actual del flujo del modal.
   */
  currentStep = signal<'seleccion' | 'confirmacion'>('seleccion');

  /**
   * Opción seleccionada por el usuario.
   */
  opcionSeleccionada = signal<OpcionSalida>(null);

  /**
   * Indica si se está procesando la solicitud.
   */
  isSubmitting = signal(false);

  /**
   * Mensaje de error mostrado al usuario.
   */
  errorMessage = signal<string | null>(null);

  /**
   * Guarda la opción seleccionada y pasa al paso de confirmación.
   */
  seleccionarOpcion(opcion: OpcionSalida): void {
    this.opcionSeleccionada.set(opcion);
    this.currentStep.set('confirmacion');
    this.errorMessage.set(null);
  }

  /**
   * Ejecuta la acción correspondiente dependiendo de la opción elegida:
   * - Dejar de ser artista manteniendo la cuenta.
   * - Eliminar la cuenta por completo.
   */
  confirmarAccion(): void {
    const user = this.authState.getUserInfo();
    if (!user) {
      this.errorMessage.set('No se pudo obtener la información del usuario');
      return;
    }

    const idArtista = user.idArtista;
    if (!idArtista) {
      this.errorMessage.set('No se encontró el perfil de artista');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    if (this.opcionSeleccionada() === 'seguir_usuario') {
      this.userProfileService.dejarDeSerArtista(idArtista).subscribe({
        next: (response) => {
          this.authState.updateUserInfo({
            tipoUsuario: TipoUsuario.NORMAL,
            idArtista: undefined
          });

          this.isSubmitting.set(false);
          this.artistLeft.emit();
          this.close();

          alert(response.message || 'Has dejado de ser artista');

          setTimeout(() => {
            this.router.navigate(['/perfil/info']).then(() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            });
          }, 500);
        },
        error: (error) => {
          console.error('Error al dejar de ser artista:', error);
          this.errorMessage.set(error.error?.message || 'Error al procesar la solicitud');
          this.isSubmitting.set(false);
        }
      });

    } else if (this.opcionSeleccionada() === 'eliminar_cuenta') {
      this.userProfileService.eliminarCuenta(idArtista).subscribe({
        next: (response) => {
          this.isSubmitting.set(false);
          this.close();

          alert(response.message || 'Tu cuenta ha sido eliminada');

          setTimeout(() => {
            this.authService.logout();
          }, 500);
        },
        error: (error) => {
          console.error('Error al eliminar cuenta:', error);
          this.errorMessage.set(error.error?.message || 'Error al eliminar la cuenta');
          this.isSubmitting.set(false);
        }
      });
    }
  }

  /**
   * Cierra el modal.
   */
  close(): void {
    this.closeModal.emit();
  }

  /**
   * Regresa al paso anterior del flujo del modal.
   */
  volverPasoAnterior(): void {
    this.errorMessage.set(null);
    this.currentStep.set('seleccion');
  }

  /**
   * Devuelve el título correspondiente a la opción seleccionada.
   */
  getOpcionTitulo(): string {
    return this.opcionSeleccionada() === 'seguir_usuario'
      ? 'Dejar de ser Artista'
      : 'Eliminar cuenta';
  }

  /**
   * Devuelve una descripción contextualizada según la acción elegida.
   */
  getOpcionDescripcion(): string {
    return this.opcionSeleccionada() === 'seguir_usuario'
      ? 'Perderás acceso a tu contenido y estadísticas de artista, pero mantendrás tu cuenta de usuario.'
      : 'Se eliminará permanentemente toda tu información, incluyendo canciones, álbumes y datos de usuario.';
  }
}

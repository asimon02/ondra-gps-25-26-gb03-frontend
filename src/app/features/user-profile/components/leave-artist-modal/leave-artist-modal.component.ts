import {Component, EventEmitter, inject, Output, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router} from '@angular/router';
import {UserProfileService} from '../../services/user-profile.service';
import {AuthStateService} from '../../../../core/services/auth-state.service';
import {AuthService} from '../../../../core/services/auth.service';
import {TipoUsuario} from '../../../../core/models/auth.model';

type OpcionSalida = 'seguir_usuario' | 'eliminar_cuenta' | null;

@Component({
  selector: 'app-leave-artist-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leave-artist-modal.component.html',
  styleUrls: ['./leave-artist-modal.component.scss']
})
export class LeaveArtistModalComponent {
  @Output() closeModal = new EventEmitter<void>();
  @Output() artistLeft = new EventEmitter<void>();

  private userProfileService = inject(UserProfileService);
  private authState = inject(AuthStateService);
  private authService = inject(AuthService);
  private router = inject(Router);

  currentStep = signal<'seleccion' | 'confirmacion'>('seleccion');
  opcionSeleccionada = signal<OpcionSalida>(null);
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  seleccionarOpcion(opcion: OpcionSalida): void {
    this.opcionSeleccionada.set(opcion);
    this.currentStep.set('confirmacion');
    this.errorMessage.set(null);
  }

  volverAtras(): void {
    this.currentStep.set('seleccion');
    this.opcionSeleccionada.set(null);
    this.errorMessage.set(null);
  }

  confirmarAccion(): void {
    const user = this.authState.getUserInfo();
    if (!user) {
      this.errorMessage.set('No se pudo obtener la información del usuario');
      return;
    }

    // ✅ CRÍTICO: Necesitamos el idArtista, no el idUsuario
    const idArtista = user.idArtista;
    if (!idArtista) {
      this.errorMessage.set('No se encontró el perfil de artista');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    if (this.opcionSeleccionada() === 'seguir_usuario') {
      // Renunciar al perfil de artista pero mantener cuenta de usuario
      this.userProfileService.dejarDeSerArtista(idArtista).subscribe({
        next: (response) => {
          console.log('✅ Dejaste de ser artista:', response);

          // Actualizar el estado local del usuario
          this.authState.updateUserInfo({
            tipoUsuario: TipoUsuario.NORMAL,
            idArtista: undefined // Limpiar el idArtista
          });

          this.isSubmitting.set(false);
          this.artistLeft.emit();
          this.close();

          // Mostrar mensaje de éxito
          alert(response.message || '✅ Has dejado de ser artista exitosamente');

          // Redirigir al perfil actualizado
          setTimeout(() => {
            this.router.navigate(['/perfil/info']).then(() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            });
          }, 500);
        },
        error: (error) => {
          console.error('❌ Error al dejar de ser artista:', error);
          this.errorMessage.set(error.error?.message || 'Error al procesar la solicitud');
          this.isSubmitting.set(false);
        }
      });
    } else if (this.opcionSeleccionada() === 'eliminar_cuenta') {
      // Eliminar cuenta completamente (marca como inactivo)
      this.userProfileService.eliminarCuenta(idArtista).subscribe({
        next: (response) => {
          console.log('✅ Cuenta eliminada:', response);
          this.isSubmitting.set(false);
          this.close();

          // Mostrar mensaje de éxito
          alert(response.message || '✅ Tu cuenta ha sido eliminada');

          // Hacer logout y redirigir
          setTimeout(() => {
            this.authService.logout();
          }, 500);
        },
        error: (error) => {
          console.error('❌ Error al eliminar cuenta:', error);
          this.errorMessage.set(error.error?.message || 'Error al eliminar la cuenta');
          this.isSubmitting.set(false);
        }
      });
    }
  }

  close(): void {
    this.closeModal.emit();
  }

  getOpcionTitulo(): string {
    return this.opcionSeleccionada() === 'seguir_usuario'
      ? 'Dejar de ser Artista'
      : 'Eliminar cuenta';
  }

  getOpcionDescripcion(): string {
    return this.opcionSeleccionada() === 'seguir_usuario'
      ? 'Perderás acceso a tus canciones, álbumes y estadísticas de artista, pero mantendrás tu cuenta de usuario.'
      : 'Se eliminará permanentemente toda tu información, incluyendo canciones, álbumes, y datos de usuario.';
  }
}

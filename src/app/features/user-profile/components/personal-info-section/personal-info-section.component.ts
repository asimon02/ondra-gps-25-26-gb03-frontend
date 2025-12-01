import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserProfile } from '../../models/user-profile.model';
import { EditableFieldComponent } from '../editable-field/editable-field.component';
import { ChangePasswordModalComponent } from '../change-password-modal/change-password-modal.component';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-personal-info-section',
  standalone: true,
  imports: [CommonModule, EditableFieldComponent, ChangePasswordModalComponent],
  templateUrl: './personal-info-section.component.html',
  styleUrls: ['./personal-info-section.component.scss']
})
export class PersonalInfoSectionComponent {
  /**
   * Perfil completo del usuario, incluyendo datos básicos y de artista si aplica.
   */
  @Input() userProfile!: UserProfile;

  /**
   * Evento emitido cuando algún campo del perfil ha sido actualizado.
   */
  @Output() profileUpdated = new EventEmitter<UserProfile>();

  /**
   * Indica si debe mostrarse el modal de cambio de contraseña.
   */
  showPasswordModal = false;

  constructor(private authService: AuthService) {}

  /**
   * Determina si el usuario es artista.
   */
  get isArtist(): boolean {
    return this.userProfile.tipoUsuario === 'ARTISTA';
  }

  /**
   * Propaga al componente padre el perfil actualizado recibido desde un campo editable.
   * @param updatedProfile Perfil actualizado.
   */
  onFieldUpdated(updatedProfile: UserProfile): void {
    this.profileUpdated.emit(updatedProfile);
  }

  /**
   * Abre el modal para cambiar la contraseña del usuario.
   */
  openPasswordModal(): void {
    this.showPasswordModal = true;
  }

  /**
   * Cierra el modal de cambio de contraseña.
   */
  closePasswordModal(): void {
    this.showPasswordModal = false;
  }

  /**
   * Acción ejecutada tras cambiar exitosamente la contraseña.
   * Cierra sesión por motivos de seguridad.
   */
  onPasswordChanged(): void {
    alert('Contraseña cambiada exitosamente. Por seguridad, vuelve a iniciar sesión.');
    this.authService.logout();
  }
}

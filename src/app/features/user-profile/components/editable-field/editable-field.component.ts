import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserProfileService } from '../../services/user-profile.service';
import { UserProfile } from '../../models/user-profile.model';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-editable-field',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editable-field.component.html',
  styleUrls: ['./editable-field.component.scss']
})
export class EditableFieldComponent {
  /**
   * Etiqueta mostrada para el campo editable.
   */
  @Input() label: string = '';

  /**
   * Valor actual del campo.
   */
  @Input() value: string = '';

  /**
   * Nombre del campo que será actualizado en el backend.
   */
  @Input() fieldName: string = '';

  /**
   * ID del usuario propietario del perfil.
   */
  @Input() userId!: number;

  /**
   * ID del artista, si aplica. Permite editar campos pertenecientes a la tabla Artistas.
   */
  @Input() artistaId?: number;

  /**
   * Indica si el campo editable debe renderizarse como un textarea.
   */
  @Input() isTextarea: boolean = false;

  /**
   * Evento emitido tras actualizar el perfil y recibir la versión completa actualizada.
   */
  @Output() fieldUpdated = new EventEmitter<UserProfile>();

  /**
   * Estado que indica si el campo está en modo edición.
   */
  isEditing = false;

  /**
   * Valor temporal del campo durante la edición.
   */
  editedValue = '';

  /**
   * Indica si se está realizando una operación de guardado.
   */
  isSaving = false;

  /**
   * Lista de campos que pertenecen a la entidad Artista.
   */
  private camposArtista = ['nombreArtistico', 'biografiaArtistico', 'fotoPerfilArtistico'];

  constructor(private userProfileService: UserProfileService) {}

  /**
   * Activa el modo edición para el campo.
   */
  startEditing(): void {
    this.isEditing = true;
    this.editedValue = this.value || '';
  }

  /**
   * Cancela la edición y restaura el valor original.
   */
  cancelEditing(): void {
    this.isEditing = false;
    this.editedValue = '';
  }

  /**
   * Guarda el valor editado y envía la actualización al backend.
   * Se determina automáticamente si debe actualizarse el perfil de usuario
   * o el perfil de artista.
   */
  saveChanges(): void {
    if (this.editedValue.trim() === '' && this.fieldName !== 'biografiaArtistico') {
      alert('El campo no puede estar vacío');
      return;
    }

    if (this.editedValue === this.value) {
      this.cancelEditing();
      return;
    }

    this.isSaving = true;
    const updateData = { [this.fieldName]: this.editedValue };
    const isArtistaField = this.camposArtista.includes(this.fieldName);

    if (isArtistaField && this.artistaId) {
      // Actualizar campo perteneciente a la entidad Artista
      this.userProfileService.editarPerfilArtista(this.artistaId, updateData)
        .pipe(switchMap(() => this.userProfileService.obtenerPerfil(this.userId)))
        .subscribe({
          next: (updatedProfile) => {
            this.fieldUpdated.emit(updatedProfile);
            this.isEditing = false;
            this.isSaving = false;
          },
          error: () => {
            alert('Error al actualizar el campo');
            this.isSaving = false;
          }
        });

    } else {
      // Actualizar campo de usuario
      this.userProfileService.editarPerfilUsuario(this.userId, updateData).subscribe({
        next: (updatedProfile) => {
          this.fieldUpdated.emit(updatedProfile);
          this.isEditing = false;
          this.isSaving = false;
        },
        error: () => {
          alert('Error al actualizar el campo');
          this.isSaving = false;
        }
      });
    }
  }
}

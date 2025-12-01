import { Component, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { UserProfileService } from '../../services/user-profile.service';
import { AuthStateService } from '../../../../core/services/auth-state.service';

@Component({
  selector: 'app-become-artist-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './become-artist-modal.component.html',
  styleUrls: ['./become-artist-modal.component.scss']
})
export class BecomeArtistModalComponent {
  /**
   * Evento que notifica al componente padre que el modal debe cerrarse.
   */
  @Output() closeModal = new EventEmitter<void>();

  /**
   * Evento emitido cuando se ha creado un perfil artístico exitosamente
   * o cuando el proceso finaliza sin datos disponibles.
   */
  @Output() artistaCreado = new EventEmitter<any>();

  private fb = inject(FormBuilder);
  private userProfileService = inject(UserProfileService);
  private authState = inject(AuthStateService);

  /**
   * Formulario de creación del perfil artístico.
   */
  artistForm!: FormGroup;

  /**
   * Indica si se está enviando el formulario.
   */
  isSubmitting = signal(false);

  /**
   * Mensaje de error relacionado con la creación del perfil artístico.
   */
  errorMessage = signal<string | null>(null);

  /**
   * Archivo seleccionado para la foto de perfil del artista.
   */
  selectedFile = signal<File | null>(null);

  /**
   * URL generada para previsualización de la imagen seleccionada.
   */
  previewUrl = signal<string | null>(null);

  /**
   * Tamaño máximo permitido para la imagen (5MB).
   */
  readonly MAX_FILE_SIZE = 5 * 1024 * 1024;

  /**
   * Tipos MIME permitidos para la imagen de perfil.
   */
  readonly ALLOWED_FORMATS = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

  constructor() {
    this.initializeForm();
  }

  /**
   * Inicializa el formulario con sus controles y validadores.
   */
  private initializeForm(): void {
    this.artistForm = this.fb.group({
      nombreArtistico: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
          this.noSpecialCharsValidator
        ]
      ],
      biografiaArtistico: [
        '',
        [
          Validators.required,
          Validators.minLength(50),
          Validators.maxLength(500)
        ]
      ],
      fotoPerfilArtistico: [null, [Validators.required]]
    });
  }

  /**
   * Validador para evitar caracteres especiales no permitidos.
   */
  private noSpecialCharsValidator(control: AbstractControl): { [key: string]: any } | null {
    if (!control.value) return null;
    const forbidden = /[<>{}[\]\\\/]/.test(control.value);
    return forbidden ? { specialChars: true } : null;
  }

  /**
   * Maneja la selección de un archivo de imagen y valida formato y tamaño.
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!this.ALLOWED_FORMATS.includes(file.type)) {
      this.errorMessage.set('Solo se permiten imágenes JPG, PNG o WEBP');
      this.clearFileSelection();
      return;
    }

    if (file.size > this.MAX_FILE_SIZE) {
      this.errorMessage.set('La imagen no puede superar los 5MB');
      this.clearFileSelection();
      return;
    }

    this.selectedFile.set(file);
    this.artistForm.patchValue({ fotoPerfilArtistico: file });
    this.artistForm.get('fotoPerfilArtistico')?.updateValueAndValidity();
    this.errorMessage.set(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewUrl.set(e.target?.result as string);
    };

    reader.readAsDataURL(file);
  }

  /**
   * Activa el input de tipo archivo para seleccionar una imagen.
   */
  triggerFileInput(): void {
    document.getElementById('file-input')?.click();
  }

  /**
   * Limpia la selección del archivo actual.
   */
  removeFile(): void {
    this.clearFileSelection();
    this.artistForm.patchValue({ fotoPerfilArtistico: null });
    this.artistForm.get('fotoPerfilArtistico')?.updateValueAndValidity();
  }

  /**
   * Restablece los estados asociados a la imagen seleccionada.
   */
  private clearFileSelection(): void {
    this.selectedFile.set(null);
    this.previewUrl.set(null);

    const input = document.getElementById('file-input') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  }

  /**
   * Gestiona el envío del formulario y realiza la creación del perfil artístico.
   */
  onSubmit(): void {
    if (this.artistForm.invalid) {
      this.artistForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const file = this.selectedFile();
    if (!file) {
      this.errorMessage.set('Debes seleccionar una foto de perfil');
      this.isSubmitting.set(false);
      return;
    }

    const artistaData = {
      nombreArtistico: this.artistForm.value.nombreArtistico,
      biografiaArtistico: this.artistForm.value.biografiaArtistico
    };

    this.userProfileService.convertirseEnArtista(file, artistaData).subscribe({
      next: (artistaResponse) => {
        const usuarioActual = this.authState.currentUser();

        if (usuarioActual?.idUsuario) {
          this.userProfileService.obtenerPerfil(usuarioActual.idUsuario).subscribe({
            next: (perfilCompleto) => {
              this.authState.updateUser(perfilCompleto as any);
              this.artistaCreado.emit(perfilCompleto);
              this.close();
              this.isSubmitting.set(false);
            },
            error: () => {
              this.artistaCreado.emit(null);
              this.close();
              this.isSubmitting.set(false);
            }
          });
        } else {
          this.artistaCreado.emit(null);
          this.close();
          this.isSubmitting.set(false);
        }
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || 'Error al crear perfil de artista');
        this.isSubmitting.set(false);
      }
    });
  }

  /**
   * Cierra el modal emitiendo el evento correspondiente.
   */
  close(): void {
    this.closeModal.emit();
  }

  /** Getters de conveniencia para controles del formulario */
  get nombreArtistico() { return this.artistForm.get('nombreArtistico'); }
  get biografiaArtistico() { return this.artistForm.get('biografiaArtistico'); }
  get fotoPerfilArtistico() { return this.artistForm.get('fotoPerfilArtistico'); }

  /**
   * Indica si un campo del formulario es inválido y ya fue tocado.
   */
  isFieldInvalid(field: AbstractControl | null): boolean {
    return !!(field && field.invalid && field.touched);
  }

  /**
   * Verifica si un campo presenta un error de un tipo específico.
   */
  hasError(field: AbstractControl | null, errorType: string): boolean {
    return !!(field && field.hasError(errorType) && field.touched);
  }

  /**
   * Obtiene el número de caracteres introducidos en un campo del formulario.
   */
  getCharCount(fieldName: string): number {
    return this.artistForm.get(fieldName)?.value?.length || 0;
  }
}

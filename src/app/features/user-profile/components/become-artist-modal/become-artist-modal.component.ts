// src/app/features/user-profile/components/become-artist-modal/become-artist-modal.component.ts

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
  @Output() closeModal = new EventEmitter<void>();
  @Output() artistaCreado = new EventEmitter<any>();

  private fb = inject(FormBuilder);
  private userProfileService = inject(UserProfileService);
  private authState = inject(AuthStateService);

  artistForm!: FormGroup;
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);
  selectedFile = signal<File | null>(null);
  previewUrl = signal<string | null>(null);

  readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  readonly ALLOWED_FORMATS = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

  constructor() {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.artistForm = this.fb.group({
      nombreArtistico: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        this.noSpecialCharsValidator
      ]],
      biografiaArtistico: ['', [
        Validators.required,
        Validators.minLength(50),
        Validators.maxLength(500)
      ]],
      fotoPerfilArtistico: [null, [Validators.required]]
    });
  }

  private noSpecialCharsValidator(control: AbstractControl): { [key: string]: any } | null {
    if (!control.value) return null;
    const forbidden = /[<>{}[\]\\\/]/.test(control.value);
    return forbidden ? { specialChars: true } : null;
  }

  // ============================================
  // MANEJO DE ARCHIVO
  // ============================================

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

  triggerFileInput(): void {
    document.getElementById('file-input')?.click();
  }

  removeFile(): void {
    this.clearFileSelection();
    this.artistForm.patchValue({ fotoPerfilArtistico: null });
    this.artistForm.get('fotoPerfilArtistico')?.updateValueAndValidity();
  }

  private clearFileSelection(): void {
    this.selectedFile.set(null);
    this.previewUrl.set(null);
    const input = document.getElementById('file-input') as HTMLInputElement;
    if (input) input.value = '';
  }

  // ============================================
  // SUBMIT
  // ============================================

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
        console.log('✅ Perfil de artista creado:', artistaResponse);

        // Actualizar el usuario en AuthState
        const usuarioActual = this.authState.currentUser();
        if (usuarioActual?.idUsuario) {
          this.userProfileService.obtenerPerfil(usuarioActual.idUsuario).subscribe({
            next: (perfilCompleto) => {
              // Actualizar AuthState con el perfil completo
              this.authState.updateUser(perfilCompleto as any);
              console.log('✅ Perfil actualizado en AuthState:', perfilCompleto);

              // Emitir el perfil completo para que el padre lo use directamente
              this.artistaCreado.emit(perfilCompleto);
              this.close();
              this.isSubmitting.set(false);
            },
            error: (err) => {
              console.error('⚠️ Error al recargar perfil:', err);
              // Aun con error, emitir null para que el padre intente recargar desde el servidor
              this.artistaCreado.emit(null);
              this.close();
              this.isSubmitting.set(false);
            }
          });
        } else {
          console.warn('⚠️ No hay usuario actual en AuthState');
          this.artistaCreado.emit(null);
          this.close();
          this.isSubmitting.set(false);
        }
      },
      error: (error) => {
        console.error('❌ Error al crear perfil de artista:', error);
        this.errorMessage.set(error.error?.message || 'Error al crear perfil de artista');
        this.isSubmitting.set(false);
      }
    });
  }

  // ============================================
  // UTILIDADES
  // ============================================

  close(): void {
    this.closeModal.emit();
  }

  get nombreArtistico() { return this.artistForm.get('nombreArtistico'); }
  get biografiaArtistico() { return this.artistForm.get('biografiaArtistico'); }
  get fotoPerfilArtistico() { return this.artistForm.get('fotoPerfilArtistico'); }

  isFieldInvalid(field: AbstractControl | null): boolean {
    return !!(field && field.invalid && field.touched);
  }

  hasError(field: AbstractControl | null, errorType: string): boolean {
    return !!(field && field.hasError(errorType) && field.touched);
  }

  getCharCount(fieldName: string): number {
    return this.artistForm.get(fieldName)?.value?.length || 0;
  }
}

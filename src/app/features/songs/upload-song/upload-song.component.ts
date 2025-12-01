import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SongService } from '../services/song.service';
import { FileUploadService } from '../../shared/services/file-upload.service';
import { GenreService } from '../../shared/services/genre.service';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';

/**
 * Representa un género musical.
 */
interface GeneroDTO {
  idGenero: number;
  nombreGenero: string;
}

/**
 * Componente para subir canciones, incluyendo audio, portada, información y selección de género.
 */
@Component({
  selector: 'app-upload-song',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BackButtonComponent],
  templateUrl: './upload-song.component.html',
  styleUrls: ['./upload-song.component.scss']
})
export class UploadSongComponent implements OnInit {
  private fb = inject(FormBuilder);
  private songService = inject(SongService);
  private fileUploadService = inject(FileUploadService);
  private genreService = inject(GenreService);
  public router = inject(Router);

  /** Formulario reactivo de subida de canción */
  songForm!: FormGroup;

  /** Lista de géneros musicales */
  generos = signal<GeneroDTO[]>([]);

  /** Estados de subida */
  isSubmitting = signal(false);
  uploadingAudio = signal(false);
  uploadingCover = signal(false);

  /** URLs de archivos subidos */
  audioUrl = signal<string | null>(null);
  coverUrl = signal<string | null>(null);

  /** Vista previa y metadatos */
  coverPreview = signal<string | null>(null);
  audioFileName = signal<string | null>(null);
  audioDuration = signal<number | null>(null);

  /** Mensajes de éxito y error */
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.scrollToTop();
    this.cargarGeneros();
    this.initializeForm();
  }

  /**
   * Carga los géneros disponibles desde el backend.
   */
  private cargarGeneros(): void {
    this.genreService.obtenerTodosLosGeneros().subscribe({
      next: (generos) => this.generos.set(generos),
      error: () => this.errorMessage.set('Error al cargar los géneros musicales')
    });
  }

  /**
   * Inicializa el formulario reactivo con validaciones.
   */
  private initializeForm(): void {
    this.songForm = this.fb.group({
      tituloCancion: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
      idGenero: ['', [Validators.required]],
      fechaLanzamiento: ['', [Validators.required]],
      precioCancion: [0.99, [Validators.required, Validators.min(0.99), Validators.max(99.99)]],
      descripcion: ['', [Validators.maxLength(500)]]
    });
  }

  /**
   * Maneja la selección de archivo de audio.
   * @param event Evento de cambio del input de archivo
   */
  onAudioSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const validacion = this.fileUploadService.validarAudio(file);
    if (!validacion.valido) {
      this.errorMessage.set(validacion.error || 'Archivo de audio no válido');
      this.scrollToTop();
      return;
    }

    this.uploadingAudio.set(true);
    this.errorMessage.set(null);
    this.audioFileName.set(file.name);

    this.fileUploadService.subirAudioCancion(file).subscribe({
      next: (response) => {
        this.audioUrl.set(response.url);
        this.audioDuration.set(response.duracion || 0);
        this.uploadingAudio.set(false);
      },
      error: () => {
        this.errorMessage.set('Error al subir el archivo de audio');
        this.uploadingAudio.set(false);
        this.audioFileName.set(null);
        this.scrollToTop();
      }
    });
  }

  /**
   * Maneja la selección de archivo de portada.
   * @param event Evento de cambio del input de archivo
   */
  onCoverSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const validacion = this.fileUploadService.validarImagen(file);
    if (!validacion.valido) {
      this.errorMessage.set(validacion.error || 'Imagen no válida');
      this.scrollToTop();
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => this.coverPreview.set(e.target?.result as string);
    reader.readAsDataURL(file);

    this.uploadingCover.set(true);
    this.errorMessage.set(null);

    this.fileUploadService.subirPortadaCancion(file).subscribe({
      next: (response) => {
        this.coverUrl.set(response.url);
        this.uploadingCover.set(false);
      },
      error: () => {
        this.errorMessage.set('Error al subir la portada');
        this.uploadingCover.set(false);
        this.coverPreview.set(null);
        this.scrollToTop();
      }
    });
  }

  /**
   * Envía la canción al backend para crear un nuevo registro.
   */
  onSubmit(): void {
    if (this.songForm.invalid) {
      this.songForm.markAllAsTouched();
      this.scrollToTop();
      return;
    }

    if (!this.audioUrl()) {
      this.errorMessage.set('Debes subir un archivo de audio');
      this.scrollToTop();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const formValue = this.songForm.value;
    const dto = {
      tituloCancion: formValue.tituloCancion,
      duracionSegundos: this.audioDuration() || 0,
      fechaLanzamiento: formValue.fechaLanzamiento,
      urlAudio: this.audioUrl()!,
      urlPortada: this.coverUrl() || undefined,
      precioCancion: parseFloat(formValue.precioCancion),
      idGenero: parseInt(formValue.idGenero),
      descripcion: formValue.descripcion || undefined
    };

    this.songService.crearCancion(dto).subscribe({
      next: () => {
        this.successMessage.set('¡Canción subida exitosamente!');
        this.isSubmitting.set(false);
        this.scrollToTop();
        setTimeout(() => this.router.navigate(['/perfil/info']), 3000);
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || 'Error al crear la canción');
        this.isSubmitting.set(false);
        this.scrollToTop();
      }
    });
  }

  /** Elimina el audio cargado */
  removeAudio(): void {
    this.audioUrl.set(null);
    this.audioFileName.set(null);
    this.audioDuration.set(null);
  }

  /** Elimina la portada cargada */
  removeCover(): void {
    this.coverUrl.set(null);
    this.coverPreview.set(null);
  }

  /** Desplaza la ventana al inicio de la página */
  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Formatea duración de audio en segundos a formato mm:ss
   * @param seconds Duración en segundos
   * @returns Cadena formateada
   */
  formatDuration(seconds: number | null): string {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /** Getters para validación de campos del formulario */
  get tituloCancion() { return this.songForm.get('tituloCancion'); }
  get idGenero() { return this.songForm.get('idGenero'); }
  get fechaLanzamiento() { return this.songForm.get('fechaLanzamiento'); }
  get precioCancion() { return this.songForm.get('precioCancion'); }
  get descripcion() { return this.songForm.get('descripcion'); }

  /**
   * Verifica si un campo del formulario es inválido y ha sido tocado
   * @param field Campo del formulario
   * @returns Verdadero si el campo es inválido
   */
  isFieldInvalid(field: any): boolean {
    return !!(field && field.invalid && field.touched);
  }
}

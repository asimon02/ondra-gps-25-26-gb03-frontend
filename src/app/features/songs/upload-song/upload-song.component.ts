import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SongService } from '../services/song.service';
import { FileUploadService } from '../../shared/services/file-upload.service';
import { GenreService } from '../../shared/services/genre.service';
import { Location } from '@angular/common';

interface GeneroDTO {
  idGenero: number;
  nombreGenero: string;
}

@Component({
  selector: 'app-upload-song',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './upload-song.component.html',
  styleUrls: ['./upload-song.component.scss']
})
export class UploadSongComponent implements OnInit {
  private fb = inject(FormBuilder);
  private songService = inject(SongService);
  private fileUploadService = inject(FileUploadService);
  private genreService = inject(GenreService);
  public router = inject(Router);
  private location = inject(Location);

  songForm!: FormGroup;
  generos = signal<GeneroDTO[]>([]);

  // Estados de subida
  isSubmitting = signal(false);
  uploadingAudio = signal(false);
  uploadingCover = signal(false);

  // URLs de archivos subidos
  audioUrl = signal<string | null>(null);
  coverUrl = signal<string | null>(null);

  // Vista previa
  coverPreview = signal<string | null>(null);
  audioFileName = signal<string | null>(null);
  audioDuration = signal<number | null>(null);

  // Mensajes
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.scrollToTop();
    this.cargarGeneros();
    this.initializeForm();
  }

  /**
   * Carga los géneros desde el backend
   */
  private cargarGeneros(): void {
    this.genreService.obtenerTodosLosGeneros().subscribe({
      next: (generos) => {
        this.generos.set(generos);
        console.log('✅ Géneros cargados:', generos);
      },
      error: (err) => {
        console.error('❌ Error al cargar géneros:', err);
        this.errorMessage.set('Error al cargar los géneros musicales');
      }
    });
  }

  private initializeForm(): void {
    this.songForm = this.fb.group({
      tituloCancion: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
      idGenero: ['', [Validators.required]],
      fechaLanzamiento: ['', [Validators.required]],
      precioCancion: [0.99, [Validators.required, Validators.min(0.99), Validators.max(99.99)]],
      descripcion: ['', [Validators.maxLength(500)]]
    });
  }

  onAudioSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    // Validar tipo de archivo
    const validacion = this.fileUploadService.validarAudio(file);
    if (!validacion.valido) {
      this.errorMessage.set(validacion.error || 'Archivo de audio no válido');
      this.scrollToTop();
      return;
    }

    this.uploadingAudio.set(true);
    this.errorMessage.set(null);
    this.audioFileName.set(file.name);

    // Subir archivo al backend
    this.fileUploadService.subirAudioCancion(file).subscribe({
      next: (response) => {
        this.audioUrl.set(response.url);
        this.audioDuration.set(response.duracion || 0);
        this.uploadingAudio.set(false);
        console.log('✅ Audio subido:', response);
      },
      error: (error) => {
        console.error('❌ Error al subir audio:', error);
        this.errorMessage.set('Error al subir el archivo de audio');
        this.uploadingAudio.set(false);
        this.audioFileName.set(null);
        this.scrollToTop();
      }
    });
  }

  onCoverSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    // Validar tipo de archivo
    const validacion = this.fileUploadService.validarImagen(file);
    if (!validacion.valido) {
      this.errorMessage.set(validacion.error || 'Imagen no válida');
      this.scrollToTop();
      return;
    }

    // Vista previa local
    const reader = new FileReader();
    reader.onload = (e) => {
      this.coverPreview.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Subir archivo al backend
    this.uploadingCover.set(true);
    this.errorMessage.set(null);

    this.fileUploadService.subirPortadaCancion(file).subscribe({
      next: (response) => {
        this.coverUrl.set(response.url); // ✅ Corregido
        this.uploadingCover.set(false);
        console.log('✅ Portada subida:', response);
      },
      error: (error) => {
        console.error('❌ Error al subir portada:', error);
        this.errorMessage.set('Error al subir la portada');
        this.uploadingCover.set(false);
        this.coverPreview.set(null);
        this.scrollToTop();
      }
    });
  }

  private obtenerDuracionAudio(file: File): void {
    const audio = new Audio();
    audio.src = URL.createObjectURL(file);

    audio.addEventListener('loadedmetadata', () => {
      this.audioDuration.set(Math.floor(audio.duration));
      URL.revokeObjectURL(audio.src);
    });
  }

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

    console.log('📤 Enviando canción:', dto);

    this.songService.crearCancion(dto).subscribe({
      next: (cancion) => {
        console.log('✅ Canción creada:', cancion);
        this.successMessage.set('¡Canción subida exitosamente!');
        this.isSubmitting.set(false);
        this.scrollToTop();

        // Redirigir después de 2 segundos
        setTimeout(() => {
          this.router.navigate(['/perfil/info']);
        }, 3000);
      },
      error: (error) => {
        console.error('❌ Error al crear canción:', error);
        this.errorMessage.set(error.error?.message || 'Error al crear la canción');
        this.isSubmitting.set(false);
        this.scrollToTop();
      }
    });
  }

  removeAudio(): void {
    this.audioUrl.set(null);
    this.audioFileName.set(null);
    this.audioDuration.set(null);
  }

  removeCover(): void {
    this.coverUrl.set(null);
    this.coverPreview.set(null);
  }

  goBack(): void {
    this.location.back();
  }

  private scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  formatDuration(seconds: number | null): string {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // Getters para validación
  get tituloCancion() { return this.songForm.get('tituloCancion'); }
  get idGenero() { return this.songForm.get('idGenero'); }
  get fechaLanzamiento() { return this.songForm.get('fechaLanzamiento'); }
  get precioCancion() { return this.songForm.get('precioCancion'); }
  get descripcion() { return this.songForm.get('descripcion'); }

  isFieldInvalid(field: any): boolean {
    return !!(field && field.invalid && field.touched);
  }
}

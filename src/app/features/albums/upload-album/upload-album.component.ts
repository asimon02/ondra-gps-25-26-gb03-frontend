import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlbumService } from '../services/album.service';
import { SongService } from '../../songs/services/song.service';
import { FileUploadService } from '../../shared/services/file-upload.service';
import { GenreService, GeneroDTO } from '../../shared/services/genre.service';
import { CancionDTO } from '../../songs/models/song.model';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';

/**
 * Componente para la creación de álbumes musicales.
 *
 * Permite a los artistas:
 * - Crear un nuevo álbum con información básica
 * - Subir portada del álbum
 * - Seleccionar canciones existentes para incluir en el álbum
 * - Gestionar el proceso en pasos progresivos
 */
@Component({
  selector: 'app-upload-album',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BackButtonComponent],
  templateUrl: './upload-album.component.html',
  styleUrls: ['./upload-album.component.scss']
})
export class UploadAlbumComponent implements OnInit {
  private fb = inject(FormBuilder);
  private albumService = inject(AlbumService);
  private songService = inject(SongService);
  private fileUploadService = inject(FileUploadService);
  private genreService = inject(GenreService);
  private authService = inject(AuthStateService);

  public router = inject(Router);

  albumForm!: FormGroup;
  generos = signal<GeneroDTO[]>([]);
  misCanciones = signal<CancionDTO[]>([]);
  cancionesSeleccionadas = signal<CancionDTO[]>([]);

  isSubmitting = signal(false);
  uploadingCover = signal(false);
  loadingCanciones = signal(false);

  coverUrl = signal<string | null>(null);
  coverPreview = signal<string | null>(null);

  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  currentStep = signal(1);

  ngOnInit(): void {
    window.scrollTo(0, 0);
    this.cargarGeneros();
    this.cargarMisCanciones();
    this.initializeForm();
  }

  /**
   * Carga la lista de géneros musicales disponibles.
   */
  private cargarGeneros(): void {
    this.genreService.obtenerTodosLosGeneros().subscribe({
      next: (generos) => this.generos.set(generos),
      error: (err) => console.error('Error al cargar géneros:', err)
    });
  }

  /**
   * Carga las canciones del artista actual que no están asignadas a ningún álbum.
   * Solo muestra canciones disponibles para ser agregadas al nuevo álbum.
   */
  private cargarMisCanciones(): void {
    this.loadingCanciones.set(true);

    const userInfo = this.authService.getUserInfo();
    if (!userInfo) {
      console.error('No hay usuario autenticado');
      this.errorMessage.set('No hay usuario autenticado. Por favor, inicia sesión.');
      this.loadingCanciones.set(false);
      return;
    }

    const idArtista = userInfo.idArtista;

    if (!idArtista) {
      this.misCanciones.set([]);
      this.loadingCanciones.set(false);
      return;
    }

    this.songService.obtenerCancionesPorArtista(idArtista).subscribe({
      next: (canciones) => {
        const cancionesSinAlbum = canciones.filter(c => !c.album);
        this.misCanciones.set(cancionesSinAlbum);
        this.loadingCanciones.set(false);
      },
      error: (err) => {
        console.error('Error al cargar canciones:', err);
        this.errorMessage.set(
          err.error?.message ||
          'Error al cargar tus canciones. Por favor, intenta de nuevo.'
        );
        this.misCanciones.set([]);
        this.loadingCanciones.set(false);
      }
    });
  }

  /**
   * Inicializa el formulario reactivo con validaciones.
   * Establece valores por defecto como la fecha actual y precio sugerido.
   */
  private initializeForm(): void {
    const today = new Date().toISOString().split('T')[0];

    this.albumForm = this.fb.group({
      tituloAlbum: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
      descripcionAlbum: ['', [Validators.maxLength(500)]],
      idGenero: ['', [Validators.required]],
      fechaLanzamiento: [today, [Validators.required]],
      precioAlbum: [9.99, [Validators.required, Validators.min(1.99), Validators.max(199.99)]]
    });
  }

  /**
   * Maneja la selección de archivo de portada.
   * Valida el archivo, genera preview y sube la imagen al servidor.
   *
   * @param event - Evento del input file
   */
  onCoverSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    const validacion = this.fileUploadService.validarImagen(file);
    if (!validacion.valido) {
      this.errorMessage.set(validacion.error!);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this.coverPreview.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    this.uploadingCover.set(true);
    this.errorMessage.set(null);

    this.fileUploadService.subirPortadaAlbum(file).subscribe({
      next: (response) => {
        this.coverUrl.set(response.url);
        this.uploadingCover.set(false);
      },
      error: (error) => {
        console.error('Error al subir portada:', error);
        this.errorMessage.set(
          error.error?.mensaje ||
          error.error?.message ||
          'Error al subir la portada del álbum'
        );
        this.uploadingCover.set(false);
        this.coverPreview.set(null);
      }
    });
  }

  /**
   * Elimina la portada seleccionada.
   */
  removeCover(): void {
    this.coverUrl.set(null);
    this.coverPreview.set(null);
  }

  /**
   * Alterna la selección de una canción para incluirla en el álbum.
   *
   * @param cancion - Canción a seleccionar/deseleccionar
   */
  toggleCancion(cancion: CancionDTO): void {
    const canciones = this.cancionesSeleccionadas();
    const index = canciones.findIndex(c => c.idCancion === cancion.idCancion);

    if (index > -1) {
      this.cancionesSeleccionadas.set(canciones.filter(c => c.idCancion !== cancion.idCancion));
    } else {
      this.cancionesSeleccionadas.set([...canciones, cancion]);
    }
  }

  /**
   * Verifica si una canción está seleccionada.
   *
   * @param cancion - Canción a verificar
   * @returns true si la canción está seleccionada
   */
  isCancionSeleccionada(cancion: CancionDTO): boolean {
    return this.cancionesSeleccionadas().some(c => c.idCancion === cancion.idCancion);
  }

  /**
   * Avanza al siguiente paso del formulario.
   * Valida los datos del paso actual antes de continuar.
   */
  nextStep(): void {
    if (this.currentStep() === 1 && this.albumForm.invalid) {
      this.albumForm.markAllAsTouched();
      this.errorMessage.set('Por favor, completa todos los campos obligatorios');
      this.scrollToTop();
      return;
    }

    if (this.currentStep() === 2) {
      if (this.cancionesSeleccionadas().length === 0) {
        this.errorMessage.set('Debes seleccionar al menos una canción para el álbum');
        this.scrollToTop();
        return;
      }
    }

    this.currentStep.update(s => s + 1);
    this.errorMessage.set(null);
    this.scrollToTop();
  }

  /**
   * Retrocede al paso anterior del formulario.
   */
  prevStep(): void {
    this.currentStep.update(s => s - 1);
    this.errorMessage.set(null);
    this.scrollToTop();
  }

  /**
   * Desplaza la ventana al inicio de la página con animación suave.
   */
  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Maneja el envío del formulario y creación del álbum.
   * Valida los datos y ejecuta el proceso de creación en dos fases:
   * 1. Crea el álbum
   * 2. Agrega las canciones seleccionadas
   */
  onSubmit(): void {
    if (this.albumForm.invalid) {
      this.albumForm.markAllAsTouched();
      this.errorMessage.set('Por favor, completa todos los campos correctamente');
      this.scrollToTop();
      return;
    }

    if (this.cancionesSeleccionadas().length === 0) {
      this.errorMessage.set('Debes seleccionar al menos una canción');
      this.scrollToTop();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const formValue = this.albumForm.value;

    const albumDTO = {
      tituloAlbum: formValue.tituloAlbum,
      idGenero: parseInt(formValue.idGenero),
      precioAlbum: parseFloat(formValue.precioAlbum),
      urlPortada: this.coverUrl() || '',
      descripcion: formValue.descripcionAlbum || undefined
    };

    this.albumService.crearAlbum(albumDTO).subscribe({
      next: (album) => {
        this.agregarCancionesAlAlbum(album.idAlbum);
      },
      error: (error) => {
        console.error('Error al crear álbum:', error);
        this.errorMessage.set(
          error.error?.message ||
          error.error?.mensaje ||
          'Error al crear el álbum. Por favor, intenta de nuevo.'
        );
        this.isSubmitting.set(false);
        this.scrollToTop();
      }
    });
  }

  /**
   * Agrega las canciones seleccionadas al álbum recién creado.
   * Asigna número de pista a cada canción según el orden de selección.
   *
   * @param idAlbum - ID del álbum al que se agregarán las canciones
   */
  private agregarCancionesAlAlbum(idAlbum: number): void {
    const canciones = this.cancionesSeleccionadas();
    let completadas = 0;
    let errores = 0;

    canciones.forEach((cancion, index) => {
      const dto = {
        idCancion: cancion.idCancion,
        numeroPista: index + 1
      };

      this.albumService.agregarCancionAlAlbum(idAlbum, dto).subscribe({
        next: () => {
          completadas++;

          if (completadas + errores === canciones.length) {
            this.finalizarCreacion(completadas, errores);
          }
        },
        error: (error) => {
          errores++;
          console.error('Error al agregar canción:', error);

          if (completadas + errores === canciones.length) {
            this.finalizarCreacion(completadas, errores);
          }
        }
      });
    });
  }

  /**
   * Finaliza el proceso de creación del álbum.
   * Muestra mensaje de éxito o advertencia y redirige al perfil.
   *
   * @param completadas - Número de canciones agregadas exitosamente
   * @param errores - Número de canciones que fallaron al agregarse
   */
  private finalizarCreacion(completadas: number, errores: number): void {
    this.isSubmitting.set(false);

    if (errores > 0) {
      this.errorMessage.set(
        `Álbum creado con advertencias: ${completadas} canciones agregadas, ${errores} fallaron.`
      );
    } else {
      this.successMessage.set('¡Álbum creado exitosamente!');
    }

    this.scrollToTop();

    setTimeout(() => {
      this.router.navigate(['/perfil/info']);
    }, 3000);
  }

  /**
   * Obtiene el nombre del género seleccionado en el formulario.
   *
   * @returns Nombre del género o cadena vacía si no hay selección
   */
  getNombreGenero(): string {
    const idGenero = parseInt(this.albumForm.value.idGenero);
    return this.generos().find(g => g.idGenero === idGenero)?.nombreGenero || '';
  }

  /**
   * Calcula la duración total del álbum basada en las canciones seleccionadas.
   *
   * @returns Duración formateada como "Xh Ym Zs" o "Ym Zs"
   */
  getDuracionTotal(): string {
    const totalSegundos = this.cancionesSeleccionadas()
      .reduce((sum, c) => sum + c.duracionSegundos, 0);

    const horas = Math.floor(totalSegundos / 3600);
    const minutos = Math.floor((totalSegundos % 3600) / 60);
    const segundos = totalSegundos % 60;

    if (horas > 0) {
      return `${horas}h ${minutos}m ${segundos}s`;
    }
    return `${minutos}m ${segundos}s`;
  }

  /**
   * Formatea una duración en segundos a formato MM:SS.
   *
   * @param seconds - Duración en segundos
   * @returns Duración formateada
   */
  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Formatea una fecha ISO a formato legible en español.
   *
   * @param dateString - Fecha en formato ISO
   * @returns Fecha formateada en español o cadena vacía
   */
  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  get tituloAlbum() { return this.albumForm.get('tituloAlbum'); }
  get descripcionAlbum() { return this.albumForm.get('descripcionAlbum'); }
  get idGenero() { return this.albumForm.get('idGenero'); }
  get fechaLanzamiento() { return this.albumForm.get('fechaLanzamiento'); }
  get precioAlbum() { return this.albumForm.get('precioAlbum'); }

  /**
   * Verifica si un campo del formulario es inválido y ha sido tocado.
   *
   * @param field - FormControl a verificar
   * @returns true si el campo es inválido y ha sido tocado
   */
  isFieldInvalid(field: any): boolean {
    return !!(field && field.invalid && field.touched);
  }
}

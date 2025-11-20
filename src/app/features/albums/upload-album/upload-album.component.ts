import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlbumService } from '../services/album.service';
import { SongService } from '../../songs/services/song.service';
import { FileUploadService } from '../../shared/services/file-upload.service';
import { GenreService, GeneroDTO } from '../../shared/services/genre.service';
import { CancionDTO } from '../../songs/models/song.model';
import { AuthStateService } from '../../../core/services/auth-state.service';

@Component({
  selector: 'app-upload-album',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
  private location = inject(Location);

  public router = inject(Router);

  albumForm!: FormGroup;
  generos = signal<GeneroDTO[]>([]);  // ✅ Cambiado de GeneroOption[] a GeneroDTO[]
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

  // ==================== CARGA INICIAL ====================

  private cargarGeneros(): void {
    this.genreService.obtenerTodosLosGeneros().subscribe({  // ✅ Usar método directo
      next: (generos) => this.generos.set(generos),
      error: (err) => console.error('Error al cargar géneros:', err)
    });
  }

  private cargarMisCanciones(): void {
    this.loadingCanciones.set(true);

    const userInfo = this.authService.getUserInfo();
    if (!userInfo) {
      console.error('❌ No hay usuario autenticado');
      this.errorMessage.set('No hay usuario autenticado. Por favor, inicia sesión.');
      this.loadingCanciones.set(false);
      return;
    }

    const idArtista = userInfo.idArtista;

    if (!idArtista) {
      console.log(idArtista);
      console.warn('⚠️ El usuario no es artista o no tiene idArtista');
      this.misCanciones.set([]);
      this.loadingCanciones.set(false);
      return;
    }

    console.log(`🔍 Cargando canciones del artista ID: ${idArtista}`);

    this.songService.obtenerCancionesPorArtista(idArtista).subscribe({
      next: (canciones) => {
        console.log('✅ Canciones recibidas del backend:', canciones);

        const cancionesSinAlbum = canciones.filter(c => !c.album);

        this.misCanciones.set(cancionesSinAlbum);

        console.log(`📦 Canciones disponibles: ${cancionesSinAlbum.length}`);

        this.loadingCanciones.set(false);
      },
      error: (err) => {
        console.error('❌ Error al cargar canciones:', err);
        this.errorMessage.set(
          err.error?.message ||
          'Error al cargar tus canciones. Por favor, intenta de nuevo.'
        );
        this.misCanciones.set([]);
        this.loadingCanciones.set(false);
      }
    });
  }

  // ==================== FORMULARIO ====================

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

  // ==================== GESTIÓN DE PORTADA ====================

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
        console.log('✅ Portada de álbum subida:', {
          url: response.url,
          dimensiones: response.dimensiones,
          mensaje: response.mensaje
        });
      },
      error: (error) => {
        console.error('❌ Error al subir portada:', error);
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

  removeCover(): void {
    this.coverUrl.set(null);
    this.coverPreview.set(null);
  }

  // ==================== SELECCIÓN DE CANCIONES ====================

  toggleCancion(cancion: CancionDTO): void {
    const canciones = this.cancionesSeleccionadas();
    const index = canciones.findIndex(c => c.idCancion === cancion.idCancion);

    if (index > -1) {
      this.cancionesSeleccionadas.set(canciones.filter(c => c.idCancion !== cancion.idCancion));
    } else {
      this.cancionesSeleccionadas.set([...canciones, cancion]);
    }
  }

  isCancionSeleccionada(cancion: CancionDTO): boolean {
    return this.cancionesSeleccionadas().some(c => c.idCancion === cancion.idCancion);
  }

  // ==================== NAVEGACIÓN ENTRE PASOS ====================

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

  prevStep(): void {
    this.currentStep.update(s => s - 1);
    this.errorMessage.set(null);
    this.scrollToTop();
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ==================== CREACIÓN DEL ÁLBUM ====================

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

    console.log('📀 Creando álbum:', albumDTO);

    this.albumService.crearAlbum(albumDTO).subscribe({
      next: (album) => {
        console.log('✅ Álbum creado:', album);
        this.agregarCancionesAlAlbum(album.idAlbum);
      },
      error: (error) => {
        console.error('❌ Error al crear álbum:', error);
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

  private agregarCancionesAlAlbum(idAlbum: number): void {
    const canciones = this.cancionesSeleccionadas();
    let completadas = 0;
    let errores = 0;

    console.log(`🎵 Agregando ${canciones.length} canciones al álbum ${idAlbum}`);

    canciones.forEach((cancion, index) => {
      const dto = {
        idCancion: cancion.idCancion,
        numeroPista: index + 1
      };

      console.log(`📝 Agregando canción ${index + 1}/${canciones.length}:`, dto);

      this.albumService.agregarCancionAlAlbum(idAlbum, dto).subscribe({
        next: () => {
          completadas++;
          console.log(`✅ Canción ${completadas}/${canciones.length} agregada: ${cancion.tituloCancion}`);

          if (completadas + errores === canciones.length) {
            this.finalizarCreacion(completadas, errores);
          }
        },
        error: (error) => {
          errores++;
          console.error(`❌ Error al agregar canción ${cancion.tituloCancion}:`, error);
          console.error('   Detalles:', {
            idCancion: cancion.idCancion,
            idArtista: cancion.idArtista,
            error: error.error
          });

          if (completadas + errores === canciones.length) {
            this.finalizarCreacion(completadas, errores);
          }
        }
      });
    });
  }

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

  // ==================== MÉTODOS AUXILIARES ====================

  getNombreGenero(): string {
    const idGenero = parseInt(this.albumForm.value.idGenero);
    return this.generos().find(g => g.idGenero === idGenero)?.nombreGenero || '';  // ✅ Usar idGenero y nombreGenero
  }

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

  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  goBack(): void {
    this.location.back();
  }

  // ==================== GETTERS PARA VALIDACIÓN ====================

  get tituloAlbum() { return this.albumForm.get('tituloAlbum'); }
  get descripcionAlbum() { return this.albumForm.get('descripcionAlbum'); }
  get idGenero() { return this.albumForm.get('idGenero'); }
  get fechaLanzamiento() { return this.albumForm.get('fechaLanzamiento'); }
  get precioAlbum() { return this.albumForm.get('precioAlbum'); }

  isFieldInvalid(field: any): boolean {
    return !!(field && field.invalid && field.touched);
  }
}

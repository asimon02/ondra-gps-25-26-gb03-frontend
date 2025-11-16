import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlbumService } from '../services/album.service';
import { SongService } from '../../songs/services/song.service';
import { FileUploadService } from '../../shared/services/file-upload.service';
import { GenreService, GeneroOption } from '../../shared/services/genre.service';
import { CancionDTO } from '../../songs/models/song.model';

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
  private location = inject(Location);

  public router = inject(Router);

  albumForm!: FormGroup;
  generos = signal<GeneroOption[]>([]);
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
  usandoCancionesPrueba = signal(false);

  ngOnInit(): void {
    window.scrollTo(0, 0);
    this.cargarGeneros();
    this.cargarMisCanciones();
    this.initializeForm();
  }

  private cargarGeneros(): void {
    this.genreService.obtenerGenerosComoOpciones().subscribe({
      next: (generos) => this.generos.set(generos),
      error: (err) => console.error('Error al cargar géneros:', err)
    });
  }

  private cargarMisCanciones(): void {
    this.loadingCanciones.set(true);
    this.songService.listarMisCanciones().subscribe({
      next: (canciones) => {
        const cancionesSinAlbum = canciones.filter(c => !c.album);

        if (cancionesSinAlbum.length === 0) {
          // ✅ Si no hay canciones, crear canciones de prueba
          console.log('⚠️ No hay canciones disponibles. Creando canciones de prueba...');
          this.crearCancionesPrueba();
        } else {
          this.misCanciones.set(cancionesSinAlbum);
          this.usandoCancionesPrueba.set(false);
        }

        this.loadingCanciones.set(false);
      },
      error: (err) => {
        console.error('Error al cargar canciones:', err);
        // ✅ En caso de error, también crear canciones de prueba
        console.log('⚠️ Error al cargar canciones. Usando canciones de prueba...');
        this.crearCancionesPrueba();
        this.loadingCanciones.set(false);
      }
    });
  }

  /**
   * ✅ Crea canciones de prueba para testing
   */
  private crearCancionesPrueba(): void {
    const cancionesPrueba: CancionDTO[] = [
      {
        idCancion: 1,
        tituloCancion: 'Amanecer Digital',
        duracionSegundos: 245,
        fechaLanzamiento: '2025-01-15',
        urlAudio: 'https://example.com/audio/song1.mp3',
        urlPortada: 'https://picsum.photos/seed/song1/400/400',
        precioCancion: 0.99,
        reproducciones: 1250,
        genero: {
          idGenero: 1,
          nombreGenero: 'Electrónica'
        },
        artista: {
          idArtista: 1,
          nombreArtistico: 'DJ Prueba'
        }
      },
      {
        idCancion: 2,
        tituloCancion: 'Ritmos Urbanos',
        duracionSegundos: 198,
        fechaLanzamiento: '2025-01-16',
        urlAudio: 'https://example.com/audio/song2.mp3',
        urlPortada: 'https://picsum.photos/seed/song2/400/400',
        precioCancion: 0.99,
        reproducciones: 890,
        genero: {
          idGenero: 2,
          nombreGenero: 'Hip Hop'
        },
        artista: {
          idArtista: 1,
          nombreArtistico: 'DJ Prueba'
        }
      },
      {
        idCancion: 3,
        tituloCancion: 'Melodía Nocturna',
        duracionSegundos: 312,
        fechaLanzamiento: '2025-01-17',
        urlAudio: 'https://example.com/audio/song3.mp3',
        urlPortada: 'https://picsum.photos/seed/song3/400/400',
        precioCancion: 1.29,
        reproducciones: 2340,
        genero: {
          idGenero: 3,
          nombreGenero: 'Jazz'
        },
        artista: {
          idArtista: 1,
          nombreArtistico: 'DJ Prueba'
        }
      },
      {
        idCancion: 4,
        tituloCancion: 'Éxtasis Electrónico',
        duracionSegundos: 267,
        fechaLanzamiento: '2025-01-18',
        urlAudio: 'https://example.com/audio/song4.mp3',
        urlPortada: 'https://picsum.photos/seed/song4/400/400',
        precioCancion: 0.99,
        reproducciones: 1580,
        genero: {
          idGenero: 1,
          nombreGenero: 'Electrónica'
        },
        artista: {
          idArtista: 1,
          nombreArtistico: 'DJ Prueba'
        }
      },
      {
        idCancion: 5,
        tituloCancion: 'Sueños en Vinilo',
        duracionSegundos: 289,
        fechaLanzamiento: '2025-01-19',
        urlAudio: 'https://example.com/audio/song5.mp3',
        urlPortada: 'https://picsum.photos/seed/song5/400/400',
        precioCancion: 1.49,
        reproducciones: 3120,
        genero: {
          idGenero: 4,
          nombreGenero: 'Rock'
        },
        artista: {
          idArtista: 1,
          nombreArtistico: 'DJ Prueba'
        }
      },
      {
        idCancion: 6,
        tituloCancion: 'Frecuencia del Alma',
        duracionSegundos: 223,
        fechaLanzamiento: '2025-01-20',
        urlAudio: 'https://example.com/audio/song6.mp3',
        urlPortada: 'https://picsum.photos/seed/song6/400/400',
        precioCancion: 0.99,
        reproducciones: 987,
        genero: {
          idGenero: 5,
          nombreGenero: 'Ambient'
        },
        artista: {
          idArtista: 1,
          nombreArtistico: 'DJ Prueba'
        }
      }
    ];

    this.misCanciones.set(cancionesPrueba);
    this.usandoCancionesPrueba.set(true);
    console.log('✅ Canciones de prueba creadas:', cancionesPrueba.length);
  }

  private initializeForm(): void {
    this.albumForm = this.fb.group({
      tituloAlbum: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
      descripcionAlbum: ['', [Validators.maxLength(500)]],
      idGenero: ['', [Validators.required]],
      fechaLanzamiento: ['', [Validators.required]],
      precioAlbum: [9.99, [Validators.required, Validators.min(1.99), Validators.max(199.99)]]
    });
  }

  onCoverSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.errorMessage.set('Por favor selecciona una imagen válida');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      this.errorMessage.set('La imagen no puede superar los 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this.coverPreview.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    this.uploadingCover.set(true);
    this.errorMessage.set(null);

    this.fileUploadService.subirImagen(file, 'album').subscribe({
      next: (response) => {
        this.coverUrl.set(response.url_imagen);
        this.uploadingCover.set(false);
        console.log('✅ Portada de álbum subida:', response);
      },
      error: (error) => {
        console.error('❌ Error al subir portada:', error);
        this.errorMessage.set('Error al subir la portada del álbum');
        this.uploadingCover.set(false);
        this.coverPreview.set(null);
      }
    });
  }

  removeCover(): void {
    this.coverUrl.set(null);
    this.coverPreview.set(null);
  }

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

  nextStep(): void {
    if (this.currentStep() === 1 && this.albumForm.invalid) {
      this.albumForm.markAllAsTouched();
      return;
    }

    if (this.currentStep() === 2 && this.cancionesSeleccionadas().length === 0) {
      this.errorMessage.set('Debes seleccionar al menos una canción para el álbum');
      this.scrollToTop();
      return;
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

  /**
   * ✅ Hace scroll suave hacia arriba de la página
   */
  private scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  onSubmit(): void {
    if (this.albumForm.invalid) {
      this.albumForm.markAllAsTouched();
      return;
    }

    if (this.cancionesSeleccionadas().length === 0) {
      this.errorMessage.set('Debes seleccionar al menos una canción');
      this.scrollToTop();
      return;
    }

    // ⚠️ Si estamos usando canciones de prueba, simular éxito
    if (this.usandoCancionesPrueba()) {
      console.log('⚠️ Modo de prueba: simulando creación de álbum...');
      this.simularCreacionAlbum();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const formValue = this.albumForm.value;

    const albumDTO = {
      tituloAlbum: formValue.tituloAlbum,
      descripcionAlbum: formValue.descripcionAlbum || undefined,
      fechaLanzamiento: formValue.fechaLanzamiento,
      urlPortada: this.coverUrl() || undefined,
      precioAlbum: parseFloat(formValue.precioAlbum),
      idGenero: parseInt(formValue.idGenero)
    };

    this.albumService.crearAlbum(albumDTO).subscribe({
      next: (album) => {
        console.log('✅ Álbum creado:', album);
        this.agregarCancionesAlAlbum(album.idAlbum);
      },
      error: (error) => {
        console.error('❌ Error al crear álbum:', error);
        this.errorMessage.set(error.error?.message || 'Error al crear el álbum');
        this.isSubmitting.set(false);
        this.scrollToTop();
      }
    });
  }

  /**
   * ✅ Simula la creación de un álbum para modo de prueba
   */
  private simularCreacionAlbum(): void {
    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const formValue = this.albumForm.value;

    console.log('📀 Álbum simulado:', {
      titulo: formValue.tituloAlbum,
      descripcion: formValue.descripcionAlbum,
      genero: this.getNombreGenero(),
      fecha: formValue.fechaLanzamiento,
      precio: formValue.precioAlbum,
      canciones: this.cancionesSeleccionadas().map(c => c.tituloCancion),
      totalCanciones: this.cancionesSeleccionadas().length,
      duracionTotal: this.getDuracionTotal()
    });

    // Simular delay de red
    setTimeout(() => {
      this.successMessage.set('¡Álbum creado exitosamente! (Modo Prueba)');
      this.isSubmitting.set(false);
      this.scrollToTop();

      setTimeout(() => {
        this.router.navigate(['/perfil/info']);
      }, 3000);
    }, 1500);
  }

  private agregarCancionesAlAlbum(idAlbum: number): void {
    const canciones = this.cancionesSeleccionadas();
    let completadas = 0;
    let errores = 0;

    canciones.forEach((cancion, index) => {
      const dto = {
        idCancion: cancion.idCancion,
        numeroCancion: index + 1
      };

      this.albumService.agregarCancion(idAlbum, dto).subscribe({
        next: () => {
          completadas++;
          console.log(`✅ Canción ${completadas}/${canciones.length} agregada`);

          if (completadas + errores === canciones.length) {
            this.finalizarCreacion();
          }
        },
        error: (error) => {
          errores++;
          console.error('❌ Error al agregar canción:', error);

          if (completadas + errores === canciones.length) {
            this.finalizarCreacion();
          }
        }
      });
    });
  }

  private finalizarCreacion(): void {
    this.successMessage.set('¡Álbum creado exitosamente!');
    this.isSubmitting.set(false);
    this.scrollToTop();

    setTimeout(() => {
      this.router.navigate(['/mis-albumes']);
    }, 2000);
  }

  getNombreGenero(): string {
    const idGenero = parseInt(this.albumForm.value.idGenero);
    return this.generos().find(g => g.id === idGenero)?.nombre || '';
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

  goBack(): void {
    this.location.back();
  }

  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  get tituloAlbum() { return this.albumForm.get('tituloAlbum'); }
  get descripcionAlbum() { return this.albumForm.get('descripcionAlbum'); }
  get idGenero() { return this.albumForm.get('idGenero'); }
  get fechaLanzamiento() { return this.albumForm.get('fechaLanzamiento'); }
  get precioAlbum() { return this.albumForm.get('precioAlbum'); }

  isFieldInvalid(field: any): boolean {
    return !!(field && field.invalid && field.touched);
  }
}

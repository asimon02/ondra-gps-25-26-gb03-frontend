import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ContentCarouselComponent, CarouselItem } from '../content-carousel/content-carousel.component';
import { SongService } from '../../../songs/services/song.service';
import { CancionDTO } from '../../../songs/models/song.model';
import { MusicPlayerService } from '../../../../core/services/music-player.service';
import { SongService as CoreSongService } from '../../../../core/services/song.service';
import { AuthStateService } from '../../../../core/services/auth-state.service';

@Component({
  selector: 'app-canciones-preview',
  standalone: true,
  imports: [CommonModule, ContentCarouselComponent],
  templateUrl: './canciones-preview.component.html',
  styleUrls: ['./canciones-preview.component.scss']
})
export class CancionesPreviewComponent implements OnInit {
  /**
   * ID del artista cuyas canciones deben mostrarse.
   */
  @Input() artistaId?: number;

  /**
   * Nombre del artista asociado a las canciones.
   */
  @Input() nombreArtista?: string;

  /**
   * Indica si el perfil visualizado pertenece al usuario autenticado.
   */
  @Input() isOwnProfile: boolean = false;

  /**
   * Lista mapeada de canciones para el componente de carrusel.
   */
  canciones: CarouselItem[] = [];

  /**
   * Indica si los datos están siendo cargados.
   */
  isLoading = true;

  /**
   * Mensaje de error mostrado al usuario.
   */
  errorMessage = '';

  constructor(
    private router: Router,
    private songService: SongService,
    private playerService: MusicPlayerService,
    private coreSongService: CoreSongService,
    private authState: AuthStateService
  ) {}

  /**
   * Hook de inicialización.
   * Si se ha recibido un ID de artista, carga las canciones asociadas.
   */
  ngOnInit(): void {
    if (this.artistaId) {
      this.cargarCanciones();
    } else {
      this.isLoading = false;
    }
  }

  /**
   * Obtiene las canciones del artista desde el servicio correspondiente
   * y las mapea al formato requerido por el carrusel.
   */
  cargarCanciones(): void {
    if (!this.artistaId) {
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.songService.obtenerCancionesPorArtista(this.artistaId).subscribe({
      next: (canciones: CancionDTO[]) => {
        this.canciones = canciones.map((cancion: CancionDTO) => ({
          id: cancion.idCancion,
          nombre: cancion.tituloCancion,
          artista: this.nombreArtista || 'Artista desconocido',
          tipo: 'canción' as const,
          imagen: cancion.urlPortada || 'https://via.placeholder.com/300x300?text=Sin+Portada'
        }));

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar canciones:', error);
        this.errorMessage = 'No se pudieron cargar las canciones';
        this.canciones = [];
        this.isLoading = false;
      }
    });
  }

  /**
   * Navega a la vista para subir una nueva canción.
   */
  onAddCancion(): void {
    this.router.navigate([`/perfil/subir-cancion`]);
  }

  /**
   * Maneja la acción de clic en un elemento del carrusel.
   * @param item Canción seleccionada.
   */
  onItemClick(item: CarouselItem): void {
    this.router.navigate([`/cancion/${item.id}`]);
  }

  /**
   * Reproduce la canción seleccionada.
   * Carga los datos completos de la canción, establece la playlist
   * y registra la reproducción si el usuario está autenticado.
   *
   * @param item Canción seleccionada.
   */
  onPlayClick(item: CarouselItem): void {
    this.coreSongService.getSongById(item.id.toString()).subscribe({
      next: (song) => {
        this.playerService.setPlaylist([song]);
        this.playerService.playSong(song, true);

        if (this.authState.isAuthenticated()) {
          this.coreSongService.registerPlay(song.id).subscribe({
            error: (err) => console.error('Error registering play:', err)
          });
        }
      },
      error: (err) => {
        console.error('Error loading song:', err);
        alert('Error al cargar la canción');
      }
    });
  }
}

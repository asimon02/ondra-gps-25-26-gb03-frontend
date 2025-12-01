import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ContentCarouselComponent, CarouselItem } from '../content-carousel/content-carousel.component';
import { AlbumService } from '../../../albums/services/album.service';
import { AlbumDTO } from '../../../albums/models/album.model';
import { MusicPlayerService } from '../../../../core/services/music-player.service';
import { AlbumService as CoreAlbumService } from '../../../../core/services/album.service';
import { SongService as CoreSongService } from '../../../../core/services/song.service';
import { AuthStateService } from '../../../../core/services/auth-state.service';

@Component({
  selector: 'app-albumes-preview',
  standalone: true,
  imports: [CommonModule, ContentCarouselComponent],
  templateUrl: './albumes-preview.component.html',
  styleUrls: ['./albumes-preview.component.scss']
})
export class AlbumesPreviewComponent implements OnInit {
  /**
   * ID del artista al que pertenecen los álbumes a mostrar.
   */
  @Input() artistaId?: number;

  /**
   * Nombre del artista asociado a los álbumes.
   */
  @Input() nombreArtista?: string;

  /**
   * Indica si el perfil visualizado pertenece al usuario autenticado.
   */
  @Input() isOwnProfile: boolean = false;

  /**
   * Lista de álbumes en formato compatible con el carrusel.
   */
  albumes: CarouselItem[] = [];

  /**
   * Indica si los datos están siendo cargados.
   */
  isLoading = true;

  /**
   * Mensaje de error a mostrar en caso de fallo al obtener los álbumes.
   */
  errorMessage = '';

  constructor(
    private router: Router,
    private albumService: AlbumService,
    private playerService: MusicPlayerService,
    private coreAlbumService: CoreAlbumService,
    private coreSongService: CoreSongService,
    private authState: AuthStateService
  ) {}

  /**
   * Hook de inicialización del componente.
   * Si se proporciona un ID de artista, se inicia la carga de álbumes.
   */
  ngOnInit(): void {
    if (this.artistaId) {
      this.cargarAlbumes();
    } else {
      this.isLoading = false;
    }
  }

  /**
   * Obtiene los álbumes del artista desde el servicio correspondiente
   * y los mapea al formato utilizado por el componente de carrusel.
   */
  cargarAlbumes(): void {
    if (!this.artistaId) {
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.albumService.obtenerAlbumesPorArtista(this.artistaId).subscribe({
      next: (albumes: AlbumDTO[]) => {
        this.albumes = albumes.map((album: AlbumDTO) => ({
          id: album.idAlbum,
          nombre: album.tituloAlbum,
          artista: this.nombreArtista || 'Artista desconocido',
          tipo: 'álbum' as const,
          imagen: album.urlPortada || 'https://via.placeholder.com/300x300?text=Sin+Portada'
        }));

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar álbumes:', error);
        this.errorMessage = 'No se pudieron cargar los álbumes';
        this.albumes = [];
        this.isLoading = false;
      }
    });
  }

  /**
   * Navega a la vista para subir un nuevo álbum.
   */
  onAddAlbum(): void {
    this.router.navigate([`/perfil/subir-album`]);
  }

  /**
   * Gestiona el evento de clic sobre un álbum del carrusel.
   * @param item Álbum seleccionado.
   */
  onItemClick(item: CarouselItem): void {
    this.router.navigate([`/album/${item.id}`]);
  }

  /**
   * Inicia la reproducción de un álbum completo.
   * Carga la lista de pistas, establece la playlist y reproduce la primera canción.
   * Además, registra la reproducción si el usuario está autenticado.
   *
   * @param item Álbum seleccionado para reproducción.
   */
  onPlayClick(item: CarouselItem): void {
    this.coreAlbumService.getAlbumById(item.id.toString()).subscribe({
      next: (album) => {
        if (album.trackList && album.trackList.length > 0) {
          this.playerService.setPlaylist(album.trackList);
          this.playerService.playSong(album.trackList[0], true);

          if (this.authState.isAuthenticated()) {
            this.coreSongService.registerPlay(album.trackList[0].id).subscribe({
              error: (err) => console.error('Error registering play:', err)
            });
          }
        } else {
          alert('Este álbum no tiene canciones disponibles');
        }
      },
      error: (err) => {
        console.error('Error loading album:', err);
        alert('Error al cargar el álbum');
      }
    });
  }
}

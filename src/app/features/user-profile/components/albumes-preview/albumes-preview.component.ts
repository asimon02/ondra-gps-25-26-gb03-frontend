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
  @Input() artistaId?: number;
  @Input() nombreArtista?: string; // ✅ CAMBIAR A nombreArtista (sin "ico")
  @Input() isOwnProfile: boolean = false;

  albumes: CarouselItem[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(
    private router: Router,
    private albumService: AlbumService,
    private playerService: MusicPlayerService,
    private coreAlbumService: CoreAlbumService,
    private coreSongService: CoreSongService,
    private authState: AuthStateService
  ) {}

  ngOnInit(): void {
    console.log('💿 AlbumesPreview - Inputs recibidos:', {
      artistaId: this.artistaId,
      nombreArtista: this.nombreArtista, // ✅ Verificar qué llega
      isOwnProfile: this.isOwnProfile
    });

    if (this.artistaId) {
      this.cargarAlbumes();
    } else {
      this.isLoading = false;
    }
  }

  cargarAlbumes(): void {
    if (!this.artistaId) {
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.albumService.obtenerAlbumesPorArtista(this.artistaId).subscribe({
      next: (albumes: AlbumDTO[]) => {
        console.log('✅ Álbumes cargados:', albumes);
        console.log('🎨 Nombre artista a usar:', this.nombreArtista);

        this.albumes = albumes.map((album: AlbumDTO) => ({
          id: album.idAlbum,
          nombre: album.tituloAlbum,
          artista: this.nombreArtista || 'Artista Desconocido', // ✅ USAR nombreArtista
          tipo: 'álbum' as const,
          imagen: album.urlPortada || 'https://via.placeholder.com/300x300?text=Sin+Portada'
        }));

        console.log('💿 Primer álbum mapeado:', this.albumes[0]);

        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error al cargar álbumes:', error);
        this.errorMessage = 'No se pudieron cargar los álbumes';
        this.albumes = [];
        this.isLoading = false;
      }
    });
  }

  onAddAlbum(): void {
    this.router.navigate([`/perfil/subir-album`]);
  }

  onItemClick(item: CarouselItem): void {
    console.log('Álbum clickeado:', item);
    this.router.navigate([`/album/${item.id}`]);
  }

  onPlayClick(item: CarouselItem): void {
    console.log('Reproducir álbum:', item);
    // Cargar el álbum completo desde la API usando el core service
    this.coreAlbumService.getAlbumById(item.id.toString()).subscribe({
      next: (album) => {
        if (album.trackList && album.trackList.length > 0) {
          // Establecer playlist con todas las canciones del álbum
          this.playerService.setPlaylist(album.trackList);
          // Reproducir la primera canción con auto-play
          this.playerService.playSong(album.trackList[0], true);
          // Registrar reproducción solo si hay sesión
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

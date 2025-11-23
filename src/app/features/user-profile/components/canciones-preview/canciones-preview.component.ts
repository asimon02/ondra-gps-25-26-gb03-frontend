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
  @Input() artistaId?: number;
  @Input() nombreArtista?: string; // ✅ CAMBIAR A nombreArtista (sin "ico")
  @Input() isOwnProfile: boolean = false;

  canciones: CarouselItem[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(
    private router: Router,
    private songService: SongService,
    private playerService: MusicPlayerService,
    private coreSongService: CoreSongService,
    private authState: AuthStateService
  ) {}

  ngOnInit(): void {
    console.log('🎵 CancionesPreview - Inputs recibidos:', {
      artistaId: this.artistaId,
      nombreArtista: this.nombreArtista, // ✅ Verificar qué llega
      isOwnProfile: this.isOwnProfile
    });

    if (this.artistaId) {
      this.cargarCanciones();
    } else {
      this.isLoading = false;
    }
  }

  cargarCanciones(): void {
    if (!this.artistaId) {
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.songService.obtenerCancionesPorArtista(this.artistaId).subscribe({
      next: (canciones: CancionDTO[]) => {
        console.log('✅ Canciones cargadas:', canciones);
        console.log('🎨 Nombre artista a usar:', this.nombreArtista);

        this.canciones = canciones.map((cancion: CancionDTO) => ({
          id: cancion.idCancion,
          nombre: cancion.tituloCancion,
          artista: this.nombreArtista || 'Artista Desconocido', // ✅ USAR nombreArtista
          tipo: 'canción' as const,
          imagen: cancion.urlPortada || 'https://via.placeholder.com/300x300?text=Sin+Portada'
        }));

        console.log('🎵 Primera canción mapeada:', this.canciones[0]);

        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error al cargar canciones:', error);
        this.errorMessage = 'No se pudieron cargar las canciones';
        this.canciones = [];
        this.isLoading = false;
      }
    });
  }

  onAddCancion(): void {
    this.router.navigate([`/perfil/subir-cancion`]);
  }

  onItemClick(item: CarouselItem): void {
    console.log('Canción clickeada:', item);
    this.router.navigate([`/song/${item.id}`]);
  }

  onPlayClick(item: CarouselItem): void {
    console.log('Reproducir canción:', item);
    // Cargar la canción completa desde la API usando el core service
    this.coreSongService.getSongById(item.id.toString()).subscribe({
      next: (song) => {
        // Establecer playlist con la canción
        this.playerService.setPlaylist([song]);
        // Reproducir la canción con auto-play
        this.playerService.playSong(song, true);
        // Registrar reproducción solo si hay sesión
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

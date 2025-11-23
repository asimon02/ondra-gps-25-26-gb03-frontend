// src/app/features/user-profile/components/favorites-preview/favorites-preview.component.ts

import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ContentCarouselComponent, CarouselItem } from '../content-carousel/content-carousel.component';
import { environment } from '../../../../../enviroments/enviroment';
import { MusicPlayerService } from '../../../../core/services/music-player.service';
import { AlbumService as CoreAlbumService } from '../../../../core/services/album.service';
import { SongService as CoreSongService } from '../../../../core/services/song.service';
import { AuthStateService } from '../../../../core/services/auth-state.service';

@Component({
  selector: 'app-favorites-preview',
  standalone: true,
  imports: [CommonModule, ContentCarouselComponent],
  templateUrl: './favorites-preview.component.html',
  styleUrls: ['./favorites-preview.component.scss']
})
export class FavoritesPreviewComponent implements OnInit {
  @Input() userId!: number;
  @Input() isOwnProfile: boolean = false; // ✅ NUEVO

  favoritos: CarouselItem[] = [];
  isLoading = true;

  constructor(
    private http: HttpClient,
    private router: Router,
    private playerService: MusicPlayerService,
    private coreAlbumService: CoreAlbumService,
    private coreSongService: CoreSongService,
    private authState: AuthStateService
  ) {}

  ngOnInit(): void {
    this.cargarFavoritos();
  }

  cargarFavoritos(): void {
    this.isLoading = true;

    setTimeout(() => {
      this.favoritos = [
        {
          id: 1,
          nombre: 'One More Time',
          artista: 'Daft Punk',
          tipo: 'canción',
          imagen: 'https://i.scdn.co/image/ab67616d0000b27338e5c88261ac859cee792916'
        },
        {
          id: 2,
          nombre: 'Around the World',
          artista: 'Daft Punk',
          tipo: 'canción',
          imagen: 'https://i.scdn.co/image/ab67616d0000b27338e5c88261ac859cee792916'
        },
        {
          id: 3,
          nombre: 'Random Access Memories',
          artista: 'Daft Punk',
          tipo: 'álbum',
          imagen: 'https://i.scdn.co/image/ab67616d0000b27338e5c88261ac859cee792916'
        },
        {
          id: 4,
          nombre: 'Get Lucky',
          artista: 'Daft Punk',
          tipo: 'canción',
          imagen: 'https://i.scdn.co/image/ab67616d0000b27338e5c88261ac859cee792916'
        },
        {
          id: 5,
          nombre: 'Instant Crush',
          artista: 'Daft Punk',
          tipo: 'canción',
          imagen: 'https://i.scdn.co/image/ab67616d0000b27338e5c88261ac859cee792916'
        }
      ];
      this.isLoading = false;
    }, 500);
  }

  onItemClick(item: CarouselItem): void {
    console.log('Favorito clickeado:', item);
    if (item.tipo === 'álbum') {
      this.router.navigate([`/album/${item.id}`]);
    } else {
      this.router.navigate([`/song/${item.id}`]);
    }
  }

  onPlayClick(item: CarouselItem): void {
    console.log('Reproducir favorito:', item);

    if (item.tipo === 'álbum') {
      // Cargar álbum y reproducir primera canción
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
    } else {
      // Cargar y reproducir canción
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
}

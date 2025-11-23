// src/app/features/user-profile/components/purchases-preview/purchases-preview.component.ts

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
  selector: 'app-purchases-preview',
  standalone: true,
  imports: [CommonModule, ContentCarouselComponent],
  templateUrl: './purchases-preview.component.html',
  styleUrls: ['./purchases-preview.component.scss']
})
export class PurchasesPreviewComponent implements OnInit {
  @Input() userId!: number;

  compras: CarouselItem[] = [];
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
    this.cargarCompras();
  }

  cargarCompras(): void {
    // TODO: Implementar llamada real al microservicio de contenidos
    this.isLoading = true;

    setTimeout(() => {
      this.compras = [
        {
          id: 1,
          nombre: 'Blinding Lights',
          artista: 'The Weeknd',
          tipo: 'canción',
          precio: 0.99,
          imagen: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36'
        },
        {
          id: 2,
          nombre: 'Starboy',
          artista: 'The Weeknd',
          tipo: 'álbum',
          precio: 9.99,
          imagen: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36'
        },
        {
          id: 3,
          nombre: 'Save Your Tears',
          artista: 'The Weeknd',
          tipo: 'canción',
          precio: 0.99,
          imagen: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36'
        },
        {
          id: 4,
          nombre: 'After Hours',
          artista: 'The Weeknd',
          tipo: 'álbum',
          precio: 12.99,
          imagen: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36'
        },
        {
          id: 5,
          nombre: 'Die For You',
          artista: 'The Weeknd',
          tipo: 'canción',
          precio: 0.99,
          imagen: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36'
        }
      ];
      this.isLoading = false;
    }, 500);
  }

  onItemClick(item: CarouselItem): void {
    console.log('Compra clickeada:', item);
    if (item.tipo === 'álbum') {
      this.router.navigate([`/album/${item.id}`]);
    } else {
      this.router.navigate([`/song/${item.id}`]);
    }
  }

  onPlayClick(item: CarouselItem): void {
    console.log('Reproducir compra:', item);

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

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AlbumService } from '../../../../core/services/album.service';
import { SongService } from '../../../../core/services/song.service';
import { MusicPlayerService } from '../../../../core/services/music-player.service';
import { Album, AlbumArtist } from '../../../../core/models/album.model';
import { Song } from '../../../../core/models/song.model';
import { MusicPlayerComponent } from '../../components/music-player/music-player.component';
import { ArtistService } from '../../../../core/services/artist.service';
import { map, catchError, switchMap } from 'rxjs/operators';
import { of, Observable } from 'rxjs';
import { AuthStateService } from '../../../../core/services/auth-state.service';
import { FollowService } from '../../../../core/services/follow.service';
import { RatingWidgetComponent } from '../../ratings/rating-widget/rating-widget.component';
import { CommentsSectionComponent } from '../../comments/components/comments-section/comments-section.component';
import { CarritoService } from '../../../../core/services/carrito.service';
import { FavoritosService } from '../../../../core/services/favoritos.service';
import { BackButtonComponent } from '../../../../shared/components/back-button/back-button.component';
import { CheckoutStateService } from '../../../../core/services/checkout-state.service';
import { TipoUsuario } from '../../../../core/models/auth.model';

/**
 * Componente de detalle de álbum.
 * Muestra la información completa de un álbum, incluyendo su tracklist,
 * artista, opciones de compra, favoritos y reproducción.
 */
@Component({
  selector: 'app-album-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MusicPlayerComponent,
    RatingWidgetComponent,
    CommentsSectionComponent,
    BackButtonComponent
  ],
  templateUrl: './album-detail.component.html',
  styles: []
})
export class AlbumDetailComponent implements OnInit, OnDestroy {
  album?: Album;
  isLoading = true;
  showPlayer = false;
  currentSongId: string | null = null;
  isPlayerPlaying = false;
  followersCount: number | null = null;
  isFollowingArtist = false;
  isUpdatingFollow = false;
  isInCart = false;

  private subscriptions = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private albumService: AlbumService,
    private songService: SongService,
    private playerService: MusicPlayerService,
    private artistService: ArtistService,
    private authState: AuthStateService,
    private followService: FollowService,
    private carritoService: CarritoService,
    private favoritosService: FavoritosService,
    private checkoutState: CheckoutStateService
  ) {}

  /**
   * Inicializa el componente, carga el álbum y configura las suscripciones
   * a los observables del reproductor, carrito y favoritos.
   */
  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'instant' });

    const albumId = this.route.snapshot.paramMap.get('id');
    if (albumId) {
      this.loadAlbum(albumId);
    } else {
      this.isLoading = false;
    }

    this.subscriptions.add(
      this.playerService.currentSong$.subscribe(currentSong => {
        this.showPlayer = currentSong !== null;
        this.currentSongId = currentSong?.id ?? null;
      })
    );

    this.subscriptions.add(
      this.playerService.isPlaying$.subscribe(isPlaying => {
        this.isPlayerPlaying = isPlaying;
      })
    );

    this.subscriptions.add(
      this.carritoService.carrito$.subscribe(() => {
        this.checkIfInCart();
      })
    );

    this.subscriptions.add(
      this.favoritosService.onFavoritoChanged.subscribe(event => {
        if (!this.album) return;

        if (event.tipo === 'CANCIÓN') {
          const track = this.album.trackList.find(t => t.id === event.idContenido.toString());
          if (track) {
            const newFavoriteState = event.accion === 'AGREGADO';
            track.isFavorite = newFavoriteState;

            const currentSong = this.playerService.getCurrentSong();
            if (currentSong?.id === event.idContenido.toString()) {
              this.playerService.updateCurrentSong({
                id: event.idContenido.toString(),
                isFavorite: newFavoriteState
              });
            }
          }
        }

        if (event.tipo === 'ÁLBUM' && this.album.id === event.idContenido.toString()) {
          this.album.isFavorite = event.accion === 'AGREGADO';

          if (event.idsCanciones && event.idsCanciones.length > 0) {
            const newFavoriteState = event.accion === 'AGREGADO';
            event.idsCanciones.forEach(idCancion => {
              const track = this.album!.trackList.find(t => t.id === idCancion.toString());
              if (track) {
                track.isFavorite = newFavoriteState;

                const currentSong = this.playerService.getCurrentSong();
                if (currentSong?.id === idCancion.toString()) {
                  this.playerService.updateCurrentSong({
                    id: idCancion.toString(),
                    isFavorite: newFavoriteState
                  });
                }
              }
            });
          }
        }
      })
    );
  }

  /**
   * Limpia las suscripciones al destruir el componente.
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Carga los datos del álbum especificado por su ID.
   * Obtiene la información del álbum, del artista asociado y actualiza
   * los estados de favoritos y compra.
   *
   * @param id - ID del álbum a cargar
   */
  loadAlbum(id: string): void {
    this.isLoading = true;
    this.followersCount = null;
    this.isFollowingArtist = false;
    this.albumService.getAlbumById(id).subscribe({
      next: (album) => {
        const artistId = album.artistId || album.artist?.id;

        const finish = (a: Album) => {
          const setAlbum = (tracks: Album['trackList']) => {
            this.album = { ...a, trackList: this.withAlbumArtist(tracks, a.artist) };
            this.isLoading = false;
          };
          this.markAlbumStates(a).pipe(
            switchMap(withStates => this.mergeTrackFavorites(withStates.trackList).pipe(
              map(tracks => ({ ...withStates, trackList: this.withAlbumArtist(tracks, withStates.artist) }))
            ))
          ).subscribe({
            next: (albumWithStates) => {
              this.album = albumWithStates;
              this.isLoading = false;
            },
            error: () => {
              this.mergeTrackFavorites(a.trackList).subscribe(setAlbum);
            }
          });
        };

        if (artistId) {
          this.artistService.getArtistById(artistId).subscribe({
            next: (artist) => finish({ ...album, artist, artistId: artist.id }),
            error: () => finish(album)
          });
        } else {
          finish(album);
        }
      },
      error: (err) => {
        console.error('Error loading album:', err);
        this.isLoading = false;
      }
    });
  }

  /**
   * Combina el estado de favoritos con las canciones del tracklist.
   * Obtiene las canciones favoritas del usuario y marca las coincidencias.
   *
   * @param tracks - Lista de canciones del álbum
   * @returns Observable con las canciones marcadas como favoritas
   */
  private mergeTrackFavorites(tracks: Album['trackList']) {
    if (!tracks || tracks.length === 0 || !this.canShowUserActions) {
      return of(tracks ? tracks.map(track => ({ ...track, isFavorite: false })) : tracks);
    }
    return this.songService.getFavoriteSongs().pipe(
      map((favorites) => {
        const favIds = new Set(favorites.map(f => f.id));
        return tracks.map(track => ({
          ...track,
          isFavorite: favIds.has(track.id)
        }));
      }),
      catchError(() => of(tracks))
    );
  }

  /**
   * Asigna el artista del álbum a las canciones que no tienen artista definido.
   *
   * @param tracks - Lista de canciones del álbum
   * @param artist - Información del artista del álbum
   * @returns Lista de canciones con el artista asignado
   */
  private withAlbumArtist(tracks: Album['trackList'], artist: AlbumArtist): Album['trackList'] {
    return tracks.map(track => {
      if (track.artist?.id) {
        return track;
      }
      return { ...track, artist };
    });
  }

  /**
   * Carga información adicional del artista (estadísticas de seguidores y estado de seguimiento).
   *
   * @param artist - Datos del artista
   */
  private loadArtistExtras(artist: AlbumArtist): void {
    const userId = artist?.userId;

    if (userId) {
      this.followService.getStats(userId).subscribe({
        next: (stats) => {
          this.followersCount = stats.followers;
        },
        error: (err) => {
          console.error('Error loading artist stats:', err);
          this.followersCount = null;
        }
      });
    } else {
      this.followersCount = null;
    }

    if (!userId) {
      this.isFollowingArtist = false;
      return;
    }

    if (this.authState.isAuthenticated()) {
      this.followService.isFollowing(userId).subscribe({
        next: (isFollowing) => {
          this.isFollowingArtist = isFollowing;
        },
        error: () => {
          this.isFollowingArtist = false;
        }
      });
    } else {
      this.isFollowingArtist = false;
    }
  }

  /**
   * Actualiza el estado del álbum con información de favoritos y compra.
   *
   * @param album - Datos del álbum a actualizar
   * @returns Observable con el álbum actualizado
   */
  private markAlbumStates(album: Album): Observable<Album> {
    if (!this.authState.isAuthenticated()) {
      this.loadArtistExtras(album.artist);
      return of({ ...album, isFavorite: false, isPurchased: false });
    }

    const favorite$ = this.canShowUserActions
      ? this.albumService.isAlbumFavorite(album.id)
      : of(false);

    return favorite$.pipe(
      switchMap((isFav) => this.albumService.isAlbumPurchased(album.id).pipe(
        map((isPurchased) => ({ ...album, isFavorite: this.canShowUserActions ? isFav : false, isPurchased }))
      )),
      catchError(() => of(album)),
      map((updated) => {
        this.loadArtistExtras(updated.artist);
        this.checkIfInCart();
        return updated;
      })
    );
  }

  /**
   * Alterna el estado de favorito del álbum completo.
   */
  onToggleFavorite(): void {
    if (!this.album || !this.canShowUserActions) {
      return;
    }
    this.albumService.toggleFavorite(this.album.id).subscribe({
      next: (updatedAlbum) => {
        if (this.album) {
          this.album.isFavorite = updatedAlbum.isFavorite;
        }
      },
      error: (err) => {
        console.error('Error toggling favorite:', err);
      }
    });
  }

  /**
   * Alterna el estado de favorito de una canción individual.
   *
   * @param songId - ID de la canción
   */
  onToggleSongFavorite(songId: string): void {
    if (!this.canShowUserActions) {
      return;
    }
    this.songService.toggleFavorite(songId).subscribe({
      next: (updatedSong) => {
        if (this.album) {
          const track = this.album.trackList.find(t => t.id === songId);
          if (track) {
            track.isFavorite = updatedSong.isFavorite;
          }

          const currentSong = this.playerService.getCurrentSong();
          if (currentSong?.id === songId) {
            this.playerService.updateCurrentSong({
              id: songId,
              isFavorite: updatedSong.isFavorite
            });
          }
        }
      },
      error: (err) => {
        console.error('Error toggling song favorite:', err);
      }
    });
  }

  /**
   * Inicia el proceso de compra del álbum.
   * Redirige al checkout o verificación de pago según el precio.
   */
  onPurchaseAlbum(): void {
    if (!this.album || !this.canShowUserActions) {
      return;
    }

    if (this.album.isPurchased) {
      alert('Ya has comprado este album');
      return;
    }

    const albumId = +this.album.id;

    if (this.album.price === 0) {
      this.checkoutState.setContext({
        origin: 'DETALLE',
        tipoContenido: 'ÁLBUM',
        idContenido: albumId,
        isFree: true,
        metodoPagoId: null,
        metodoGuardado: false
      });
      this.router.navigate(['/verificacion-pago']);
      return;
    }

    this.checkoutState.setContext({
      origin: 'DETALLE',
      tipoContenido: 'ÁLBUM',
      idContenido: albumId,
      isFree: false,
      metodoPagoId: null
    });
    this.router.navigate(['/pasarela-pago'], { state: { origin: 'DETALLE' } });
  }

  /**
   * Agrega o elimina el álbum del carrito de compras.
   */
  onAddToCart(): void {
    if (!this.album || !this.canShowUserActions) {
      return;
    }

    if (this.album.isPurchased) {
      alert('Ya has comprado este album');
      return;
    }

    const albumId = +this.album.id;

    if (this.isInCart) {
      const carrito = this.carritoService.getCarritoActual();
      if (!carrito) {
        return;
      }

      const item = carrito.items.find(item =>
        item.tipoProducto === 'ÁLBUM' && item.idAlbum === albumId
      );

      if (!item) {
        return;
      }

      this.carritoService.eliminarItem(item.idCarritoItem).subscribe({
        next: () => {
          this.isInCart = false;
        },
        error: (err) => {
          console.error('Error al quitar del carrito:', err);
          alert('Hubo un error al quitar del carrito. Intentalo de nuevo.');
        }
      });
      return;
    }

    this.carritoService.agregarItem({
      tipoProducto: 'ÁLBUM',
      idAlbum: albumId
    }).subscribe({
      next: () => {
        this.isInCart = true;
      },
      error: (err) => {
        console.error('Error al anadir al carrito:', err);
        alert('Hubo un error al anadir al carrito. Intentalo de nuevo.');
      }
    });
  }

  /**
   * Verifica si el álbum actual está en el carrito de compras.
   */
  private checkIfInCart(): void {
    if (!this.album) {
      return;
    }
    if (!this.canShowUserActions) {
      this.isInCart = false;
      return;
    }
    this.isInCart = this.carritoService.isAlbumEnCarrito(+this.album.id);
  }

  /**
   * Reproduce una canción del álbum.
   * Configura la playlist con el tracklist del álbum y registra la reproducción.
   *
   * @param song - Canción a reproducir
   */
  onPlaySong(song: Song): void {
    if (this.album) {
      this.playerService.setPlaylist(this.album.trackList);
      this.playerService.playSong(song, true);

      if (this.authState.isAuthenticated()) {
        this.songService.registerPlay(song.id).subscribe({
          next: (result) => {
            if (this.album) {
              const track = this.album.trackList.find(t => t.id === song.id);
              if (track) {
                track.playCount = result.totalPlays;
              }
            }
          },
          error: (err) => {
            console.error('Error registering play:', err);
          }
        });
      }
    }
  }

  /**
   * Reproduce el álbum completo desde la primera canción.
   */
  onPlayAlbum(): void {
    if (this.album && this.album.trackList.length > 0) {
      const firstTrack = this.album.trackList[0];
      this.onPlaySong(firstTrack);
    }
  }

  /**
   * Alterna entre reproducir y pausar el álbum completo.
   */
  onToggleAlbumPlayback(): void {
    if (!this.album || this.album.trackList.length === 0) {
      return;
    }

    if (this.isAlbumCurrentlyPlaying) {
      this.playerService.pause();
      return;
    }

    const selectedTrack = this.album.trackList.find(track => track.id === this.currentSongId);
    if (selectedTrack) {
      this.playerService.play();
      return;
    }

    this.onPlayAlbum();
  }

  /**
   * Alterna entre reproducir y pausar una canción específica.
   *
   * @param track - Canción a reproducir o pausar
   */
  onToggleTrackPlayback(track: Song): void {
    if (this.isTrackPlaying(track.id)) {
      this.playerService.pause();
      return;
    }

    if (this.currentSongId === track.id) {
      this.playerService.play();
      return;
    }

    this.onPlaySong(track);
  }

  /**
   * Cierra el reproductor de música.
   */
  onClosePlayer(): void {
    // El reproductor se cierra automáticamente cuando se llama a stop()
  }

  /**
   * Maneja el evento de toggle de favorito desde el reproductor.
   *
   * @param songId - ID de la canción
   */
  onPlayerToggleFavorite(songId: string): void {
    if (!this.canShowUserActions) {
      return;
    }
    this.onToggleSongFavorite(songId);
  }

  /**
   * Alterna el estado de seguimiento del artista del álbum.
   */
  onToggleFollow(): void {
    if (!this.album?.artist?.userId || !this.canShowUserActions) {
      return;
    }

    if (!this.authState.isAuthenticated()) {
      alert('Inicia sesión para seguir artistas.');
      return;
    }

    this.isUpdatingFollow = true;
    const userId = this.album.artist.userId;
    const followAction$ = this.isFollowingArtist
      ? this.followService.unfollow(userId)
      : this.followService.follow(userId);

    followAction$.subscribe({
      next: () => {
        this.isFollowingArtist = !this.isFollowingArtist;
        this.loadArtistExtras(this.album!.artist);
      },
      error: (err) => {
        console.error('Error updating follow state:', err);
        alert('No se pudo actualizar el seguimiento. Inténtalo nuevamente.');
        this.isUpdatingFollow = false;
      },
      complete: () => {
        this.isUpdatingFollow = false;
      }
    });
  }

  /**
   * Comparte el álbum usando la Web Share API o copiando el enlace al portapapeles.
   */
  onShare(): void {
    if (this.album) {
      const shareText = `Escucha "${this.album.title}" de ${this.album.artist.artisticName}`;
      const shareUrl = window.location.href;

      if (navigator.share) {
        navigator.share({
          title: this.album.title,
          text: shareText,
          url: shareUrl
        }).catch(err => {
          console.error('Error sharing:', err);
          this.fallbackShare(shareUrl, shareText);
        });
      } else {
        this.fallbackShare(shareUrl, shareText);
      }
    }
  }

  /**
   * Método alternativo para compartir cuando Web Share API no está disponible.
   * Copia el enlace al portapapeles.
   *
   * @param url - URL a compartir
   * @param text - Texto descriptivo
   */
  private fallbackShare(url: string, text: string): void {
    navigator.clipboard.writeText(url).then(() => {
      alert(`Enlace copiado al portapapeles:\n${text}`);
    }).catch(() => {
      alert(`Comparte este Álbum:\n${url}`);
    });
  }

  /**
   * Navega hacia atrás en el historial del navegador.
   */
  goBack(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.location.back();
  }

  /**
   * Determina si el usuario actual puede ver y ejecutar acciones como favoritos o compras.
   * Los artistas no pueden realizar estas acciones.
   */
  get canShowUserActions(): boolean {
    const user = this.authState.getUserInfo();
    return this.authState.isAuthenticated() && user?.tipoUsuario !== TipoUsuario.ARTISTA;
  }

  /**
   * Obtiene la duración total del álbum en segundos.
   *
   * @returns Duración total en segundos
   */
  getTotalDuration(): number {
    return this.album?.totalDuration || 0;
  }

  /**
   * Formatea una duración en segundos al formato MM:SS.
   *
   * @param seconds - Duración en segundos
   * @returns Duración formateada
   */
  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Extrae el año de una fecha en formato string.
   *
   * @param dateString - Fecha en formato string
   * @returns Año como string
   */
  formatReleaseYear(dateString: string): string {
    return new Date(dateString).getFullYear().toString();
  }

  /**
   * Formatea un número grande con sufijos K (miles) o M (millones).
   *
   * @param num - Número a formatear
   * @returns Número formateado
   */
  formatNumber(num: number): string {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  }

  /**
   * Maneja la respuesta del backend tras una compra de álbum.
   *
   * @param updatedAlbum - Álbum actualizado con el estado de compra
   */
  private handleAlbumPurchaseResponse(updatedAlbum: Album): void {
    if (!this.album) {
      return;
    }

    if (!updatedAlbum.isPurchased) {
      alert('El backend no confirmó la compra. Finaliza el pago desde el carrito/checkout.');
      return;
    }

    const title = updatedAlbum.title || this.album.title;
    alert('Compra exitosa: "' + title + '" agregada a tu biblioteca.');
    this.album.isPurchased = true;
  }

  /**
   * Determina si el álbum actual está siendo reproducido.
   */
  get isAlbumCurrentlyPlaying(): boolean {
    if (!this.album || !this.isPlayerPlaying || !this.currentSongId) {
      return false;
    }
    return this.album.trackList.some(track => track.id === this.currentSongId);
  }

  /**
   * Determina si una canción específica está siendo reproducida.
   *
   * @param trackId - ID de la canción
   * @returns true si la canción está reproduciéndose
   */
  isTrackPlaying(trackId: string): boolean {
    return this.currentSongId === trackId && this.isPlayerPlaying;
  }

  /**
   * Actualiza el contador de comentarios del álbum.
   *
   * @param total - Nuevo total de comentarios
   */
  onCommentsCountChange(total: number): void {
    if (this.album) {
      this.album.totalComments = total;
    }
  }
}

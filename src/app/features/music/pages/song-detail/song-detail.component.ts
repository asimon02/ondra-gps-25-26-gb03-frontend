import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { SongService } from '../../../../core/services/song.service';
import { ArtistService } from '../../../../core/services/artist.service';
import { MusicPlayerService } from '../../../../core/services/music-player.service';
import { Song } from '../../../../core/models/song.model';
import { MusicPlayerComponent } from '../../components/music-player/music-player.component';
import { RatingWidgetComponent } from '../../ratings/rating-widget/rating-widget.component';
import { CommentsSectionComponent } from '../../comments/components/comments-section/comments-section.component';
import { AuthStateService } from '../../../../core/services/auth-state.service';
import { FollowService } from '../../../../core/services/follow.service';
import { CarritoService } from '../../../../core/services/carrito.service';
import { BackButtonComponent } from '../../../../shared/components/back-button/back-button.component';
import { FavoritosService, FavoritoChangeEvent } from '../../../../core/services/favoritos.service';
import { CheckoutStateService } from '../../../../core/services/checkout-state.service';
import { TipoUsuario } from '../../../../core/models/auth.model';

/**
 * Componente de detalle de canción.
 * Muestra la información completa de una canción, incluyendo artista,
 * opciones de compra, favoritos y reproducción.
 */
@Component({
  selector: 'app-song-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MusicPlayerComponent, RatingWidgetComponent, CommentsSectionComponent, BackButtonComponent],
  templateUrl: './song-detail.component.html',
  styles: []
})
export class SongDetailComponent implements OnInit, OnDestroy {
  song?: Song;
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
   * Inicializa el componente, carga la canción y configura las suscripciones
   * a los observables del reproductor, carrito y favoritos.
   */
  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'instant' });

    const songId = this.route.snapshot.paramMap.get('id');
    if (songId) {
      this.loadSong(songId);
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
      this.favoritosService.onFavoritoChanged.subscribe((event: FavoritoChangeEvent) => {
        if (event.tipo === 'CANCIÓN' && this.song && this.song.id === event.idContenido.toString()) {
          const newFavoriteState = event.accion === 'AGREGADO';
          this.song.isFavorite = newFavoriteState;

          const currentSong = this.playerService.getCurrentSong();
          if (currentSong?.id === this.song.id) {
            this.playerService.updateCurrentSong({
              id: this.song.id,
              isFavorite: newFavoriteState
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
   * Carga los datos de la canción especificada por su ID.
   * Obtiene la información de la canción, del artista asociado y actualiza
   * los estados de favoritos y compra.
   *
   * @param id - ID de la canción a cargar
   */
  loadSong(id: string): void {
    this.isLoading = true;
    this.followersCount = null;
    this.isFollowingArtist = false;

    this.songService.getSongById(id).subscribe({
      next: (song) => {
        const artistId = song.artist.id;
        const finish = (s: Song) => {
          this.song = s;
          this.isLoading = false;
          if (this.canShowUserActions) {
            this.loadSongFavoriteState(s.id);
            this.loadSongPurchaseState(s.id);
          } else if (this.song) {
            this.song.isFavorite = false;
            this.song.isPurchased = false;
            this.isInCart = false;
          }

          this.loadArtistExtras(s.artist);
        };

        if (artistId) {
          this.artistService.getArtistById(artistId).subscribe({
            next: (artist) => finish({ ...song, artist }),
            error: () => finish(song)
          });
        } else {
          finish(song);
        }
      },
      error: (err) => {
        console.error('Error loading song:', err);
        this.isLoading = false;
      }
    });
  }

  /**
   * Carga el estado de favorito de la canción.
   *
   * @param songId - ID de la canción
   */
  private loadSongFavoriteState(songId: string): void {
    if (!this.canShowUserActions) {
      if (this.song?.id === songId) {
        this.song.isFavorite = false;
      }
      return;
    }
    this.songService.isSongFavorite(songId).subscribe({
      next: (isFav) => {
        if (this.song?.id === songId) {
          this.song.isFavorite = isFav;
        }
      },
      error: () => {
        if (this.song?.id === songId) {
          this.song.isFavorite = false;
        }
      }
    });
  }

  /**
   * Carga el estado de compra de la canción y verifica si está en el carrito.
   *
   * @param songId - ID de la canción
   */
  private loadSongPurchaseState(songId: string): void {
    if (!this.canShowUserActions) {
      if (this.song?.id === songId) {
        this.song.isPurchased = false;
        this.isInCart = false;
      }
      return;
    }
    this.songService.isSongPurchased(songId).subscribe({
      next: (isPurchased) => {
        if (this.song?.id === songId) {
          this.song.isPurchased = isPurchased;
          this.checkIfInCart();
        }
      },
      error: () => {
        if (this.song?.id === songId) {
          this.song.isPurchased = false;
          this.checkIfInCart();
        }
      }
    });
  }

  /**
   * Verifica si la canción actual está en el carrito de compras.
   */
  private checkIfInCart(): void {
    if (!this.song) {
      return;
    }
    if (!this.canShowUserActions) {
      this.isInCart = false;
      return;
    }
    this.isInCart = this.carritoService.isCancionEnCarrito(+this.song.id);
  }

  /**
   * Carga información adicional del artista (estadísticas de seguidores y estado de seguimiento).
   *
   * @param artist - Datos del artista
   */
  private loadArtistExtras(artist: Song['artist']): void {
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
   * Reproduce la canción usando el servicio de reproductor.
   * Configura una playlist de un solo elemento y registra la reproducción.
   */
  onPlaySong(): void {
    if (this.song) {
      this.playerService.setPlaylist([this.song]);
      this.playerService.playSong(this.song, true);

      if (this.authState.isAuthenticated()) {
        this.songService.registerPlay(this.song.id).subscribe({
          next: (result) => {
            if (this.song) {
              this.song.playCount = result.totalPlays;
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
   * Alterna entre reproducir y pausar la canción.
   */
  onToggleSongPlayback(): void {
    if (!this.song) {
      return;
    }

    if (this.isCurrentSongPlaying) {
      this.playerService.pause();
      return;
    }

    if (this.isCurrentSongSelected) {
      this.playerService.play();
      return;
    }

    this.onPlaySong();
  }

  /**
   * Alterna el estado de favorito de la canción.
   */
  onToggleFavorite(): void {
    if (!this.song || !this.canShowUserActions) {
      return;
    }

    this.songService.toggleFavorite(this.song.id).subscribe({
      next: (updatedSong) => {
        if (this.song) {
          this.song.isFavorite = updatedSong.isFavorite;

          const currentSong = this.playerService.getCurrentSong();
          if (currentSong?.id === this.song.id) {
            this.playerService.updateCurrentSong({
              id: this.song.id,
              isFavorite: updatedSong.isFavorite
            });
          }
        }
      },
      error: (err) => {
        console.error('Error toggling favorite:', err);
      }
    });
  }

  /**
   * Inicia el proceso de compra de la canción.
   * Redirige al checkout o verificación de pago según el precio.
   */
  onPurchase(): void {
    if (!this.song || !this.canShowUserActions) {
      return;
    }

    if (this.song.isPurchased) {
      alert('Ya has comprado esta canción');
      return;
    }

    const songId = +this.song.id;

    if (this.song.price === 0) {
      this.checkoutState.setContext({
        origin: 'DETALLE',
        tipoContenido: 'CANCIÓN',
        idContenido: songId,
        isFree: true,
        metodoPagoId: null,
        metodoGuardado: false
      });
      this.router.navigate(['/verificacion-pago']);
      return;
    }

    this.checkoutState.setContext({
      origin: 'DETALLE',
      tipoContenido: 'CANCIÓN',
      idContenido: songId,
      isFree: false,
      metodoPagoId: null
    });
    this.router.navigate(['/pasarela-pago'], { state: { origin: 'DETALLE' } });
  }

  /**
   * Agrega o elimina la canción del carrito de compras.
   */
  onAddToCart(): void {
    if (!this.song || !this.canShowUserActions) {
      return;
    }
    if (this.song.isPurchased) {
      alert('Ya has comprado esta canción');
      return;
    }

    const songId = +this.song.id;

    if (this.isInCart) {
      const carrito = this.carritoService.getCarritoActual();
      if (!carrito) {
        return;
      }

      const item = carrito.items.find(item =>
        item.tipoProducto === 'CANCIÓN' && item.idCancion === songId
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
          alert('Hubo un error al quitar del carrito. Inténtalo de nuevo.');
        }
      });
      return;
    }

    this.carritoService.agregarItem({
      tipoProducto: 'CANCIÓN',
      idCancion: songId
    }).subscribe({
      next: () => {
        this.isInCart = true;
      },
      error: (err) => {
        console.error('Error al añadir al carrito:', err);
        alert('Hubo un error al añadir al carrito. Inténtalo de nuevo.');
      }
    });
  }

  /**
   * Alterna el estado de seguimiento del artista de la canción.
   */
  onToggleFollow(): void {
    if (!this.song?.artist?.userId || !this.canShowFollow) {
      return;
    }

    if (!this.authState.isAuthenticated()) {
      alert('Inicia sesión para seguir artistas.');
      return;
    }

    this.isUpdatingFollow = true;
    const userId = this.song.artist.userId;
    const followAction$ = this.isFollowingArtist
      ? this.followService.unfollow(userId)
      : this.followService.follow(userId);

    followAction$.subscribe({
      next: () => {
        this.isFollowingArtist = !this.isFollowingArtist;
        this.loadArtistExtras(this.song!.artist);
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
   * Comparte la canción usando la Web Share API o copiando el enlace al portapapeles.
   */
  onShare(): void {
    if (this.song) {
      const shareUrl = window.location.href;
      const shareText = `Escucha "${this.song.title}" de ${this.song.artist.artisticName}`;

      if (navigator.share) {
        navigator.share({
          title: this.song.title,
          text: shareText,
          url: shareUrl
        }).catch((err) => {
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
      alert(`Comparte esta canción:\n${url}`);
    });
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
    if (this.song?.id === songId) {
      this.onToggleFavorite();
    }
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
   * Obtiene el género principal de la canción.
   *
   * @returns Nombre del género o mensaje por defecto
   */
  getPrimaryGenre(): string {
    return this.song?.genre || 'Sin género';
  }

  /**
   * Obtiene la información del álbum asociado a la canción.
   *
   * @returns Información del primer álbum o null si no existe
   */
  getAlbumInfo(): { id: string; title: string; coverUrl: string } | null {
    if (!this.song?.albums || this.song.albums.length === 0) {
      return null;
    }
    return this.song.albums[0];
  }

  /**
   * Maneja la respuesta del backend tras una compra de canción.
   *
   * @param updatedSong - Canción actualizada con el estado de compra
   */
  private handlePurchaseResponse(updatedSong: Song): void {
    if (!this.song) {
      return;
    }

    if (!updatedSong.isPurchased) {
      alert('El backend no confirmó la compra. Finaliza el pago desde el carrito/checkout.');
      return;
    }

    const title = updatedSong.title || this.song.title;
    alert('Compra exitosa: "' + title + '" agregada a tu biblioteca.');
    this.song.isPurchased = true;
  }

  /**
   * Determina si la canción actual está seleccionada en el reproductor.
   */
  private get isCurrentSongSelected(): boolean {
    return !!this.song && this.song.id === this.currentSongId;
  }

  /**
   * Determina si la canción actual está siendo reproducida.
   */
  get isCurrentSongPlaying(): boolean {
    return this.isCurrentSongSelected && this.isPlayerPlaying;
  }

  /**
   * Actualiza el contador de comentarios de la canción.
   *
   * @param total - Nuevo total de comentarios
   */
  onCommentsCountChange(total: number): void {
    if (this.song) {
      this.song.totalComments = total;
    }
  }

  /**
   * Determina si se debe mostrar la opción de seguir al artista.
   * Los artistas no pueden seguir a otros artistas.
   */
  get canShowFollow(): boolean {
    const user = this.authState.getUserInfo();
    return this.authState.isAuthenticated() && user?.tipoUsuario !== TipoUsuario.ARTISTA;
  }
}

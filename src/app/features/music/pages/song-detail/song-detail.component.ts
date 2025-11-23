import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
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

@Component({
  selector: 'app-song-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MusicPlayerComponent, RatingWidgetComponent, CommentsSectionComponent],
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

  private subscriptions = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private songService: SongService,
    private playerService: MusicPlayerService,
    private artistService: ArtistService,
    private authState: AuthStateService,
    private followService: FollowService
  ) {}

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    const songId = this.route.snapshot.paramMap.get('id');
    if (songId) {
      this.loadSong(songId);
    } else {
      this.isLoading = false;
    }

    // Suscribirse a cambios en la cancion actual del reproductor
    this.subscriptions.add(
      this.playerService.currentSong$.subscribe(currentSong => {
        // Mostrar el player si hay una cancion activa
        this.showPlayer = currentSong !== null;
        this.currentSongId = currentSong?.id ?? null;
      })
    );

    this.subscriptions.add(
      this.playerService.isPlaying$.subscribe(isPlaying => {
        this.isPlayerPlaying = isPlaying;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

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
          if (this.authState.isAuthenticated()) {
            this.loadSongFavoriteState(s.id);
            this.loadSongPurchaseState(s.id);
          } else if (this.song) {
            this.song.isFavorite = false;
            this.song.isPurchased = false;
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

  private loadSongFavoriteState(songId: string): void {
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

  private loadSongPurchaseState(songId: string): void {
    this.songService.isSongPurchased(songId).subscribe({
      next: (isPurchased) => {
        if (this.song?.id === songId) {
          this.song.isPurchased = isPurchased;
        }
      },
      error: () => {
        if (this.song?.id === songId) {
          this.song.isPurchased = false;
        }
      }
    });
  }

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
   * Reproduce la cancion usando el servicio de reproductor
   */
  onPlaySong(): void {
    if (this.song) {
      // Establecer la cancion actual como playlist de un solo elemento
      this.playerService.setPlaylist([this.song]);

      // Reproducir la cancion con auto-play
      this.playerService.playSong(this.song, true);

      // Registrar reproduccion solo si hay sesion (el endpoint requiere JWT)
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

  onToggleFavorite(): void {
    if (!this.song) {
      return;
    }

    if (!this.authState.isAuthenticated()) {
      alert('Inicia sesion para gestionar tus favoritos.');
      return;
    }

    this.songService.toggleFavorite(this.song.id).subscribe({
      next: (updatedSong) => {
        if (this.song) {
          this.song.isFavorite = updatedSong.isFavorite;

          // Si esta cancion esta en el reproductor, actualizar el estado
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

  onPurchase(): void {
    if (!this.song) {
      return;
    }

    if (!this.authState.isAuthenticated()) {
      alert('Inicia sesion para comprar canciones.');
      return;
    }

    if (this.song.isPurchased) {
      alert('Ya has comprado esta cancion');
      return;
    }

    if (this.song.price === 0) {
      this.songService.purchaseSong(this.song.id).subscribe({
        next: (updatedSong) => this.handlePurchaseResponse(updatedSong),
        error: (err) => {
          console.error('Error obtaining free song:', err);
        }
      });
      return;
    }

    const confirmPurchase = confirm('Deseas comprar "' + this.song.title + '" por ' + this.song.price.toFixed(2) + '?');

    if (confirmPurchase) {
      this.songService.purchaseSong(this.song.id).subscribe({
        next: (updatedSong) => this.handlePurchaseResponse(updatedSong),
        error: (err) => {
          console.error('Error purchasing song:', err);
          alert('Hubo un error al procesar la compra. Intentalo de nuevo.');
        }
      });
    }
  }

  onToggleFollow(): void {
    if (!this.song?.artist?.userId) {
      return;
    }

    if (!this.authState.isAuthenticated()) {
      alert('Inicia sesion para seguir artistas.');
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
        alert('No se pudo actualizar el seguimiento. Intentalo nuevamente.');
        this.isUpdatingFollow = false;
      },
      complete: () => {
        this.isUpdatingFollow = false;
      }
    });
  }

  onShare(): void {
    if (this.song) {
      const shareUrl = window.location.href;
      const shareText = `Escucha "${this.song.title}" de ${this.song.artist.artisticName}`;

      // Intentar usar Web Share API si esta disponible
      if (navigator.share) {
        navigator.share({
          title: this.song.title,
          text: shareText,
          url: shareUrl
        }).catch((err) => {
          console.log('Error sharing:', err);
          this.fallbackShare(shareUrl, shareText);
        });
      } else {
        this.fallbackShare(shareUrl, shareText);
      }
    }
  }

  private fallbackShare(url: string, text: string): void {
    // Copiar al portapapeles como fallback
    navigator.clipboard.writeText(url).then(() => {
      alert(`Enlace copiado al portapapeles:\n${text}`);
    }).catch(() => {
      alert(`Comparte esta cancion:\n${url}`);
    });
  }

  onClosePlayer(): void {
    // El reproductor se cierra automaticamente cuando se llama a stop()
    // No es necesario hacer nada aqui ya que el subscription lo maneja
  }

  /**
   * Maneja el evento de toggle favorite desde el reproductor
   */
  onPlayerToggleFavorite(songId: string): void {
    if (this.song?.id === songId) {
      this.onToggleFavorite();
    }
  }

  goBack(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.location.back();
  }

  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

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
   * Obtiene el genero principal de la cancion
   */
  getPrimaryGenre(): string {
    return this.song?.genre || 'Sin genero';
  }

  /**
   * Obtiene el album de la cancion (puede ser null)
   */
  getAlbumInfo(): { id: string; title: string; coverUrl: string } | null {
    if (!this.song?.albums || this.song.albums.length === 0) {
      return null;
    }
    // Retornar el primer album
    return this.song.albums[0];
  }

  private handlePurchaseResponse(updatedSong: Song): void {
    if (!this.song) {
      return;
    }

    if (!updatedSong.isPurchased) {
      alert('El backend no confirmo la compra. Finaliza el pago desde el carrito/checkout.');
      return;
    }

    const title = updatedSong.title || this.song.title;
    alert('Compra exitosa: "' + title + '" agregada a tu biblioteca.');
    this.song.isPurchased = true;
  }

  private get isCurrentSongSelected(): boolean {
    return !!this.song && this.song.id === this.currentSongId;
  }

  get isCurrentSongPlaying(): boolean {
    return this.isCurrentSongSelected && this.isPlayerPlaying;
  }

  onCommentsCountChange(total: number): void {
    if (this.song) {
      this.song.totalComments = total;
    }
  }
}
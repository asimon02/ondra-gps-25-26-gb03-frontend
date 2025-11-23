import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AlbumService } from '../../../../core/services/album.service';
import { SongService } from '../../../../core/services/song.service';
import { MusicPlayerService } from '../../../../core/services/music-player.service';
import { Album } from '../../../../core/models/album.model';
import { Song } from '../../../../core/models/song.model';
import { MusicPlayerComponent } from '../../components/music-player/music-player.component';
import { ArtistService } from '../../../../core/services/artist.service';
import { map, catchError, switchMap } from 'rxjs/operators';
import { of, Observable } from 'rxjs';
import { AuthStateService } from '../../../../core/services/auth-state.service';
import { FollowService } from '../../../../core/services/follow.service';
import { RatingWidgetComponent } from '../../ratings/rating-widget/rating-widget.component';
import { CommentsSectionComponent } from '../../comments/components/comments-section/comments-section.component';

@Component({
  selector: 'app-album-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MusicPlayerComponent, RatingWidgetComponent, CommentsSectionComponent],
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
    private followService: FollowService
  ) {}

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    const albumId = this.route.snapshot.paramMap.get('id');
    if (albumId) {
      this.loadAlbum(albumId);
    } else {
      this.isLoading = false;
    }

    // Suscribirse a cambios en la canciAn actual del reproductor
    this.subscriptions.add(
      this.playerService.currentSong$.subscribe(currentSong => {
        // Mostrar el player si hay una canciAn activa
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

  loadAlbum(id: string): void {
    this.isLoading = true;
    this.followersCount = null;
    this.isFollowingArtist = false;
    this.albumService.getAlbumById(id).subscribe({
      next: (album) => {
        const artistId = album.artistId || album.artist.id;
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
   * Marca los favoritos dentro del tracklist
   */
  private mergeTrackFavorites(tracks: Album['trackList']) {
    if (!tracks || tracks.length === 0 || !this.authState.isAuthenticated()) {
      return of(tracks);
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

  private withAlbumArtist(tracks: Album['trackList'], artist: Album['artist']): Album['trackList'] {
    return tracks.map(track => {
      if (track.artist && track.artist.id) {
        return track;
      }
      return { ...track, artist };
    });
  }

  private loadArtistExtras(artist: Album['artist']): void {
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

  private markAlbumStates(album: Album): Observable<Album> {
    if (!this.authState.isAuthenticated()) {
      this.loadArtistExtras(album.artist);
      return of({ ...album, isFavorite: false, isPurchased: false });
    }

    return this.albumService.isAlbumFavorite(album.id).pipe(
      switchMap((isFav) => this.albumService.isAlbumPurchased(album.id).pipe(
        map((isPurchased) => ({ ...album, isFavorite: isFav, isPurchased }))
      )),
      catchError(() => of(album)),
      map((updated) => {
        this.loadArtistExtras(updated.artist);
        return updated;
      })
    );
  }

  onToggleFavorite(): void {
    if (this.album) {
      if (!this.authState.isAuthenticated()) {
        alert('Inicia sesion para gestionar favoritos.');
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
  }

  onToggleSongFavorite(songId: string): void {
    if (!this.authState.isAuthenticated()) {
      alert('Inicia sesion para gestionar favoritos.');
      return;
    }
    this.songService.toggleFavorite(songId).subscribe({
      next: (updatedSong) => {
        if (this.album) {
          const track = this.album.trackList.find(t => t.id === songId);
          if (track) {
            track.isFavorite = updatedSong.isFavorite;
          }

          // Si esta canciAn estA en el reproductor, actualizar el estado
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

  onPurchaseAlbum(): void {
    if (!this.album) {
      return;
    }

    if (!this.authState.isAuthenticated()) {
      alert('Inicia sesion para comprar albumes.');
      return;
    }

    if (this.album.isPurchased) {
      alert('Ya has comprado este album');
      return;
    }

    if (this.album.price === 0) {
      this.albumService.purchaseAlbum(this.album.id).subscribe({
        next: (updatedAlbum) => this.handleAlbumPurchaseResponse(updatedAlbum),
        error: (err) => {
          console.error('Error obtaining free album:', err);
        }
      });
      return;
    }

    const confirmPurchase = confirm('Deseas comprar "' + this.album.title + '" por ' + this.album.price.toFixed(2) + '?');

    if (confirmPurchase) {
      this.albumService.purchaseAlbum(this.album.id).subscribe({
        next: (updatedAlbum) => this.handleAlbumPurchaseResponse(updatedAlbum),
        error: (err) => {
          console.error('Error purchasing album:', err);
          alert('Hubo un error al procesar la compra. Intentalo de nuevo.');
        }
      });
    }
  }

  /**
   * Reproduce una cancion del album usando el servicio de reproductor
   */
  onPlaySong(song: Song): void {
    if (this.album) {
      // Establecer la playlist completa del album
      this.playerService.setPlaylist(this.album.trackList);

      // Reproducir la cancion seleccionada con auto-play
      this.playerService.playSong(song, true);

      // Registrar reproduccion solo si hay sesion (endpoint protegido)
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
   * Reproduce todo el Album desde la primera canciAn
   */
  onPlayAlbum(): void {
    if (this.album && this.album.trackList.length > 0) {
      const firstTrack = this.album.trackList[0];
      this.onPlaySong(firstTrack);
    }
  }

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

  onClosePlayer(): void {
    // El reproductor se cierra automAticamente cuando se llama a stop()
    // No es necesario hacer nada aquA ya que el subscription lo maneja
  }

  /**
   * Maneja el evento de toggle favorite desde el reproductor
   */
  onPlayerToggleFavorite(songId: string): void {
    this.onToggleSongFavorite(songId);
  }

  onToggleFollow(): void {
    if (!this.album?.artist?.userId) {
      return;
    }

    if (!this.authState.isAuthenticated()) {
      alert('Inicia sesion para seguir artistas.');
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
        alert('No se pudo actualizar el seguimiento. Intentalo nuevamente.');
        this.isUpdatingFollow = false;
      },
      complete: () => {
        this.isUpdatingFollow = false;
      }
    });
  }

  onShare(): void {
    if (this.album) {
      const shareText = `Escucha "${this.album.title}" de ${this.album.artist.artisticName}`;
      const shareUrl = window.location.href;

      // Intentar usar Web Share API si estA disponible
      if (navigator.share) {
        navigator.share({
          title: this.album.title,
          text: shareText,
          url: shareUrl
        }).catch(err => {
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
      alert(`Comparte este Album:\n${url}`);
    });
  }

  goBack(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.location.back();
  }

  getTotalDuration(): number {
    return this.album?.totalDuration || 0;
  }

  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  formatReleaseYear(dateString: string): string {
    return new Date(dateString).getFullYear().toString();
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

  private handleAlbumPurchaseResponse(updatedAlbum: Album): void {
    if (!this.album) {
      return;
    }

    if (!updatedAlbum.isPurchased) {
      alert('El backend no confirmo la compra. Finaliza el pago desde el carrito/checkout.');
      return;
    }

    const title = updatedAlbum.title || this.album.title;
    alert('Compra exitosa: "' + title + '" agregada a tu biblioteca.');
    this.album.isPurchased = true;
  }

  get isAlbumCurrentlyPlaying(): boolean {
    if (!this.album || !this.isPlayerPlaying || !this.currentSongId) {
      return false;
    }
    return this.album.trackList.some(track => track.id === this.currentSongId);
  }

  isTrackPlaying(trackId: string): boolean {
    return this.currentSongId === trackId && this.isPlayerPlaying;
  }

  onCommentsCountChange(total: number): void {
    if (this.album) {
      this.album.totalComments = total;
    }
  }
}
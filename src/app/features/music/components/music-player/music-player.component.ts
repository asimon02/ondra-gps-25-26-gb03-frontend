import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, OnDestroy, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { Song } from '../../../../core/models/song.model';
import { MusicPlayerService } from '../../../../core/services/music-player.service';
import { FavoritosService } from '../../../../core/services/favoritos.service';
import { AuthStateService } from '../../../../core/services/auth-state.service';
import { TipoUsuario } from '../../../../core/models/auth.model';

@Component({
  selector: 'app-music-player',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './music-player.component.html',
  styles: [`
    @keyframes slide-up {
      from { opacity: 0; transform: translate(-50%, 20px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }

    @keyframes marquee {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }

    .animate-slide-up { animation: slide-up 0.3s ease-out; }

    .text-container { overflow: hidden; position: relative; width: 100%; }

    .animate-marquee {
      display: inline-block;
      padding-right: 2rem;
      animation: marquee 10s linear infinite;
    }

    .animate-marquee::after {
      content: attr(data-text);
      position: absolute;
      white-space: nowrap;
      padding-left: 2rem;
    }

    .volume-slider-horizontal {
      -webkit-appearance: none;
      appearance: none;
      width: 80px;
      height: 3px;
      background: #e5e7eb;
      border-radius: 5px;
      outline: none;
      cursor: pointer;
    }

    .volume-slider-horizontal::-webkit-slider-thumb,
    .volume-slider-horizontal::-moz-range-thumb {
      width: 10px;
      height: 10px;
      background: #2563eb;
      border-radius: 50%;
      cursor: pointer;
      transition: transform 0.15s ease;
    }

    .volume-slider-horizontal::-webkit-slider-thumb:hover,
    .volume-slider-horizontal::-moz-range-thumb:hover {
      transform: scale(1.2);
    }
  `]
})
export class MusicPlayerComponent implements OnDestroy, AfterViewChecked {
  /** Elementos de DOM para verificar overflow en título y artista */
  @ViewChild('titleElement', { static: false }) titleElement?: ElementRef<HTMLSpanElement>;
  @ViewChild('artistElement', { static: false }) artistElement?: ElementRef<HTMLSpanElement>;

  /** Controla visibilidad del reproductor */
  @Input() isVisible = false;

  /** Eventos para cerrar y toggle favoritos */
  @Output() close = new EventEmitter<void>();
  @Output() toggleFavorite = new EventEmitter<string>();

  /** Estado de la canción y reproductor */
  currentSong: Song | null = null;
  isPlaying = false;
  currentTime = 0;
  duration = 0;
  progress = 0;
  volume = 50;

  /** Detecta overflow en título y artista */
  isTitleOverflowing = false;
  isArtistOverflowing = false;

  /** Subscriptions y temporizadores internos */
  private subscriptions = new Subscription();
  private checkOverflowTimeout?: any;
  private lastSongId?: string;

  constructor(
    public playerService: MusicPlayerService,
    private favoritosService: FavoritosService,
    private authState: AuthStateService
  ) {
    this.subscribeToService();
  }

  /**
   * Suscripciones a cambios del reproductor y favoritos
   */
  private subscribeToService(): void {
    // Cambio de canción
    this.subscriptions.add(
      this.playerService.currentSong$.subscribe(song => {
        const isDifferentSong = this.lastSongId !== song?.id;
        this.currentSong = song;

        if (isDifferentSong && song) {
          this.lastSongId = song.id;
          this.isTitleOverflowing = false;
          this.isArtistOverflowing = false;
          this.titleElement?.nativeElement.removeAttribute('data-text');
          this.artistElement?.nativeElement.removeAttribute('data-text');
          setTimeout(() => this.checkTextOverflow(), 150);
        }
      })
    );

    // Reproducción, tiempo, duración y volumen
    this.subscriptions.add(this.playerService.isPlaying$.subscribe(playing => this.isPlaying = playing));
    this.subscriptions.add(this.playerService.currentTime$.subscribe(time => this.currentTime = time));
    this.subscriptions.add(this.playerService.duration$.subscribe(dur => this.duration = dur));
    this.subscriptions.add(this.playerService.progress$.subscribe(prog => this.progress = prog));
    this.subscriptions.add(this.playerService.volume$.subscribe(vol => this.volume = vol));

    // Cambios en favoritos
    this.subscriptions.add(
      this.favoritosService.onFavoritoChanged.subscribe(event => {
        if (!this.currentSong) return;

        // Canción individual
        if (event.tipo === 'CANCIÓN' && this.currentSong.id === event.idContenido.toString()) {
          const newFavoriteState = event.accion === 'AGREGADO';
          this.currentSong.isFavorite = newFavoriteState;
          this.playerService.updateCurrentSong({ id: this.currentSong.id, isFavorite: newFavoriteState });
        }

        // Álbum y sus canciones
        if (event.tipo === 'ÁLBUM' && event.idsCanciones?.length) {
          const newFavoriteState = event.accion === 'AGREGADO';
          const songIdsAsStrings = event.idsCanciones.map(id => id.toString());
          this.playerService.updatePlaylistSongs(songIdsAsStrings, { isFavorite: newFavoriteState });
          if (event.idsCanciones.includes(Number(this.currentSong.id))) {
            this.currentSong.isFavorite = newFavoriteState;
          }
        }
      })
    );
  }

  /** Verifica overflow del título y artista después de render */
  ngAfterViewChecked(): void {
    if (this.checkOverflowTimeout) clearTimeout(this.checkOverflowTimeout);
    this.checkOverflowTimeout = setTimeout(() => this.checkTextOverflow(), 100);
  }

  private checkTextOverflow(): void {
    this.isTitleOverflowing = false;
    this.isArtistOverflowing = false;

    setTimeout(() => {
      const check = (elementRef?: ElementRef<HTMLSpanElement>, value?: string, setter?: (val: boolean) => void) => {
        if (!elementRef || !setter) return;
        const element = elementRef.nativeElement;
        const parent = element.parentElement;
        if (!parent) return;
        const overflowing = element.scrollWidth > parent.clientWidth;
        setter(overflowing);
        if (overflowing) element.setAttribute('data-text', value || '');
        else element.removeAttribute('data-text');
      };

      check(this.titleElement, this.currentSong?.title, (val) => this.isTitleOverflowing = val);
      check(this.artistElement, this.currentSong?.artist.artisticName, (val) => this.isArtistOverflowing = val);
    }, 50);
  }

  /** Controles de reproducción */
  togglePlay(): void { this.playerService.togglePlay(); }
  playNext(): void { this.playerService.playNext(); }
  playPrevious(): void { this.playerService.playPrevious(); }
  toggleMute(): void { this.playerService.toggleMute(); }
  onVolumeChange(): void { this.playerService.setVolume(this.volume); }
  onProgressClick(event: MouseEvent): void {
    if (!this.duration) return;
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const percentage = ((event.clientX - rect.left) / rect.width) * 100;
    this.playerService.seek(Math.max(0, Math.min(100, percentage)));
  }

  /** Favoritos */
  onToggleFavorite(): void {
    if (this.currentSong && this.canShowFavorite) this.toggleFavorite.emit(this.currentSong.id);
  }

  /** Cierra el reproductor */
  onClose(): void {
    this.playerService.stop();
    this.close.emit();
  }

  /** Formatea segundos a mm:ss */
  formatTime(seconds: number): string {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /** Propiedades de navegación */
  get hasPrevious(): boolean { return this.playerService.hasPrevious; }
  get hasNext(): boolean { return this.playerService.hasNext; }

  /** Solo usuarios no artistas pueden usar favoritos */
  get canShowFavorite(): boolean {
    const user = this.authState.getUserInfo();
    return this.authState.isAuthenticated() && user?.tipoUsuario !== TipoUsuario.ARTISTA;
  }

  /** Limpieza de subscriptions y timers */
  ngOnDestroy(): void {
    if (this.checkOverflowTimeout) clearTimeout(this.checkOverflowTimeout);
    this.subscriptions.unsubscribe();
  }
}

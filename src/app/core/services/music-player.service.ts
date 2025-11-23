import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Song } from '../models/song.model';

@Injectable({
  providedIn: 'root'
})
export class MusicPlayerService {
  private audioElement: HTMLAudioElement;

  // Estado observable
  private currentSongSubject = new BehaviorSubject<Song | null>(null);
  private isPlayingSubject = new BehaviorSubject<boolean>(false);
  private currentTimeSubject = new BehaviorSubject<number>(0);
  private durationSubject = new BehaviorSubject<number>(0);
  private progressSubject = new BehaviorSubject<number>(0);
  private volumeSubject = new BehaviorSubject<number>(50);
  private playlistSubject = new BehaviorSubject<Song[]>([]);

  // Observables públicos
  currentSong$ = this.currentSongSubject.asObservable();
  isPlaying$ = this.isPlayingSubject.asObservable();
  currentTime$ = this.currentTimeSubject.asObservable();
  duration$ = this.durationSubject.asObservable();
  progress$ = this.progressSubject.asObservable();
  volume$ = this.volumeSubject.asObservable();
  playlist$ = this.playlistSubject.asObservable();

  private previousVolume = 50;

  constructor() {
    this.audioElement = new Audio();
    this.audioElement.crossOrigin = 'anonymous';
    this.setupAudioListeners();
    this.audioElement.volume = 0.5;
  }

  private setupAudioListeners(): void {
    this.audioElement.addEventListener('loadedmetadata', () => {
      this.durationSubject.next(this.audioElement.duration || 0);
    });

    this.audioElement.addEventListener('timeupdate', () => {
      const currentTime = this.audioElement.currentTime;
      const duration = this.durationSubject.value;

      this.currentTimeSubject.next(currentTime);
      this.progressSubject.next(duration > 0 ? (currentTime / duration) * 100 : 0);
    });

    this.audioElement.addEventListener('ended', () => {
      this.isPlayingSubject.next(false);
      this.currentTimeSubject.next(0);
      this.progressSubject.next(0);
      this.playNext();
    });

    this.audioElement.addEventListener('error', (e) => {
      console.error('Error al cargar el audio:', e);
      this.isPlayingSubject.next(false);
    });
  }

  playSong(song: Song, autoPlay = true): void {
    const currentSong = this.currentSongSubject.value;

    if (currentSong?.id === song.id) {
      if (autoPlay && !this.isPlayingSubject.value) {
        this.play();
      }
      return;
    }

    this.currentSongSubject.next(song);
    this.loadSong(song, autoPlay);
  }

  setPlaylist(songs: Song[]): void {
    this.playlistSubject.next(songs);
  }

  private loadSong(song: Song, autoPlay: boolean): void {
    this.audioElement.pause();
    this.audioElement.currentTime = 0;
    this.isPlayingSubject.next(false);
    this.currentTimeSubject.next(0);
    this.progressSubject.next(0);
    this.durationSubject.next(0);

    this.audioElement.src = song.audioUrl;
    this.audioElement.load();

    if (autoPlay) {
      const onMetadataLoaded = () => {
        this.play();
        this.audioElement.removeEventListener('loadedmetadata', onMetadataLoaded);
      };
      this.audioElement.addEventListener('loadedmetadata', onMetadataLoaded);
    }
  }

  /**
   * Actualiza los datos de la canci��n actual sin reiniciar el audio.
   * Útil para reflejar cambios como favoritos o compras hechos desde otros componentes.
   */
  updateCurrentSong(update: Partial<Song> & { id: string }): void {
    const current = this.currentSongSubject.value;
    if (!current || current.id !== update.id) {
      return;
    }

    const mergedSong = { ...current, ...update };
    this.currentSongSubject.next(mergedSong);

    // Mantener la playlist en sync para reflejar el cambio en el resto de la UI
    const playlist = this.playlistSubject.value;
    if (playlist.length > 0) {
      const updatedPlaylist = playlist.map(song =>
        song.id === mergedSong.id ? { ...song, ...update } : song
      );
      this.playlistSubject.next(updatedPlaylist);
    }
  }

  play(): void {
    this.audioElement.play()
      .then(() => this.isPlayingSubject.next(true))
      .catch(error => {
        console.error('Error al reproducir:', error);
        this.isPlayingSubject.next(false);
      });
  }

  pause(): void {
    this.audioElement.pause();
    this.isPlayingSubject.next(false);
  }

  togglePlay(): void {
    if (this.isPlayingSubject.value) {
      this.pause();
    } else {
      this.play();
    }
  }

  playNext(): void {
    const currentSong = this.currentSongSubject.value;
    const playlist = this.playlistSubject.value;

    if (!currentSong || playlist.length === 0) return;

    const currentIndex = playlist.findIndex(song => song.id === currentSong.id);
    if (currentIndex === -1) return;

    const nextIndex = (currentIndex + 1) % playlist.length;
    const nextSong = playlist[nextIndex];

    if (nextSong) {
      this.playSong(nextSong, true);
    }
  }

  playPrevious(): void {
    const currentSong = this.currentSongSubject.value;
    const playlist = this.playlistSubject.value;

    if (!currentSong || playlist.length === 0) return;

    const currentIndex = playlist.findIndex(song => song.id === currentSong.id);
    if (currentIndex === -1) return;

    const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
    const prevSong = playlist[prevIndex];

    if (prevSong) {
      this.playSong(prevSong, true);
    }
  }

  setVolume(volume: number): void {
    this.volumeSubject.next(volume);
    this.audioElement.volume = volume / 100;
  }

  toggleMute(): void {
    const currentVolume = this.volumeSubject.value;

    if (currentVolume > 0) {
      this.previousVolume = currentVolume;
      this.setVolume(0);
    } else {
      this.setVolume(this.previousVolume || 50);
    }
  }

  seek(percentage: number): void {
    const duration = this.durationSubject.value;
    if (duration === 0) return;

    const newTime = (percentage / 100) * duration;
    this.audioElement.currentTime = newTime;
    this.currentTimeSubject.next(newTime);
  }

  stop(): void {
    this.audioElement.pause();
    this.audioElement.currentTime = 0;
    this.isPlayingSubject.next(false);
    this.currentTimeSubject.next(0);
    this.progressSubject.next(0);
    this.currentSongSubject.next(null);
  }

  get hasPrevious(): boolean {
    return this.playlistSubject.value.length > 1;
  }

  get hasNext(): boolean {
    return this.playlistSubject.value.length > 1;
  }

  // Getter para acceder al valor actual de la canción
  getCurrentSong(): Song | null {
    return this.currentSongSubject.value;
  }

  // Getter para acceder a la playlist actual
  getCurrentPlaylist(): Song[] {
    return this.playlistSubject.value;
  }
}

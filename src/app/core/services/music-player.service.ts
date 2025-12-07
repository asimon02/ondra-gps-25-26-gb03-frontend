import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Song } from '../models/song.model';

/**
 * Servicio para controlar la reproducción de música.
 *
 * Maneja:
 * - Canción actual
 * - Playlist
 * - Reproducción, pausa, siguiente/anterior
 * - Volumen, mute y seek
 * - Observables reactivos para UI
 */
@Injectable({
  providedIn: 'root'
})
export class MusicPlayerService {
  private audioElement: HTMLAudioElement;

  /** Estado observable de la canción actual */
  private currentSongSubject = new BehaviorSubject<Song | null>(null);

  /** Estado observable de si está reproduciendo */
  private isPlayingSubject = new BehaviorSubject<boolean>(false);

  /** Tiempo actual en segundos */
  private currentTimeSubject = new BehaviorSubject<number>(0);

  /** Duración total en segundos */
  private durationSubject = new BehaviorSubject<number>(0);

  /** Progreso de reproducción en porcentaje */
  private progressSubject = new BehaviorSubject<number>(0);

  /** Volumen actual (0-100) */
  private volumeSubject = new BehaviorSubject<number>(50);

  /** Playlist actual */
  private playlistSubject = new BehaviorSubject<Song[]>([]);

  /** Observables públicos para componentes */
  currentSong$ = this.currentSongSubject.asObservable();
  isPlaying$ = this.isPlayingSubject.asObservable();
  currentTime$ = this.currentTimeSubject.asObservable();
  duration$ = this.durationSubject.asObservable();
  progress$ = this.progressSubject.asObservable();
  volume$ = this.volumeSubject.asObservable();
  playlist$ = this.playlistSubject.asObservable();

  /** Volumen previo usado para toggleMute */
  private previousVolume = 50;

  constructor() {
    this.audioElement = new Audio();
    this.audioElement.crossOrigin = 'anonymous';
    this.setupAudioListeners();
    this.audioElement.volume = 0.5;
  }

  /** Configura listeners del elemento de audio */
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

  /**
   * Reproduce una canción específica.
   * Si la canción ya está cargada, solo la reproduce si `autoPlay` es true.
   *
   * @param song Canción a reproducir
   * @param autoPlay Si debe iniciar reproducción automáticamente
   */
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

  /**
   * Establece la playlist completa
   * @param songs Array de canciones
   */
  setPlaylist(songs: Song[]): void {
    this.playlistSubject.next(songs);
  }

  /** Carga internamente la canción en el elemento de audio */
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
   * Actualiza los datos de la canción actual sin reiniciar el audio.
   * Útil para cambios de favoritos o compras desde otros componentes.
   */
  updateCurrentSong(update: Partial<Song> & { id: string }): void {
    const current = this.currentSongSubject.value;
    if (!current || current.id !== update.id) return;

    const mergedSong = { ...current, ...update };
    this.currentSongSubject.next(mergedSong);

    const playlist = this.playlistSubject.value;
    if (playlist.length > 0) {
      const updatedPlaylist = playlist.map(song =>
        song.id === mergedSong.id ? { ...song, ...update } : song
      );
      this.playlistSubject.next(updatedPlaylist);
    }
  }

  /** Reproduce la canción actual */
  play(): void {
    this.audioElement.play()
      .then(() => this.isPlayingSubject.next(true))
      .catch(error => {
        console.error('Error al reproducir:', error);
        this.isPlayingSubject.next(false);
      });
  }

  /** Pausa la canción actual */
  pause(): void {
    this.audioElement.pause();
    this.isPlayingSubject.next(false);
  }

  /** Alterna entre reproducción y pausa */
  togglePlay(): void {
    if (this.isPlayingSubject.value) {
      this.pause();
    } else {
      this.play();
    }
  }

  /** Reproduce la siguiente canción de la playlist */
  playNext(): void {
    const currentSong = this.currentSongSubject.value;
    const playlist = this.playlistSubject.value;

    if (!currentSong || playlist.length === 0) return;

    const currentIndex = playlist.findIndex(song => song.id === currentSong.id);
    if (currentIndex === -1) return;

    const nextIndex = (currentIndex + 1) % playlist.length;
    const nextSong = playlist[nextIndex];
    if (nextSong) this.playSong(nextSong, true);
  }

  /** Reproduce la canción anterior de la playlist */
  playPrevious(): void {
    const currentSong = this.currentSongSubject.value;
    const playlist = this.playlistSubject.value;

    if (!currentSong || playlist.length === 0) return;

    const currentIndex = playlist.findIndex(song => song.id === currentSong.id);
    if (currentIndex === -1) return;

    const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
    const prevSong = playlist[prevIndex];
    if (prevSong) this.playSong(prevSong, true);
  }

  /**
   * Establece el volumen de reproducción
   * @param volume Valor entre 0 y 100
   */
  setVolume(volume: number): void {
    this.volumeSubject.next(volume);
    this.audioElement.volume = volume / 100;
  }

  /** Alterna el estado de mute */
  toggleMute(): void {
    const currentVolume = this.volumeSubject.value;

    if (currentVolume > 0) {
      this.previousVolume = currentVolume;
      this.setVolume(0);
    } else {
      this.setVolume(this.previousVolume || 50);
    }
  }

  /**
   * Mueve la reproducción a un porcentaje de la duración
   * @param percentage Porcentaje (0-100)
   */
  seek(percentage: number): void {
    const duration = this.durationSubject.value;
    if (duration === 0) return;

    const newTime = (percentage / 100) * duration;
    this.audioElement.currentTime = newTime;
    this.currentTimeSubject.next(newTime);
  }

  /** Detiene la reproducción y resetea el estado */
  stop(): void {
    this.audioElement.pause();
    this.audioElement.currentTime = 0;
    this.isPlayingSubject.next(false);
    this.currentTimeSubject.next(0);
    this.progressSubject.next(0);
    this.currentSongSubject.next(null);
  }

  /** Retorna true si hay canciones anteriores disponibles */
  get hasPrevious(): boolean {
    return this.playlistSubject.value.length > 1;
  }

  /** Retorna true si hay canciones siguientes disponibles */
  get hasNext(): boolean {
    return this.playlistSubject.value.length > 1;
  }

  /** Devuelve la canción actual */
  getCurrentSong(): Song | null {
    return this.currentSongSubject.value;
  }

  /** Devuelve la playlist actual */
  getCurrentPlaylist(): Song[] {
    return this.playlistSubject.value;
  }

  /**
   * Actualiza múltiples canciones de la playlist por sus IDs
   * @param songIds IDs de las canciones a actualizar
   * @param update Datos a actualizar
   */
  updatePlaylistSongs(songIds: string[], update: Partial<Song>): void {
    const playlist = this.playlistSubject.value;
    if (playlist.length === 0) return;

    const songIdSet = new Set(songIds);
    const updatedPlaylist = playlist.map(song =>
      songIdSet.has(song.id) ? { ...song, ...update } : song
    );

    this.playlistSubject.next(updatedPlaylist);

    const current = this.currentSongSubject.value;
    if (current && songIdSet.has(current.id)) {
      this.currentSongSubject.next({ ...current, ...update });
    }
  }
}

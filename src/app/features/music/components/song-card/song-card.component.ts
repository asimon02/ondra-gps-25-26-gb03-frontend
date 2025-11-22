import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Song } from '../../../../core/models/song.model';

@Component({
  selector: 'app-song-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './song-card.component.html',
  styles: []
})
export class SongCardComponent {
  @Input() song!: Song;
  @Input() isCurrentSong = false;
  @Input() isPlaying = false;
  @Output() toggleFavorite = new EventEmitter<string>();
  @Output() playSong = new EventEmitter<Song>();
  @Output() pauseSong = new EventEmitter<void>();

  constructor(private router: Router) {}

  /**
   * Maneja el click en cualquier parte de la card
   * Navega al detalle a menos que se haya clickeado el botón de play o favoritos
   */
  onCardClick(event: Event): void {
    // No navegar si el click viene de los botones específicos
    // (ya tienen sus propios manejadores con stopPropagation)
    this.onNavigateToDetail();
  }

  onToggleFavorite(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.toggleFavorite.emit(this.song.id);
  }

  onPlaySong(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.playSong.emit(this.song);
  }

  onPauseSong(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.pauseSong.emit();
  }

  onNavigateToDetail(): void {
    this.router.navigate(['/song', this.song.id], {
      queryParams: { type: 'songs' }
    });
  }

  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  formatPlayCount(count: number): string {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  }

  /**
   * Obtiene los géneros para mostrar
   * Retorna un array con máximo 2 géneros
   */
  getDisplayGenres(): string[] {
    // El modelo ahora tiene un solo genre (string), pero por compatibilidad
    // con el template que espera genres (array), lo convertimos
    return this.song.genre ? [this.song.genre] : [];
  }

  /**
   * Obtiene el número de géneros adicionales
   */
  getAdditionalGenresCount(): number {
    // Como ahora es un único género, esto siempre retorna 0
    return 0;
  }

  /**
   * Obtiene el primer álbum de la canción (si existe)
   */
  getAlbum(): { id: string; title: string; coverUrl: string } | null {
    return this.song.albums && this.song.albums.length > 0 ? this.song.albums[0] : null;
  }
}

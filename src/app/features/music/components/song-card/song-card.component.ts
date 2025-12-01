import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Song } from '../../../../core/models/song.model';

/**
 * Componente de tarjeta de canción
 * Controla navegación, reproducción, favoritos y carrito
 */
@Component({
  selector: 'app-song-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './song-card.component.html',
  styles: []
})
export class SongCardComponent {
  /** Datos de la canción a mostrar */
  @Input() song!: Song;

  /** Flags de estado de reproducción */
  @Input() isCurrentSong = false;
  @Input() isPlaying = false;
  @Input() canFavorite = true;

  /** Eventos para interacción externa */
  @Output() toggleFavorite = new EventEmitter<string>();
  @Output() playSong = new EventEmitter<Song>();
  @Output() pauseSong = new EventEmitter<void>();
  @Output() addToCart = new EventEmitter<Song>();

  constructor(private router: Router) {}

  /**
   * Maneja click sobre toda la card
   * Navega al detalle a menos que se haga click en botones internos
   */
  onCardClick(event: Event): void {
    this.onNavigateToDetail();
  }

  /**
   * Alterna el estado de favorito de la canción
   */
  onToggleFavorite(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.canFavorite) return;
    this.toggleFavorite.emit(this.song.id);
  }

  /** Emite evento de reproducción de la canción */
  onPlaySong(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.playSong.emit(this.song);
  }

  /** Emite evento de pausa de la canción */
  onPauseSong(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.pauseSong.emit();
  }

  /** Añade la canción al carrito */
  onAddToCart(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.addToCart.emit(this.song);
  }

  /** Navega a la página de detalle de la canción */
  onNavigateToDetail(): void {
    this.router.navigate(['/cancion', this.song.id], {
      queryParams: { type: 'songs' }
    });
  }

  /** Formatea la duración en mm:ss */
  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  /** Formatea la cantidad de reproducciones */
  formatPlayCount(count: number): string {
    if (count >= 1_000_000) return (count / 1_000_000).toFixed(1) + 'M';
    if (count >= 1_000) return (count / 1_000).toFixed(1) + 'K';
    return count.toString();
  }

  /** Obtiene los géneros de la canción (máximo 2 para mostrar) */
  getDisplayGenres(): string[] {
    return this.song.genre ? [this.song.genre] : [];
  }

  /** Número de géneros adicionales no mostrados */
  getAdditionalGenresCount(): number {
    return 0; // Actualmente solo hay un género por canción
  }

  /** Obtiene el primer álbum asociado a la canción */
  getAlbum(): { id: string; title: string; coverUrl: string } | null {
    return this.song.albums && this.song.albums.length > 0 ? this.song.albums[0] : null;
  }
}

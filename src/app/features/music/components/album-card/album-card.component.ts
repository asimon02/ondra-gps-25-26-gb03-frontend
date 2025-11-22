import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Album } from '../../../../core/models/album.model';

@Component({
  selector: 'app-album-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './album-card.component.html',
  styles: []
})
export class AlbumCardComponent {
  @Input() album!: Album;
  @Input() isCurrentAlbum = false;
  @Input() isPlaying = false;
  @Output() toggleFavorite = new EventEmitter<string>();
  @Output() playAlbum = new EventEmitter<Album>();

  constructor(private router: Router) {}

  /**
   * Maneja el click en cualquier parte de la card
   * Navega al detalle a menos que se haya clickeado el botón de play o favoritos
   */
  onCardClick(event: Event): void {
    this.onNavigateToDetail();
  }

  onToggleFavorite(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.toggleFavorite.emit(this.album.id);
  }

  onPlayAlbum(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.playAlbum.emit(this.album);
  }

  onNavigateToDetail(): void {
    this.router.navigate(['/album', this.album.id], {
      queryParams: { type: 'albums' }
    });
  }

  /**
   * Obtiene la duración total del álbum desde el modelo
   * El modelo Album ya tiene totalDuration calculado por el backend
   */
  getTotalDuration(): number {
    return this.album.totalDuration;
  }

  /**
   * Obtiene el número total de canciones
   * El modelo Album ya tiene totalTracks calculado por el backend
   */
  getTotalTracks(): number {
    return this.album.totalTracks;
  }

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} min`;
  }

  formatReleaseYear(dateString: string): string {
    return new Date(dateString).getFullYear().toString();
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
}

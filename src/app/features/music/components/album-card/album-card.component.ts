import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Album } from '../../../../core/models/album.model';

/**
 * Componente de tarjeta de álbum
 * Muestra información de un álbum y permite acciones como reproducir,
 * agregar a favoritos o agregar al carrito.
 */
@Component({
  selector: 'app-album-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './album-card.component.html',
  styles: []
})
export class AlbumCardComponent {
  /** Álbum a mostrar */
  @Input() album!: Album;

  /** Indica si este álbum es el actualmente seleccionado */
  @Input() isCurrentAlbum = false;

  /** Indica si el álbum se está reproduciendo actualmente */
  @Input() isPlaying = false;

  /** Indica si se puede marcar el álbum como favorito */
  @Input() canFavorite = true;

  /** Emite el ID del álbum cuando se cambia su estado de favorito */
  @Output() toggleFavorite = new EventEmitter<string>();

  /** Emite el álbum a reproducir cuando se hace click en reproducir */
  @Output() playAlbum = new EventEmitter<Album>();

  /** Emite el álbum a agregar al carrito */
  @Output() addToCart = new EventEmitter<Album>();

  constructor(private router: Router) {}

  /**
   * Maneja el click en la tarjeta completa.
   * Navega al detalle del álbum.
   */
  onCardClick(event: Event): void {
    this.onNavigateToDetail();
  }

  /**
   * Maneja el click en el botón de favoritos.
   * Detiene la propagación del evento para no activar la navegación.
   */
  onToggleFavorite(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.canFavorite) return;
    this.toggleFavorite.emit(this.album.id);
  }

  /**
   * Maneja el click en el botón de reproducir.
   * Detiene la propagación y emite el evento de reproducción.
   */
  onPlayAlbum(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.playAlbum.emit(this.album);
  }

  /**
   * Maneja el click en el botón de agregar al carrito.
   */
  onAddToCart(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.addToCart.emit(this.album);
  }

  /**
   * Navega a la página de detalle del álbum
   */
  onNavigateToDetail(): void {
    this.router.navigate(['/album', this.album.id], {
      queryParams: { type: 'albums' }
    });
  }

  /**
   * Devuelve la duración total del álbum en segundos.
   */
  getTotalDuration(): number {
    return this.album.totalDuration;
  }

  /**
   * Devuelve el número total de canciones en el álbum.
   */
  getTotalTracks(): number {
    return this.album.totalTracks;
  }

  /**
   * Formatea una duración en segundos a un string legible (h y m o min)
   */
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes} min`;
  }

  /**
   * Extrae el año de publicación desde una fecha ISO
   */
  formatReleaseYear(dateString: string): string {
    return new Date(dateString).getFullYear().toString();
  }

  /**
   * Formatea la cantidad de reproducciones de manera compacta (K/M)
   */
  formatPlayCount(count: number): string {
    if (count >= 1_000_000) return (count / 1_000_000).toFixed(1) + 'M';
    if (count >= 1_000) return (count / 1_000).toFixed(1) + 'K';
    return count.toString();
  }
}

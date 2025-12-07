import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

/**
 * Interfaz que define la estructura de un artista
 */
export interface Artist {
  id: string;
  artisticName: string;
  profileImage: string | null;
  bio: string | null;
  slug: string | null;
  isTrending: boolean;
  startDate?: string;
}

/**
 * Componente de tarjeta de artista
 * Muestra información básica del artista y permite navegar a su perfil público.
 */
@Component({
  selector: 'app-artist-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './artist-card.component.html',
  styles: []
})
export class ArtistCardComponent {
  /** Artista a mostrar en la tarjeta */
  @Input() artist!: Artist;

  constructor(private router: Router) {}

  /**
   * Maneja el click en la tarjeta completa
   * Navega al perfil público del artista.
   */
  onCardClick(event: Event): void {
    this.onNavigateToProfile();
  }

  /**
   * Navega al perfil del artista usando su slug
   */
  onNavigateToProfile(): void {
    if (this.artist.slug) {
      this.router.navigate(['/artista', this.artist.slug]);
    }
  }

  /**
   * Formatea la fecha de inicio del artista (startDate) para mostrar solo el año
   * @param dateString Fecha en formato ISO
   * @returns Año como string o 'N/A' si no existe
   */
  formatStartYear(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).getFullYear().toString();
  }

  /**
   * Obtiene las iniciales del artista para mostrar en un placeholder
   * Si el nombre artístico tiene dos palabras, toma la primera letra de cada una
   * Si solo tiene una palabra, toma las dos primeras letras
   * @returns Iniciales en mayúsculas
   */
  getInitials(): string {
    if (!this.artist.artisticName) return '?';
    const words = this.artist.artisticName.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return this.artist.artisticName.substring(0, 2).toUpperCase();
  }
}

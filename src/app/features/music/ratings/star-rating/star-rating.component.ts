import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Componente de estrellas para mostrar y capturar valoraciones
 * Permite valoraciones dinámicas y mostrar un rating promedio
 */
@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './star-rating.component.html'
})
export class StarRatingComponent {
  /** Valor de la valoración actual */
  @Input() rating = 0;

  /** Número máximo de estrellas a mostrar */
  @Input() max = 5;

  /** Modo solo lectura: impide cambios en el rating */
  @Input() readonly = false;

  /** Evento emitido cuando el usuario selecciona un rating */
  @Output() rated = new EventEmitter<number>();

  /** Valor de la estrella sobre la que se encuentra el mouse */
  hovered = 0;

  /**
   * Array de índices de estrellas
   * Se usa para iterar en la plantilla y renderizar cada estrella
   */
  get stars(): number[] {
    return Array.from({ length: this.max }, (_, index) => index + 1);
  }

  /**
   * Se llama cuando el usuario selecciona un rating
   * Actualiza el valor y emite el evento
   */
  onRate(value: number): void {
    if (this.readonly) return;
    this.rating = value;
    this.rated.emit(value);
  }

  /**
   * Se llama cuando el usuario pasa el mouse sobre una estrella
   * Solo afecta la visualización temporal mientras se mantiene el hover
   */
  onHover(value: number): void {
    if (this.readonly) return;
    this.hovered = value;
  }

  /** Se llama cuando el mouse deja las estrellas */
  onLeave(): void {
    this.hovered = 0;
  }

  /**
   * Determina si una estrella debe aparecer llena
   * Toma en cuenta el hover si está activo
   */
  isFilled(star: number): boolean {
    if (this.hovered > 0) {
      return star <= this.hovered;
    }
    return star <= this.rating;
  }
}

import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RatingsService, RatingContentType } from '../../../../core/services/ratings.service';
import { AuthStateService } from '../../../../core/services/auth-state.service';
import { ValoracionDTO } from '../../../../core/models/ratings.model';
import { StarRatingComponent } from '../star-rating/star-rating.component';
import { finalize } from 'rxjs/operators';

/**
 * Componente de valoración para canciones o álbumes
 * Permite ver la media, valorar y eliminar valoraciones propias
 */
@Component({
  selector: 'rating-widget',
  standalone: true,
  imports: [CommonModule, StarRatingComponent],
  templateUrl: './rating-widget.component.html',
  host: {
    class: 'block my-6'
  }
})
export class RatingWidgetComponent implements OnInit, OnChanges {
  /** ID del contenido a valorar */
  @Input({ required: true }) contentId!: number;

  /** Tipo de contenido: 'song' o 'album' */
  @Input({ required: true }) type!: RatingContentType;

  /** Valoración promedio del contenido */
  average: number | null = null;

  /** Indica si hay valoraciones */
  hasRatings = false;

  /** Valoración del usuario actual (si existe) */
  userRating: ValoracionDTO | null = null;

  /** Flags de estado para evitar acciones simultáneas */
  isSaving = false;
  isRemoving = false;

  /** Mensaje de error para la UI */
  errorMessage = '';

  constructor(
    private ratingsService: RatingsService,
    private authState: AuthStateService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['contentId'] || changes['type']) {
      this.loadData();
    }
  }

  /** Retorna si el usuario está autenticado */
  get isAuthenticated(): boolean {
    return !!this.authState.isAuthenticated();
  }

  /** Redondea la valoración promedio para mostrar en estrellas */
  get averageRounded(): number {
    return this.average ? Math.round(this.average) : 0;
  }

  /**
   * Handler para cuando el usuario puntúa el contenido
   * Crea o actualiza la valoración según corresponda
   */
  onRated(value: number): void {
    if (!this.isAuthenticated) {
      this.errorMessage = 'Inicia sesión para valorar.';
      return;
    }
    if (!this.contentId || !this.type || this.isSaving) return;

    this.errorMessage = '';
    this.isSaving = true;

    const request$ = this.userRating
      ? this.ratingsService.updateRating(this.userRating.idValoracion, { valor: value })
      : this.ratingsService.createRating({
        tipoContenido: this.type === 'song' ? 'CANCIÓN' : 'ÁLBUM',
        idCancion: this.type === 'song' ? this.getNumericContentId() : null,
        idAlbum: this.type === 'album' ? this.getNumericContentId() : null,
        valor: value
      });

    request$
      .pipe(finalize(() => { this.isSaving = false; }))
      .subscribe({
        next: (rating) => {
          this.userRating = rating;
          this.loadAverage();
        },
        error: () => {
          this.errorMessage = 'No se pudo guardar tu valoración. Inténtalo de nuevo.';
        }
      });
  }

  /**
   * Elimina la valoración actual del usuario
   */
  onDeleteRating(): void {
    if (!this.userRating || this.isRemoving) return;

    this.errorMessage = '';
    this.isRemoving = true;

    this.ratingsService.deleteRating(this.userRating.idValoracion)
      .pipe(finalize(() => { this.isRemoving = false; }))
      .subscribe({
        next: () => {
          this.userRating = null;
          this.loadAverage();
        },
        error: () => {
          this.errorMessage = 'No se pudo eliminar la valoración.';
        }
      });
  }

  /**
   * Carga datos iniciales: media y valoración del usuario
   */
  private loadData(): void {
    if (!this.contentId || !this.type) return;
    this.loadAverage();
    this.loadUserRating();
  }

  /** Obtiene la valoración promedio del contenido */
  private loadAverage(): void {
    this.ratingsService.getAverageRating(this.getNumericContentId(), this.type).subscribe({
      next: (response) => {
        this.average = response.valoracionPromedio;
        this.hasRatings = response.tieneValoraciones;
      },
      error: () => {
        this.average = null;
        this.hasRatings = false;
      }
    });
  }

  /** Obtiene la valoración del usuario actual, si existe */
  private loadUserRating(): void {
    if (!this.isAuthenticated) {
      this.userRating = null;
      return;
    }

    this.ratingsService.getUserRating(this.getNumericContentId(), this.type).subscribe({
      next: (rating) => this.userRating = rating,
      error: () => this.userRating = null
    });
  }

  /** Convierte contentId a número */
  private getNumericContentId(): number {
    return Number(this.contentId);
  }
}

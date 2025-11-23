import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RatingsService, RatingContentType } from '../../../../core/services/ratings.service';
import { AuthStateService } from '../../../../core/services/auth-state.service';
import { ValoracionDTO } from '../../../../core/models/ratings.model';
import { StarRatingComponent } from '../star-rating/star-rating.component';
import { finalize } from 'rxjs/operators';

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
  @Input({ required: true }) contentId!: number;
  @Input({ required: true }) type!: RatingContentType;

  average: number | null = null;
  hasRatings = false;
  userRating: ValoracionDTO | null = null;
  isSaving = false;
  isRemoving = false;
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

  get isAuthenticated(): boolean {
    return !!this.authState.isAuthenticated();
  }

  get averageRounded(): number {
    return this.average ? Math.round(this.average) : 0;
  }

  onRated(value: number): void {
    if (!this.isAuthenticated) {
      this.errorMessage = 'Inicia sesion para valorar.';
      return;
    }

    if (!this.contentId || !this.type || this.isSaving) {
      return;
    }

    this.errorMessage = '';
    this.isSaving = true;
    const request$ = this.userRating
      ? this.ratingsService.updateRating(this.userRating.idValoracion, { valor: value })
      : this.ratingsService.createRating({
          tipoContenido: this.type === 'song' ? 'CANCION' : 'ALBUM',
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
          this.errorMessage = 'No se pudo guardar tu valoracion. Intentalo de nuevo.';
        }
      });
  }

  onDeleteRating(): void {
    if (!this.userRating || this.isRemoving) {
      return;
    }

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
          this.errorMessage = 'No se pudo eliminar la valoracion.';
        }
      });
  }

  private loadData(): void {
    if (!this.contentId || !this.type) {
      return;
    }
    this.loadAverage();
    this.loadUserRating();
  }

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

  private loadUserRating(): void {
    if (!this.isAuthenticated) {
      this.userRating = null;
      return;
    }

    this.ratingsService.getUserRating(this.getNumericContentId(), this.type).subscribe({
      next: (rating) => {
        this.userRating = rating;
      },
      error: () => {
        this.userRating = null;
      }
    });
  }

  private getNumericContentId(): number {
    return Number(this.contentId);
  }
}

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './star-rating.component.html'
})
export class StarRatingComponent {
  @Input() rating = 0;
  @Input() max = 5;
  @Input() readonly = false;
  @Output() rated = new EventEmitter<number>();

  hovered = 0;

  get stars(): number[] {
    return Array.from({ length: this.max }, (_, index) => index + 1);
  }

  onRate(value: number): void {
    if (this.readonly) {
      return;
    }
    this.rating = value;
    this.rated.emit(value);
  }

  onHover(value: number): void {
    if (this.readonly) {
      return;
    }
    this.hovered = value;
  }

  onLeave(): void {
    this.hovered = 0;
  }

  isFilled(star: number): boolean {
    if (this.hovered > 0) {
      return star <= this.hovered;
    }
    return star <= this.rating;
  }
}

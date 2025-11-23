// src/app/features/user-profile/components/content-carousel/content-carousel.component.ts

import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, signal, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CarouselItem {
  id: number;
  nombre: string;
  artista?: string;
  tipo?: string;
  precio?: number;
  imagen?: string;
}

@Component({
  selector: 'app-content-carousel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './content-carousel.component.html',
  styleUrls: ['./content-carousel.component.scss']
})
export class ContentCarouselComponent implements AfterViewInit {
  @Input() items: CarouselItem[] = [];
  @Input() title: string = '';
  @Input() showAddButton: boolean = false;
  @Input() icon: 'album' | 'song' | 'purchase' | 'favorite' | '' = ''; // ✅ Input para el icono
  @Input() emptyMessage: string = 'No hay elementos';
  @Output() addClick = new EventEmitter<void>();
  @Output() itemClick = new EventEmitter<CarouselItem>();
  @Output() playClick = new EventEmitter<CarouselItem>();

  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;

  canScrollLeft = signal(false);
  canScrollRight = signal(true);

  ngAfterViewInit(): void {
    setTimeout(() => this.updateScrollButtons(), 100);
  }

  scrollLeft(): void {
    const container = this.scrollContainer.nativeElement;
    const scrollAmount = container.offsetWidth * 0.8;

    container.scrollBy({
      left: -scrollAmount,
      behavior: 'smooth'
    });

    setTimeout(() => this.updateScrollButtons(), 300);
  }

  scrollRight(): void {
    const container = this.scrollContainer.nativeElement;
    const scrollAmount = container.offsetWidth * 0.8;

    container.scrollBy({
      left: scrollAmount,
      behavior: 'smooth'
    });

    setTimeout(() => this.updateScrollButtons(), 300);
  }

  onScroll(): void {
    this.updateScrollButtons();
  }

  private updateScrollButtons(): void {
    const container = this.scrollContainer?.nativeElement;
    if (!container) return;

    this.canScrollLeft.set(container.scrollLeft > 10);

    const maxScroll = container.scrollWidth - container.clientWidth;
    this.canScrollRight.set(container.scrollLeft < maxScroll - 10);
  }

  onAddClick(): void {
    this.addClick.emit();
  }

  onItemClick(item: CarouselItem): void {
    this.itemClick.emit(item);
  }

  onPlayClick(event: Event, item: CarouselItem): void {
    event.stopPropagation();
    this.playClick.emit(item);
  }

  getDefaultImage(): string {
    return 'https://placehold.co/400x400/1e3a8a/ffffff?text=🎵';
  }
}

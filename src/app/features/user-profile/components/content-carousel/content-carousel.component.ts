import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, signal, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Representa un elemento del carrusel de contenido.
 */
export interface CarouselItem {
  id: number;
  nombre: string;
  artista?: string;
  tipo?: string;
  precio?: number | string;
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
  /**
   * Lista de elementos a mostrar en el carrusel.
   */
  @Input() items: CarouselItem[] = [];

  /**
   * Título mostrado sobre el carrusel.
   */
  @Input() title: string = '';

  /**
   * Indica si debe mostrarse un botón para añadir contenido.
   */
  @Input() showAddButton: boolean = false;

  /**
   * Indica si debe mostrarse el botón de reproducción en cada elemento.
   */
  @Input() showPlayButton: boolean = true;

  /**
   * Icono representativo del tipo de contenido mostrado.
   */
  @Input() icon: 'album' | 'song' | 'purchase' | 'favorite' | '' = '';

  /**
   * Mensaje mostrado cuando no hay elementos en el carrusel.
   */
  @Input() emptyMessage: string = 'No hay elementos';

  /**
   * Evento emitido cuando se pulsa el botón de añadir.
   */
  @Output() addClick = new EventEmitter<void>();

  /**
   * Evento emitido cuando se selecciona un elemento del carrusel.
   */
  @Output() itemClick = new EventEmitter<CarouselItem>();

  /**
   * Evento emitido cuando se pulsa el botón de reproducción.
   */
  @Output() playClick = new EventEmitter<CarouselItem>();

  /**
   * Contenedor del carrusel usado para controlar el desplazamiento horizontal.
   */
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;

  /**
   * Indica si el carrusel puede desplazarse hacia la izquierda.
   */
  canScrollLeft = signal(false);

  /**
   * Indica si el carrusel puede desplazarse hacia la derecha.
   */
  canScrollRight = signal(true);

  /**
   * Se ejecuta tras la inicialización de la vista para configurar el estado
   * de los controles de desplazamiento.
   */
  ngAfterViewInit(): void {
    setTimeout(() => this.updateScrollButtons(), 100);
  }

  /**
   * Desplaza el carrusel hacia la izquierda.
   */
  scrollLeft(): void {
    const container = this.scrollContainer.nativeElement;
    const scrollAmount = container.offsetWidth * 0.8;

    container.scrollBy({
      left: -scrollAmount,
      behavior: 'smooth'
    });

    setTimeout(() => this.updateScrollButtons(), 300);
  }

  /**
   * Desplaza el carrusel hacia la derecha.
   */
  scrollRight(): void {
    const container = this.scrollContainer.nativeElement;
    const scrollAmount = container.offsetWidth * 0.8;

    container.scrollBy({
      left: scrollAmount,
      behavior: 'smooth'
    });

    setTimeout(() => this.updateScrollButtons(), 300);
  }

  /**
   * Actualiza el estado de los botones de desplazamiento en función
   * de la posición actual del scroll.
   */
  onScroll(): void {
    this.updateScrollButtons();
  }

  /**
   * Determina si se debe permitir desplazamiento a izquierda o derecha.
   */
  private updateScrollButtons(): void {
    const container = this.scrollContainer?.nativeElement;
    if (!container) return;

    this.canScrollLeft.set(container.scrollLeft > 10);

    const maxScroll = container.scrollWidth - container.clientWidth;
    this.canScrollRight.set(container.scrollLeft < maxScroll - 10);
  }

  /**
   * Emite el evento correspondiente al botón de añadir contenido.
   */
  onAddClick(): void {
    this.addClick.emit();
  }

  /**
   * Emite el evento asociado al clic en un elemento del carrusel.
   * @param item Elemento seleccionado.
   */
  onItemClick(item: CarouselItem): void {
    this.itemClick.emit(item);
  }

  /**
   * Emite el evento de reproducción y evita que el evento se propague
   * al clic principal del elemento.
   * @param event Evento del clic.
   * @param item Elemento del carrusel.
   */
  onPlayClick(event: Event, item: CarouselItem): void {
    event.stopPropagation();
    this.playClick.emit(item);
  }

  /**
   * Devuelve una imagen por defecto en caso de que el elemento no tenga portada.
   */
  getDefaultImage(): string {
    return 'https://placehold.co/400x400/1e3a8a/ffffff?text=Musica';
  }

  /**
   * Formatea el precio mostrado para cada elemento.
   * @param precio Precio numérico o en formato string.
   */
  formatPrice(precio: number | string | undefined): string {
    if (precio === undefined) return '';
    if (typeof precio === 'string') return precio;

    return precio === 0 ? 'Gratis' : `${precio} €`;
  }
}

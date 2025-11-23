import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { 
  RecomendacionesService,
  TipoRecomendacion,
  CancionRecomendada,
  AlbumRecomendado 
} from '../../../../core/services/recomendaciones.service';
import { AuthStateService } from '../../../../core/services/auth-state.service';

interface ItemCarrusel {
  id: number;
  tipo: 'cancion' | 'album';
  titulo: string;
  genero: string;
  idGenero: number;
}

@Component({
  selector: 'app-recommendations-carousel',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './recommendations-carousel.component.html',
  styleUrls: ['./recommendations-carousel.component.scss']
})
export class RecommendationsCarouselComponent implements OnInit, OnDestroy {
  private recomendacionesService = inject(RecomendacionesService);
  private authStateService = inject(AuthStateService);

  @Input() titulo: string = 'Recomendado para ti';
  @Input() tipo: TipoRecomendacion = TipoRecomendacion.AMBOS;
  @Input() limite: number = 10;
  @Input() autoPlay: boolean = false;
  @Input() autoPlayInterval: number = 5000;

  items: ItemCarrusel[] = [];
  isLoading = false;
  error = '';
  
  // Control del carrusel
  currentIndex = 0;
  itemsPerView = 5;
  private autoPlayTimer?: any;

  ngOnInit() {
    this.cargarRecomendaciones();
    this.calcularItemsPorVista();
    
    if (this.autoPlay) {
      this.iniciarAutoPlay();
    }

    window.addEventListener('resize', this.onResize.bind(this));
  }

  ngOnDestroy() {
    this.detenerAutoPlay();
    window.removeEventListener('resize', this.onResize.bind(this));
  }

  // Carga las recomendaciones desde el servicio
  private cargarRecomendaciones() {
    const usuarioActual = this.authStateService.currentUser();
    
    if (!usuarioActual?.idUsuario) {
      this.error = 'Usuario no autenticado';
      return;
    }

    this.isLoading = true;
    this.error = '';

    this.recomendacionesService.obtenerRecomendaciones(
      usuarioActual.idUsuario,
      this.tipo,
      this.limite
    ).subscribe({
      next: (recomendaciones) => {
        this.items = this.procesarRecomendaciones(recomendaciones);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar recomendaciones:', error);
        this.error = 'Error al cargar recomendaciones';
        this.isLoading = false;
      }
    });
  }

  // Procesa las recomendaciones en el formato del carrusel
  private procesarRecomendaciones(recomendaciones: any): ItemCarrusel[] {
    const items: ItemCarrusel[] = [];

    // Agregar canciones
    if (recomendaciones.canciones) {
      recomendaciones.canciones.forEach((c: CancionRecomendada) => {
        items.push({
          id: c.id_cancion,
          tipo: 'cancion',
          titulo: c.titulo,
          genero: c.nombre_genero,
          idGenero: c.id_genero
        });
      });
    }

    // Agregar álbumes
    if (recomendaciones.albumes) {
      recomendaciones.albumes.forEach((a: AlbumRecomendado) => {
        items.push({
          id: a.id_album,
          tipo: 'album',
          titulo: a.titulo,
          genero: a.nombre_genero,
          idGenero: a.id_genero
        });
      });
    }

    // Mezclar aleatoriamente para variedad
    return this.mezclarArray(items);
  }

  // Mezcla aleatoriamente un arrayç
  private mezclarArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Calcula cuántos items mostrar según el ancho de pantalla
  private calcularItemsPorVista() {
    const width = window.innerWidth;
    
    if (width < 640) {
      this.itemsPerView = 2;
    } else if (width < 768) {
      this.itemsPerView = 3;
    } else if (width < 1024) {
      this.itemsPerView = 4;
    } else {
      this.itemsPerView = 5;
    }
  }

  // Maneja el resize de la ventana
  private onResize() {
    this.calcularItemsPorVista();
    if (this.currentIndex > this.maxIndex) {
      this.currentIndex = this.maxIndex;
    }
  }

  /**
   * Navega al item anterior
   */
  anterior() {
    if (this.puedeIrAnterior) {
      this.currentIndex--;
      this.reiniciarAutoPlay();
    }
  }

  // Navega al siguiente item
  siguiente() {
    if (this.puedeIrSiguiente) {
      this.currentIndex++;
      this.reiniciarAutoPlay();
    } else if (this.autoPlay) {
      this.currentIndex = 0;
    }
  }

  // Va a un índice específico
  irAIndice(index: number) {
    if (index >= 0 && index <= this.maxIndex) {
      this.currentIndex = index;
      this.reiniciarAutoPlay();
    }
  }

  // Calcula el índice máximo posible
  get maxIndex(): number {
    return Math.max(0, this.items.length - this.itemsPerView);
  }

  // Verifica si puede ir al anterior
  get puedeIrAnterior(): boolean {
    return this.currentIndex > 0;
  }

  // Verifica si puede ir al siguiente
  get puedeIrSiguiente(): boolean {
    return this.currentIndex < this.maxIndex;
  }

  // Calcula el offset de transformaciónç
  get transformOffset(): string {
    const itemWidth = 100 / this.itemsPerView;
    const offset = this.currentIndex * itemWidth;
    return `translateX(-${offset}%)`;
  }

  // Inicia el autoplayç
  private iniciarAutoPlay() {
    if (this.autoPlay && this.items.length > this.itemsPerView) {
      this.autoPlayTimer = setInterval(() => {
        this.siguiente();
      }, this.autoPlayInterval);
    }
  }

  // Detiene el autoplay
  private detenerAutoPlay() {
    if (this.autoPlayTimer) {
      clearInterval(this.autoPlayTimer);
      this.autoPlayTimer = undefined;
    }
  }

  // Reinicia el autoplay
  private reiniciarAutoPlay() {
    if (this.autoPlay) {
      this.detenerAutoPlay();
      this.iniciarAutoPlay();
    }
  }

  // Obtiene el color según el género
  getColorGenero(idGenero: number): string {
    const colores = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
      '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
      '#FF8FAB', '#FFD93D', '#6BCF7F', '#A8DADC', '#E63946'
    ];
    return colores[idGenero % colores.length];
  }

  // Obtiene el emoji según el tipo
  getEmojiTipo(tipo: 'cancion' | 'album'): string {
    return tipo === 'cancion' ? '🎵' : '💿';
  }

  // Obtiene la ruta para navegar al detalle
  getRutaDetalle(item: ItemCarrusel): string {
    return item.tipo === 'cancion' 
      ? `/canciones/${item.id}` 
      : `/albumes/${item.id}`;
  }

  // Recarga las recomendaciones manualmente
  recargar() {
    this.cargarRecomendaciones();
  }

  // Genera los puntos indicadores
  get puntosIndicadores(): number[] {
    const totalPuntos = Math.ceil(this.items.length / this.itemsPerView);
    return Array.from({ length: totalPuntos }, (_, i) => i);
  }

  // Calcula el punto activo
  get puntoActivo(): number {
    return Math.floor(this.currentIndex / this.itemsPerView);
  }
}
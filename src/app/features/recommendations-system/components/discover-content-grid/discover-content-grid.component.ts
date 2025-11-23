import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { 
  RecomendacionesResponse,
  CancionRecomendada,
  AlbumRecomendado 
} from '../../../../core/services/recomendaciones.service';

type CategoriaRecomendacion = 'todas' | 'canciones' | 'albumes';

interface ItemRecomendado {
  id: number;
  tipo: 'cancion' | 'album';
  titulo: string;
  genero: string;
  idGenero: number;
}

@Component({
  selector: 'app-discover-content-grid',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './discover-content-grid.component.html',
  styleUrls: ['./discover-content-grid.component.scss']
})
export class DiscoverContentGridComponent implements OnChanges {
  @Input() recomendaciones!: RecomendacionesResponse;
  @Input() categoriaActual: CategoriaRecomendacion = 'todas';

  itemsMostrados: ItemRecomendado[] = [];
  itemsPorPagina = 12;
  paginaActual = 1;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['recomendaciones'] || changes['categoriaActual']) {
      this.procesarRecomendaciones();
    }
  }

  /**
   * Procesa las recomendaciones según la categoría seleccionada
   */
  private procesarRecomendaciones() {
    if (!this.recomendaciones) {
      this.itemsMostrados = [];
      return;
    }

    let items: ItemRecomendado[] = [];

    // Agregar canciones si corresponde
    if (this.categoriaActual === 'todas' || this.categoriaActual === 'canciones') {
      const canciones = this.recomendaciones.canciones.map(c => this.mapearCancion(c));
      items = [...items, ...canciones];
    }

    // Agregar álbumes si corresponde
    if (this.categoriaActual === 'todas' || this.categoriaActual === 'albumes') {
      const albumes = this.recomendaciones.albumes.map(a => this.mapearAlbum(a));
      items = [...items, ...albumes];
    }

    // Mezclar items si es "todas" para variedad
    if (this.categoriaActual === 'todas') {
      items = this.mezclarItems(items);
    }

    this.itemsMostrados = items;
    this.paginaActual = 1; // Resetear a la primera página
  }

  /**
   * Mapea una canción al formato ItemRecomendado
   */
  private mapearCancion(cancion: CancionRecomendada): ItemRecomendado {
    return {
      id: cancion.id_cancion,
      tipo: 'cancion',
      titulo: cancion.titulo,
      genero: cancion.nombre_genero,
      idGenero: cancion.id_genero
    };
  }

  /**
   * Mapea un álbum al formato ItemRecomendado
   */
  private mapearAlbum(album: AlbumRecomendado): ItemRecomendado {
    return {
      id: album.id_album,
      tipo: 'album',
      titulo: album.titulo,
      genero: album.nombre_genero,
      idGenero: album.id_genero
    };
  }

  /**
   * Mezcla los items de forma intercalada (canción, álbum, canción, álbum...)
   */
  private mezclarItems(items: ItemRecomendado[]): ItemRecomendado[] {
    const canciones = items.filter(i => i.tipo === 'cancion');
    const albumes = items.filter(i => i.tipo === 'album');
    const mezclados: ItemRecomendado[] = [];

    const maxLength = Math.max(canciones.length, albumes.length);

    for (let i = 0; i < maxLength; i++) {
      if (i < canciones.length) mezclados.push(canciones[i]);
      if (i < albumes.length) mezclados.push(albumes[i]);
    }

    return mezclados;
  }

  /**
   * Obtiene los items de la página actual
   */
  get itemsPaginados(): ItemRecomendado[] {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    return this.itemsMostrados.slice(inicio, fin);
  }

  /**
   * Calcula el número total de páginas
   */
  get totalPaginas(): number {
    return Math.ceil(this.itemsMostrados.length / this.itemsPorPagina);
  }

  /**
   * Verifica si hay una página anterior
   */
  get tienePaginaAnterior(): boolean {
    return this.paginaActual > 1;
  }

  /**
   * Verifica si hay una página siguiente
   */
  get tienePaginaSiguiente(): boolean {
    return this.paginaActual < this.totalPaginas;
  }

  /**
   * Va a la página anterior
   */
  paginaAnterior() {
    if (this.tienePaginaAnterior) {
      this.paginaActual--;
      this.scrollToTop();
    }
  }

  /**
   * Va a la página siguiente
   */
  paginaSiguiente() {
    if (this.tienePaginaSiguiente) {
      this.paginaActual++;
      this.scrollToTop();
    }
  }

  /**
   * Va a una página específica
   */
  irAPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
      this.scrollToTop();
    }
  }

  /**
   * Scroll suave hacia arriba
   */
  private scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Obtiene el array de números de página para mostrar
   */
  get numerosPagina(): number[] {
    const paginas: number[] = [];
    const rango = 2; // Cuántas páginas mostrar a cada lado de la actual

    let inicio = Math.max(1, this.paginaActual - rango);
    let fin = Math.min(this.totalPaginas, this.paginaActual + rango);

    // Ajustar si estamos cerca del inicio o fin
    if (this.paginaActual <= rango) {
      fin = Math.min(this.totalPaginas, rango * 2 + 1);
    }
    if (this.paginaActual >= this.totalPaginas - rango) {
      inicio = Math.max(1, this.totalPaginas - rango * 2);
    }

    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }

    return paginas;
  }

  /**
   * Obtiene el emoji según el tipo de item
   */
  getEmojiTipo(tipo: 'cancion' | 'album'): string {
    return tipo === 'cancion' ? '🎵' : '💿';
  }

  /**
   * Obtiene la ruta para navegar al detalle
   */
  getRutaDetalle(item: ItemRecomendado): string {
    return item.tipo === 'cancion' 
      ? `/canciones/${item.id}` 
      : `/albumes/${item.id}`;
  }

  /**
   * Genera un color de fondo basado en el género
   */
  getColorGenero(idGenero: number): string {
    const colores = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
      '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
      '#FF8FAB', '#FFD93D', '#6BCF7F', '#A8DADC', '#E63946'
    ];
    return colores[idGenero % colores.length];
  }

  /**
   * Maneja el error de carga de imagen
   */
  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/default-cover.png'; // Imagen por defecto
  }
}
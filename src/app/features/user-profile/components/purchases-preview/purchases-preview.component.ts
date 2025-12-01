import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ContentCarouselComponent, CarouselItem } from '../content-carousel/content-carousel.component';
import { ComprasService, CompraDTO } from '../../services/compras.service';

@Component({
  selector: 'app-purchases-preview',
  standalone: true,
  imports: [CommonModule, ContentCarouselComponent],
  templateUrl: './purchases-preview.component.html',
  styleUrls: ['./purchases-preview.component.scss']
})
export class PurchasesPreviewComponent implements OnInit {
  /**
   * ID del usuario cuyas compras deben cargarse.
   */
  @Input() userId!: number;

  /**
   * Indica si el perfil visualizado pertenece al usuario autenticado.
   */
  @Input() isOwnProfile: boolean = false;

  /**
   * Lista de compras en formato compatible con el carrusel.
   */
  compras: CarouselItem[] = [];

  /**
   * Estado de carga para el conjunto de compras.
   */
  isLoading = true;

  constructor(
    private comprasService: ComprasService,
    private router: Router
  ) {}

  /**
   * Hook de inicialización. Carga las compras del usuario al iniciar el componente.
   */
  ngOnInit(): void {
    this.cargarCompras();
  }

  /**
   * Solicita al backend la lista de compras del usuario y las transforma
   * al formato utilizado por el carrusel.
   */
  cargarCompras(): void {
    this.isLoading = true;

    this.comprasService.listarCompras(this.userId, undefined, 1, 9999).subscribe({
      next: (response) => {
        this.compras = this.mapearComprasACarouselItems(response.compras);
        this.isLoading = false;
      },
      error: () => {
        this.compras = [];
        this.isLoading = false;
      }
    });
  }

  /**
   * Convierte el array de compras del backend en elementos del carrusel.
   *
   * @param compras Lista de compras recibidas del backend.
   */
  private mapearComprasACarouselItems(compras: CompraDTO[]): CarouselItem[] {
    return compras.map(compra => {
      const precioFormateado = compra.precioPagado === 0
        ? 'Gratis'
        : `${compra.precioPagado} €`;

      if (compra.tipoContenido === 'CANCIÓN' && compra.cancion) {
        return {
          id: compra.cancion.idCancion,
          nombre: compra.cancion.tituloCancion,
          artista: compra.nombreArtista,
          tipo: 'canción',
          precio: precioFormateado,
          imagen: compra.cancion.urlPortada || 'assets/default-song.png'
        };
      }

      if (compra.tipoContenido === 'ÁLBUM' && compra.album) {
        return {
          id: compra.album.idAlbum,
          nombre: compra.album.tituloAlbum,
          artista: compra.nombreArtista,
          tipo: 'álbum',
          precio: precioFormateado,
          imagen: compra.album.urlPortada || 'assets/default-album.png'
        };
      }

      return {
        id: compra.idCompra,
        nombre: 'Desconocido',
        artista: compra.nombreArtista || 'Artista desconocido',
        tipo: compra.tipoContenido === 'ÁLBUM' ? 'álbum' : 'canción',
        precio: precioFormateado,
        imagen: 'assets/default-content.png'
      };
    });
  }

  /**
   * Maneja la navegación al hacer clic en un elemento del carrusel.
   *
   * @param item Elemento seleccionado.
   */
  onItemClick(item: CarouselItem): void {
    if (item.tipo === 'álbum') {
      this.router.navigate([`/album/${item.id}`]);
    } else {
      this.router.navigate([`/cancion/${item.id}`]);
    }
  }
}

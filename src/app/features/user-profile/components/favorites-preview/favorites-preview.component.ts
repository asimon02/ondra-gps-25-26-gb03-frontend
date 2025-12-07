import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ContentCarouselComponent, CarouselItem } from '../content-carousel/content-carousel.component';
import { environment } from '../../../../../enviroments/enviroment';
import { FavoritosService } from '../../../../core/services/favoritos.service';

interface CancionDTO {
  idCancion: number;
  tituloCancion: string;
  idArtista: number;
  genero: string;
  precioCancion: number;
  duracionSegundos: number;
  urlPortada: string;
  urlAudio: string;
  reproducciones: number;
  valoracionMedia: number | null;
  totalComentarios: number;
  fechaPublicacion: string;
  descripcion: string;
}

interface AlbumDTO {
  idAlbum: number;
  tituloAlbum: string;
  idArtista: number;
  genero: string;
  precioAlbum: number;
  urlPortada: string;
  valoracionMedia: number | null;
  totalComentarios: number;
  totalCanciones: number;
  duracionTotalSegundos: number;
  totalPlayCount: number;
  fechaPublicacion: string;
  descripcion: string;
}

interface FavoritoDTO {
  idFavorito: number;
  idUsuario: number;
  tipoContenido: 'CANCIÓN' | 'ÁLBUM';
  cancion?: CancionDTO;
  album?: AlbumDTO;
  fechaAgregado: string;
  nombreArtista: string;
  slugArtista?: string;
}

interface FavoritosPaginadosDTO {
  favoritos: FavoritoDTO[];
  paginaActual: number;
  totalPaginas: number;
  totalElementos: number;
  elementosPorPagina: number;
}

@Component({
  selector: 'app-favorites-preview',
  standalone: true,
  imports: [CommonModule, ContentCarouselComponent],
  templateUrl: './favorites-preview.component.html',
  styleUrls: ['./favorites-preview.component.scss']
})
export class FavoritesPreviewComponent implements OnInit, OnDestroy {
  /**
   * ID del usuario del cual se cargarán los favoritos.
   */
  @Input() userId!: number;

  /**
   * Indica si el perfil mostrado pertenece al usuario autenticado.
   */
  @Input() isOwnProfile: boolean = false;

  /**
   * Lista de favoritos en formato de ítems para el carrusel.
   */
  favoritos: CarouselItem[] = [];

  /**
   * Indica si los datos están siendo cargados.
   */
  isLoading = true;

  /**
   * Suscripción a eventos de cambios en los favoritos.
   */
  private favoritosSubscription?: Subscription;

  constructor(
    private http: HttpClient,
    private router: Router,
    private favoritosService: FavoritosService
  ) {}

  /**
   * Carga inicial de favoritos y suscripción a cambios en el servicio.
   */
  ngOnInit(): void {
    this.cargarFavoritos();
    this.suscribirseACambiosDeFavoritos();
  }

  /**
   * Elimina la suscripción al destruir el componente.
   */
  ngOnDestroy(): void {
    if (this.favoritosSubscription) {
      this.favoritosSubscription.unsubscribe();
    }
  }

  /**
   * Se suscribe a los eventos emitidos cuando ocurre un cambio en los favoritos,
   * recargando la lista automáticamente.
   */
  private suscribirseACambiosDeFavoritos(): void {
    this.favoritosSubscription = this.favoritosService.onFavoritoChanged.subscribe({
      next: () => {
        this.cargarFavoritos();
      },
      error: (err) => console.error('Error en suscripción a favoritos:', err)
    });
  }

  /**
   * Llama al backend para obtener todos los favoritos del usuario.
   */
  cargarFavoritos(): void {
    this.isLoading = true;

    const params = new HttpParams()
      .set('idUsuario', this.userId.toString())
      .set('page', '1')
      .set('limit', '9999');

    const url = `${environment.apis.contenidos}/favoritos`;

    this.http.get<FavoritosPaginadosDTO>(url, { params }).subscribe({
      next: (response) => {
        this.favoritos = this.mapearFavoritosACarouselItems(response.favoritos);
        this.isLoading = false;
      },
      error: () => {
        this.favoritos = [];
        this.isLoading = false;
      }
    });
  }

  /**
   * Convierte los objetos FavoritoDTO en elementos del carrusel.
   *
   * @param favoritos Lista de favoritos del backend.
   */
  private mapearFavoritosACarouselItems(favoritos: FavoritoDTO[]): CarouselItem[] {
    return favoritos.map(fav => {
      const artista = fav.nombreArtista || 'Artista desconocido';

      if (fav.tipoContenido === 'CANCIÓN' && fav.cancion) {
        return {
          id: fav.cancion.idCancion,
          nombre: fav.cancion.tituloCancion,
          artista,
          tipo: 'canción',
          imagen: fav.cancion.urlPortada || 'assets/default-song.png'
        };
      }

      if (fav.tipoContenido === 'ÁLBUM' && fav.album) {
        return {
          id: fav.album.idAlbum,
          nombre: fav.album.tituloAlbum,
          artista,
          tipo: 'álbum',
          imagen: fav.album.urlPortada || 'assets/default-album.png'
        };
      }

      return {
        id: fav.idFavorito,
        nombre: 'Desconocido',
        artista,
        tipo: fav.tipoContenido === 'ÁLBUM' ? 'álbum' : 'canción',
        imagen: 'assets/default-content.png'
      };
    });
  }

  /**
   * Navega al detalle del contenido cuando el usuario hace clic en un ítem del carrusel.
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

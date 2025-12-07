import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../enviroments/enviroment';

/**
 * Representa una canción en el sistema
 */
export interface CancionDTO {
  /** Identificador único de la canción */
  idCancion: number;

  /** Título de la canción */
  tituloCancion: string;

  /** ID del artista propietario */
  idArtista: number;

  /** Género musical */
  genero: string;

  /** Precio de la canción */
  precioCancion: number;

  /** Duración en segundos */
  duracionSegundos: number;

  /** URL de la imagen de portada */
  urlPortada: string;

  /** URL del archivo de audio */
  urlAudio: string;

  /** Número total de reproducciones */
  reproducciones: number;

  /** Valoración media de usuarios */
  valoracionMedia: number | null;

  /** Total de comentarios recibidos */
  totalComentarios: number;

  /** Fecha de publicación */
  fechaPublicacion: string;

  /** Descripción de la canción */
  descripcion: string;
}

/**
 * Representa un álbum musical
 */
export interface AlbumDTO {
  /** Identificador único del álbum */
  idAlbum: number;

  /** Título del álbum */
  tituloAlbum: string;

  /** ID del artista propietario */
  idArtista: number;

  /** Género musical predominante */
  genero: string;

  /** Precio del álbum completo */
  precioAlbum: number;

  /** URL de la imagen de portada */
  urlPortada: string;

  /** Valoración media de usuarios */
  valoracionMedia: number | null;

  /** Total de comentarios recibidos */
  totalComentarios: number;

  /** Cantidad de canciones en el álbum */
  totalCanciones: number;

  /** Duración total del álbum en segundos */
  duracionTotalSegundos: number;

  /** Total de reproducciones acumuladas */
  totalPlayCount: number;

  /** Fecha de publicación */
  fechaPublicacion: string;

  /** Descripción del álbum */
  descripcion: string;
}

/**
 * Representa una compra realizada por un usuario
 */
export interface CompraDTO {
  /** Identificador único de la compra */
  idCompra: number;

  /** ID del usuario que realizó la compra */
  idUsuario: number;

  /** Tipo de contenido comprado */
  tipoContenido: 'CANCIÓN' | 'ÁLBUM';

  /** Información de la canción (si aplica) */
  cancion?: CancionDTO;

  /** Información del álbum (si aplica) */
  album?: AlbumDTO;

  /** Precio pagado en la transacción */
  precioPagado: number;

  /** Fecha y hora de la compra */
  fechaCompra: string;

  /** Método de pago utilizado */
  metodoPago: string;

  /** Identificador de la transacción */
  idTransaccion: string;

  /** Nombre del artista del contenido comprado */
  nombreArtista: string;
}

/**
 * Respuesta paginada de compras
 */
export interface ComprasPaginadasDTO {
  /** Lista de compras en la página actual */
  compras: CompraDTO[];

  /** Número de la página actual */
  paginaActual: number;

  /** Total de páginas disponibles */
  totalPaginas: number;

  /** Total de elementos en todas las páginas */
  totalElementos: number;

  /** Cantidad de elementos por página */
  elementosPorPagina: number;
}

/**
 * Servicio para gestionar el historial de compras de usuarios.
 * Permite consultar compras realizadas, verificar propiedad de contenido
 * y obtener estadísticas de gasto.
 */
@Injectable({
  providedIn: 'root'
})
export class ComprasService {
  private apiUrl = `${environment.apis.contenidos}/compras`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene el historial de compras de un usuario con paginación y filtros opcionales
   * @param idUsuario ID del usuario
   * @param tipo Filtro por tipo de contenido (CANCION o ALBUM)
   * @param page Número de página (por defecto 1)
   * @param limit Elementos por página (por defecto 20)
   * @returns Observable con las compras paginadas
   */
  listarCompras(
    idUsuario: number,
    tipo?: string,
    page: number = 1,
    limit: number = 20
  ): Observable<ComprasPaginadasDTO> {
    let params = new HttpParams()
      .set('idUsuario', idUsuario.toString())
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (tipo) {
      params = params.set('tipo', tipo);
    }

    return this.http.get<ComprasPaginadasDTO>(this.apiUrl, { params });
  }

  /**
   * Verifica si el usuario actual ha comprado una canción específica
   * @param idCancion ID de la canción a verificar
   * @returns Observable que emite true si el usuario posee la canción
   */
  verificarCompraCancion(idCancion: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/canciones/${idCancion}/check`);
  }

  /**
   * Verifica si el usuario actual ha comprado un álbum específico
   * @param idAlbum ID del álbum a verificar
   * @returns Observable que emite true si el usuario posee el álbum
   */
  verificarCompraAlbum(idAlbum: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/albumes/${idAlbum}/check`);
  }

  /**
   * Obtiene el monto total gastado por el usuario actual en todas sus compras
   * @returns Observable con el total gastado
   */
  obtenerTotalGastado(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/total-gastado`);
  }
}

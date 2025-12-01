import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../enviroments/enviroment';
import {
  AlbumDTO,
  AlbumDetalleDTO,
  AlbumesPaginadosDTO,
  CrearAlbumDTO,
  EditarAlbumDTO,
  AgregarCancionAlbumDTO,
  CancionAlbumDTO,
  EstadisticasArtistaDTO
} from '../models/album.model';

/**
 * Servicio para gestión de álbumes musicales.
 * Proporciona métodos para listar, buscar, crear, editar y eliminar álbumes,
 * así como gestionar las canciones dentro de cada álbum.
 */
@Injectable({
  providedIn: 'root'
})
export class AlbumService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apis.contenidos}/albumes`;

  /**
   * Lista álbumes con opciones de filtrado, ordenamiento y paginación.
   *
   * @param filtros - Objeto opcional con criterios de filtrado y paginación
   * @returns Observable con respuesta paginada de álbumes
   */
  listarAlbumes(filtros?: {
    artistId?: number;
    genreId?: number;
    search?: string;
    orderBy?: 'most_recent' | 'oldest' | 'best_rated' | 'price_asc' | 'price_desc';
    page?: number;
    limit?: number;
  }): Observable<AlbumesPaginadosDTO> {
    let params = new HttpParams();

    if (filtros) {
      if (filtros.artistId) params = params.set('artistId', filtros.artistId.toString());
      if (filtros.genreId) params = params.set('genreId', filtros.genreId.toString());
      if (filtros.search) params = params.set('search', filtros.search);
      if (filtros.orderBy) params = params.set('orderBy', filtros.orderBy);
      if (filtros.page) params = params.set('page', filtros.page.toString());
      if (filtros.limit) params = params.set('limit', filtros.limit.toString());
    }

    return this.http.get<AlbumesPaginadosDTO>(this.apiUrl, { params });
  }

  /**
   * Obtiene los detalles completos de un álbum por su ID.
   * Incluye el tracklist completo con todas las canciones.
   *
   * @param id - ID del álbum
   * @returns Observable con detalles completos del álbum
   */
  obtenerAlbum(id: number): Observable<AlbumDetalleDTO> {
    return this.http.get<AlbumDetalleDTO>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtiene todos los álbumes de un artista específico.
   *
   * @param artistId - ID del artista
   * @returns Observable con array de álbumes del artista
   */
  obtenerAlbumesPorArtista(artistId: number): Observable<AlbumDTO[]> {
    return this.http.get<AlbumDTO[]>(`${this.apiUrl}/artist/${artistId}`);
  }

  /**
   * Busca álbumes por término de búsqueda.
   *
   * @param query - Término de búsqueda
   * @returns Observable con array de álbumes que coinciden con la búsqueda
   */
  buscarAlbumes(query: string): Observable<AlbumDTO[]> {
    return this.http.get<AlbumDTO[]>(`${this.apiUrl}/search`, {
      params: { q: query }
    });
  }

  /**
   * Obtiene las canciones de un álbum ordenadas por número de pista.
   *
   * @param id - ID del álbum
   * @returns Observable con array de canciones del álbum
   */
  obtenerCancionesAlbum(id: number): Observable<CancionAlbumDTO[]> {
    return this.http.get<CancionAlbumDTO[]>(`${this.apiUrl}/${id}/tracks`);
  }

  /**
   * Obtiene álbumes con precio gratuito (precio = 0).
   *
   * @returns Observable con array de álbumes gratuitos
   */
  obtenerAlbumesGratuitos(): Observable<AlbumDTO[]> {
    return this.http.get<AlbumDTO[]>(`${this.apiUrl}/gratuitos`);
  }

  /**
   * Obtiene álbumes filtrados por género musical.
   *
   * @param genreId - ID del género musical
   * @returns Observable con array de álbumes del género especificado
   */
  obtenerAlbumesPorGenero(genreId: number): Observable<AlbumDTO[]> {
    return this.http.get<AlbumDTO[]>(`${this.apiUrl}/genre/${genreId}`);
  }

  /**
   * Obtiene los álbumes mejor valorados.
   *
   * @param limit - Número máximo de álbumes a retornar (default: 10)
   * @returns Observable con array de álbumes ordenados por valoración
   */
  obtenerAlbumesMejorValorados(limit: number = 10): Observable<AlbumDTO[]> {
    return this.http.get<AlbumDTO[]>(`${this.apiUrl}/top-rated`, {
      params: { limit: limit.toString() }
    });
  }

  /**
   * Obtiene los álbumes más recientes.
   *
   * @param limit - Número máximo de álbumes a retornar (default: 10)
   * @returns Observable con array de álbumes ordenados por fecha de publicación
   */
  obtenerAlbumesRecientes(limit: number = 10): Observable<AlbumDTO[]> {
    return this.http.get<AlbumDTO[]>(`${this.apiUrl}/recent`, {
      params: { limit: limit.toString() }
    });
  }

  /**
   * Obtiene estadísticas de reproducción totales de un artista.
   *
   * @param artistId - ID del artista
   * @returns Observable con estadísticas del artista
   */
  obtenerEstadisticasArtista(artistId: number): Observable<EstadisticasArtistaDTO> {
    return this.http.get<EstadisticasArtistaDTO>(`${this.apiUrl}/artist/${artistId}/stats`);
  }

  /**
   * Crea un nuevo álbum.
   * Requiere autenticación y rol ARTISTA.
   *
   * @param datos - Datos del álbum a crear
   * @returns Observable con el álbum creado
   */
  crearAlbum(datos: CrearAlbumDTO): Observable<AlbumDTO> {
    return this.http.post<AlbumDTO>(this.apiUrl, datos);
  }

  /**
   * Actualiza un álbum existente.
   * Requiere ser propietario del álbum.
   *
   * @param id - ID del álbum a actualizar
   * @param datos - Datos a actualizar (campos opcionales)
   * @returns Observable con el álbum actualizado
   */
  actualizarAlbum(id: number, datos: EditarAlbumDTO): Observable<AlbumDTO> {
    return this.http.put<AlbumDTO>(`${this.apiUrl}/${id}`, datos);
  }

  /**
   * Elimina un álbum.
   * Requiere ser propietario del álbum.
   *
   * @param id - ID del álbum a eliminar
   * @returns Observable que completa cuando se elimina el álbum
   */
  eliminarAlbum(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Agrega una canción existente a un álbum.
   * Requiere ser propietario del álbum.
   *
   * @param idAlbum - ID del álbum
   * @param datos - ID de la canción y número de pista
   * @returns Observable que completa cuando se agrega la canción
   */
  agregarCancionAlAlbum(idAlbum: number, datos: AgregarCancionAlbumDTO): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${idAlbum}/tracks`, datos);
  }

  /**
   * Elimina una canción de un álbum.
   * Requiere ser propietario del álbum.
   *
   * @param idAlbum - ID del álbum
   * @param idCancion - ID de la canción a eliminar
   * @returns Observable que completa cuando se elimina la canción
   */
  eliminarCancionDeAlbum(idAlbum: number, idCancion: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${idAlbum}/tracks/${idCancion}`);
  }
}

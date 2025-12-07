// src/app/features/songs/services/song.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../enviroments/enviroment';
import {
  CancionDTO,
  CancionDetalleDTO,
  CancionesPaginadasDTO,
  CrearCancionDTO,
  EditarCancionDTO,
  ReproduccionResponseDTO
} from '../models/song.model';
import { EstadisticasArtistaDTO } from '../../albums/models/album.model';

/**
 * Servicio para gestión de canciones, incluyendo operaciones de búsqueda,
 * creación, actualización, eliminación y registro de reproducciones.
 */
@Injectable({
  providedIn: 'root'
})
export class SongService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apis.contenidos}/canciones`;

  /**
   * Lista canciones con filtros opcionales y paginación.
   * @param filtros Objeto con filtros y opciones de paginación
   * @returns Observable con datos paginados de canciones
   */
  listarCanciones(filtros?: {
    artistId?: number;
    genreId?: number;
    search?: string;
    orderBy?: 'most_recent' | 'oldest' | 'most_played' | 'best_rated' | 'price_asc' | 'price_desc';
    page?: number;
    limit?: number;
  }): Observable<CancionesPaginadasDTO> {
    let params = new HttpParams();

    if (filtros) {
      if (filtros.artistId) params = params.set('artistId', filtros.artistId.toString());
      if (filtros.genreId) params = params.set('genreId', filtros.genreId.toString());
      if (filtros.search) params = params.set('search', filtros.search);
      if (filtros.orderBy) params = params.set('orderBy', filtros.orderBy);
      if (filtros.page) params = params.set('page', filtros.page.toString());
      if (filtros.limit) params = params.set('limit', filtros.limit.toString());
    }

    return this.http.get<CancionesPaginadasDTO>(this.apiUrl, { params });
  }

  /**
   * Obtiene información detallada de una canción por su ID.
   * @param id ID de la canción
   * @returns Observable con los detalles de la canción
   */
  obtenerCancion(id: number): Observable<CancionDetalleDTO> {
    return this.http.get<CancionDetalleDTO>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtiene todas las canciones de un artista específico.
   * @param artistId ID del artista
   * @returns Observable con un arreglo de canciones
   */
  obtenerCancionesPorArtista(artistId: number): Observable<CancionDTO[]> {
    return this.http.get<CancionDTO[]>(`${this.apiUrl}/artist/${artistId}`);
  }

  /**
   * Obtiene todas las canciones de un álbum específico.
   * @param albumId ID del álbum
   * @returns Observable con un arreglo de canciones
   */
  obtenerCancionesPorAlbum(albumId: number): Observable<CancionDTO[]> {
    return this.http.get<CancionDTO[]>(`${this.apiUrl}/album/${albumId}`);
  }

  /**
   * Busca canciones por un término de búsqueda.
   * @param query Término de búsqueda
   * @returns Observable con un arreglo de canciones coincidentes
   */
  buscarCanciones(query: string): Observable<CancionDTO[]> {
    return this.http.get<CancionDTO[]>(`${this.apiUrl}/search`, {
      params: { q: query }
    });
  }

  /**
   * Obtiene canciones gratuitas disponibles en la plataforma.
   * @returns Observable con un arreglo de canciones gratuitas
   */
  obtenerCancionesGratuitas(): Observable<CancionDTO[]> {
    return this.http.get<CancionDTO[]>(`${this.apiUrl}/gratuitas`);
  }

  /**
   * Registra la reproducción de una canción específica.
   * @param id ID de la canción
   * @returns Observable con información de la reproducción
   */
  registrarReproduccion(id: number): Observable<ReproduccionResponseDTO> {
    return this.http.post<ReproduccionResponseDTO>(`${this.apiUrl}/${id}/reproducir`, {});
  }

  /**
   * Obtiene estadísticas de reproducciones totales de un artista.
   * @param artistId ID del artista
   * @returns Observable con estadísticas de reproducciones
   */
  obtenerEstadisticasArtista(artistId: number): Observable<EstadisticasArtistaDTO> {
    return this.http.get<EstadisticasArtistaDTO>(`${this.apiUrl}/artist/${artistId}/stats`);
  }

  /**
   * Crea una nueva canción.
   * @param datos Objeto con información de la canción a crear
   * @returns Observable con la canción creada
   */
  crearCancion(datos: CrearCancionDTO): Observable<CancionDTO> {
    return this.http.post<CancionDTO>(this.apiUrl, datos);
  }

  /**
   * Actualiza una canción existente.
   * @param id ID de la canción a actualizar
   * @param datos Objeto con los campos a actualizar
   * @returns Observable con la canción actualizada
   */
  actualizarCancion(id: number, datos: EditarCancionDTO): Observable<CancionDTO> {
    return this.http.put<CancionDTO>(`${this.apiUrl}/${id}`, datos);
  }

  /**
   * Elimina una canción por su ID.
   * @param id ID de la canción a eliminar
   * @returns Observable que completa al eliminar
   */
  eliminarCancion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

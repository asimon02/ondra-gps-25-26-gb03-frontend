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

@Injectable({
  providedIn: 'root'
})
export class SongService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apis.contenidos}/canciones`;

  /**
   * GET /api/canciones
   * Lista canciones con filtros y paginación
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
   * GET /api/canciones/{id}
   * Obtiene una canción por ID con información detallada
   */
  obtenerCancion(id: number): Observable<CancionDetalleDTO> {
    return this.http.get<CancionDetalleDTO>(`${this.apiUrl}/${id}`);
  }

  /**
   * GET /api/canciones/artist/{artistId}
   * Obtiene todas las canciones de un artista
   */
  obtenerCancionesPorArtista(artistId: number): Observable<CancionDTO[]> {
    return this.http.get<CancionDTO[]>(`${this.apiUrl}/artist/${artistId}`);
  }

  /**
   * GET /api/canciones/album/{albumId}
   * Obtiene canciones de un álbum
   */
  obtenerCancionesPorAlbum(albumId: number): Observable<CancionDTO[]> {
    return this.http.get<CancionDTO[]>(`${this.apiUrl}/album/${albumId}`);
  }

  /**
   * GET /api/canciones/search?q={query}
   * Busca canciones por término
   */
  buscarCanciones(query: string): Observable<CancionDTO[]> {
    return this.http.get<CancionDTO[]>(`${this.apiUrl}/search`, {
      params: { q: query }
    });
  }

  /**
   * GET /api/canciones/gratuitas
   * Obtiene canciones gratuitas
   */
  obtenerCancionesGratuitas(): Observable<CancionDTO[]> {
    return this.http.get<CancionDTO[]>(`${this.apiUrl}/gratuitas`);
  }

  /**
   * POST /api/canciones/{id}/reproducir
   * Registra una reproducción de canción
   */
  registrarReproduccion(id: number): Observable<ReproduccionResponseDTO> {
    return this.http.post<ReproduccionResponseDTO>(`${this.apiUrl}/${id}/reproducir`, {});
  }

  /**
   * GET /api/canciones/artist/{artistId}/stats
   * Obtiene estadísticas de reproducciones totales de un artista
   */
  obtenerEstadisticasArtista(artistId: number): Observable<EstadisticasArtistaDTO> {
    return this.http.get<EstadisticasArtistaDTO>(`${this.apiUrl}/artist/${artistId}/stats`);
  }

  /**
   * POST /api/canciones
   * Crea una nueva canción (requiere autenticación y rol ARTISTA)
   */
  crearCancion(datos: CrearCancionDTO): Observable<CancionDTO> {
    return this.http.post<CancionDTO>(this.apiUrl, datos);
  }

  /**
   * PUT /api/canciones/{id}
   * Actualiza una canción existente (requiere ser propietario)
   */
  actualizarCancion(id: number, datos: EditarCancionDTO): Observable<CancionDTO> {
    return this.http.put<CancionDTO>(`${this.apiUrl}/${id}`, datos);
  }

  /**
   * DELETE /api/canciones/{id}
   * Elimina una canción (requiere ser propietario)
   */
  eliminarCancion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

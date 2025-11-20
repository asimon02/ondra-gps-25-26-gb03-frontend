// src/app/features/albums/services/album.service.ts

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

@Injectable({
  providedIn: 'root'
})
export class AlbumService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apis.contenidos}/albumes`;

  /**
   * GET /api/albumes
   * Lista álbumes con filtros y paginación
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
   * GET /api/albumes/{id}
   * Obtiene un álbum por ID con trackList completo
   */
  obtenerAlbum(id: number): Observable<AlbumDetalleDTO> {
    return this.http.get<AlbumDetalleDTO>(`${this.apiUrl}/${id}`);
  }

  /**
   * GET /api/albumes/artist/{artistId}
   * Obtiene todos los álbumes de un artista
   */
  obtenerAlbumesPorArtista(artistId: number): Observable<AlbumDTO[]> {
    return this.http.get<AlbumDTO[]>(`${this.apiUrl}/artist/${artistId}`);
  }

  /**
   * GET /api/albumes/search?q={query}
   * Busca álbumes por término
   */
  buscarAlbumes(query: string): Observable<AlbumDTO[]> {
    return this.http.get<AlbumDTO[]>(`${this.apiUrl}/search`, {
      params: { q: query }
    });
  }

  /**
   * GET /api/albumes/{id}/tracks
   * Obtiene las canciones de un álbum ordenadas por número de pista
   */
  obtenerCancionesAlbum(id: number): Observable<CancionAlbumDTO[]> {
    return this.http.get<CancionAlbumDTO[]>(`${this.apiUrl}/${id}/tracks`);
  }

  /**
   * GET /api/albumes/gratuitos
   * Obtiene álbumes gratuitos
   */
  obtenerAlbumesGratuitos(): Observable<AlbumDTO[]> {
    return this.http.get<AlbumDTO[]>(`${this.apiUrl}/gratuitos`);
  }

  /**
   * GET /api/albumes/genre/{genreId}
   * Obtiene álbumes por género
   */
  obtenerAlbumesPorGenero(genreId: number): Observable<AlbumDTO[]> {
    return this.http.get<AlbumDTO[]>(`${this.apiUrl}/genre/${genreId}`);
  }

  /**
   * GET /api/albumes/top-rated?limit={limit}
   * Obtiene álbumes mejor valorados
   */
  obtenerAlbumesMejorValorados(limit: number = 10): Observable<AlbumDTO[]> {
    return this.http.get<AlbumDTO[]>(`${this.apiUrl}/top-rated`, {
      params: { limit: limit.toString() }
    });
  }

  /**
   * GET /api/albumes/recent?limit={limit}
   * Obtiene álbumes más recientes
   */
  obtenerAlbumesRecientes(limit: number = 10): Observable<AlbumDTO[]> {
    return this.http.get<AlbumDTO[]>(`${this.apiUrl}/recent`, {
      params: { limit: limit.toString() }
    });
  }

  /**
   * GET /api/albumes/artist/{artistId}/stats
   * Obtiene las estadísticas de reproducciones totales de un artista
   */
  obtenerEstadisticasArtista(artistId: number): Observable<EstadisticasArtistaDTO> {
    return this.http.get<EstadisticasArtistaDTO>(`${this.apiUrl}/artist/${artistId}/stats`);
  }

  /**
   * POST /api/albumes
   * Crea un nuevo álbum (requiere autenticación y rol ARTISTA)
   */
  crearAlbum(datos: CrearAlbumDTO): Observable<AlbumDTO> {
    return this.http.post<AlbumDTO>(this.apiUrl, datos);
  }

  /**
   * PUT /api/albumes/{id}
   * Actualiza un álbum existente (requiere ser propietario)
   */
  actualizarAlbum(id: number, datos: EditarAlbumDTO): Observable<AlbumDTO> {
    return this.http.put<AlbumDTO>(`${this.apiUrl}/${id}`, datos);
  }

  /**
   * DELETE /api/albumes/{id}
   * Elimina un álbum (requiere ser propietario)
   */
  eliminarAlbum(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * POST /api/albumes/{id}/tracks
   * Agrega una canción a un álbum (requiere ser propietario)
   */
  agregarCancionAlAlbum(idAlbum: number, datos: AgregarCancionAlbumDTO): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${idAlbum}/tracks`, datos);
  }

  /**
   * DELETE /api/albumes/{id}/tracks/{songId}
   * Elimina una canción de un álbum (requiere ser propietario)
   */
  eliminarCancionDeAlbum(idAlbum: number, idCancion: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${idAlbum}/tracks/${idCancion}`);
  }
}

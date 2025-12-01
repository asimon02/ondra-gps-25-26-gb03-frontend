import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap, shareReplay } from 'rxjs/operators';
import { environment } from '../../../enviroments/enviroment';
import { SongArtist } from '../models/song.model';

interface ArtistaDTO {
  idArtista: number;
  idUsuario: number;
  nombreArtistico: string;
  biografiaArtistico: string;
  fotoPerfilArtistico: string;
  esTendencia: boolean;
  slugArtistico: string;
  fechaInicioArtistico?: string;
}

export interface ArtistQueryParams {
  search?: string;
  esTendencia?: boolean;
  orderBy?: 'most_recent' | 'oldest';
  page?: number;
  limit?: number;
}

export interface PaginatedArtistsResponse {
  content: ArtistaDTO[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
  size: number;
}

@Injectable({
  providedIn: 'root'
})
export class ArtistService {
  /**
   * URL base del módulo de artistas.
   */
  private readonly apiUrl = `${environment.apis.usuarios}/artistas`;

  /**
   * Cache interna para almacenar artistas consultados por ID.
   */
  private cache = new Map<string, Observable<SongArtist>>();

  constructor(private http: HttpClient) {}

  /**
   * Obtiene un artista por su identificador.
   * Si el artista ya se encuentra en caché, la respuesta se obtiene desde allí.
   *
   * @param id Identificador del artista.
   * @returns Observable con la información del artista.
   */
  getArtistById(id: string | number): Observable<SongArtist> {
    const key = id.toString();

    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    const request$ = this.http.get<ArtistaDTO>(`${this.apiUrl}/${key}`).pipe(
      map(dto => this.mapDto(dto)),
      tap(artist => this.cache.set(key, of(artist))),
      shareReplay(1)
    );

    this.cache.set(key, request$);
    return request$;
  }

  /**
   * Realiza una búsqueda de artistas usando parámetros opcionales.
   *
   * @param params Parámetros de consulta para filtrar, ordenar y paginar resultados.
   * @returns Observable con el listado paginado de artistas.
   */
  searchArtists(params: ArtistQueryParams = {}): Observable<PaginatedArtistsResponse> {
    let httpParams = new HttpParams();

    if (params.search) {
      httpParams = httpParams.set('search', params.search);
    }
    if (params.esTendencia !== undefined) {
      httpParams = httpParams.set('esTendencia', params.esTendencia.toString());
    }
    if (params.orderBy) {
      httpParams = httpParams.set('orderBy', params.orderBy);
    }
    if (params.page !== undefined) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params.limit !== undefined) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }

    return this.http.get<PaginatedArtistsResponse>(`${this.apiUrl}/buscar`, {
      params: httpParams
    });
  }

  /**
   * Transforma un objeto ArtistaDTO del backend en un modelo SongArtist usado por el frontend.
   *
   * @param dto Objeto proveniente del backend.
   * @returns Instancia normalizada de SongArtist.
   */
  private mapDto(dto: ArtistaDTO): SongArtist {
    return {
      id: dto.idArtista.toString(),
      artisticName: dto.nombreArtistico || 'Artista',
      profileImage: dto.fotoPerfilArtistico || null,
      userId: dto.idUsuario?.toString() ?? null,
      slug: dto.slugArtistico ?? null,
      bio: dto.biografiaArtistico ?? null,
      isTrending: dto.esTendencia ?? false,
      startDate: dto.fechaInicioArtistico ?? undefined
    };
  }
}

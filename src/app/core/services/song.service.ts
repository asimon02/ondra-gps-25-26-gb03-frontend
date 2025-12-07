import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, map, switchMap } from 'rxjs/operators';
import { Song, SongAlbumSummary, SongArtist } from '../models/song.model';
import { MOCK_SONGS } from '../mocks/mock-songs';
import { environment } from '../../../enviroments/enviroment';
import { FavoritosService } from './favoritos.service';

/**
 * Respuesta paginada de canciones compatible con Spring Boot y modo mock.
 */
export interface PaginatedSongsResponse {
  /** Lista de canciones (formato mock) */
  songs?: Song[];
  /** Lista de canciones (formato backend) */
  content?: Song[];
  /** Página actual */
  currentPage: number;
  /** Total de páginas disponibles */
  totalPages: number;
  /** Total de elementos en el dataset */
  totalElements: number;
  /** Elementos por página (formato mock) */
  elementsPerPage?: number;
  /** Tamaño de página (formato backend) */
  size?: number;
}

/**
 * Parámetros de consulta para filtrado y ordenamiento de canciones.
 */
export interface SongQueryParams {
  /** Nombre del género (legacy) */
  genre?: string;
  /** ID del género */
  genreId?: string;
  /** ID del artista */
  artistId?: string;
  /** Término de búsqueda */
  search?: string;
  /** Precio mínimo */
  minPrice?: number;
  /** Precio máximo */
  maxPrice?: number;
  /** Criterio de ordenamiento */
  orderBy?: 'most_recent' | 'oldest' | 'most_played' | 'best_rated' | 'price_asc' | 'price_desc';
  /** Número de página (1-indexed) */
  page?: number;
  /** Límite de resultados por página */
  limit?: number;
}

/**
 * Servicio para gestión de canciones.
 * Soporta modo mock y backend real según configuración de entorno.
 */
@Injectable({
  providedIn: 'root'
})
export class SongService {
  private readonly MOCK_DELAY = 300;
  private readonly apiUrl = `${environment.apis.contenidos}/canciones`;
  private readonly favoritesUrl = `${environment.apis.contenidos}/favoritos`;
  private readonly purchasesUrl = `${environment.apis.contenidos}/compras`;

  private songs: Song[] = [...MOCK_SONGS];

  constructor(
    private http: HttpClient,
    private favoritosService: FavoritosService
  ) {}

  /**
   * Obtiene todas las canciones con filtros y paginación opcionales.
   *
   * @param params - Parámetros de filtrado, ordenamiento y paginación
   * @returns Observable con respuesta paginada de canciones
   */
  getAllSongs(params?: SongQueryParams): Observable<PaginatedSongsResponse> {
    return environment.useMock
      ? this.getAllSongsMock(params)
      : this.getAllSongsBackend(params);
  }

  /**
   * Obtiene una canción por su ID.
   *
   * @param id - ID de la canción
   * @returns Observable con los datos de la canción
   */
  getSongById(id: string): Observable<Song> {
    return environment.useMock
      ? this.getSongByIdMock(id)
      : this.http.get<any>(`${this.apiUrl}/${id}`).pipe(map(song => this.mapSongDto(song)));
  }

  /**
   * Obtiene todas las canciones de un álbum específico.
   *
   * @param albumId - ID del álbum
   * @returns Observable con array de canciones del álbum
   */
  getSongsByAlbum(albumId: string): Observable<Song[]> {
    if (environment.useMock) {
      const albumSongs = this.songs.filter(song =>
        song.albums?.some(a => a.id === albumId)
      );
      return of(albumSongs).pipe(delay(this.MOCK_DELAY));
    }
    return this.http.get<any[]>(`${this.apiUrl}/album/${albumId}`).pipe(
      map(songs => songs.map(song => this.mapSongDto(song)))
    );
  }

  /**
   * Obtiene todas las canciones de un artista específico.
   *
   * @param artistId - ID del artista
   * @returns Observable con array de canciones del artista
   */
  getSongsByArtist(artistId: string): Observable<Song[]> {
    if (environment.useMock) {
      const artistSongs = this.songs.filter(song => song.artist.id === artistId);
      return of(artistSongs).pipe(delay(this.MOCK_DELAY));
    }
    return this.http.get<any[]>(`${this.apiUrl}/artist/${artistId}`).pipe(
      map(songs => songs.map(song => this.mapSongDto(song)))
    );
  }

  /**
   * Busca canciones por término de búsqueda.
   * Busca en título, género y nombre artístico.
   *
   * @param query - Término de búsqueda
   * @returns Observable con array de canciones que coinciden
   */
  searchSongs(query: string): Observable<Song[]> {
    if (environment.useMock) {
      const q = query.toLowerCase();
      const results = this.songs.filter(song =>
        song.title.toLowerCase().includes(q) ||
        song.genre.toLowerCase().includes(q) ||
        song.artist.artisticName.toLowerCase().includes(q)
      );
      return of(results).pipe(delay(this.MOCK_DELAY));
    }

    return this.http.get<any[]>(`${this.apiUrl}/search`, {
      params: { q: query }
    }).pipe(map(songs => songs.map(song => this.mapSongDto(song))));
  }

  /**
   * Registra una reproducción de una canción.
   * Incrementa el contador de reproducciones.
   *
   * @param songId - ID de la canción reproducida
   * @returns Observable con ID de la canción y total de reproducciones actualizado
   */
  registerPlay(songId: string): Observable<{ id: string; totalPlays: number }> {
    if (environment.useMock) {
      const song = this.songs.find(s => s.id === songId);
      if (!song) {
        return throwError(() => new Error(`Song with ID ${songId} not found`));
      }
      song.playCount++;
      return of({ id: songId, totalPlays: song.playCount }).pipe(delay(this.MOCK_DELAY));
    }

    return this.http.post<any>(
      `${this.apiUrl}/${songId}/reproducir`,
      {}
    ).pipe(
      map(res => ({
        id: this.toStringId(res.id ?? res.songId ?? res.idCancion ?? songId),
        totalPlays: Number(res.totalReproducciones ?? res.totalPlays ?? res.reproducciones ?? 0)
      }))
    );
  }

  /**
   * Alterna el estado de favorito de una canción.
   * Agrega o elimina la canción de favoritos según su estado actual.
   *
   * @param songId - ID de la canción
   * @returns Observable con la canción actualizada
   */
  toggleFavorite(songId: string): Observable<Song> {
    if (environment.useMock) {
      const song = this.songs.find(s => s.id === songId);
      if (!song) {
        return throwError(() => new Error(`Song with ID ${songId} not found`));
      }
      song.isFavorite = !song.isFavorite;
      return of(song).pipe(delay(this.MOCK_DELAY));
    }

    return this.favoritosService.esCancionFavorita(Number(songId)).pipe(
      switchMap((isFavorite) => {
        if (isFavorite) {
          return this.favoritosService.eliminarCancionDeFavoritos(Number(songId)).pipe(
            map(() => ({ id: songId, isFavorite: false } as Song))
          );
        } else {
          return this.favoritosService.agregarCancionAFavoritos(Number(songId)).pipe(
            map(() => ({ id: this.toStringId(songId), isFavorite: true } as Song))
          );
        }
      })
    );
  }

  /**
   * Registra la compra de una canción.
   *
   * @param songId - ID de la canción a comprar
   * @returns Observable con la canción actualizada indicando que está comprada
   */
  purchaseSong(songId: string): Observable<Song> {
    if (environment.useMock) {
      const song = this.songs.find(s => s.id === songId);
      if (!song) {
        return throwError(() => new Error(`Song with ID ${songId} not found`));
      }
      song.isPurchased = true;
      return of(song).pipe(delay(this.MOCK_DELAY));
    }

    return this.http.get<boolean>(`${this.purchasesUrl}/canciones/${songId}/check`).pipe(
      map((isPurchased) => ({ id: this.toStringId(songId), isPurchased } as Song))
    );
  }

  /**
   * Obtiene todas las canciones gratuitas (precio = 0).
   *
   * @returns Observable con array de canciones gratuitas
   */
  getFreeSongs(): Observable<Song[]> {
    if (environment.useMock) {
      return of(this.songs.filter(song => song.price === 0)).pipe(delay(this.MOCK_DELAY));
    }
    return this.http.get<any[]>(`${this.apiUrl}/gratuitas`).pipe(
      map(songs => songs.map(song => this.mapSongDto(song)))
    );
  }

  /**
   * Obtiene todas las canciones marcadas como favoritas por el usuario actual.
   *
   * @returns Observable con array de canciones favoritas
   */
  getFavoriteSongs(): Observable<Song[]> {
    if (environment.useMock) {
      return of(this.songs.filter(song => song.isFavorite)).pipe(delay(this.MOCK_DELAY));
    }
    return this.http.get<any>(this.favoritesUrl, {
      params: new HttpParams().set('tipo', 'CANCIÓN')
    }).pipe(
      map((response) => {
        const items = response?.favoritos ?? response?.content ?? response ?? [];
        return (items as any[]).map(fav => {
          const song = fav?.cancion ?? fav;
          const mapped = this.mapSongDto(song);
          mapped.isFavorite = true;
          return mapped;
        });
      })
    );
  }

  /**
   * Obtiene todas las canciones compradas por el usuario actual.
   *
   * @returns Observable con array de canciones compradas
   */
  getPurchasedSongs(): Observable<Song[]> {
    if (environment.useMock) {
      return of(this.songs.filter(song => song.isPurchased)).pipe(delay(this.MOCK_DELAY));
    }
    return this.http.get<any>(this.purchasesUrl, {
      params: new HttpParams().set('tipo', 'CANCIÓN')
    }).pipe(
      map((response) => {
        const items = response?.content ?? response?.compras ?? response ?? [];
        return (items as any[]).map(item => {
          const song = item?.cancion ?? item?.song ?? item;
          const mapped = this.mapSongDto(song);
          mapped.isPurchased = true;
          return mapped;
        });
      })
    );
  }

  /**
   * Verifica si una canción está marcada como favorita.
   *
   * @param songId - ID de la canción
   * @returns Observable con true si es favorita, false en caso contrario
   */
  isSongFavorite(songId: string): Observable<boolean> {
    if (environment.useMock) {
      const song = this.songs.find(s => s.id === songId);
      return of(!!song?.isFavorite).pipe(delay(this.MOCK_DELAY));
    }
    return this.http.get<boolean>(`${this.favoritesUrl}/canciones/${songId}/check`);
  }

  /**
   * Verifica si una canción ha sido comprada por el usuario.
   *
   * @param songId - ID de la canción
   * @returns Observable con true si está comprada, false en caso contrario
   */
  isSongPurchased(songId: string): Observable<boolean> {
    if (environment.useMock) {
      const song = this.songs.find(s => s.id === songId);
      return of(!!song?.isPurchased).pipe(delay(this.MOCK_DELAY));
    }
    return this.http.get<boolean>(`${this.purchasesUrl}/canciones/${songId}/check`);
  }

  /**
   * Obtiene canciones filtradas por género.
   *
   * @param genre - Nombre del género
   * @returns Observable con array de canciones del género especificado
   */
  getSongsByGenre(genre: string): Observable<Song[]> {
    if (environment.useMock) {
      const g = genre.toLowerCase();
      const result = this.songs.filter(s => s.genre.toLowerCase() === g);
      return of(result).pipe(delay(this.MOCK_DELAY));
    }
    return this.http.get<any[]>(`${this.apiUrl}/genre/${genre}`).pipe(
      map(songs => songs.map(song => this.mapSongDto(song)))
    );
  }

  /**
   * Obtiene las canciones más reproducidas.
   *
   * @param limit - Número máximo de canciones a retornar (default: 10)
   * @returns Observable con array de canciones ordenadas por reproducciones
   */
  getMostPlayedSongs(limit: number = 10): Observable<Song[]> {
    if (environment.useMock) {
      const result = [...this.songs]
        .sort((a, b) => b.playCount - a.playCount)
        .slice(0, limit);
      return of(result).pipe(delay(this.MOCK_DELAY));
    }
    return this.http.get<any>(`${this.apiUrl}`, {
      params: new HttpParams()
        .set('orderBy', 'most_played')
        .set('limit', limit.toString())
    }).pipe(
      map(res => this.normalizeBackendResponse(res).content || [])
    );
  }

  /**
   * Obtiene las canciones más recientes.
   *
   * @param limit - Número máximo de canciones a retornar (default: 10)
   * @returns Observable con array de canciones ordenadas por fecha de lanzamiento
   */
  getRecentSongs(limit: number = 10): Observable<Song[]> {
    if (environment.useMock) {
      const result = [...this.songs]
        .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())
        .slice(0, limit);
      return of(result).pipe(delay(this.MOCK_DELAY));
    }
    return this.http.get<any[]>(`${this.apiUrl}/recent`, {
      params: { limit: limit.toString() }
    }).pipe(map(songs => songs.map(song => this.mapSongDto(song))));
  }

  /**
   * Obtiene las canciones mejor valoradas.
   *
   * @param limit - Número máximo de canciones a retornar (default: 10)
   * @returns Observable con array de canciones ordenadas por calificación promedio
   */
  getTopRatedSongs(limit: number = 10): Observable<Song[]> {
    if (environment.useMock) {
      const result = [...this.songs]
        .filter(s => s.averageRating !== null)
        .sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0))
        .slice(0, limit);
      return of(result).pipe(delay(this.MOCK_DELAY));
    }
    return this.http.get<any[]>(`${this.apiUrl}/top-rated`, {
      params: { limit: limit.toString() }
    }).pipe(map(songs => songs.map(song => this.mapSongDto(song))));
  }

  /**
   * Implementación mock de getAllSongs con filtrado y paginación local.
   */
  private getAllSongsMock(params?: SongQueryParams): Observable<PaginatedSongsResponse> {
    let filtered = [...this.songs];

    if (params?.artistId) {
      filtered = filtered.filter(song => song.artist.id === params.artistId);
    }

    if (params?.genre) {
      const g = params.genre.toLowerCase();
      filtered = filtered.filter(song => song.genre.toLowerCase() === g);
    }

    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(song =>
        song.title.toLowerCase().includes(q) ||
        song.genre.toLowerCase().includes(q) ||
        song.artist.artisticName.toLowerCase().includes(q)
      );
    }

    if (params?.minPrice !== undefined) {
      filtered = filtered.filter(song => song.price >= params.minPrice!);
    }
    if (params?.maxPrice !== undefined) {
      filtered = filtered.filter(song => song.price <= params.maxPrice!);
    }

    filtered = this.applySorting(filtered, params?.orderBy);

    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginated = filtered.slice(start, end);

    return of({
      songs: paginated,
      content: paginated,
      currentPage: page,
      totalPages: Math.ceil(filtered.length / limit),
      totalElements: filtered.length,
      elementsPerPage: limit,
      size: limit
    }).pipe(delay(this.MOCK_DELAY));
  }

  /**
   * Implementación mock de getSongById con búsqueda local.
   */
  private getSongByIdMock(id: string): Observable<Song> {
    const song = this.songs.find(s => s.id === id);
    if (!song) {
      return throwError(() => new Error(`Song with ID ${id} not found`));
    }
    return of(song).pipe(delay(this.MOCK_DELAY));
  }

  /**
   * Aplica ordenamiento a un array de canciones según el criterio especificado.
   *
   * @param songs - Array de canciones a ordenar
   * @param orderBy - Criterio de ordenamiento
   * @returns Array de canciones ordenado
   */
  private applySorting(songs: Song[], orderBy?: string): Song[] {
    switch (orderBy) {
      case 'most_recent':
        return songs.sort((a, b) =>
          new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
        );
      case 'oldest':
        return songs.sort((a, b) =>
          new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime()
        );
      case 'most_played':
        return songs.sort((a, b) => b.playCount - a.playCount);
      case 'best_rated':
        return songs.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
      case 'price_asc':
        return songs.sort((a, b) => a.price - b.price);
      case 'price_desc':
        return songs.sort((a, b) => b.price - a.price);
      default:
        return songs;
    }
  }

  /**
   * Implementación backend de getAllSongs con construcción de HttpParams.
   */
  private getAllSongsBackend(params?: SongQueryParams): Observable<PaginatedSongsResponse> {
    let httpParams = new HttpParams();

    const genreValue = params?.genreId ?? params?.genre;
    if (genreValue) httpParams = httpParams.set('genreId', genreValue);
    if (params?.artistId) httpParams = httpParams.set('artistId', params.artistId);
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.orderBy) httpParams = httpParams.set('orderBy', params.orderBy);
    if (params?.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit !== undefined) httpParams = httpParams.set('limit', params.limit.toString());
    if (params?.minPrice !== undefined) {
      httpParams = httpParams.set('minPrice', params.minPrice.toString());
    }
    if (params?.maxPrice !== undefined) {
      httpParams = httpParams.set('maxPrice', params.maxPrice.toString());
    }

    return this.http.get<any>(`${this.apiUrl}`, { params: httpParams }).pipe(
      map(res => this.normalizeBackendResponse(res))
    );
  }

  /**
   * Normaliza la respuesta del backend a formato estándar PaginatedSongsResponse.
   * Maneja múltiples variaciones de nombres de campos del backend.
   *
   * @param response - Respuesta raw del backend
   * @returns Respuesta normalizada
   */
  private normalizeBackendResponse(response: any): PaginatedSongsResponse {
    const rawContent = response?.canciones || response?.songs || response?.content || response?.items || [];
    const content = Array.isArray(rawContent) ? rawContent.map(song => this.mapSongDto(song)) : [];

    const currentPage = Number(response?.paginaActual ?? response?.page ?? response?.currentPage ?? 1);
    const totalPages = Number(response?.totalPaginas ?? response?.totalPages ?? response?.pages ?? 1);
    const totalElements = Number(response?.totalElementos ?? response?.totalElements ?? content.length);
    const size = Number(response?.elementosPorPagina ?? response?.size ?? response?.limit ?? content.length);

    return {
      songs: content,
      content,
      currentPage,
      totalPages,
      totalElements,
      elementsPerPage: size,
      size
    };
  }

  /**
   * Mapea un DTO de canción del backend al modelo Song del frontend.
   * Maneja múltiples variaciones de nombres de campos para compatibilidad.
   *
   * @param dto - Objeto DTO del backend
   * @returns Objeto Song normalizado
   */
  private mapSongDto(dto: any): Song {
    if (!dto) {
      return {
        id: '',
        title: '',
        artist: { id: '', artisticName: '', profileImage: null },
        duration: 0,
        genre: '',
        price: 0,
        coverUrl: '',
        audioUrl: '',
        playCount: 0,
        releaseDate: '',
        averageRating: null,
        description: '',
        totalComments: 0,
        isFavorite: false,
        isPurchased: false,
        albums: []
      };
    }

    const mappedArtist = this.mapArtist(
      dto.artist ?? dto.artista,
      dto.artistId ?? dto.idArtista,
      dto.artistName ?? dto.artistaNombre
    );

    const genreValue = typeof dto.genre === 'object'
      ? (dto.genre?.nombre ?? dto.genre?.name ?? '')
      : (dto.genre ?? dto.genero ?? dto.genreName ?? '');

    const albums = this.mapAlbumsFromSong(dto.albums ?? dto.albumes ?? dto.albumList ?? dto.albumDtos ?? []);
    const averageRatingRaw = dto.averageRating ?? dto.promedioCalificacion ?? dto.rating ?? dto.valoracionMedia ?? null;
    const averageRating = averageRatingRaw === null || averageRatingRaw === undefined ? null : Number(averageRatingRaw);
    const totalComments = Number(dto.totalComments ?? dto.totalComentarios ?? 0);
    const description = dto.description ?? dto.descripcion ?? '';

    return {
      id: this.toStringId(dto.id ?? dto.idCancion ?? dto.songId),
      title: dto.title ?? dto.titulo ?? dto.tituloCancion ?? dto.nombre ?? '',
      artist: mappedArtist,
      duration: Number(dto.duration ?? dto.duracionSegundos ?? dto.duracion ?? dto.duracionMs ?? 0),
      genre: genreValue,
      price: Number(dto.price ?? dto.precioCancion ?? dto.precio ?? dto.precioVenta ?? 0),
      coverUrl: dto.coverUrl ?? dto.urlPortada ?? dto.portada ?? dto.portadaUrl ?? dto.coverImageUrl ?? '',
      audioUrl: dto.audioUrl ?? dto.urlAudio ?? dto.audio ?? dto.audioUrl ?? '',
      playCount: Number(dto.playCount ?? dto.reproducciones ?? dto.totalReproducciones ?? dto.reproduccionCount ?? 0),
      releaseDate: dto.releaseDate ?? dto.fechaPublicacion ?? dto.publicadoEn ?? dto.fechaLanzamiento ?? '',
      averageRating,
      description,
      totalComments,
      isFavorite: !!(dto.isFavorite ?? dto.favorito ?? false),
      isPurchased: !!(dto.isPurchased ?? dto.comprado ?? false),
      albums
    };
  }

  /**
   * Mapea un array de álbumes del DTO a objetos SongAlbumSummary.
   *
   * @param albums - Array de álbumes desde el backend
   * @returns Array de SongAlbumSummary normalizado
   */
  private mapAlbumsFromSong(albums: any[]): SongAlbumSummary[] {
    if (!Array.isArray(albums)) return [];
    return albums.map((album: any) => ({
      id: this.toStringId(album?.id ?? album?.idAlbum ?? album?.albumId),
      title: album?.title ?? album?.titulo ?? album?.tituloAlbum ?? album?.nombre ?? '',
      coverUrl: album?.coverUrl ?? album?.urlPortada ?? album?.portada ?? '',
      trackNumber: album?.trackNumber ?? album?.numeroPista
    }));
  }

  /**
   * Mapea datos de artista del backend al modelo SongArtist.
   * Utiliza valores de fallback si el objeto artista no está completo.
   *
   * @param artistLike - Objeto artista desde el backend
   * @param fallbackId - ID alternativo si no está presente en artistLike
   * @param fallbackName - Nombre alternativo si no está presente en artistLike
   * @returns Objeto SongArtist normalizado
   */
  private mapArtist(artistLike: any, fallbackId?: any, fallbackName?: any): SongArtist {
    const artist: any = artistLike || {};
    const userIdValue = artist.userId ?? artist.idUsuario ?? artist.usuarioId ?? artist?.usuario?.id ?? null;
    const slugValue = artist.slug ?? artist.slugArtistico ?? null;
    const bioValue = artist.bio ?? artist.biografiaArtistico ?? artist.biografia ?? null;

    return {
      id: this.toStringId(artist.id ?? fallbackId ?? artist.artistId ?? artist.idArtista),
      artisticName: artist.artisticName ?? artist.nombreArtistico ?? artist.nombre ?? fallbackName ?? '',
      profileImage: artist.profileImage ?? artist.fotoPerfilArtistico ?? artist.fotoPerfil ?? artist.profileImageUrl ?? null,
      userId: userIdValue === null || userIdValue === undefined ? null : this.toStringId(userIdValue),
      slug: slugValue,
      bio: bioValue
    };
  }

  /**
   * Convierte un valor a string de forma segura.
   * Retorna string vacío si el valor es null o undefined.
   *
   * @param value - Valor a convertir
   * @returns Representación en string del valor
   */
  private toStringId(value: any): string {
    if (value === undefined || value === null) {
      return '';
    }
    return value.toString();
  }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, map, switchMap } from 'rxjs/operators';
import { Album, AlbumTrack } from '../models/album.model';
import { Song, SongArtist } from '../models/song.model';
import { MOCK_ALBUMS } from '../mocks/mocks-albums';
import { environment } from '../../../enviroments/enviroment';
import { FavoritosService } from './favoritos.service';

/**
 * Respuesta paginada compatible con distintos formatos de backend y con los mocks.
 */
export interface PaginatedAlbumsResponse {
  albums?: Album[];
  content?: Album[];

  currentPage: number;
  totalPages: number;
  totalElements: number;
  elementsPerPage?: number;
  size?: number;
}

/**
 * Parámetros aceptados para consultas de álbumes.
 */
export interface AlbumQueryParams {
  genre?: string;
  genreId?: string;
  artistId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  orderBy?: 'most_recent' | 'oldest' | 'best_rated' | 'price_asc' | 'price_desc';
  page?: number;
  limit?: number;
}

/**
 * DTO para añadir una pista a un álbum.
 */
export interface AddTrackToAlbumDto {
  songId: string;
  trackNumber: number;
}

/**
 * Servicio encargado de la gestión de álbumes, incluyendo:
 * - Obtención de álbumes (backend o mock)
 * - Búsqueda y filtrado
 * - Estado de favoritos y compras
 * - Mapeo y normalización de respuestas del backend
 *
 * El servicio respeta la configuración `environment.useMock` para
 * redirigir llamadas al conjunto de mocks local cuando sea necesario.
 */
@Injectable({
  providedIn: 'root'
})
export class AlbumService {
  private readonly MOCK_DELAY = 300;
  private readonly apiUrl = `${environment.apis.contenidos}/albumes`;
  private readonly favoritesUrl = `${environment.apis.contenidos}/favoritos`;
  private readonly purchasesUrl = `${environment.apis.contenidos}/compras`;

  // Almacenamiento local de mocks para modo `useMock`
  private albums: Album[] = [...MOCK_ALBUMS];

  constructor(
    private http: HttpClient,
    private readonly favoritosService: FavoritosService
  ) {}

  // ===============================================================
  // API PÚBLICA
  // ===============================================================

  /**
   * Obtiene una lista paginada de álbumes según los parámetros indicados.
   *
   * @param params Parámetros de consulta opcionales (filtro, orden, paginado).
   * @returns Observable con la respuesta paginada normalizada.
   */
  getAllAlbums(params?: AlbumQueryParams): Observable<PaginatedAlbumsResponse> {
    return environment.useMock
      ? this.getAllAlbumsMock(params)
      : this.getAllAlbumsBackend(params);
  }

  /**
   * Obtiene un álbum por su identificador.
   *
   * @param id Identificador del álbum.
   * @returns Observable con el álbum mapeado.
   */
  getAlbumById(id: string): Observable<Album> {
    return environment.useMock
      ? this.getAlbumByIdMock(id)
      : this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
        map(album => this.mapAlbumDto(album))
      );
  }

  /**
   * Obtiene todos los álbumes de un artista.
   *
   * @param artistId Identificador del artista.
   * @returns Observable con la lista de álbumes del artista.
   */
  getAlbumsByArtist(artistId: string): Observable<Album[]> {
    if (environment.useMock) {
      const result = this.albums.filter(album => album.artistId === artistId);
      return of(result).pipe(delay(this.MOCK_DELAY));
    }
    return this.http.get<any[]>(`${this.apiUrl}/artist/${artistId}`).pipe(
      map(albums => albums.map(album => this.mapAlbumDto(album)))
    );
  }

  /**
   * Busca álbumes mediante una cadena de texto.
   *
   * @param query Texto de búsqueda.
   * @returns Observable con la lista de álbumes que coinciden.
   */
  searchAlbums(query: string): Observable<Album[]> {
    if (environment.useMock) {
      const q = query.toLowerCase();
      const result = this.albums.filter(album =>
        album.title.toLowerCase().includes(q) ||
        (album.description?.toLowerCase().includes(q)) ||
        album.genre.toLowerCase().includes(q) ||
        album.artist.artisticName.toLowerCase().includes(q)
      );
      return of(result).pipe(delay(this.MOCK_DELAY));
    }

    return this.http.get<any[]>(`${this.apiUrl}/search`, {
      params: { q: query }
    }).pipe(
      map(albums => albums.map(album => this.mapAlbumDto(album)))
    );
  }

  /**
   * Devuelve álbumes que contienen pistas (trackList no vacía).
   *
   * @returns Observable con la lista de álbumes que tienen pistas.
   */
  getAlbumsWithTracks(): Observable<Album[]> {
    if (environment.useMock) {
      const result = this.albums.filter(a => a.trackList.length > 0);
      return of(result).pipe(delay(this.MOCK_DELAY));
    }
    return this.getAllAlbumsBackend().pipe(
      map(response => response.content ?? response.albums ?? [])
    );
  }

  /**
   * Obtiene la lista de pistas de un álbum, ordenadas por número de pista.
   *
   * @param albumId Identificador del álbum.
   * @returns Observable con la lista de pistas del álbum.
   */
  getAlbumTracks(albumId: string): Observable<Album['trackList']> {
    if (environment.useMock) {
      const album = this.albums.find(a => a.id === albumId);
      if (!album) {
        return throwError(() => new Error(`Album with ID ${albumId} not found`));
      }
      return of([...album.trackList].sort((a, b) => a.trackNumber - b.trackNumber))
        .pipe(delay(this.MOCK_DELAY));
    }

    return this.http.get<any[]>(`${this.apiUrl}/${albumId}/tracks`).pipe(
      map(tracks => tracks.map(track => this.mapAlbumTrack(track)).sort((a, b) => a.trackNumber - b.trackNumber))
    );
  }

  /**
   * Alterna el estado de favorito de un álbum. En backend utiliza FavoritosService
   * para mantener consistencia entre álbum y canciones asociadas.
   *
   * @param albumId Identificador del álbum.
   * @returns Observable con el álbum actualizado (solo campos relevantes en backend).
   */
  toggleFavorite(albumId: string): Observable<Album> {
    if (environment.useMock) {
      const album = this.albums.find(a => a.id === albumId);
      if (!album) {
        return throwError(() => new Error(`Album with ID ${albumId} not found`));
      }
      const newFavoriteState = !album.isFavorite;
      album.isFavorite = newFavoriteState;

      // Actualiza el estado de favorito de las pistas del álbum
      album.trackList.forEach(track => {
        track.isFavorite = newFavoriteState;
      });

      return of(album).pipe(delay(this.MOCK_DELAY));
    }

    // En backend: comprobar estado actual y agregar/eliminar usando FavoritosService
    return this.favoritosService.esAlbumFavorito(Number(albumId)).pipe(
      switchMap((isFavorite) => {
        return this.getAlbumTracks(albumId).pipe(
          switchMap((tracks) => {
            const songIds = tracks.map(track => Number(track.id)).filter(id => !isNaN(id));

            if (isFavorite) {
              // Eliminar de favoritos (álbum y canciones)
              return this.favoritosService.eliminarAlbumConCancionesDeFavoritos(Number(albumId), songIds).pipe(
                map(() => ({ id: albumId, isFavorite: false } as Album))
              );
            } else {
              // Agregar a favoritos (álbum y canciones)
              return this.favoritosService.agregarAlbumConCancionesAFavoritos(Number(albumId), songIds).pipe(
                map(() => ({ id: this.toStringId(albumId), isFavorite: true } as Album))
              );
            }
          })
        );
      })
    );
  }

  /**
   * Marca un álbum como comprado en modo mock o consulta el estado de compra en backend.
   *
   * @param albumId Identificador del álbum.
   * @returns Observable con el álbum (o estado de compra) correspondiente.
   */
  purchaseAlbum(albumId: string): Observable<Album> {
    if (environment.useMock) {
      const album = this.albums.find(a => a.id === albumId);
      if (!album) {
        return throwError(() => new Error(`Album with ID ${albumId} not found`));
      }
      album.isPurchased = true;
      return of(album).pipe(delay(this.MOCK_DELAY));
    }

    return this.http.get<boolean>(`${this.purchasesUrl}/albumes/${albumId}/check`).pipe(
      map((isPurchased) => ({ id: this.toStringId(albumId), isPurchased } as Album))
    );
  }

  /**
   * Obtiene los álbumes marcados como favoritos.
   *
   * @returns Observable con la lista de álbumes en favoritos.
   */
  getFavoriteAlbums(): Observable<Album[]> {
    if (environment.useMock) {
      return of(this.albums.filter(a => a.isFavorite)).pipe(delay(this.MOCK_DELAY));
    }
    return this.http.get<any>(this.favoritesUrl, {
      params: new HttpParams().set('tipo', 'ÁLBUM')
    }).pipe(
      map((response) => {
        const items = response?.favoritos ?? response?.content ?? response ?? [];
        return (items as any[]).map(fav => {
          const album = fav?.album ?? fav;
          const mapped = this.mapAlbumDto(album);
          mapped.isFavorite = true;
          return mapped;
        });
      })
    );
  }

  /**
   * Obtiene los álbumes adquiridos por el usuario.
   *
   * @returns Observable con la lista de álbumes comprados.
   */
  getPurchasedAlbums(): Observable<Album[]> {
    if (environment.useMock) {
      return of(this.albums.filter(a => a.isPurchased)).pipe(delay(this.MOCK_DELAY));
    }
    return this.http.get<any>(this.purchasesUrl, {
      params: new HttpParams().set('tipo', 'ÁLBUM')
    }).pipe(
      map((response) => {
        const items = response?.content ?? response?.compras ?? response ?? [];
        return (items as any[]).map(item => {
          const album = item?.album ?? item?.albumDto ?? item;
          const mapped = this.mapAlbumDto(album);
          mapped.isPurchased = true;
          return mapped;
        });
      })
    );
  }

  /**
   * Obtiene álbumes filtrados por género.
   *
   * @param genre Nombre del género.
   * @returns Observable con la lista de álbumes del género solicitado.
   */
  getAlbumsByGenre(genre: string): Observable<Album[]> {
    if (environment.useMock) {
      const g = genre.toLowerCase();
      const result = this.albums.filter(a => a.genre.toLowerCase() === g);
      return of(result).pipe(delay(this.MOCK_DELAY));
    }
    return this.http.get<any[]>(`${this.apiUrl}/genre/${genre}`).pipe(
      map(albums => albums.map(album => this.mapAlbumDto(album)))
    );
  }

  /**
   * Obtiene los álbumes gratuitos (precio 0).
   *
   * @returns Observable con los álbumes gratuitos.
   */
  getFreeAlbums(): Observable<Album[]> {
    if (environment.useMock) {
      return of(this.albums.filter(a => a.price === 0)).pipe(delay(this.MOCK_DELAY));
    }
    return this.http.get<Album[]>(`${this.apiUrl}/gratuitos`);
  }

  /**
   * Obtiene los álbumes mejor valorados.
   *
   * @param limit Límite de resultados a retornar. Por defecto 10.
   * @returns Observable con los álbumes top valorados.
   */
  getTopRatedAlbums(limit: number = 10): Observable<Album[]> {
    if (environment.useMock) {
      const result = [...this.albums]
        .filter(a => a.averageRating !== null && a.averageRating !== undefined)
        .sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0))
        .slice(0, limit);

      return of(result).pipe(delay(this.MOCK_DELAY));
    }

    return this.http.get<any[]>(`${this.apiUrl}/top-rated`, {
      params: { limit: limit.toString() }
    }).pipe(map(albums => albums.map(album => this.mapAlbumDto(album))));
  }

  /**
   * Obtiene los álbumes más reproducidos.
   *
   * @param limit Límite de resultados a retornar. Por defecto 10.
   * @returns Observable con los álbumes más reproducidos.
   */
  getMostPlayedAlbums(limit: number = 10): Observable<Album[]> {
    if (environment.useMock) {
      const result = [...this.albums]
        .sort((a, b) => b.totalPlayCount - a.totalPlayCount)
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
   * Obtiene los álbumes recientes ordenados por fecha de publicación.
   *
   * @param limit Límite de resultados a retornar. Por defecto 10.
   * @returns Observable con los álbumes más recientes.
   */
  getRecentAlbums(limit: number = 10): Observable<Album[]> {
    if (environment.useMock) {
      const result = [...this.albums]
        .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())
        .slice(0, limit);

      return of(result).pipe(delay(this.MOCK_DELAY));
    }

    return this.http.get<any[]>(`${this.apiUrl}/recent`, {
      params: { limit: limit.toString() }
    }).pipe(map(albums => albums.map(album => this.mapAlbumDto(album))));
  }

  /**
   * Obtiene la duración total de un álbum.
   *
   * @param albumId Identificador del álbum.
   * @returns Observable con la duración total en segundos.
   */
  getTotalDuration(albumId: string): Observable<number> {
    return this.getAlbumById(albumId).pipe(
      map(album => album.totalDuration)
    );
  }

  /**
   * Añade una pista a un álbum.
   *
   * @param albumId Identificador del álbum.
   * @param dto Datos de la pista a añadir.
   * @returns Observable que completa cuando la operación finaliza.
   */
  addTrackToAlbum(albumId: string, dto: AddTrackToAlbumDto): Observable<void> {
    if (environment.useMock) {
      return of(void 0).pipe(delay(this.MOCK_DELAY));
    }
    return this.http.post<void>(`${this.apiUrl}/${albumId}/tracks`, dto);
  }

  /**
   * Elimina una pista de un álbum.
   *
   * @param albumId Identificador del álbum.
   * @param songId Identificador de la canción a eliminar.
   * @returns Observable que completa cuando la operación finaliza.
   */
  removeTrackFromAlbum(albumId: string, songId: string): Observable<void> {
    if (environment.useMock) {
      return of(void 0).pipe(delay(this.MOCK_DELAY));
    }
    return this.http.delete<void>(`${this.apiUrl}/${albumId}/tracks/${songId}`);
  }

  // ===============================================================
  // MODO MOCK (métodos privados)
  // ===============================================================

  /**
   * Implementación de `getAllAlbums` en modo mock.
   *
   * @param params Parámetros de consulta.
   * @returns Observable con la respuesta paginada simulada.
   * @internal
   */
  private getAllAlbumsMock(params?: AlbumQueryParams): Observable<PaginatedAlbumsResponse> {
    let filtered = [...this.albums];

    // Filtrado por artista
    if (params?.artistId) {
      filtered = filtered.filter(a => a.artistId === params.artistId);
    }

    // Filtrado por género
    if (params?.genre) {
      const g = params.genre.toLowerCase();
      filtered = filtered.filter(a => a.genre.toLowerCase() === g);
    }

    // Búsqueda por texto
    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(q) ||
        (a.description && a.description.toLowerCase().includes(q)) ||
        a.genre.toLowerCase().includes(q) ||
        a.artist.artisticName.toLowerCase().includes(q)
      );
    }

    // Filtrado por precio
    if (params?.minPrice !== undefined) {
      filtered = filtered.filter(a => a.price >= params.minPrice!);
    }
    if (params?.maxPrice !== undefined) {
      filtered = filtered.filter(a => a.price <= params.maxPrice!);
    }

    // Ordenamiento
    filtered = this.applySorting(filtered, params?.orderBy);

    // Paginación
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const start = (page - 1) * limit;
    const result = filtered.slice(start, start + limit);

    return of({
      albums: result,
      content: result,
      currentPage: page,
      totalPages: Math.ceil(filtered.length / limit),
      totalElements: filtered.length,
      elementsPerPage: limit,
      size: limit
    }).pipe(delay(this.MOCK_DELAY));
  }

  /**
   * Obtiene un álbum del conjunto de mocks por ID.
   *
   * @param id Identificador del álbum.
   * @returns Observable con el álbum o error si no se encuentra.
   * @internal
   */
  private getAlbumByIdMock(id: string): Observable<Album> {
    const album = this.albums.find(a => a.id === id);
    if (!album) {
      return throwError(() => new Error(`Album with ID ${id} not found`));
    }
    return of(album).pipe(delay(this.MOCK_DELAY));
  }

  /**
   * Aplica ordenamiento según el criterio indicado.
   *
   * @param albums Lista de álbumes a ordenar.
   * @param orderBy Criterio de ordenamiento.
   * @returns Lista ordenada.
   * @internal
   */
  private applySorting(albums: Album[], orderBy?: string): Album[] {
    switch (orderBy) {
      case 'most_recent':
        return albums.sort((a, b) =>
          new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
        );
      case 'oldest':
        return albums.sort((a, b) =>
          new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime()
        );
      case 'best_rated':
        return albums.sort((a, b) =>
          (b.averageRating ?? 0) - (a.averageRating ?? 0)
        );
      case 'price_asc':
        return albums.sort((a, b) => a.price - b.price);
      case 'price_desc':
        return albums.sort((a, b) => b.price - a.price);
      default:
        return albums;
    }
  }

  // ===============================================================
  // MODO BACKEND (métodos privados)
  // ===============================================================

  /**
   * Construye y ejecuta la llamada al backend para obtener álbumes.
   *
   * @param params Parámetros opcionales de consulta.
   * @returns Observable con la respuesta paginada normalizada.
   * @internal
   */
  private getAllAlbumsBackend(params?: AlbumQueryParams): Observable<PaginatedAlbumsResponse> {
    let httpParams = new HttpParams();

    const genreValue = params?.genreId ?? params?.genre;
    if (genreValue) httpParams = httpParams.set('genreId', genreValue);
    if (params?.artistId) httpParams = httpParams.set('artistId', params.artistId);
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.orderBy) httpParams = httpParams.set('orderBy', params.orderBy);
    if (params?.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
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
   * Normaliza distintas formas de respuesta del backend a un formato paginado esperado.
   *
   * @param response Respuesta original del backend.
   * @returns Respuesta normalizada con contenido mapeado a Album.
   * @internal
   */
  private normalizeBackendResponse(response: any): PaginatedAlbumsResponse {
    const rawContent = response?.albumes || response?.albums || response?.content || response?.items || [];
    const content = Array.isArray(rawContent) ? rawContent.map(album => this.mapAlbumDto(album)) : [];

    const currentPage = Number(response?.paginaActual ?? response?.page ?? response?.currentPage ?? 1);
    const totalPages = Number(response?.totalPaginas ?? response?.totalPages ?? response?.pages ?? 1);
    const totalElements = Number(response?.totalElementos ?? response?.totalElements ?? content.length);
    const size = Number(response?.elementosPorPagina ?? response?.size ?? response?.limit ?? content.length);

    return {
      albums: content,
      content,
      currentPage,
      totalPages,
      totalElements,
      elementsPerPage: size,
      size
    };
  }

  /**
   * Mapea un DTO de backend a la entidad Album utilizada por el frontend.
   *
   * @param dto Objeto recibido desde el backend o mocks.
   * @returns Album mapeado con valores por defecto cuando faltan propiedades.
   * @internal
   */
  private mapAlbumDto(dto: any): Album {
    if (!dto) {
      return {
        id: '',
        title: '',
        description: '',
        coverUrl: '',
        releaseDate: '',
        genre: '',
        price: 0,
        totalDuration: 0,
        totalTracks: 0,
        totalPlayCount: 0,
        averageRating: null,
        totalComments: 0,
        artist: { id: '', artisticName: '', profileImage: null },
        artistId: '',
        trackList: [],
        isFavorite: false,
        isPurchased: false
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

    const trackListSource = dto.trackList ?? dto.tracks ?? dto.canciones ?? dto.albumCanciones ?? dto.albumTracks ?? [];
    const trackList = Array.isArray(trackListSource)
      ? trackListSource.map((t: any) => this.mapAlbumTrack(t)).sort((a, b) => a.trackNumber - b.trackNumber)
      : [];

    const averageRatingRaw = dto.averageRating ?? dto.promedioCalificacion ?? dto.rating ?? dto.valoracionMedia ?? null;
    const averageRating = averageRatingRaw === null || averageRatingRaw === undefined ? null : Number(averageRatingRaw);
    const totalComments = Number(dto.totalComments ?? dto.totalComentarios ?? 0);

    return {
      id: this.toStringId(dto.id ?? dto.idAlbum ?? dto.albumId),
      title: dto.title ?? dto.titulo ?? dto.tituloAlbum ?? dto.nombre ?? '',
      description: dto.description ?? dto.descripcion ?? '',
      coverUrl: dto.coverUrl ?? dto.urlPortada ?? dto.portada ?? dto.portadaUrl ?? dto.coverImageUrl ?? '',
      releaseDate: dto.releaseDate ?? dto.fechaPublicacion ?? dto.publicadoEn ?? dto.fechaLanzamiento ?? '',
      genre: genreValue,
      price: Number(dto.price ?? dto.precioAlbum ?? dto.precio ?? 0),
      totalDuration: Number(dto.totalDuration ?? dto.duracionTotalSegundos ?? dto.duracionTotal ?? dto.duracionSegundos ?? 0),
      totalTracks: Number(dto.totalTracks ?? dto.totalCanciones ?? dto.cantidadCanciones ?? trackList.length),
      totalPlayCount: Number(dto.totalPlayCount ?? dto.totalReproducciones ?? dto.reproducciones ?? 0),
      averageRating,
      totalComments,
      artist: mappedArtist,
      artistId: this.toStringId(dto.artistId ?? dto.idArtista ?? mappedArtist.id),
      trackList,
      isFavorite: !!(dto.isFavorite ?? dto.favorito ?? false),
      isPurchased: !!(dto.isPurchased ?? dto.comprado ?? false)
    };
  }

  /**
   * Mapea un objeto de pista/track desde backend a AlbumTrack.
   *
   * @param track Objeto de pista recibido del backend o fuente de datos.
   * @returns AlbumTrack mapeado para el frontend.
   * @internal
   */
  private mapAlbumTrack(track: any): AlbumTrack {
    const songData = track?.song ?? track?.cancion ?? track ?? {};
    const mappedSong = this.mapSongFromTrack(songData, track);
    return {
      ...mappedSong,
      trackNumber: Number(track?.trackNumber ?? track?.numeroPista ?? track?.orden ?? track?.track ?? track?.position ?? 0),
      addedDate: track?.addedDate ?? track?.fechaAgregado ?? track?.fechaAgregadoAlAlbum ?? track?.fecha ?? mappedSong.releaseDate
    };
  }

  /**
   * Mapea la información de una canción contenida en un track a la entidad Song del frontend.
   *
   * @param dto Objeto con datos de la canción.
   * @param track Objeto track que puede contener información adicional relacionada.
   * @returns Song mapeada.
   * @internal
   */
  private mapSongFromTrack(dto: any, track?: any): Song {
    const mappedArtist = this.mapArtist(
      dto?.artist ?? dto?.artista,
      dto?.artistId ?? dto?.idArtista,
      dto?.artistName ?? dto?.artistaNombre
    );

    const genreValue = typeof dto?.genre === 'object'
      ? (dto?.genre?.nombre ?? dto?.genre?.name ?? '')
      : (dto?.genre ?? dto?.genero ?? dto?.genreName ?? track?.genero ?? '');

    const albums = dto?.albums ?? dto?.albumes ?? [];

    return {
      id: this.toStringId(dto?.id ?? dto?.idCancion ?? dto?.songId ?? track?.idCancion),
      title: dto?.title ?? dto?.titulo ?? dto?.tituloCancion ?? dto?.nombre ?? track?.tituloCancion ?? '',
      artist: mappedArtist,
      duration: Number(dto?.duration ?? dto?.duracionSegundos ?? dto?.duracion ?? dto?.duracionMs ?? track?.duracionSegundos ?? 0),
      genre: genreValue,
      price: Number(dto?.price ?? dto?.precioCancion ?? dto?.precio ?? dto?.precioVenta ?? track?.precioCancion ?? 0),
      coverUrl: dto?.coverUrl ?? dto?.urlPortada ?? dto?.portada ?? dto?.portadaUrl ?? dto?.coverImageUrl ?? track?.urlPortada ?? '',
      audioUrl: dto?.audioUrl ?? dto?.urlAudio ?? dto?.audio ?? track?.urlAudio ?? '',
      playCount: Number(track?.reproducciones ?? dto?.playCount ?? dto?.reproducciones ?? dto?.totalReproducciones ?? dto?.reproduccionCount ?? 0),
      releaseDate: dto?.releaseDate ?? dto?.fechaPublicacion ?? dto?.publicadoEn ?? dto?.fechaLanzamiento ?? '',
      averageRating: null,
      description: dto?.description ?? dto?.descripcion ?? '',
      isFavorite: false,
      isPurchased: false,
      albums: Array.isArray(albums)
        ? albums.map((album: any) => ({
          id: this.toStringId(album?.id ?? album?.idAlbum ?? album?.albumId),
          title: album?.title ?? album?.titulo ?? album?.tituloAlbum ?? album?.nombre ?? '',
          coverUrl: album?.coverUrl ?? album?.urlPortada ?? album?.portada ?? album?.portadaUrl ?? ''
        }))
        : []
    };
  }

  /**
   * Convierte un valor a cadena para usar como identificador en frontend.
   *
   * @param value Valor original del identificador.
   * @returns Cadena representando el id o cadena vacía si value es null/undefined.
   * @internal
   */
  private toStringId(value: any): string {
    if (value === undefined || value === null) {
      return '';
    }
    return value.toString();
  }

  /**
   * Mapea diferentes formas de representación de artista del backend a SongArtist.
   *
   * @param artistLike Objeto que puede representar un artista en varias formas.
   * @param fallbackId Identificador alternativo si no existe en `artistLike`.
   * @param fallbackName Nombre alternativo si no existe en `artistLike`.
   * @returns SongArtist mapeado.
   * @internal
   */
  private mapArtist(artistLike: any, fallbackId?: any, fallbackName?: any): SongArtist {
    const artist: any = artistLike || {};
    const userIdValue = artist.userId ?? artist.idUsuario ?? artist.usuarioId ?? artist?.usuario?.id ?? null;
    return {
      id: this.toStringId(artist.id ?? fallbackId ?? artist.artistId ?? artist.idArtista),
      artisticName: artist.artisticName ?? artist.nombreArtistico ?? artist.nombre ?? fallbackName ?? '',
      profileImage: artist.profileImage ?? artist.fotoPerfilArtistico ?? artist.fotoPerfil ?? artist.profileImageUrl ?? null,
      userId: userIdValue === null || userIdValue === undefined ? null : this.toStringId(userIdValue),
      slug: artist.slug ?? artist.slugArtistico ?? null,
      bio: artist.bio ?? artist.biografiaArtistico ?? artist.biografia ?? null
    };
  }

  /**
   * Comprueba si un álbum está en favoritos.
   *
   * @param albumId Identificador del álbum.
   * @returns Observable que indica si el álbum está en favoritos.
   */
  isAlbumFavorite(albumId: string): Observable<boolean> {
    if (environment.useMock) {
      const album = this.albums.find(a => a.id === albumId);
      return of(!!album?.isFavorite).pipe(delay(this.MOCK_DELAY));
    }
    return this.http.get<boolean>(`${this.favoritesUrl}/albumes/${albumId}/check`);
  }

  /**
   * Comprueba si un álbum ha sido comprado.
   *
   * @param albumId Identificador del álbum.
   * @returns Observable que indica si el álbum ha sido comprado.
   */
  isAlbumPurchased(albumId: string): Observable<boolean> {
    if (environment.useMock) {
      const album = this.albums.find(a => a.id === albumId);
      return of(!!album?.isPurchased).pipe(delay(this.MOCK_DELAY));
    }
    return this.http.get<boolean>(`${this.purchasesUrl}/albumes/${albumId}/check`);
  }
}

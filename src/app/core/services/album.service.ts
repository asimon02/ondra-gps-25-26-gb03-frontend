// src/app/services/album.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, map, switchMap, catchError } from 'rxjs/operators';
import { Album, AlbumTrack } from '../models/album.model';
import { Song, SongArtist } from '../models/song.model';
import { MOCK_ALBUMS } from '../mocks/mocks-albums';
import { environment } from '../../../enviroments/enviroment';

/**
 * Respuesta paginada compatible con Spring Boot y mocks
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

export interface AlbumQueryParams {
  genre?: string; // Cambio: genreId a genre (string directo)
  genreId?: string;
  artistId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  orderBy?: 'most_recent' | 'oldest' | 'best_rated' | 'price_asc' | 'price_desc';
  page?: number;
  limit?: number;
}

export interface AddTrackToAlbumDto {
  songId: string; // Cambio: number a string
  trackNumber: number;
}

@Injectable({
  providedIn: 'root'
})
export class AlbumService {
  private readonly MOCK_DELAY = 300;
  private readonly apiUrl = `${environment.apis.contenidos}/albumes`;
  private readonly favoritesUrl = `${environment.apis.contenidos}/favoritos`;
  private readonly purchasesUrl = `${environment.apis.contenidos}/compras`;

  // Mock
  private albums: Album[] = [...MOCK_ALBUMS];

  constructor(private http: HttpClient) {}

  // ===============================================================
  // PUBLIC API
  // ===============================================================

  getAllAlbums(params?: AlbumQueryParams): Observable<PaginatedAlbumsResponse> {
    return environment.useMock
      ? this.getAllAlbumsMock(params)
      : this.getAllAlbumsBackend(params);
  }

  getAlbumById(id: string): Observable<Album> {
    return environment.useMock
      ? this.getAlbumByIdMock(id)
      : this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
        map(album => this.mapAlbumDto(album))
      );
  }

  getAlbumsByArtist(artistId: string): Observable<Album[]> {
    if (environment.useMock) {
      const result = this.albums.filter(album => album.artistId === artistId);
      return of(result).pipe(delay(this.MOCK_DELAY));
    }
    return this.http.get<any[]>(`${this.apiUrl}/artist/${artistId}`).pipe(
      map(albums => albums.map(album => this.mapAlbumDto(album)))
    );
  }

  searchAlbums(query: string): Observable<Album[]> {
    if (environment.useMock) {
      const q = query.toLowerCase();
      const result = this.albums.filter(album =>
        album.title.toLowerCase().includes(q) ||
        (album.description && album.description.toLowerCase().includes(q)) ||
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

  getAlbumsWithTracks(): Observable<Album[]> {
    if (environment.useMock) {
      const result = this.albums.filter(a => a.trackList.length > 0);
      return of(result).pipe(delay(this.MOCK_DELAY));
    }
    return this.getAllAlbumsBackend().pipe(
      map(response => response.content ?? response.albums ?? [])
    );
  }

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

  toggleFavorite(albumId: string): Observable<Album> {
    if (environment.useMock) {
      const album = this.albums.find(a => a.id === albumId);
      if (!album) {
        return throwError(() => new Error(`Album with ID ${albumId} not found`));
      }
      album.isFavorite = !album.isFavorite;
      return of(album).pipe(delay(this.MOCK_DELAY));
    }

    const payload = { tipoContenido: 'ALBUM', idAlbum: Number(albumId) };

    return this.isAlbumFavorite(albumId).pipe(
      switchMap((isFavorite) => {
        if (isFavorite) {
          return this.http.delete<void>(`${this.favoritesUrl}/albumes/${albumId}`).pipe(
            map(() => ({ id: albumId, isFavorite: false } as Album))
          );
        }

        return this.http.post<any>(this.favoritesUrl, payload).pipe(
          map(() => ({ id: this.toStringId(albumId), isFavorite: true } as Album))
        );
      })
    );
  }

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

  getFavoriteAlbums(): Observable<Album[]> {
    if (environment.useMock) {
      return of(this.albums.filter(a => a.isFavorite)).pipe(delay(this.MOCK_DELAY));
    }
    return this.http.get<any>(this.favoritesUrl, {
      params: new HttpParams().set('tipo', 'ALBUM')
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

  getPurchasedAlbums(): Observable<Album[]> {
    if (environment.useMock) {
      return of(this.albums.filter(a => a.isPurchased)).pipe(delay(this.MOCK_DELAY));
    }
    return this.http.get<any>(this.purchasesUrl, {
      params: new HttpParams().set('tipo', 'ALBUM')
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

  getFreeAlbums(): Observable<Album[]> {
    if (environment.useMock) {
      return of(this.albums.filter(a => a.price === 0)).pipe(delay(this.MOCK_DELAY));
    }
    return this.http.get<Album[]>(`${this.apiUrl}/gratuitos`);
  }

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

  getTotalDuration(albumId: string): Observable<number> {
    return this.getAlbumById(albumId).pipe(
      map(album => album.totalDuration)
    );
  }

  addTrackToAlbum(albumId: string, dto: AddTrackToAlbumDto): Observable<void> {
    if (environment.useMock) {
      return of(void 0).pipe(delay(this.MOCK_DELAY));
    }
    return this.http.post<void>(`${this.apiUrl}/${albumId}/tracks`, dto);
  }

  removeTrackFromAlbum(albumId: string, songId: string): Observable<void> {
    if (environment.useMock) {
      return of(void 0).pipe(delay(this.MOCK_DELAY));
    }
    return this.http.delete<void>(`${this.apiUrl}/${albumId}/tracks/${songId}`);
  }

  // ===============================================================
  // MOCK MODE
  // ===============================================================

  private getAllAlbumsMock(params?: AlbumQueryParams): Observable<PaginatedAlbumsResponse> {
    let filtered = [...this.albums];

    // Artista
    if (params?.artistId) {
      filtered = filtered.filter(a => a.artistId === params.artistId);
    }

    // GAnero (string Anico)
    if (params?.genre) {
      const g = params.genre.toLowerCase();
      filtered = filtered.filter(a => a.genre.toLowerCase() === g);
    }

    // BAsqueda
    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(q) ||
        (a.description && a.description.toLowerCase().includes(q)) ||
        a.genre.toLowerCase().includes(q) ||
        a.artist.artisticName.toLowerCase().includes(q)
      );
    }

    // Precio
    if (params?.minPrice !== undefined) {
      filtered = filtered.filter(a => a.price >= params.minPrice!);
    }
    if (params?.maxPrice !== undefined) {
      filtered = filtered.filter(a => a.price <= params.maxPrice!);
    }

    // Orden
    filtered = this.applySorting(filtered, params?.orderBy);

    // PaginaciAn
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

  private getAlbumByIdMock(id: string): Observable<Album> {
    const album = this.albums.find(a => a.id === id);
    if (!album) {
      return throwError(() => new Error(`Album with ID ${id} not found`));
    }
    return of(album).pipe(delay(this.MOCK_DELAY));
  }

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
  // BACKEND MODE
  // ===============================================================

  private getAllAlbumsBackend(params?: AlbumQueryParams): Observable<PaginatedAlbumsResponse> {
    let httpParams = new HttpParams();

    const genreValue = params?.genreId ?? params?.genre;
    if (genreValue) httpParams = httpParams.set('genreId', genreValue);
    if (params?.artistId) httpParams = httpParams.set('artistId', params.artistId);
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.orderBy) httpParams = httpParams.set('orderBy', params.orderBy);
    if (params?.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());

    return this.http.get<any>(`${this.apiUrl}`, { params: httpParams }).pipe(
      map(res => this.normalizeBackendResponse(res))
    );
  }

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

  private mapAlbumTrack(track: any): AlbumTrack {
    const songData = track?.song ?? track?.cancion ?? track ?? {};
    const mappedSong = this.mapSongFromTrack(songData, track);
    return {
      ...mappedSong,
      trackNumber: Number(track?.trackNumber ?? track?.numeroPista ?? track?.orden ?? track?.track ?? track?.position ?? 0),
      addedDate: track?.addedDate ?? track?.fechaAgregado ?? track?.fechaAgregadoAlAlbum ?? track?.fecha ?? mappedSong.releaseDate
    };
  }

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

  private toStringId(value: any): string {
    if (value === undefined || value === null) {
      return '';
    }
    return value.toString();
  }

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

  isAlbumFavorite(albumId: string): Observable<boolean> {
    if (environment.useMock) {
      const album = this.albums.find(a => a.id === albumId);
      return of(!!album?.isFavorite).pipe(delay(this.MOCK_DELAY));
    }
    return this.http.get<boolean>(`${this.favoritesUrl}/albumes/${albumId}/check`);
  }

  isAlbumPurchased(albumId: string): Observable<boolean> {
    if (environment.useMock) {
      const album = this.albums.find(a => a.id === albumId);
      return of(!!album?.isPurchased).pipe(delay(this.MOCK_DELAY));
    }
    return this.http.get<boolean>(`${this.purchasesUrl}/albumes/${albumId}/check`);
  }
}

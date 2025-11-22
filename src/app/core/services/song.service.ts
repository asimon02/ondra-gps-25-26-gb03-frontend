// src/app/services/song.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, map, switchMap } from 'rxjs/operators';
import { Song, SongAlbumSummary, SongArtist } from '../models/song.model';
import { MOCK_SONGS } from '../mocks/mock-songs';
import { environment } from '../../../enviroments/enviroment';

/**
 * Respuesta paginada compatible con Spring Boot y mocks
 */
export interface PaginatedSongsResponse {
  songs?: Song[];
  content?: Song[];

  currentPage: number;
  totalPages: number;
  totalElements: number;
  elementsPerPage?: number;
  size?: number;
}

export interface SongQueryParams {
  genre?: string; // Cambio: genreId a genre (string directo)
  genreId?: string;
  artistId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  orderBy?: 'most_recent' | 'oldest' | 'most_played' | 'best_rated' | 'price_asc' | 'price_desc';
  page?: number;
  limit?: number;
}

@Injectable({
  providedIn: 'root'
})
export class SongService {
  private readonly MOCK_DELAY = 300;
  private readonly apiUrl = `${environment.apis.contenidos}/canciones`;
  private readonly favoritesUrl = `${environment.apis.contenidos}/favoritos`;
  private readonly purchasesUrl = `${environment.apis.contenidos}/compras`;

  // Mock local
  private songs: Song[] = [...MOCK_SONGS];

  constructor(private http: HttpClient) {}

  // ===============================================================
  // PUBLIC API
  // ===============================================================

  getAllSongs(params?: SongQueryParams): Observable<PaginatedSongsResponse> {
    return environment.useMock
      ? this.getAllSongsMock(params)
      : this.getAllSongsBackend(params);
  }

  getSongById(id: string): Observable<Song> {
    return environment.useMock
      ? this.getSongByIdMock(id)
      : this.http.get<any>(`${this.apiUrl}/${id}`).pipe(map(song => this.mapSongDto(song)));
  }

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

  getSongsByArtist(artistId: string): Observable<Song[]> {
    if (environment.useMock) {
      const artistSongs = this.songs.filter(song => song.artist.id === artistId);
      return of(artistSongs).pipe(delay(this.MOCK_DELAY));
    }
    return this.http.get<any[]>(`${this.apiUrl}/artist/${artistId}`).pipe(
      map(songs => songs.map(song => this.mapSongDto(song)))
    );
  }

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

  toggleFavorite(songId: string): Observable<Song> {
    if (environment.useMock) {
      const song = this.songs.find(s => s.id === songId);
      if (!song) {
        return throwError(() => new Error(`Song with ID ${songId} not found`));
      }
      song.isFavorite = !song.isFavorite;
      return of(song).pipe(delay(this.MOCK_DELAY));
    }

    return this.isSongFavorite(songId).pipe(
      switchMap((isFavorite) => {
        if (isFavorite) {
          return this.http.delete<void>(`${this.favoritesUrl}/canciones/${songId}`).pipe(
            map(() => ({ id: songId, isFavorite: false } as Song))
          );
        }

        const payload = { tipoContenido: 'CANCION', idCancion: Number(songId) };
        return this.http.post<any>(this.favoritesUrl, payload).pipe(
          map(() => ({ id: this.toStringId(songId), isFavorite: true } as Song))
        );
      })
    );
  }

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

  getFreeSongs(): Observable<Song[]> {
    if (environment.useMock) {
      return of(this.songs.filter(song => song.price === 0)).pipe(delay(this.MOCK_DELAY));
    }
    return this.http.get<any[]>(`${this.apiUrl}/gratuitas`).pipe(
      map(songs => songs.map(song => this.mapSongDto(song)))
    );
  }

  getFavoriteSongs(): Observable<Song[]> {
    if (environment.useMock) {
      return of(this.songs.filter(song => song.isFavorite)).pipe(delay(this.MOCK_DELAY));
    }
    return this.http.get<any>(this.favoritesUrl, {
      params: new HttpParams().set('tipo', 'CANCION')
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

  getPurchasedSongs(): Observable<Song[]> {
    if (environment.useMock) {
      return of(this.songs.filter(song => song.isPurchased)).pipe(delay(this.MOCK_DELAY));
    }
    return this.http.get<any>(this.purchasesUrl, {
      params: new HttpParams().set('tipo', 'CANCION')
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

  isSongFavorite(songId: string): Observable<boolean> {
    if (environment.useMock) {
      const song = this.songs.find(s => s.id === songId);
      return of(!!song?.isFavorite).pipe(delay(this.MOCK_DELAY));
    }
    return this.http.get<boolean>(`${this.favoritesUrl}/canciones/${songId}/check`);
  }

  isSongPurchased(songId: string): Observable<boolean> {
    if (environment.useMock) {
      const song = this.songs.find(s => s.id === songId);
      return of(!!song?.isPurchased).pipe(delay(this.MOCK_DELAY));
    }
    return this.http.get<boolean>(`${this.purchasesUrl}/canciones/${songId}/check`);
  }

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

  // ===============================================================
  // MOCK MODE
  // ===============================================================

  private getAllSongsMock(params?: SongQueryParams): Observable<PaginatedSongsResponse> {
    let filtered = [...this.songs];

    // Filtro artista
    if (params?.artistId) {
      filtered = filtered.filter(song => song.artist.id === params.artistId);
    }

    // Filtro gAnero (string Anico)
    if (params?.genre) {
      const g = params.genre.toLowerCase();
      filtered = filtered.filter(song => song.genre.toLowerCase() === g);
    }

    // BAsqueda
    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(song =>
        song.title.toLowerCase().includes(q) ||
        song.genre.toLowerCase().includes(q) ||
        song.artist.artisticName.toLowerCase().includes(q)
      );
    }

    // Precio
    if (params?.minPrice !== undefined) {
      filtered = filtered.filter(song => song.price >= params.minPrice!);
    }
    if (params?.maxPrice !== undefined) {
      filtered = filtered.filter(song => song.price <= params.maxPrice!);
    }

    // Orden
    filtered = this.applySorting(filtered, params?.orderBy);

    // PaginaciAn
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

  private getSongByIdMock(id: string): Observable<Song> {
    const song = this.songs.find(s => s.id === id);
    if (!song) {
      return throwError(() => new Error(`Song with ID ${id} not found`));
    }
    return of(song).pipe(delay(this.MOCK_DELAY));
  }

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

  // ===============================================================
  // BACKEND MODE
  // ===============================================================

  private getAllSongsBackend(params?: SongQueryParams): Observable<PaginatedSongsResponse> {
    let httpParams = new HttpParams();

    const genreValue = params?.genreId ?? params?.genre;
    if (genreValue) httpParams = httpParams.set('genreId', genreValue);
    if (params?.artistId) httpParams = httpParams.set('artistId', params.artistId);
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.orderBy) httpParams = httpParams.set('orderBy', params.orderBy);
    if (params?.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit !== undefined) httpParams = httpParams.set('limit', params.limit.toString());

    return this.http.get<any>(`${this.apiUrl}`, { params: httpParams }).pipe(
      map(res => this.normalizeBackendResponse(res))
    );
  }

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

  private mapAlbumsFromSong(albums: any[]): SongAlbumSummary[] {
    if (!Array.isArray(albums)) return [];
    return albums.map((album: any) => ({
      id: this.toStringId(album?.id ?? album?.idAlbum ?? album?.albumId),
      title: album?.title ?? album?.titulo ?? album?.tituloAlbum ?? album?.nombre ?? '',
      coverUrl: album?.coverUrl ?? album?.urlPortada ?? album?.portada ?? '',
      trackNumber: album?.trackNumber ?? album?.numeroPista
    }));
  }

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

  private toStringId(value: any): string {
    if (value === undefined || value === null) {
      return '';
    }
    return value.toString();
  }
}

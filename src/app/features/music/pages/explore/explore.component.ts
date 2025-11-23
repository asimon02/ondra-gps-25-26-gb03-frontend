import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { forkJoin, of } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { SongService, SongQueryParams, PaginatedSongsResponse } from '../../../../core/services/song.service';
import { AlbumService, AlbumQueryParams, PaginatedAlbumsResponse } from '../../../../core/services/album.service';
import { GenreService } from '../../../../core/services/genre.service';
import { MusicPlayerService } from '../../../../core/services/music-player.service';
import { Song } from '../../../../core/models/song.model';
import { Album, AlbumTrack } from '../../../../core/models/album.model';
import { ArtistService } from '../../../../core/services/artist.service';
import { AuthStateService } from '../../../../core/services/auth-state.service';
import { SongCardComponent } from '../../components/song-card/song-card.component';
import { AlbumCardComponent } from '../../components/album-card/album-card.component';
import { MusicPlayerComponent } from '../../components/music-player/music-player.component';
import { environment } from '../../../../../enviroments/enviroment';

type ContentType = 'songs' | 'albums';
type SortOption = 'most_recent' | 'oldest' | 'most_played' | 'best_rated' | 'price_asc' | 'price_desc';

interface FilterState {
  searchTerm: string;
  genre: string;
  priceRange: {
    min: number;
    max: number;
  };
  sortBy: SortOption;
}

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SongCardComponent,
    AlbumCardComponent,
    MusicPlayerComponent
  ],
  templateUrl: './explore.component.html',
  styles: [`
    .genre-select {
      max-height: 240px;
      overflow-y: auto;
    }

    .filter-control {
      height: 40px;
      border: 1px solid #d1d5db;
      border-radius: 0.5rem;
      background: #fff;
      color: #111827;
      padding: 0 12px;
      font-size: 0.95rem;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
      cursor: pointer;
    }

    .filter-control:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
    }

    .filter-label {
      font-size: 0.9rem;
      color: #374151;
      font-weight: 500;
    }

    .search-control {
      padding-left: 42px;
      cursor: text;
    }

    .dropdown-panel {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
      max-height: 14rem;
      overflow-y: auto;
    }

    .dropdown-option {
      cursor: pointer;
    }
  `]
})
export class ExploreComponent implements OnInit, OnDestroy {
  currentContentType: ContentType = 'songs';

  displayedSongs: Song[] = [];
  displayedAlbums: Album[] = [];

  totalSongs = 0;
  totalAlbums = 0;
  currentPage = 1;
  totalPages = 1;
  itemsPerPage = 1000;

  availableGenres: string[] = [];
  isLoading = true;
  showPlayer = false;
  currentSongId: string | null = null;
  isSongPlaying = false;

  private genreNameToId: Record<string, string> = {};
  filters: FilterState = {
    searchTerm: '',
    genre: '',
    priceRange: {
      min: 0,
      max: 20
    },
    sortBy: 'most_recent'
  };

  private subscriptions = new Subscription();
  private readonly useMock = environment.useMock;
  readonly sortOptions: { value: SortOption; label: string }[] = [
    { value: 'most_recent', label: 'Más recientes' },
    { value: 'oldest', label: 'Más antiguos' },
    { value: 'most_played', label: 'Más reproducidos' },
    { value: 'best_rated', label: 'Mejor valorados' },
    { value: 'price_asc', label: 'Precio: menor a mayor' },
    { value: 'price_desc', label: 'Precio: mayor a menor' }
  ];

  constructor(
    private songService: SongService,
    private albumService: AlbumService,
    private genreService: GenreService,
    private playerService: MusicPlayerService,
    private artistService: ArtistService,
    private authState: AuthStateService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const typeParam = this.route.snapshot.queryParamMap.get('type');
    if (typeParam === 'songs' || typeParam === 'albums') {
      this.applyContentTypeState(typeParam);
    }
    this.syncContentTypeInUrl(this.currentContentType, true);

    this.loadGenres();
    this.loadContent();
    this.subscribeToPlayer();
  }

  get visibleSortOptions(): { value: SortOption; label: string }[] {
    if (this.currentContentType === 'albums') {
      return this.sortOptions.filter(opt => opt.value !== 'most_played');
    }
    return this.sortOptions;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  

  

  /**
   * Suscribirse al estado del reproductor
   */
  private subscribeToPlayer(): void {
    this.subscriptions.add(
      this.playerService.currentSong$.subscribe(song => {
        this.showPlayer = !!song;
        this.currentSongId = song?.id ?? null;
      })
    );

    this.subscriptions.add(
      this.playerService.isPlaying$.subscribe(isPlaying => {
        this.isSongPlaying = isPlaying;
      })
    );
  }

  /**
   * Cambia el tipo de contenido (canciones/álbumes)
   */
  switchContentType(type: ContentType): void {
    if (this.currentContentType === type) return;

    this.applyContentTypeState(type);
    this.syncContentTypeInUrl(type);
    this.loadContent();
  }

  /**
   * Carga el contenido según el tipo seleccionado
   */
  loadContent(): void {
    this.isLoading = true;

    if (this.currentContentType === 'songs') {
      this.loadSongs();
    } else {
      this.loadAlbums();
    }
  }

  /**
   * Carga canciones con filtros aplicados
   */
  loadSongs(): void {
    const genreId = this.filters.genre ? this.genreNameToId[this.filters.genre] : undefined;
    const params: SongQueryParams = {
      // Mantener búsqueda en cliente para incluir artistas
      genre: this.filters.genre || undefined,
      genreId,
      orderBy: this.filters.sortBy,
      page: this.currentPage,
      limit: this.itemsPerPage
    };

    this.fetchAllSongs(params).subscribe({
      next: (songs) => {
        this.enrichArtistsForSongs(songs).pipe(
          switchMap(enriched => this.mergeFavoriteSongs(enriched))
        ).subscribe((withFavorites) => {
          const filteredBySearch = this.applySearchFilterToSongs(withFavorites);
          this.displayedSongs = this.applyPriceFilter(filteredBySearch, this.filters.priceRange);
          this.totalSongs = this.displayedSongs.length;
          this.currentPage = 1;
          this.totalPages = 1;
          this.isLoading = false;

          // Actualizar playlist en el servicio cuando cambian las canciones
          this.playerService.setPlaylist(this.displayedSongs);
        });
      },
      error: (err) => {
        console.error('Error loading songs:', err);
        this.displayedSongs = [];
        this.totalSongs = 0;
        this.isLoading = false;
      }
    });
  }

  /**
   * Carga álbumes con filtros aplicados
   */
  loadAlbums(): void {
    const genreId = this.filters.genre ? this.genreNameToId[this.filters.genre] : undefined;
    const params: AlbumQueryParams = {
      search: this.filters.searchTerm || undefined,
      genre: this.filters.genre || undefined,
      genreId,
      orderBy: this.filters.sortBy === 'most_played' ? 'most_recent' : this.filters.sortBy,
      page: this.currentPage,
      limit: this.itemsPerPage
    };

    this.fetchAllAlbums(params).subscribe({
      next: (albums) => {
        this.enrichArtistsForAlbums(albums).pipe(
          switchMap(enriched => this.mergeFavoriteAlbums(enriched))
        ).subscribe((withFavorites) => {
          const filteredBySearch = this.applySearchFilterToAlbums(withFavorites);
          this.displayedAlbums = this.applyPriceFilter(filteredBySearch, this.filters.priceRange);
          this.totalAlbums = this.displayedAlbums.length;
          this.currentPage = 1;
          this.totalPages = 1;
          this.isLoading = false;
        });
      },
      error: (err) => {
        console.error('Error loading albums:', err);
        this.displayedAlbums = [];
        this.totalAlbums = 0;
        this.isLoading = false;
      }
    });
  }

  /**
   * Carga los géneros disponibles
   */
  loadGenres(): void {
    this.genreService.getAllGenres().subscribe({
      next: (genres) => {
        const entries = Array.isArray(genres) ? genres : [];
        this.availableGenres = entries
          .map(g => (typeof g === 'string' ? g : g.nombre))
          .filter(Boolean)
          .sort();
        this.genreNameToId = entries.reduce<Record<string, string>>((acc, genre) => {
          if (typeof genre === 'string') {
            return acc;
          }
          const name = genre.nombre;
          if (!name) return acc;
          const idValue = genre.id !== undefined && genre.id !== null ? genre.id.toString() : '';
          if (idValue) {
            acc[name] = idValue;
          }
          return acc;
        }, {});
      },
      error: (err) => {
        console.error('Error loading genres:', err);
        this.availableGenres = [];
      }
    });
  }

  /**
   * Manejador de cambio de filtros
   */
  onFilterChange(): void {
    if (this.filters.priceRange.min > this.filters.priceRange.max) {
      this.filters.priceRange.min = this.filters.priceRange.max;
    }

    this.currentPage = 1;
    this.loadContent();
  }

  /**
   * Alterna el favorito de una canción
   */
  onToggleFavoriteSong(songId: string): void {
    this.songService.toggleFavorite(songId).subscribe({
      next: (updatedSong) => {
        const song = this.displayedSongs.find(s => s.id === songId);
        if (song) {
          song.isFavorite = updatedSong.isFavorite;
        }

        // Actualizar en el servicio si es la canción actual
        const currentSong = this.playerService.getCurrentSong();
        if (currentSong?.id === songId) {
          this.playerService.updateCurrentSong({
            id: songId,
            isFavorite: updatedSong.isFavorite
          });
        }
      },
      error: (err) => {
        console.error('Error toggling favorite:', err);
      }
    });
  }

  /**
   * Alterna el favorito de un álbum
   */
  onToggleFavoriteAlbum(albumId: string): void {
    this.albumService.toggleFavorite(albumId).subscribe({
      next: (updatedAlbum) => {
        const album = this.displayedAlbums.find(a => a.id === albumId);
        if (album) {
          album.isFavorite = updatedAlbum.isFavorite;
        }
      },
      error: (err) => {
        console.error('Error toggling favorite:', err);
      }
    });
  }

  /**
   * Reproduce una canción
   */
  onPlaySong(song: Song): void {
    // Actualizar playlist y reproducir
    this.playerService.setPlaylist(this.displayedSongs);
    this.playerService.playSong(song, true);

    // Registrar reproducción
    this.songService.registerPlay(song.id).subscribe({
      next: (result) => {
        const displayedSong = this.displayedSongs.find(s => s.id === song.id);
        if (displayedSong) {
          displayedSong.playCount = result.totalPlays;
        }
      },
      error: (err) => {
        console.error('Error registering play:', err);
      }
    });
  }

  onPauseSong(): void {
    this.playerService.pause();
  }

  /**
   * Reproduce un álbum completo
   */
  onPlayAlbum(album: Album): void {
    const playTracks = (tracks: AlbumTrack[]) => {
      if (!tracks || tracks.length === 0) {
        return;
      }
      const ordered = this.addAlbumArtistToTracks(tracks, album).sort((a: AlbumTrack, b: AlbumTrack) => {
        const aTrack = typeof a.trackNumber === 'number' ? a.trackNumber : 0;
        const bTrack = typeof b.trackNumber === 'number' ? b.trackNumber : 0;
        return aTrack - bTrack;
      });

      this.playerService.setPlaylist(ordered);
      this.playerService.playSong(ordered[0], true);

      this.songService.registerPlay(ordered[0].id).subscribe({
        next: (result) => {
          const first = ordered[0];
          if (first) {
            first.playCount = result.totalPlays;
          }
        },
        error: (err) => console.error('Error registering play:', err)
      });
    };

    if (this.isAlbumCurrentlySelected(album) && this.isSongPlaying) {
      this.playerService.pause();
      return;
    }

    if (this.isAlbumCurrentlySelected(album) && !this.isSongPlaying) {
      this.playerService.play();
      return;
    }

    if (album.trackList && album.trackList.length > 0) {
      album.trackList = [...this.addAlbumArtistToTracks(album.trackList, album)].sort((a, b) => (a.trackNumber ?? 0) - (b.trackNumber ?? 0));
      playTracks(album.trackList);
      return;
    }

    this.albumService.getAlbumTracks(album.id).subscribe({
      next: (tracks) => {
        const enriched = this.addAlbumArtistToTracks(tracks, album);
        album.trackList = enriched;
        playTracks(enriched);
      },
      error: (err) => console.error('Error loading album tracks:', err)
    });
  }

  /**
   * Cierra el reproductor de música
   */
  onClosePlayer(): void {
    this.playerService.stop();
  }

  /**
   * Navega a la página anterior
   */
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadContent();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Navega a la página siguiente
   */
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadContent();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // ========== MÉTODOS AUXILIARES ==========

  /**
   * Aplica el estado base al cambiar de tipo de contenido.
   */
  private applyContentTypeState(type: ContentType): void {
    this.currentContentType = type;
    this.currentPage = 1;
    this.filters.priceRange.max = type === 'albums' ? 50 : 20;
    this.filters.searchTerm = '';
    this.filters.genre = '';
    this.filters.sortBy = 'most_recent';
  }

  /**
   * Sincroniza el tipo de contenido en la URL para que al volver desde detalles
   * se restituya la pestaña correcta.
   */
  private syncContentTypeInUrl(type: ContentType, replaceUrl = false): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { type },
      replaceUrl
    });
  }

  /**
   * Extrae el contenido de la respuesta
   */
  private extractContentFromResponse<T>(response: PaginatedSongsResponse | PaginatedAlbumsResponse): T[] {
    if ('content' in response && response.content) {
      return response.content as T[];
    }
    if ('songs' in response && response.songs) {
      return response.songs as T[];
    }
    if ('albums' in response && response.albums) {
      return response.albums as T[];
    }
    return [];
  }

  /**
   * Extrae la metadata de paginación
   */
  private extractPaginationMetadata(response: PaginatedSongsResponse | PaginatedAlbumsResponse) {
    return {
      currentPage: response.currentPage || 1,
      totalPages: response.totalPages || 0,
      totalElements: response.totalElements || 0,
      elementsPerPage: response.size || response.elementsPerPage || this.itemsPerPage
    };
  }

  /**
   * Aplica filtros de precio en el cliente (el backend no los soporta)
   */
  private applyPriceFilter<T extends { price: number }>(items: T[], range: { min: number; max: number }): T[] {
    return items.filter(item => {
      const price = item.price ?? 0;
      return price >= range.min && price <= range.max;
    });
  }

  private applySearchFilterToSongs(songs: Song[]): Song[] {
    const term = (this.filters.searchTerm || '').trim().toLowerCase();
    if (!term) return songs;
    return songs.filter(song => {
      const title = song.title?.toLowerCase() ?? '';
      const genre = song.genre?.toLowerCase() ?? '';
      const artist = song.artist?.artisticName?.toLowerCase() ?? '';
      return title.includes(term) || genre.includes(term) || artist.includes(term);
    });
  }

  private applySearchFilterToAlbums(albums: Album[]): Album[] {
    const term = (this.filters.searchTerm || '').trim().toLowerCase();
    if (!term) return albums;
    return albums.filter(album => {
      const title = album.title?.toLowerCase() ?? '';
      const description = album.description?.toLowerCase() ?? '';
      const genre = album.genre?.toLowerCase() ?? '';
      const artist = album.artist?.artisticName?.toLowerCase() ?? '';
      return title.includes(term) || description.includes(term) || genre.includes(term) || artist.includes(term);
    });
  }

  isAlbumCurrentlySelected(album: Album): boolean {
    const playlist = this.playerService.getCurrentPlaylist();
    if (!playlist.length || !album.trackList || album.trackList.length === 0) {
      return false;
    }

    const albumIds = new Set(album.trackList.map(t => t.id));
    if (albumIds.size !== playlist.length) {
      return false;
    }

    return playlist.every(song => albumIds.has(song.id));
  }

  /**
   * Descarga todas las páginas de canciones
   */
  private fetchAllSongs(params: SongQueryParams) {
    const limit = params.limit ?? this.itemsPerPage;
    const baseParams = { ...params, page: 1, limit };

    return this.songService.getAllSongs(baseParams).pipe(
      switchMap((first) => {
        const firstPageContent = this.extractContentFromResponse<Song>(first);
        const meta = this.extractPaginationMetadata(first);

        if (meta.totalPages <= 1) {
          return of(firstPageContent);
        }

        const requests = [];
        for (let page = 2; page <= meta.totalPages; page++) {
          requests.push(
            this.songService.getAllSongs({ ...params, page, limit }).pipe(
              map(res => this.extractContentFromResponse<Song>(res))
            )
          );
        }

        return forkJoin(requests).pipe(
          map(rest => firstPageContent.concat(...rest)),
          catchError(() => of(firstPageContent))
        );
      })
    );
  }

  /**
   * Descarga todas las páginas de álbumes
   */
  private fetchAllAlbums(params: AlbumQueryParams) {
    const limit = params.limit ?? this.itemsPerPage;
    const baseParams = { ...params, page: 1, limit };

    return this.albumService.getAllAlbums(baseParams).pipe(
      switchMap((first) => {
        const firstPageContent = this.extractContentFromResponse<Album>(first);
        const meta = this.extractPaginationMetadata(first);

        if (meta.totalPages <= 1) {
          return of(firstPageContent);
        }

        const requests = [];
        for (let page = 2; page <= meta.totalPages; page++) {
          requests.push(
            this.albumService.getAllAlbums({ ...params, page, limit }).pipe(
              map(res => this.extractContentFromResponse<Album>(res))
            )
          );
        }

        return forkJoin(requests).pipe(
          map(rest => firstPageContent.concat(...rest)),
          catchError(() => of(firstPageContent))
        );
      })
    );
  }

  /**
   * Obtiene info de artista para canciones (se basa en idArtista)
   */
  private enrichArtistsForSongs(songs: Song[]) {
    const uniqueIds = Array.from(new Set(songs.map(s => s.artist?.id).filter(Boolean) as string[]));
    if (uniqueIds.length === 0) return of(songs);

    const requests = uniqueIds.map(id => this.artistService.getArtistById(id));
    return forkJoin(requests).pipe(
      map((artists) => {
        const mapArtists = new Map(artists.map(a => [a.id, a]));
        return songs.map(song => {
          const artist = mapArtists.get(song.artist.id);
          return artist ? { ...song, artist } : song;
        });
      }),
      catchError(() => of(songs))
    );
  }

  private mergeFavoriteSongs(songs: Song[]) {
    if (this.useMock || !this.authState.isAuthenticated()) {
      return of(songs);
    }
    return this.songService.getFavoriteSongs().pipe(
      map((favorites) => {
        const favIds = new Set(favorites.map(f => f.id));
        return songs.map(song => ({ ...song, isFavorite: favIds.has(song.id) }));
      }),
      catchError(() => of(songs))
    );
  }

  /**
   * Obtiene info de artista para álbumes
   */
  private enrichArtistsForAlbums(albums: Album[]) {
    const uniqueIds = Array.from(new Set(albums.map(a => a.artistId || a.artist?.id).filter(Boolean) as string[]));
    if (uniqueIds.length === 0) return of(albums);

    const requests = uniqueIds.map(id => this.artistService.getArtistById(id));
    return forkJoin(requests).pipe(
      map((artists) => {
        const mapArtists = new Map(artists.map(a => [a.id, a]));
        return albums.map(album => {
          const artist = mapArtists.get(album.artistId || album.artist.id);
          if (artist) {
            return { ...album, artist, artistId: artist.id };
          }
          return album;
        });
      }),
      catchError(() => of(albums))
    );
  }

  private mergeFavoriteAlbums(albums: Album[]) {
    if (this.useMock || !this.authState.isAuthenticated()) {
      return of(albums);
    }
    return this.albumService.getFavoriteAlbums().pipe(
      map((favorites) => {
        const favIds = new Set(favorites.map(f => f.id));
        return albums.map(album => ({ ...album, isFavorite: favIds.has(album.id) }));
      }),
      catchError(() => of(albums))
    );
  }

  private addAlbumArtistToTracks(tracks: (Song | AlbumTrack)[], album: Album): AlbumTrack[] {
    return tracks.map(track => {
      const trackNumber = (track as AlbumTrack).trackNumber ?? 0;
      if (track.artist && track.artist.id) {
        return { ...track, trackNumber } as AlbumTrack;
      }
      return { ...track, artist: album.artist, trackNumber } as AlbumTrack;
    });
  }
}

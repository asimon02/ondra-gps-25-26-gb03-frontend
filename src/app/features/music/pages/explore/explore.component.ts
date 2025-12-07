import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, Subject } from 'rxjs';
import { switchMap, map, catchError, debounceTime } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { SongService, SongQueryParams, PaginatedSongsResponse } from '../../../../core/services/song.service';
import { AlbumService, AlbumQueryParams, PaginatedAlbumsResponse } from '../../../../core/services/album.service';
import { GenreService } from '../../../../core/services/genre.service';
import { MusicPlayerService } from '../../../../core/services/music-player.service';
import { Song, SongArtist } from '../../../../core/models/song.model';
import { Album, AlbumTrack } from '../../../../core/models/album.model';
import { ArtistService, ArtistQueryParams, PaginatedArtistsResponse } from '../../../../core/services/artist.service';
import { AuthStateService } from '../../../../core/services/auth-state.service';
import { TipoUsuario } from '../../../../core/models/auth.model';
import { SongCardComponent } from '../../components/song-card/song-card.component';
import { AlbumCardComponent } from '../../components/album-card/album-card.component';
import { ArtistCardComponent, Artist } from '../../components/artist-card/artist-card.component';
import { MusicPlayerComponent } from '../../components/music-player/music-player.component';
import { environment } from '../../../../../enviroments/enviroment';
import { FavoritosService } from '../../../../core/services/favoritos.service';
import { CarritoService } from '../../../../core/services/carrito.service';
import { of, forkJoin } from 'rxjs';

type ContentType = 'songs' | 'albums' | 'artists';
type SortOption = 'most_recent' | 'oldest' | 'most_played' | 'best_rated' | 'price_asc' | 'price_desc';

/**
 * Estado de los filtros de búsqueda y ordenamiento.
 */
interface FilterState {
  searchTerm: string;
  artistName: string;
  genre: string;
  priceRange: {
    min: number | null;
    max: number | null;
  };
  sortBy: SortOption;
}

/**
 * Componente de exploración de contenido musical.
 * Permite buscar y filtrar canciones, álbumes y artistas con paginación infinita.
 */
@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SongCardComponent,
    AlbumCardComponent,
    ArtistCardComponent,
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

    .loading-spinner {
      display: inline-block;
      width: 40px;
      height: 40px;
      border: 4px solid #f3f4f6;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .fade-in-item {
      animation: fadeInUp 0.5s ease-out;
    }

    .smooth-scroll {
      scroll-behavior: smooth;
    }
  `]
})
export class ExploreComponent implements OnInit, OnDestroy {
  currentContentType: ContentType = 'songs';

  displayedSongs: Song[] = [];
  displayedAlbums: Album[] = [];
  displayedArtists: Artist[] = [];

  totalSongs = 0;
  totalAlbums = 0;
  totalArtists = 0;
  currentPage = 1;
  itemsPerPage = 20;
  hasMorePages = true;

  availableGenres: string[] = [];
  isLoading = false;
  isLoadingMore = false;
  showPlayer = false;
  currentSongId: string | null = null;
  isSongPlaying = false;

  private genreNameToId: Record<string, string> = {};
  filters: FilterState = {
    searchTerm: '',
    artistName: '',
    genre: '',
    priceRange: {
      min: 0,
      max: 100
    },
    sortBy: 'most_recent'
  };

  private filterChange$ = new Subject<void>();
  private scrollTimeout: any = null;
  private isScrollLoading = false;

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
    private route: ActivatedRoute,
    private favoritosService: FavoritosService,
    private carritoService: CarritoService
  ) {}

  /**
   * Inicializa el componente, carga el contenido inicial y configura las suscripciones.
   */
  ngOnInit(): void {
    const typeParam = this.route.snapshot.queryParamMap.get('type');
    if (typeParam === 'songs' || typeParam === 'albums' || typeParam === 'artists') {
      this.applyContentTypeState(typeParam);
    }
    this.syncContentTypeInUrl(this.currentContentType, true);

    this.loadGenres();
    this.loadContent();
    this.subscribeToPlayer();
    this.subscribeToFavoriteChanges();

    this.subscriptions.add(
      this.filterChange$.pipe(
        debounceTime(500)
      ).subscribe(() => {
        this.resetAndLoadContent();
      })
    );
  }

  /**
   * Obtiene las opciones de ordenamiento visibles según el tipo de contenido actual.
   */
  get visibleSortOptions(): { value: SortOption; label: string }[] {
    if (this.currentContentType === 'albums') {
      return this.sortOptions.filter(opt => opt.value !== 'most_played');
    }
    if (this.currentContentType === 'artists') {
      return this.sortOptions.filter(opt =>
        opt.value === 'most_recent' || opt.value === 'oldest'
      );
    }
    return this.sortOptions;
  }

  /**
   * Limpia las suscripciones y timeouts al destruir el componente.
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
  }

  /**
   * Detecta el scroll de la ventana para cargar más contenido cuando se alcanza el final.
   */
  @HostListener('window:scroll', ['$event'])
  onScroll(): void {
    const scrollPosition = window.innerHeight + window.scrollY;
    const scrollThreshold = document.documentElement.scrollHeight - 500;

    if (scrollPosition >= scrollThreshold && !this.isLoading && !this.isLoadingMore && this.hasMorePages && !this.isScrollLoading) {
      this.isScrollLoading = true;

      this.scrollTimeout = setTimeout(() => {
        this.loadMoreContent();
        this.isScrollLoading = false;
      }, 1500);
    }
  }

  /**
   * Configura las suscripciones al reproductor de música.
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
   * Configura la suscripción a cambios en favoritos para sincronizar el estado.
   */
  private subscribeToFavoriteChanges(): void {
    this.subscriptions.add(
      this.favoritosService.onFavoritoChanged.subscribe({
        next: (event) => {
          if (event.tipo === 'CANCIÓN') {
            const song = this.displayedSongs.find(s => s.id === event.idContenido.toString());
            if (song) {
              song.isFavorite = event.accion === 'AGREGADO';
            }
          }

          if (event.tipo === 'ÁLBUM') {
            const album = this.displayedAlbums.find(a => a.id === event.idContenido.toString());
            if (album) {
              album.isFavorite = event.accion === 'AGREGADO';
            }

            if (event.idsCanciones && event.idsCanciones.length > 0) {
              const newFavoriteState = event.accion === 'AGREGADO';
              event.idsCanciones.forEach(idCancion => {
                const song = this.displayedSongs.find(s => s.id === idCancion.toString());
                if (song) {
                  song.isFavorite = newFavoriteState;
                }
              });
            }
          }
        },
        error: (err) => console.error('Error en suscripción a favoritos:', err)
      })
    );
  }

  /**
   * Cambia el tipo de contenido a mostrar (canciones, álbumes o artistas).
   *
   * @param type - Tipo de contenido a mostrar
   */
  switchContentType(type: ContentType): void {
    if (this.currentContentType === type) return;

    this.applyContentTypeState(type);
    this.syncContentTypeInUrl(type);
    this.resetAndLoadContent();
  }

  /**
   * Reinicia el estado de paginación y recarga el contenido.
   */
  private resetAndLoadContent(): void {
    this.currentPage = 1;
    this.displayedSongs = [];
    this.displayedAlbums = [];
    this.displayedArtists = [];
    this.hasMorePages = true;
    this.loadContent();
  }

  /**
   * Carga el contenido según el tipo seleccionado (canciones, álbumes o artistas).
   */
  loadContent(): void {
    this.isLoading = true;

    if (this.currentContentType === 'songs') {
      this.loadSongs();
    } else if (this.currentContentType === 'albums') {
      this.loadAlbums();
    } else if (this.currentContentType === 'artists') {
      this.loadArtists();
    }
  }

  /**
   * Carga la siguiente página de contenido para scroll infinito.
   */
  private loadMoreContent(): void {
    if (!this.hasMorePages) return;

    this.isLoadingMore = true;
    this.currentPage++;

    if (this.currentContentType === 'songs') {
      this.loadSongs();
    } else if (this.currentContentType === 'albums') {
      this.loadAlbums();
    } else if (this.currentContentType === 'artists') {
      this.loadArtists();
    }
  }

  /**
   * Carga las canciones aplicando los filtros activos.
   * Enriquece los datos con información de artistas y favoritos.
   */
  loadSongs(): void {
    const genreId = this.filters.genre ? this.genreNameToId[this.filters.genre] : undefined;

    const minPrice = this.filters.priceRange.min !== null && this.filters.priceRange.min !== undefined
      ? Number(this.filters.priceRange.min)
      : undefined;

    const maxPrice = this.filters.priceRange.max !== null && this.filters.priceRange.max !== undefined
      ? Number(this.filters.priceRange.max)
      : undefined;

    const params: SongQueryParams = {
      search: this.filters.searchTerm || undefined,
      genreId,
      orderBy: this.filters.sortBy,
      minPrice,
      maxPrice,
      page: this.currentPage,
      limit: this.itemsPerPage
    };

    this.songService.getAllSongs(params).subscribe({
      next: (response) => {
        let songs = this.extractContentFromResponse<Song>(response);

        if (this.filters.searchTerm && this.filters.searchTerm.trim() !== '') {
          const searchQuery = this.filters.searchTerm.toLowerCase().trim();
          songs = songs.filter(song => {
            const titleMatch = song.title?.toLowerCase().includes(searchQuery);
            const artistMatch = song.artist?.artisticName?.toLowerCase().includes(searchQuery);
            return titleMatch || artistMatch;
          });
        }

        if (this.filters.artistName && this.filters.artistName.trim() !== '') {
          const artistQuery = this.filters.artistName.toLowerCase().trim();
          songs = songs.filter(song =>
            song.artist?.artisticName?.toLowerCase().includes(artistQuery)
          );
        }

        const meta = this.extractPaginationMetadata(response);

        this.enrichArtistsForSongs(songs).pipe(
          switchMap(enriched => this.mergeFavoriteSongs(enriched))
        ).subscribe((withFavorites) => {
          if (this.isLoadingMore) {
            this.displayedSongs = [...this.displayedSongs, ...withFavorites];
          } else {
            this.displayedSongs = withFavorites;
          }

          const hasClientFilter = (this.filters.searchTerm && this.filters.searchTerm.trim() !== '') ||
            (this.filters.artistName && this.filters.artistName.trim() !== '');

          if (hasClientFilter) {
            this.totalSongs = this.displayedSongs.length;
            this.hasMorePages = false;
          } else {
            this.totalSongs = meta.totalElements;
            this.hasMorePages = this.currentPage < meta.totalPages;
          }

          this.isLoading = false;
          this.isLoadingMore = false;

          this.playerService.setPlaylist(this.displayedSongs);
        });
      },
      error: (err) => {
        console.error('Error loading songs:', err);
        if (!this.isLoadingMore) {
          this.displayedSongs = [];
          this.totalSongs = 0;
        }
        this.isLoading = false;
        this.isLoadingMore = false;
        this.hasMorePages = false;
      }
    });
  }

  /**
   * Carga los álbumes aplicando los filtros activos.
   * Enriquece los datos con información de artistas y favoritos.
   */
  loadAlbums(): void {
    const genreId = this.filters.genre ? this.genreNameToId[this.filters.genre] : undefined;

    const minPrice = this.filters.priceRange.min !== null && this.filters.priceRange.min !== undefined
      ? Number(this.filters.priceRange.min)
      : undefined;

    const maxPrice = this.filters.priceRange.max !== null && this.filters.priceRange.max !== undefined
      ? Number(this.filters.priceRange.max)
      : undefined;

    const params: AlbumQueryParams = {
      search: this.filters.searchTerm || undefined,
      genreId,
      orderBy: this.filters.sortBy === 'most_played' ? 'most_recent' : this.filters.sortBy,
      minPrice,
      maxPrice,
      page: this.currentPage,
      limit: this.itemsPerPage
    };

    this.albumService.getAllAlbums(params).subscribe({
      next: (response) => {
        let albums = this.extractContentFromResponse<Album>(response);

        if (this.filters.searchTerm && this.filters.searchTerm.trim() !== '') {
          const searchQuery = this.filters.searchTerm.toLowerCase().trim();
          albums = albums.filter(album => {
            const titleMatch = album.title?.toLowerCase().includes(searchQuery);
            const artistMatch = album.artist?.artisticName?.toLowerCase().includes(searchQuery);
            return titleMatch || artistMatch;
          });
        }

        if (this.filters.artistName && this.filters.artistName.trim() !== '') {
          const artistQuery = this.filters.artistName.toLowerCase().trim();
          albums = albums.filter(album =>
            album.artist?.artisticName?.toLowerCase().includes(artistQuery)
          );
        }

        const meta = this.extractPaginationMetadata(response);

        this.enrichArtistsForAlbums(albums).pipe(
          switchMap(enriched => this.mergeFavoriteAlbums(enriched))
        ).subscribe((withFavorites) => {
          if (this.isLoadingMore) {
            this.displayedAlbums = [...this.displayedAlbums, ...withFavorites];
          } else {
            this.displayedAlbums = withFavorites;
          }

          const hasClientFilter = (this.filters.searchTerm && this.filters.searchTerm.trim() !== '') ||
            (this.filters.artistName && this.filters.artistName.trim() !== '');

          if (hasClientFilter) {
            this.totalAlbums = this.displayedAlbums.length;
            this.hasMorePages = false;
          } else {
            this.totalAlbums = meta.totalElements;
            this.hasMorePages = this.currentPage < meta.totalPages;
          }

          this.isLoading = false;
          this.isLoadingMore = false;
        });
      },
      error: (err) => {
        console.error('Error loading albums:', err);
        if (!this.isLoadingMore) {
          this.displayedAlbums = [];
          this.totalAlbums = 0;
        }
        this.isLoading = false;
        this.isLoadingMore = false;
        this.hasMorePages = false;
      }
    });
  }

  /**
   * Carga los artistas aplicando los filtros activos.
   */
  loadArtists(): void {
    const params: ArtistQueryParams = {
      search: this.filters.searchTerm || undefined,
      esTendencia: this.filters.genre === 'trending' ? true : undefined,
      orderBy: this.filters.sortBy === 'most_recent' || this.filters.sortBy === 'oldest'
        ? this.filters.sortBy
        : 'most_recent',
      page: this.currentPage - 1,
      limit: this.itemsPerPage
    };

    this.artistService.searchArtists(params).subscribe({
      next: (response) => {
        const artists: Artist[] = response.content.map(dto => ({
          id: dto.idArtista.toString(),
          artisticName: dto.nombreArtistico,
          profileImage: dto.fotoPerfilArtistico || null,
          bio: dto.biografiaArtistico || null,
          slug: dto.slugArtistico || null,
          isTrending: dto.esTendencia,
          startDate: dto.fechaInicioArtistico
        }));

        if (this.isLoadingMore) {
          this.displayedArtists = [...this.displayedArtists, ...artists];
        } else {
          this.displayedArtists = artists;
        }

        this.totalArtists = response.totalElements;
        this.hasMorePages = response.currentPage < response.totalPages - 1;

        this.isLoading = false;
        this.isLoadingMore = false;
      },
      error: (err) => {
        console.error('Error loading artists:', err);
        if (!this.isLoadingMore) {
          this.displayedArtists = [];
          this.totalArtists = 0;
        }
        this.isLoading = false;
        this.isLoadingMore = false;
        this.hasMorePages = false;
      }
    });
  }

  /**
   * Carga los géneros disponibles del sistema.
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
   * Maneja los cambios en los filtros de búsqueda.
   * Valida los rangos de precio y emite el evento de cambio con debounce.
   */
  onFilterChange(): void {
    if (this.filters.priceRange.min !== null && this.filters.priceRange.min < 0) {
      this.filters.priceRange.min = 0;
    }

    const maxAllowed = 100;
    if (this.filters.priceRange.max !== null && this.filters.priceRange.max > maxAllowed) {
      this.filters.priceRange.max = maxAllowed;
    }

    if (this.filters.priceRange.min !== null && this.filters.priceRange.max !== null &&
      this.filters.priceRange.min > this.filters.priceRange.max) {
      this.filters.priceRange.min = this.filters.priceRange.max;
    }

    this.filterChange$.next();
  }

  /**
   * Alterna el estado de favorito de una canción.
   *
   * @param songId - ID de la canción
   */
  onToggleFavoriteSong(songId: string): void {
    if (!this.canUseFavorites()) {
      return;
    }
    this.songService.toggleFavorite(songId).subscribe({
      next: (updatedSong) => {
        const song = this.displayedSongs.find(s => s.id === songId);
        if (song) {
          song.isFavorite = updatedSong.isFavorite;
        }

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
   * Alterna el estado de favorito de un álbum.
   *
   * @param albumId - ID del álbum
   */
  onToggleFavoriteAlbum(albumId: string): void {
    if (!this.canUseFavorites()) {
      return;
    }
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
   * Reproduce una canción.
   * Configura la playlist y registra la reproducción.
   *
   * @param song - Canción a reproducir
   */
  onPlaySong(song: Song): void {
    this.playerService.setPlaylist(this.displayedSongs);
    this.playerService.playSong(song, true);

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

  /**
   * Pausa la reproducción actual.
   */
  onPauseSong(): void {
    this.playerService.pause();
  }

  /**
   * Reproduce un álbum completo.
   * Carga el tracklist si es necesario y configura el reproductor.
   *
   * @param album - Álbum a reproducir
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
   * Cierra el reproductor de música.
   */
  onClosePlayer(): void {
    this.playerService.stop();
  }

  /**
   * Aplica el estado del tipo de contenido seleccionado.
   * Resetea los filtros y la paginación.
   *
   * @param type - Tipo de contenido
   */
  private applyContentTypeState(type: ContentType): void {
    this.currentContentType = type;
    this.currentPage = 1;
    this.filters.priceRange.min = 0;
    this.filters.priceRange.max = 100;
    this.filters.artistName = '';
    this.filters.searchTerm = '';
    this.filters.genre = '';
    this.filters.sortBy = 'most_recent';
  }

  /**
   * Sincroniza el tipo de contenido con los parámetros de la URL.
   *
   * @param type - Tipo de contenido
   * @param replaceUrl - Si debe reemplazar la URL actual
   */
  private syncContentTypeInUrl(type: ContentType, replaceUrl = false): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { type },
      replaceUrl
    });
  }

  /**
   * Extrae el contenido de la respuesta paginada.
   *
   * @param response - Respuesta de la API
   * @returns Array de contenido
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
   * Extrae los metadatos de paginación de la respuesta.
   *
   * @param response - Respuesta de la API
   * @returns Metadatos de paginación
   */
  private extractPaginationMetadata(response: PaginatedSongsResponse | PaginatedAlbumsResponse) {
    return {
      currentPage: response.currentPage || 1,
      totalPages: response.totalPages || 0,totalElements: response.totalElements || 0,
      elementsPerPage: response.size || response.elementsPerPage || this.itemsPerPage
    };
  }
  /**

   Determina si un álbum está seleccionado en el reproductor.

   @param album - Álbum a verificar
   @returns true si el álbum está en reproducción
   */
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

   Enriquece las canciones con información completa de sus artistas.

   @param songs - Canciones a enriquecer
   @returns Observable con las canciones enriquecidas
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
  /**

   Combina el estado de favoritos con las canciones.

   @param songs - Canciones a procesar
   @returns Observable con las canciones marcadas como favoritas
   */
  private mergeFavoriteSongs(songs: Song[]) {
    if (this.useMock || !this.canUseFavorites()) {
      return of(songs.map(song => ({ ...song, isFavorite: false })));
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

   Enriquece los álbumes con información completa de sus artistas.

   @param albums - Álbumes a enriquecer
   @returns Observable con los álbumes enriquecidos
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
  /**

   Combina el estado de favoritos con los álbumes.

   @param albums - Álbumes a procesar
   @returns Observable con los álbumes marcados como favoritos
   */
  private mergeFavoriteAlbums(albums: Album[]) {
    if (this.useMock || !this.canUseFavorites()) {
      return of(albums.map(album => ({ ...album, isFavorite: false })));
    }
    return this.albumService.getFavoriteAlbums().pipe(
      map((favorites) => {
        const favIds = new Set(favorites.map(f => f.id));
        return albums.map(album => ({ ...album, isFavorite: favIds.has(album.id) }));
      }),
      catchError(() => of(albums))
    );
  }

  /**

   Asigna el artista del álbum a las canciones que no tienen artista definido.

   @param tracks - Lista de canciones
   @param album - Álbum de origen
   @returns Canciones con el artista asignado
   */
  private addAlbumArtistToTracks(tracks: (Song | AlbumTrack)[], album: Album): AlbumTrack[] {
    return tracks.map(track => {
      const trackNumber = (track as AlbumTrack).trackNumber ?? 0;
      if (track.artist && track.artist.id) {
        return { ...track, trackNumber } as AlbumTrack;
      }
      return { ...track, artist: album.artist, trackNumber } as AlbumTrack;
    });
  }

  /**

   Agrega una canción al carrito de compras.

   @param song - Canción a agregar
   */
  onAddSongToCart(song: Song): void {
    if (!this.canUseCart()) {
      return;
    }

    this.carritoService.agregarItem({
      tipoProducto: 'CANCIÓN',
      idCancion: Number(song.id)
    }).subscribe({
      next: () => {},
      error: (err) => {
        console.error('Error al añadir canción al carrito:', err);
        if (err.error?.message?.includes('ya está en el carrito')) {
          alert('Esta canción ya está en tu carrito');
        } else {
          alert('Error al añadir la canción al carrito. Por favor, intenta de nuevo.');
        }
      }
    });
  }
  /**

   Agrega un álbum al carrito de compras.

   @param album - Álbum a agregar
   */
  onAddAlbumToCart(album: Album): void {
    if (!this.canUseCart()) {
      return;
    }

    this.carritoService.agregarItem({
      tipoProducto: 'ÁLBUM',
      idAlbum: Number(album.id)
    }).subscribe({
      next: () => {},
      error: (err) => {
        console.error('Error al añadir álbum al carrito:', err);
        if (err.error?.message?.includes('ya está en el carrito')) {
          alert('Este álbum ya está en tu carrito');
        } else {
          alert('Error al añadir el álbum al carrito. Por favor, intenta de nuevo.');
        }
      }
    });
  }
  /**

   Determina si se deben mostrar las acciones de favoritos.
   */
  get canShowFavoriteActions(): boolean {
    return this.canUseFavorites();
  }

  /**

   Determina si se deben mostrar las acciones de compra.
   */
  get canShowPurchaseActions(): boolean {
    return this.canUseCart();
  }

  /**

   Verifica si el usuario puede usar la funcionalidad de favoritos.
   Los artistas no pueden marcar contenido como favorito.

   @returns true si el usuario puede usar favoritos
   */
  private canUseFavorites(): boolean {
    const user = this.authState.getUserInfo();
    return this.authState.isAuthenticated() && user?.tipoUsuario !== TipoUsuario.ARTISTA;
  }

  /**

   Verifica si el usuario puede usar el carrito de compras.
   Los artistas no pueden comprar contenido.

   @returns true si el usuario puede usar el carrito
   */
  private canUseCart(): boolean {
    const user = this.authState.getUserInfo();
    return this.authState.isAuthenticated() && user?.tipoUsuario !== TipoUsuario.ARTISTA;
  }
}

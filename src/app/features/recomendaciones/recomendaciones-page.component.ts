import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ContentCarouselComponent, CarouselItem } from '../user-profile/components/content-carousel/content-carousel.component';
import { RecomendacionesService, RecomendacionesResponse, TipoRecomendacion } from '../../core/services/recomendaciones.service';
import { AuthStateService } from '../../core/services/auth-state.service';
import { SongService } from '../../core/services/song.service';
import { AlbumService } from '../../core/services/album.service';
import { forkJoin } from 'rxjs';

/**
 * Página de recomendaciones personalizadas para el usuario/artista.
 * Muestra carruseles de canciones, álbumes o ambos según preferencias.
 */
@Component({
  selector: 'app-recomendaciones-page',
  standalone: true,
  imports: [CommonModule, ContentCarouselComponent],
  templateUrl: './recomendaciones-page.component.html',
  styleUrls: ['./recomendaciones-page.component.scss']
})
export class RecomendacionesPageComponent implements OnInit {
  private recomendacionesService = inject(RecomendacionesService);
  private authStateService = inject(AuthStateService);
  private songService = inject(SongService);
  private albumService = inject(AlbumService);
  private router = inject(Router);

  /** Indicador de carga general */
  isLoading = signal(true);

  /** Mensaje de error */
  error = signal<string | null>(null);

  /** Indica si el usuario no tiene preferencias configuradas */
  sinPreferencias = signal(false);

  /** Items combinados (canciones + álbumes) */
  itemsAmbos = signal<CarouselItem[]>([]);

  /** Items de solo canciones */
  itemsCanciones = signal<CarouselItem[]>([]);

  /** Items de solo álbumes */
  itemsAlbumes = signal<CarouselItem[]>([]);

  ngOnInit(): void {
    this.cargarRecomendaciones();
  }

  /**
   * Carga todas las recomendaciones en paralelo
   * y aplica un delay mínimo para mejorar UX.
   */
  cargarRecomendaciones(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.sinPreferencias.set(false);

    const user = this.authStateService.currentUser();
    const esArtista = user?.tipoUsuario === 'ARTISTA';

    const recomendacionesMethod = esArtista
      ? this.recomendacionesService.obtenerRecomendacionesArtista.bind(this.recomendacionesService)
      : this.recomendacionesService.obtenerRecomendacionesUsuario.bind(this.recomendacionesService);

    const minimumDelay = new Promise(resolve => setTimeout(resolve, 500));

    const loadPromise = Promise.all([
      this.cargarAmbos(recomendacionesMethod),
      this.cargarCanciones(recomendacionesMethod),
      this.cargarAlbumes(recomendacionesMethod)
    ]);

    Promise.all([loadPromise, minimumDelay])
      .then(() => {
        if (
          this.itemsAmbos().length === 0 &&
          this.itemsCanciones().length === 0 &&
          this.itemsAlbumes().length === 0
        ) {
          this.sinPreferencias.set(true);
        }
      })
      .catch((err) => {
        console.error('Error al cargar recomendaciones:', err);
        this.error.set(err.error?.mensaje || 'Error al cargar las recomendaciones');
      })
      .finally(() => {
        this.isLoading.set(false);
      });
  }

  /**
   * Carga recomendaciones combinadas de canciones y álbumes
   * @param method Método de recomendación correspondiente al usuario/artista
   */
  private cargarAmbos(method: Function): Promise<void> {
    return new Promise((resolve, reject) => {
      method(TipoRecomendacion.AMBOS, 10).subscribe({
        next: (response: RecomendacionesResponse) => {
          const items: CarouselItem[] = [];
          const cancionIds = response.canciones.map(c => c.idCancion.toString());
          const albumIds = response.albumes.map(a => a.idAlbum.toString());

          if (cancionIds.length === 0 && albumIds.length === 0) {
            this.itemsAmbos.set([]);
            resolve();
            return;
          }

          const cancionObservables = cancionIds.map(id => this.songService.getSongById(id));
          const albumObservables = albumIds.map(id => this.albumService.getAlbumById(id));

          forkJoin([
            cancionObservables.length > 0 ? forkJoin(cancionObservables) : [],
            albumObservables.length > 0 ? forkJoin(albumObservables) : []
          ]).subscribe({
            next: ([canciones, albumes]) => {
              const maxLength = Math.max(canciones.length, albumes.length);

              for (let i = 0; i < maxLength; i++) {
                if (i < canciones.length) {
                  const c = canciones[i];
                  items.push({
                    id: Number(c.id),
                    nombre: c.title,
                    tipo: 'Canción',
                    imagen: c.coverUrl || undefined
                  });
                }
                if (i < albumes.length) {
                  const a = albumes[i];
                  items.push({
                    id: Number(a.id),
                    nombre: a.title,
                    tipo: 'Álbum',
                    imagen: a.coverUrl || undefined
                  });
                }
              }

              this.itemsAmbos.set(items.slice(0, 10));
              resolve();
            },
            error: reject
          });
        },
        error: reject
      });
    });
  }

  /**
   * Carga recomendaciones de solo canciones
   * @param method Método de recomendación correspondiente al usuario/artista
   */
  private cargarCanciones(method: Function): Promise<void> {
    return new Promise((resolve, reject) => {
      method(TipoRecomendacion.CANCIÓN, 10).subscribe({
        next: (response: RecomendacionesResponse) => {
          const cancionIds = response.canciones.map(c => c.idCancion.toString());
          const observables = cancionIds.map(id => this.songService.getSongById(id));

          if (observables.length === 0) {
            this.itemsCanciones.set([]);
            resolve();
            return;
          }

          forkJoin(observables).subscribe({
            next: (canciones) => {
              const items = canciones.map(cancion => ({
                id: Number(cancion.id),
                nombre: cancion.title,
                tipo: 'Canción',
                imagen: cancion.coverUrl || undefined
              }));

              this.itemsCanciones.set(items);
              resolve();
            },
            error: reject
          });
        },
        error: reject
      });
    });
  }

  /**
   * Carga recomendaciones de solo álbumes
   * @param method Método de recomendación correspondiente al usuario/artista
   */
  private cargarAlbumes(method: Function): Promise<void> {
    return new Promise((resolve, reject) => {
      method(TipoRecomendacion.ÁLBUM, 10).subscribe({
        next: (response: RecomendacionesResponse) => {
          const albumIds = response.albumes.map(a => a.idAlbum.toString());
          const observables = albumIds.map(id => this.albumService.getAlbumById(id));

          if (observables.length === 0) {
            this.itemsAlbumes.set([]);
            resolve();
            return;
          }

          forkJoin(observables).subscribe({
            next: (albumes) => {
              const items = albumes.map(album => ({
                id: Number(album.id),
                nombre: album.title,
                tipo: 'Álbum',
                imagen: album.coverUrl || undefined
              }));

              this.itemsAlbumes.set(items);
              resolve();
            },
            error: reject
          });
        },
        error: reject
      });
    });
  }

  /**
   * Maneja el clic en un item del carrusel
   * @param item Elemento clickeado
   */
  onItemClick(item: CarouselItem): void {
    console.log('🎵 Recomendación clickeada:', item);
    if (item.tipo === 'Canción') {
      this.router.navigate([`/cancion/${item.id}`]);
    } else if (item.tipo === 'Álbum') {
      this.router.navigate([`/album/${item.id}`]);
    }
  }

  /** Navega a la configuración de preferencias */
  irAPreferencias(): void {
    this.router.navigate(['/preferencias/configurar'], {
      queryParams: {
        reconfig: 'true',
        from: 'para-ti'
      }
    });
  }
}

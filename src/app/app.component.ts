import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { HeaderComponent } from './shared/components/layout/header/header.component';
import { FooterComponent } from './shared/components/layout/footer/footer.component';
import { MusicPlayerComponent } from './features/music/components/music-player/music-player.component';
import { MusicPlayerService } from './core/services/music-player.service';
import { SongService } from './core/services/song.service';
import { Subscription, filter } from 'rxjs';

/**
 * Componente raíz de la aplicación.
 * Gestiona la visibilidad del reproductor de música, navegación y layout general.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, MusicPlayerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  /** Título de la aplicación */
  title = 'ONDRA';

  /** Indica si se debe mostrar el reproductor de música */
  showPlayer = false;

  /** Suscripciones a observables */
  private subscriptions = new Subscription();

  constructor(
    private playerService: MusicPlayerService,
    private songService: SongService,
    private router: Router
  ) {}

  /**
   * Inicializa el componente, suscribiéndose a cambios del reproductor
   * y a eventos de navegación para scroll automático.
   */
  ngOnInit(): void {
    // Mostrar u ocultar el reproductor según la canción actual
    this.subscriptions.add(
      this.playerService.currentSong$.subscribe(currentSong => {
        this.showPlayer = currentSong !== null;
      })
    );

    // Scroll al inicio de la página en cada navegación
    this.subscriptions.add(
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      })
    );
  }

  /** Limpia todas las suscripciones al destruir el componente */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Maneja el cierre del reproductor de música.
   * Actualmente no realiza ninguna acción específica ya que el cierre automático
   * se gestiona internamente en MusicPlayerService.
   */
  onClosePlayer(): void {}

  /**
   * Alterna el estado de favorito de una canción.
   * Actualiza la información de la canción actual en el MusicPlayerService.
   *
   * @param songId ID de la canción a actualizar
   */
  onPlayerToggleFavorite(songId: string): void {
    this.songService.toggleFavorite(songId).subscribe({
      next: (updatedSong) => {
        this.playerService.updateCurrentSong({
          id: songId,
          isFavorite: updatedSong.isFavorite
        });
      },
      error: (err) => {
        console.error('Error toggling favorite:', err);
      }
    });
  }
}

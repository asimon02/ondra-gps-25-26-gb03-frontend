import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { HeaderComponent } from './shared/components/layout/header/header.component';
import { FooterComponent } from './shared/components/layout/footer/footer.component';
import { MusicPlayerComponent } from './features/music/components/music-player/music-player.component';
import { MusicPlayerService } from './core/services/music-player.service';
import { SongService } from './core/services/song.service';
import { Subscription, filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, MusicPlayerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'ONDRA';
  showPlayer = false;
  private subscriptions = new Subscription();

  constructor(
    private playerService: MusicPlayerService,
    private songService: SongService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Suscribirse a cambios en la canción actual del reproductor para mostrar/ocultar el player
    this.subscriptions.add(
      this.playerService.currentSong$.subscribe(currentSong => {
        this.showPlayer = currentSong !== null;
      })
    );

    // Scroll al inicio en cada navegación
    this.subscriptions.add(
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onClosePlayer(): void {
    // El reproductor se cierra automáticamente cuando se llama a stop()
  }

  onPlayerToggleFavorite(songId: string): void {
    this.songService.toggleFavorite(songId).subscribe({
      next: (updatedSong) => {
        // Actualizar el estado en el servicio del reproductor
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
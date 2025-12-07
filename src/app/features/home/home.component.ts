import { Component, OnInit, inject, signal } from '@angular/core';
import { HeroSectionComponent } from './components/hero-section/hero-section.component';
import { StatsComponent } from './components/stats/stats.component';
import { TrendingArtistsComponent } from './components/trending-artists/trending-artists.component';
import { HomeService } from './services/home.service';
import { ArtistaDTO } from '../../shared/models/artista.model';
import { StatsGlobales } from '../../shared/models/stats.model';

/**
 * Componente principal de la página Home.
 * Coordina la carga de secciones: hero, estadísticas y artistas en tendencia.
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [HeroSectionComponent, StatsComponent, TrendingArtistsComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  private homeService = inject(HomeService);

  /** Lista de artistas en tendencia */
  artistas = signal<ArtistaDTO[]>([]);

  /** Estadísticas globales de la plataforma */
  stats = signal<StatsGlobales | null>(null);

  /** Indicador de carga general */
  isLoading = signal(true);

  /** Mensaje de error al cargar estadísticas */
  errorStats = signal<string | null>(null);

  /** Mensaje de error al cargar artistas */
  errorArtistas = signal<string | null>(null);

  ngOnInit(): void {
    this.cargarDatos();
  }

  /**
   * Carga datos principales para la página Home:
   * - Estadísticas globales
   * - Artistas en tendencia (limitados a 4)
   */
  private cargarDatos(): void {
    this.isLoading.set(true);

    // Cargar estadísticas
    this.homeService.obtenerStats().subscribe({
      next: (stats) => {
        this.stats.set(stats);
      },
      error: (err) => {
        this.errorStats.set('No se pudieron cargar las estadísticas');
      }
    });

    // Cargar artistas en tendencia
    this.homeService.obtenerArtistasTrending(4).subscribe({
      next: (artistas) => {
        this.artistas.set(artistas);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorArtistas.set('No se pudieron cargar los artistas');
        this.isLoading.set(false);
      }
    });
  }
}

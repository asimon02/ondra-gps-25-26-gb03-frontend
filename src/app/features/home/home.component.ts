import { Component, OnInit, inject, signal } from '@angular/core';
import { HeroSectionComponent } from './components/hero-section/hero-section.component';
import { StatsComponent } from './components/stats/stats.component';
import { TrendingArtistsComponent } from './components/trending-artists/trending-artists.component';
import { HomeService } from './services/home.service';
import { ArtistaDTO } from '../../shared/models/artista.model';
import { StatsGlobales } from '../../shared/models/stats.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [HeroSectionComponent, StatsComponent, TrendingArtistsComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  private homeService = inject(HomeService);

  // Signals para datos reactivos
  artistas = signal<ArtistaDTO[]>([]);
  stats = signal<StatsGlobales | null>(null);
  isLoading = signal(true);
  errorStats = signal<string | null>(null);
  errorArtistas = signal<string | null>(null);

  ngOnInit(): void {
    this.cargarDatos();
  }

  private cargarDatos(): void {
    this.isLoading.set(true);

    // Cargar estadísticas
    this.homeService.obtenerStats().subscribe({
      next: (stats) => {
        this.stats.set(stats);
      },
      error: (err) => {
        console.error('Error al cargar estadísticas:', err);
        this.errorStats.set('No se pudieron cargar las estadísticas');
      }
    });

    // Cargar 4 artistas trending
    this.homeService.obtenerArtistasTrending(4).subscribe({
      next: (artistas) => {
        this.artistas.set(artistas);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar artistas:', err);
        this.errorArtistas.set('No se pudieron cargar los artistas');
        this.isLoading.set(false);
      }
    });
  }
}
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';
import { ArtistasService } from '../../../shared/services/artistas.service';
import { ArtistaDTO } from '../../../shared/models/artista.model';
import { StatsGlobales, StatsDTO, CancionesStatsDTO } from '../../../shared/models/stats.model';
import { environment } from '../../../../enviroments/enviroment';

/**
 * Servicio de lógica para la página Home.
 * Coordina llamadas a APIs de artistas y estadísticas globales.
 */
@Injectable({
  providedIn: 'root'
})
export class HomeService {
  private http = inject(HttpClient);
  private artistasService = inject(ArtistasService);

  /**
   * Obtiene los artistas en tendencia.
   * @param limit Número máximo de artistas a retornar (por defecto 5)
   * @returns Observable con un array de ArtistaDTO
   */
  obtenerArtistasTrending(limit: number = 5): Observable<ArtistaDTO[]> {
    return this.artistasService.obtenerArtistasTendencia(limit);
  }

  /**
   * Obtiene estadísticas globales combinando datos de usuarios y canciones.
   * - Usuarios: totalUsuarios, totalArtistas
   * - Contenidos: totalCanciones, totalReproducciones
   * @returns Observable con un objeto StatsGlobales
   */
  obtenerStats(): Observable<StatsGlobales> {
    const statsUsuarios$ = this.http.get<StatsDTO>(
      `${environment.apis.usuarios}/usuarios/stats`
    );
    const statsCanciones$ = this.http.get<CancionesStatsDTO>(
      `${environment.apis.contenidos}/canciones/stats`
    );

    return forkJoin({
      usuarios: statsUsuarios$,
      canciones: statsCanciones$
    }).pipe(
      map(({ usuarios, canciones }) => ({
        totalUsuarios: usuarios.totalUsuarios,
        totalArtistas: usuarios.totalArtistas,
        totalCanciones: canciones.totalCanciones,
        totalReproducciones: canciones.totalReproducciones
      }))
    );
  }
}

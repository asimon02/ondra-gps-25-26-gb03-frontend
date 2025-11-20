import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { forkJoin, map } from 'rxjs';
import { ArtistasService } from '../../../shared/services/artistas.service';
import { ArtistaDTO } from '../../../shared/models/artista.model';
import { StatsGlobales, StatsDTO, CancionesStatsDTO } from '../../../shared/models/stats.model';
import { environment } from '../../../../enviroments/enviroment';

/**
 * Servicio específico para la página Home
 * Orquesta las llamadas a otros servicios
 */
@Injectable({
  providedIn: 'root'
})
export class HomeService {
  private http = inject(HttpClient);
  private artistasService = inject(ArtistasService);

  /**
   * Obtiene los artistas en tendencia (por defecto 5)
   */
  obtenerArtistasTrending(limit: number = 5): Observable<ArtistaDTO[]> {
    return this.artistasService.obtenerArtistasTendencia(limit);
  }

  /**
   * Obtiene las estadísticas globales combinando datos de ambos microservicios
   * - Usuarios: totalUsuarios, totalArtistas
   * - Contenidos: totalCanciones, totalReproducciones
   */
  obtenerStats(): Observable<StatsGlobales> {
    const statsUsuarios$ = this.http.get<StatsDTO>(`${environment.apis.usuarios}/usuarios/stats`);
    const statsCanciones$ = this.http.get<CancionesStatsDTO>(`${environment.apis.contenidos}/canciones/stats`);

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

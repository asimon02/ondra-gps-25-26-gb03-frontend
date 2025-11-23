import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../enviroments/enviroment';

// ==================== INTERFACES ====================

/**
 * DTO para agregar preferencias (debe coincidir con AgregarPreferenciasDTO.java)
 */
export interface AgregarPreferenciasDTO {
  idsGeneros: number[];  // camelCase como en Java
}

/**
 * DTO de preferencia de género
 */
export interface PreferenciaGeneroDTO {
  id_genero: number;        // snake_case del backend
  nombre_genero: string;
}

/**
 * Respuesta al agregar preferencias
 */
export interface PreferenciasResponse {
  mensaje: string;
  generos_agregados: number;
  generos_duplicados: number;
  preferencias: PreferenciaGeneroDTO[];
}

/**
 * Canción recomendada
 */
export interface CancionRecomendada {
  id_cancion: number;
  titulo: string;
  id_genero: number;
  nombre_genero: string;
}

/**
 * Álbum recomendado
 */
export interface AlbumRecomendado {
  id_album: number;
  titulo: string;
  id_genero: number;
  nombre_genero: string;
}

/**
 * Respuesta de recomendaciones
 */
export interface RecomendacionesResponse {
  id_usuario: number;
  total_recomendaciones: number;
  canciones: CancionRecomendada[];
  albumes: AlbumRecomendado[];
}

/**
 * Tipos de recomendación disponibles
 */
export enum TipoRecomendacion {
  CANCION = 'cancion',
  ALBUM = 'album',
  AMBOS = 'ambos'
}

// ==================== SERVICIO ====================

@Injectable({
  providedIn: 'root'
})
export class RecomendacionesService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apis.recomendaciones}/usuarios`;

  // ==================== PREFERENCIAS ====================

  /**
   * Agrega géneros musicales a las preferencias del usuario
   *
   * Endpoint: POST /api/usuarios/{idUsuario}/preferencias
   * Body: { "idsGeneros": [1, 3, 5, 7] }
   *
   * @param idUsuario ID del usuario
   * @param idsGeneros Array de IDs de géneros a agregar
   * @returns Observable con la respuesta del servidor
   */
  agregarPreferencias(idUsuario: number, idsGeneros: number[]): Observable<PreferenciasResponse> {
    const body: AgregarPreferenciasDTO = { idsGeneros: idsGeneros };
    const url = `${this.API_URL}/${idUsuario}/preferencias`;

    console.log('📤 POST Preferencias:');
    console.log('   → URL:', url);
    console.log('   → Body:', body);

    return this.http.post<PreferenciasResponse>(url, body).pipe(
      tap((response) => {
        console.log('✅ Respuesta del servidor:', response);
      })
    );
  }

  /**
   * Obtiene las preferencias del usuario
   *
   * Endpoint: GET /api/usuarios/{idUsuario}/preferencias
   *
   * @param idUsuario ID del usuario
   * @returns Observable con array de preferencias
   */
  obtenerPreferencias(idUsuario: number): Observable<PreferenciaGeneroDTO[]> {
    return this.http.get<PreferenciaGeneroDTO[]>(
      `${this.API_URL}/${idUsuario}/preferencias`
    );
  }

  /**
   * Elimina una preferencia específica del usuario
   *
   * Endpoint: DELETE /api/usuarios/{idUsuario}/preferencias/{idGenero}
   *
   * @param idUsuario ID del usuario
   * @param idGenero ID del género a eliminar
   * @returns Observable void
   */
  eliminarPreferencia(idUsuario: number, idGenero: number): Observable<void> {
    return this.http.delete<void>(
      `${this.API_URL}/${idUsuario}/preferencias/${idGenero}`
    );
  }

  /**
   * Elimina todas las preferencias del usuario
   *
   * Endpoint: DELETE /api/usuarios/{idUsuario}/preferencias
   *
   * @param idUsuario ID del usuario
   * @returns Observable void
   */
  eliminarTodasPreferencias(idUsuario: number): Observable<void> {
    return this.http.delete<void>(
      `${this.API_URL}/${idUsuario}/preferencias`
    );
  }

  // ==================== RECOMENDACIONES ====================

  /**
   * Obtiene recomendaciones personalizadas para el usuario
   *
   * Endpoint: GET /api/usuarios/{idUsuario}/recomendaciones
   * Query params: ?tipo=ambos&limite=20
   *
   * @param idUsuario ID del usuario
   * @param tipo Tipo de recomendaciones (cancion, album, ambos)
   * @param limite Número máximo de recomendaciones (1-50)
   * @returns Observable con las recomendaciones
   */
  obtenerRecomendaciones(
    idUsuario: number,
    tipo: TipoRecomendacion = TipoRecomendacion.AMBOS,
    limite: number = 20
  ): Observable<RecomendacionesResponse> {
    let params = new HttpParams()
      .set('tipo', tipo)
      .set('limite', limite.toString());

    return this.http.get<RecomendacionesResponse>(
      `${this.API_URL}/${idUsuario}/recomendaciones`,
      { params }
    );
  }

  /**
   * Obtiene solo recomendaciones de canciones
   *
   * @param idUsuario ID del usuario
   * @param limite Número máximo de recomendaciones
   * @returns Observable con canciones recomendadas
   */
  obtenerRecomendacionesCanciones(
    idUsuario: number,
    limite: number = 15
  ): Observable<RecomendacionesResponse> {
    return this.obtenerRecomendaciones(idUsuario, TipoRecomendacion.CANCION, limite);
  }

  /**
   * Obtiene solo recomendaciones de álbumes
   *
   * @param idUsuario ID del usuario
   * @param limite Número máximo de recomendaciones
   * @returns Observable con álbumes recomendados
   */
  obtenerRecomendacionesAlbumes(
    idUsuario: number,
    limite: number = 12
  ): Observable<RecomendacionesResponse> {
    return this.obtenerRecomendaciones(idUsuario, TipoRecomendacion.ALBUM, limite);
  }

  // ==================== UTILIDADES ====================

  /**
   * Verifica si el usuario tiene preferencias configuradas
   *
   * @param idUsuario ID del usuario
   * @returns Observable<boolean> true si tiene preferencias
   */
  tienePreferencias(idUsuario: number): Observable<boolean> {
    return new Observable(observer => {
      this.obtenerPreferencias(idUsuario).subscribe({
        next: (preferencias) => {
          observer.next(preferencias.length > 0);
          observer.complete();
        },
        error: (error) => {
          observer.next(false);
          observer.complete();
        }
      });
    });
  }
}

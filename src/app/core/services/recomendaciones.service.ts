import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../enviroments/enviroment';

/**
 * DTO para agregar preferencias (IDs de géneros musicales)
 */
export interface AgregarPreferenciasDTO {
  idsGeneros: number[];
}

/**
 * DTO de preferencia de género
 */
export interface PreferenciaGeneroDTO {
  idGenero: number;
  nombreGenero: string;
}

/**
 * Respuesta al agregar preferencias
 */
export interface PreferenciasResponse {
  mensaje: string;
  generosAgregados: number;
  generosDuplicados: number;
  preferencias: PreferenciaGeneroDTO[];
}

/**
 * Canción recomendada
 */
export interface CancionRecomendada {
  idCancion: number;
  titulo: string;
  idGenero: number;
  nombreGenero: string;
}

/**
 * Álbum recomendado
 */
export interface AlbumRecomendado {
  idAlbum: number;
  titulo: string;
  idGenero: number;
  nombreGenero: string;
}

/**
 * Respuesta de recomendaciones
 */
export interface RecomendacionesResponse {
  idUsuario: number;
  totalRecomendaciones: number;
  canciones: CancionRecomendada[];
  albumes: AlbumRecomendado[];
}

/** Tipos de recomendación */
export enum TipoRecomendacion {
  CANCIÓN = 'cancion',
  ÁLBUM = 'album',
  AMBOS = 'ambos'
}

/**
 * Servicio para gestionar preferencias y recomendaciones musicales.
 *
 * Funcionalidades:
 * - CRUD de preferencias de géneros
 * - Obtención de recomendaciones para usuarios y artistas
 */
@Injectable({
  providedIn: 'root'
})
export class RecomendacionesService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apis.recomendaciones}/usuarios`;

  // ==================== PREFERENCIAS ====================

  /**
   * Agrega géneros a las preferencias del usuario.
   *
   * @param idUsuario ID del usuario
   * @param idsGeneros Array de IDs de géneros
   * @returns Observable con la respuesta del servidor
   */
  agregarPreferencias(idUsuario: number, idsGeneros: number[]): Observable<PreferenciasResponse> {
    const body: AgregarPreferenciasDTO = { idsGeneros };
    const url = `${this.API_URL}/${idUsuario}/preferencias`;

    console.log('📤 POST Preferencias:', url, body);

    return this.http.post<PreferenciasResponse>(url, body).pipe(
      tap(response => console.log('✅ Respuesta del servidor:', response))
    );
  }

  /**
   * Obtiene las preferencias actuales del usuario.
   *
   * @param idUsuario ID del usuario
   * @returns Observable con array de preferencias
   */
  obtenerPreferencias(idUsuario: number): Observable<PreferenciaGeneroDTO[]> {
    return this.http.get<PreferenciaGeneroDTO[]>(`${this.API_URL}/${idUsuario}/preferencias`);
  }

  /**
   * Elimina una preferencia específica del usuario.
   *
   * @param idUsuario ID del usuario
   * @param idGenero ID del género a eliminar
   * @returns Observable<void>
   */
  eliminarPreferencia(idUsuario: number, idGenero: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${idUsuario}/preferencias/${idGenero}`);
  }

  /**
   * Elimina todas las preferencias del usuario.
   *
   * @param idUsuario ID del usuario
   * @returns Observable<void>
   */
  eliminarTodasPreferencias(idUsuario: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${idUsuario}/preferencias`);
  }

  // ==================== RECOMENDACIONES ====================

  /**
   * Obtiene recomendaciones personalizadas para el usuario.
   *
   * @param idUsuario ID del usuario
   * @param tipo Tipo de recomendación (cancion, album, ambos)
   * @param limite Número máximo de recomendaciones
   * @returns Observable con recomendaciones
   */
  obtenerRecomendaciones(
    idUsuario: number,
    tipo: TipoRecomendacion = TipoRecomendacion.AMBOS,
    limite: number = 20
  ): Observable<RecomendacionesResponse> {
    const params = new HttpParams()
      .set('tipo', tipo)
      .set('limite', limite.toString());

    return this.http.get<RecomendacionesResponse>(`${this.API_URL}/${idUsuario}/recomendaciones`, { params });
  }

  /**
   * Obtiene solo recomendaciones de canciones.
   *
   * @param idUsuario ID del usuario
   * @param limite Número máximo de canciones
   * @returns Observable con canciones recomendadas
   */
  obtenerRecomendacionesCanciones(idUsuario: number, limite: number = 15): Observable<RecomendacionesResponse> {
    return this.obtenerRecomendaciones(idUsuario, TipoRecomendacion.CANCIÓN, limite);
  }

  /**
   * Obtiene solo recomendaciones de álbumes.
   *
   * @param idUsuario ID del usuario
   * @param limite Número máximo de álbumes
   * @returns Observable con álbumes recomendados
   */
  obtenerRecomendacionesAlbumes(idUsuario: number, limite: number = 12): Observable<RecomendacionesResponse> {
    return this.obtenerRecomendaciones(idUsuario, TipoRecomendacion.ÁLBUM, limite);
  }

  /**
   * Verifica si el usuario tiene preferencias configuradas.
   *
   * @param idUsuario ID del usuario
   * @returns Observable<boolean> true si tiene preferencias
   */
  tienePreferencias(idUsuario: number): Observable<boolean> {
    return new Observable(observer => {
      this.obtenerPreferencias(idUsuario).subscribe({
        next: preferencias => {
          observer.next(preferencias.length > 0);
          observer.complete();
        },
        error: () => {
          observer.next(false);
          observer.complete();
        }
      });
    });
  }

  /**
   * Obtiene recomendaciones para artistas (excluye su propio contenido).
   *
   * @param tipo Tipo de recomendación
   * @param limite Número máximo de recomendaciones
   * @returns Observable con recomendaciones del artista
   */
  obtenerRecomendacionesArtista(
    tipo: TipoRecomendacion = TipoRecomendacion.AMBOS,
    limite: number = 10
  ): Observable<RecomendacionesResponse> {
    const params = new HttpParams().set('tipo', tipo).set('limite', limite.toString());
    const url = `${environment.apis.recomendaciones}/artistas/recomendaciones`;

    console.log('📤 GET Recomendaciones Artista:', url);

    return this.http.get<RecomendacionesResponse>(url, { params }).pipe(
      tap(response => console.log('✅ Recomendaciones recibidas:', response))
    );
  }

  /**
   * Obtiene recomendaciones para usuarios (excluye compras y favoritos).
   *
   * @param tipo Tipo de recomendación
   * @param limite Número máximo de recomendaciones
   * @returns Observable con recomendaciones del usuario
   */
  obtenerRecomendacionesUsuario(
    tipo: TipoRecomendacion = TipoRecomendacion.AMBOS,
    limite: number = 10
  ): Observable<RecomendacionesResponse> {
    const params = new HttpParams().set('tipo', tipo).set('limite', limite.toString());
    const url = `${environment.apis.recomendaciones}/usuarios/recomendaciones`;

    console.log('📤 GET Recomendaciones Usuario:', url);

    return this.http.get<RecomendacionesResponse>(url, { params }).pipe(
      tap(response => console.log('✅ Recomendaciones recibidas:', response))
    );
  }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../enviroments/enviroment';
import { CrearValoracionDTO, EditarValoracionDTO, ValoracionDTO } from '../models/ratings.model';

/** Tipos de contenido que pueden ser valorados */
export type RatingContentType = 'song' | 'album';

/** Respuesta del promedio de valoraciones */
export interface AverageRatingResponse {
  valoracionPromedio: number | null;
  tieneValoraciones: boolean;
}

/**
 * Servicio para gestionar valoraciones de canciones y álbumes.
 *
 * Permite:
 * - Obtener la valoración de un usuario
 * - Obtener la valoración promedio
 * - Crear, actualizar y eliminar valoraciones
 */
@Injectable({
  providedIn: 'root'
})
export class RatingsService {
  /** URL base del API de valoraciones */
  private readonly apiUrl = `${environment.apis.contenidos}/valoraciones`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene la valoración de un usuario para un contenido específico.
   *
   * @param contentId ID del contenido (canción o álbum)
   * @param type Tipo de contenido ('song' | 'album')
   * @returns Observable con la valoración del usuario o null si no existe
   */
  getUserRating(contentId: number, type: RatingContentType): Observable<ValoracionDTO | null> {
    const url = type === 'song'
      ? `${this.apiUrl}/canciones/${contentId}/mi-valoracion`
      : `${this.apiUrl}/albumes/${contentId}/mi-valoracion`;

    return this.http.get<ValoracionDTO | null>(url, { observe: 'response' }).pipe(
      map((response: HttpResponse<ValoracionDTO | null>) => response.body ?? null)
    );
  }

  /**
   * Obtiene la valoración promedio de un contenido.
   *
   * @param contentId ID del contenido (canción o álbum)
   * @param type Tipo de contenido ('song' | 'album')
   * @returns Observable con promedio de valoraciones y si existen valoraciones
   */
  getAverageRating(contentId: number, type: RatingContentType): Observable<AverageRatingResponse> {
    const url = type === 'song'
      ? `${this.apiUrl}/canciones/${contentId}/promedio`
      : `${this.apiUrl}/albumes/${contentId}/promedio`;

    return this.http.get<any>(url).pipe(
      map((response) => ({
        valoracionPromedio: response?.valoracionPromedio !== undefined && response?.valoracionPromedio !== null
          ? Number(response.valoracionPromedio)
          : null,
        tieneValoraciones: !!response?.tieneValoraciones
      }))
    );
  }

  /**
   * Crea una nueva valoración para un contenido.
   *
   * @param dto Datos de la valoración a crear
   * @returns Observable con la valoración creada
   */
  createRating(dto: CrearValoracionDTO): Observable<ValoracionDTO> {
    return this.http.post<ValoracionDTO>(this.apiUrl, dto);
  }

  /**
   * Actualiza una valoración existente.
   *
   * @param idValoracion ID de la valoración a actualizar
   * @param dto Datos a actualizar
   * @returns Observable con la valoración actualizada
   */
  updateRating(idValoracion: number, dto: EditarValoracionDTO): Observable<ValoracionDTO> {
    return this.http.put<ValoracionDTO>(`${this.apiUrl}/${idValoracion}`, dto);
  }

  /**
   * Elimina una valoración existente.
   *
   * @param idValoracion ID de la valoración a eliminar
   * @returns Observable con un mensaje de confirmación
   */
  deleteRating(idValoracion: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${idValoracion}`);
  }
}

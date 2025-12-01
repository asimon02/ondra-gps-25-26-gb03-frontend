import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { environment } from '../../../enviroments/enviroment';

/**
 * DTO que representa un género musical
 */
export interface GeneroDTO {
  /** ID del género */
  id: number;

  /** Nombre del género */
  nombre: string;
}

/**
 * Servicio para obtener y buscar géneros musicales.
 *
 * Soporta:
 * - Carga de géneros desde backend
 * - Búsqueda de géneros
 * - Modo mock para desarrollo
 */
@Injectable({
  providedIn: 'root'
})
export class GenreService {
  /** Retardo simulado para mocks (ms) */
  private readonly MOCK_DELAY = 300;

  /** URL base de la API de géneros */
  private readonly apiUrl = `${environment.apis.contenidos}/generos`;

  /** Géneros de ejemplo usados en modo mock */
  private readonly MOCK_GENRES: string[] = [
    'Rock',
    'Progressive Rock',
    'Pop Rock',
    'Psychedelic Rock',
    'Art Rock',
    'Hard Rock',
    'Folk Rock',
    'Pop',
    'Soft Rock',
    'Rock Ballad',
    'Funk',
    'Dance',
    'Electronic',
    'Disco',
    'Synthpop'
  ];

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todos los géneros musicales.
   * En modo mock, devuelve un listado simulado.
   *
   * @returns Observable con la lista de géneros
   */
  getAllGenres(): Observable<GeneroDTO[]> {
    if (environment.useMock) {
      return of(
        this.MOCK_GENRES.map((nombre, index) => ({ id: index + 1, nombre }))
      ).pipe(delay(this.MOCK_DELAY));
    }

    return this.http.get<any>(this.apiUrl).pipe(
      map((res) => {
        if (Array.isArray(res)) {
          return res.map((g, index) => this.normalizeGenre(g, index));
        }
        const items = res?.content || res?.data || res?.generos || res || [];
        return (Array.isArray(items) ? items : []).map((g, index) => this.normalizeGenre(g, index));
      })
    );
  }

  /**
   * Busca géneros musicales por un texto de consulta.
   * En modo mock, filtra sobre los géneros simulados.
   *
   * @param query Texto a buscar en los nombres de géneros
   * @returns Observable con los géneros que coinciden
   */
  searchGenres(query: string): Observable<GeneroDTO[]> {
    if (environment.useMock) {
      const q = query.toLowerCase();
      return of(
        this.MOCK_GENRES
          .filter(g => g.toLowerCase().includes(q))
          .map((nombre, index) => ({ id: index + 1, nombre }))
      ).pipe(delay(this.MOCK_DELAY));
    }

    return this.http.get<any>(`${this.apiUrl}/buscar`, {
      params: { query }
    }).pipe(
      map((res) => {
        if (Array.isArray(res)) {
          return res.map((g, index) => this.normalizeGenre(g, index));
        }
        const items = res?.content || res?.data || res?.generos || res || [];
        return (Array.isArray(items) ? items : []).map((g, index) => this.normalizeGenre(g, index));
      })
    );
  }

  /**
   * Normaliza un objeto o string recibido desde la API
   * a un `GeneroDTO`.
   *
   * @param item Objeto o string representando un género
   * @param index Índice en la lista (usado si no hay ID disponible)
   * @returns Género normalizado
   */
  private normalizeGenre(item: any, index: number): GeneroDTO {
    if (typeof item === 'string') {
      return { id: index + 1, nombre: item };
    }
    return {
      id: item?.id ?? item?.idGenero ?? item?.genreId ?? index + 1,
      nombre: item?.nombre ?? item?.nombreGenero ?? item?.name ?? item?.genreName ?? ''
    };
  }
}

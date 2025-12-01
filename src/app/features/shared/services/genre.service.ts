import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../enviroments/enviroment';

/**
 * DTO que representa un género musical
 */
export interface GeneroDTO {
  idGenero: number;
  nombreGenero: string;
}

/**
 * Servicio para manejar géneros musicales
 */
@Injectable({
  providedIn: 'root'
})
export class GenreService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apis.contenidos}/generos`;

  /**
   * Obtiene todos los géneros musicales desde el backend
   * GET /api/contenidos/generos
   *
   * @returns Observable con un array de GeneroDTO
   */
  obtenerTodosLosGeneros(): Observable<GeneroDTO[]> {
    return this.http.get<GeneroDTO[]>(this.apiUrl);
  }
}

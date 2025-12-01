import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroments/enviroment';
import { ArtistaDTO, EditarArtistaDTO } from '../models/artista.model';

/**
 * Servicio para interactuar con los endpoints relacionados con artistas
 * del microservicio de Usuarios.
 */
@Injectable({
  providedIn: 'root'
})
export class ArtistasService {
  private http = inject(HttpClient);
  private readonly API_URL = environment.apis.usuarios + '/artistas';

  /**
   * Obtiene los artistas en tendencia.
   * GET /api/artistas?limit={limit}
   * Endpoint público, no requiere autenticación.
   *
   * @param limit Cantidad máxima de artistas a obtener (por defecto 5)
   * @returns Observable con un arreglo de artistas
   */
  obtenerArtistasTendencia(limit: number = 5): Observable<ArtistaDTO[]> {
    return this.http.get<ArtistaDTO[]>(`${this.API_URL}`, {
      params: { limit: limit.toString() }
    });
  }

  /**
   * Obtiene el perfil completo de un artista por su ID.
   * GET /api/artistas/{id}
   * Endpoint público, no requiere autenticación.
   *
   * @param id ID del artista
   * @returns Observable con los datos del artista
   */
  obtenerArtista(id: number): Observable<ArtistaDTO> {
    return this.http.get<ArtistaDTO>(`${this.API_URL}/${id}`);
  }

  /**
   * Edita el perfil de un artista existente.
   * PUT /api/artistas/{id}
   * Requiere autenticación JWT.
   *
   * @param id ID del artista a editar
   * @param dto Datos a actualizar en el perfil del artista
   * @returns Observable con los datos actualizados del artista
   */
  editarArtista(id: number, dto: EditarArtistaDTO): Observable<ArtistaDTO> {
    return this.http.put<ArtistaDTO>(`${this.API_URL}/${id}`, dto);
  }

  /**
   * Elimina el perfil de un artista.
   * DELETE /api/artistas/{id}
   * Requiere autenticación JWT.
   *
   * @param id ID del artista a eliminar
   * @returns Observable del resultado de la operación
   */
  eliminarArtista(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`);
  }
}

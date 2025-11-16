import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../enviroments/enviroment';
import { CancionDTO, CrearCancionDTO } from '../models/song.model';

@Injectable({
  providedIn: 'root'
})
export class SongService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apis.contenidos}/canciones`;

  /**
   * Lista canciones con filtros opcionales
   */
  listarCanciones(filtros?: {
    genero?: number;
    artista?: number;
    busqueda?: string;
    ordenar?: string;
    pagina?: number;
    limite?: number;
  }): Observable<any> {
    let params = new HttpParams();

    if (filtros) {
      if (filtros.genero) params = params.set('genero', filtros.genero.toString());
      if (filtros.artista) params = params.set('artista', filtros.artista.toString());
      if (filtros.busqueda) params = params.set('busqueda', filtros.busqueda);
      if (filtros.ordenar) params = params.set('ordenar', filtros.ordenar);
      if (filtros.pagina) params = params.set('pagina', filtros.pagina.toString());
      if (filtros.limite) params = params.set('limite', filtros.limite.toString());
    }

    return this.http.get<any>(this.apiUrl, { params });
  }

  /**
   * Obtiene una canción por ID
   */
  obtenerCancion(id: number): Observable<CancionDTO> {
    return this.http.get<CancionDTO>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crea una nueva canción
   */
  crearCancion(datos: CrearCancionDTO): Observable<CancionDTO> {
    return this.http.post<CancionDTO>(this.apiUrl, datos);
  }

  /**
   * Actualiza una canción existente
   */
  actualizarCancion(id: number, datos: Partial<CrearCancionDTO>): Observable<CancionDTO> {
    return this.http.put<CancionDTO>(`${this.apiUrl}/${id}`, datos);
  }

  /**
   * Elimina una canción
   */
  eliminarCancion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Lista canciones del artista autenticado
   */
  listarMisCanciones(): Observable<CancionDTO[]> {
    return this.http.get<CancionDTO[]>(`${this.apiUrl}/mis-canciones`);
  }
}

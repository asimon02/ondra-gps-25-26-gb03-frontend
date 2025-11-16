import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../enviroments/enviroment';
import { AlbumDTO, CrearAlbumDTO, AgregarCancionAlbumDTO } from '../models/album.model';

@Injectable({
  providedIn: 'root'
})
export class AlbumService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apis.contenidos}/albumes`;

  /**
   * Lista álbumes con filtros opcionales
   */
  listarAlbumes(filtros?: {
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
   * Obtiene un álbum por ID
   */
  obtenerAlbum(id: number): Observable<AlbumDTO> {
    return this.http.get<AlbumDTO>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crea un nuevo álbum
   */
  crearAlbum(datos: CrearAlbumDTO): Observable<AlbumDTO> {
    return this.http.post<AlbumDTO>(this.apiUrl, datos);
  }

  /**
   * Actualiza un álbum existente
   */
  actualizarAlbum(id: number, datos: Partial<CrearAlbumDTO>): Observable<AlbumDTO> {
    return this.http.put<AlbumDTO>(`${this.apiUrl}/${id}`, datos);
  }

  /**
   * Elimina un álbum
   */
  eliminarAlbum(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Agrega una canción a un álbum
   */
  agregarCancion(idAlbum: number, datos: AgregarCancionAlbumDTO): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${idAlbum}/canciones`, datos);
  }

  /**
   * Elimina una canción de un álbum
   */
  eliminarCancion(idAlbum: number, idCancion: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${idAlbum}/canciones/${idCancion}`);
  }

  /**
   * Lista álbumes del artista autenticado
   */
  listarMisAlbumes(): Observable<AlbumDTO[]> {
    return this.http.get<AlbumDTO[]>(`${this.apiUrl}/mis-albumes`);
  }
}

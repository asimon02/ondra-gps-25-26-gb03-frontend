import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../enviroments/enviroment';
import {
  CommentDTO,
  CommentsPageDTO,
  CrearComentarioDTO,
  EditarComentarioDTO,
  SuccessfulResponseDTO
} from '../models/comment.model';

/**
 * Servicio para la gestión de comentarios de canciones y álbumes.
 * Proporciona métodos para obtener, crear, editar y eliminar comentarios.
 */
@Injectable({
  providedIn: 'root'
})
export class CommentsService {
  /** URL base del endpoint de comentarios */
  private readonly baseUrl = `${environment.apis.contenidos}/comentarios`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene los comentarios de una canción paginados.
   * @param idCancion ID de la canción
   * @param page Página a obtener (default 1)
   * @param limit Número de comentarios por página (default 10)
   * @returns Observable con los comentarios paginados
   */
  getSongComments(idCancion: number, page = 1, limit = 10): Observable<CommentsPageDTO> {
    const params = this.buildPaginationParams(page, limit);
    return this.http.get<CommentsPageDTO>(`${this.baseUrl}/canciones/${idCancion}`, { params });
  }

  /**
   * Obtiene los comentarios de un álbum paginados.
   * @param idAlbum ID del álbum
   * @param page Página a obtener (default 1)
   * @param limit Número de comentarios por página (default 10)
   * @returns Observable con los comentarios paginados
   */
  getAlbumComments(idAlbum: number, page = 1, limit = 10): Observable<CommentsPageDTO> {
    const params = this.buildPaginationParams(page, limit);
    return this.http.get<CommentsPageDTO>(`${this.baseUrl}/albumes/${idAlbum}`, { params });
  }

  /**
   * Crea un nuevo comentario.
   * @param dto Datos del comentario a crear
   * @returns Observable con el comentario creado
   */
  createComment(dto: CrearComentarioDTO): Observable<CommentDTO> {
    return this.http.post<CommentDTO>(this.baseUrl, dto);
  }

  /**
   * Edita un comentario existente.
   * @param idComentario ID del comentario a editar
   * @param dto Datos actualizados del comentario
   * @returns Observable con el comentario actualizado
   */
  editComment(idComentario: number, dto: EditarComentarioDTO): Observable<CommentDTO> {
    return this.http.put<CommentDTO>(`${this.baseUrl}/${idComentario}`, dto);
  }

  /**
   * Elimina un comentario existente.
   * @param idComentario ID del comentario a eliminar
   * @returns Observable con la respuesta de la operación
   */
  deleteComment(idComentario: number): Observable<SuccessfulResponseDTO> {
    return this.http.delete<SuccessfulResponseDTO>(`${this.baseUrl}/${idComentario}`);
  }

  /**
   * Construye los parámetros de paginación para las solicitudes HTTP.
   * @param page Número de página (mínimo 1)
   * @param limit Número de elementos por página (mínimo 1)
   * @returns HttpParams configurado con page y limit
   */
  private buildPaginationParams(page: number, limit: number): HttpParams {
    let params = new HttpParams();
    params = params.set('page', String(page > 0 ? page : 1));
    params = params.set('limit', String(limit > 0 ? limit : 10));
    return params;
  }
}

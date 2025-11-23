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

@Injectable({
  providedIn: 'root'
})
export class CommentsService {
  private readonly baseUrl = `${environment.apis.contenidos}/comentarios`;

  constructor(private http: HttpClient) {}

  getSongComments(idCancion: number, page = 1, limit = 10): Observable<CommentsPageDTO> {
    const params = this.buildPaginationParams(page, limit);
    return this.http.get<CommentsPageDTO>(`${this.baseUrl}/canciones/${idCancion}`, { params });
  }

  getAlbumComments(idAlbum: number, page = 1, limit = 10): Observable<CommentsPageDTO> {
    const params = this.buildPaginationParams(page, limit);
    return this.http.get<CommentsPageDTO>(`${this.baseUrl}/albumes/${idAlbum}`, { params });
  }

  createComment(dto: CrearComentarioDTO): Observable<CommentDTO> {
    return this.http.post<CommentDTO>(this.baseUrl, dto);
  }

  editComment(idComentario: number, dto: EditarComentarioDTO): Observable<CommentDTO> {
    return this.http.put<CommentDTO>(`${this.baseUrl}/${idComentario}`, dto);
  }

  deleteComment(idComentario: number): Observable<SuccessfulResponseDTO> {
    return this.http.delete<SuccessfulResponseDTO>(`${this.baseUrl}/${idComentario}`);
  }

  private buildPaginationParams(page: number, limit: number): HttpParams {
    let params = new HttpParams();
    params = params.set('page', String(page > 0 ? page : 1));
    params = params.set('limit', String(limit > 0 ? limit : 10));
    return params;
  }
}

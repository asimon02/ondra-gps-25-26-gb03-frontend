import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../enviroments/enviroment';
import { CrearValoracionDTO, EditarValoracionDTO, ValoracionDTO } from '../models/ratings.model';

export type RatingContentType = 'song' | 'album';

export interface AverageRatingResponse {
  valoracionPromedio: number | null;
  tieneValoraciones: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class RatingsService {
  private readonly apiUrl = `${environment.apis.contenidos}/valoraciones`;

  constructor(private http: HttpClient) {}

  getUserRating(contentId: number, type: RatingContentType): Observable<ValoracionDTO | null> {
    const url = type === 'song'
      ? `${this.apiUrl}/canciones/${contentId}/mi-valoracion`
      : `${this.apiUrl}/albumes/${contentId}/mi-valoracion`;

    return this.http.get<ValoracionDTO | null>(url, { observe: 'response' }).pipe(
      map((response: HttpResponse<ValoracionDTO | null>) => response.body ?? null)
    );
  }

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

  createRating(dto: CrearValoracionDTO): Observable<ValoracionDTO> {
    return this.http.post<ValoracionDTO>(this.apiUrl, dto);
  }

  updateRating(idValoracion: number, dto: EditarValoracionDTO): Observable<ValoracionDTO> {
    return this.http.put<ValoracionDTO>(`${this.apiUrl}/${idValoracion}`, dto);
  }

  deleteRating(idValoracion: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${idValoracion}`);
  }
}

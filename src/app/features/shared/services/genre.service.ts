import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../enviroments/enviroment';

export interface GeneroDTO {
  idGenero: number;
  nombreGenero: string;
}

@Injectable({
  providedIn: 'root'
})
export class GenreService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apis.contenidos}/generos`;

  /**
   * Obtiene todos los géneros musicales desde el backend
   */
  obtenerTodosLosGeneros(): Observable<GeneroDTO[]> {
    return this.http.get<GeneroDTO[]>(this.apiUrl);
  }
}

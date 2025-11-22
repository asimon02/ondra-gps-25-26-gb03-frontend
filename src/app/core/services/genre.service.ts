import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { environment } from '../../../enviroments/enviroment';

export interface GeneroDTO {
  id: number;
  nombre: string;
}

@Injectable({
  providedIn: 'root'
})
export class GenreService {
  private readonly MOCK_DELAY = 300;
  private readonly apiUrl = `${environment.apis.contenidos}/generos`;

  // Mock data - generos extraidos manualmente
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

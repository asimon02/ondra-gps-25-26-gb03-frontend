import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap, shareReplay } from 'rxjs/operators';
import { environment } from '../../../enviroments/enviroment';
import { SongArtist } from '../models/song.model';

interface ArtistaDTO {
  idArtista: number;
  idUsuario: number;
  nombreArtistico: string;
  biografiaArtistico: string;
  fotoPerfilArtistico: string;
  esTendencia: boolean;
  slugArtistico: string;
}

@Injectable({
  providedIn: 'root'
})
export class ArtistService {
  private readonly apiUrl = `${environment.apis.usuarios}/artistas`;
  private cache = new Map<string, Observable<SongArtist>>();

  constructor(private http: HttpClient) {}

  getArtistById(id: string | number): Observable<SongArtist> {
    const key = id.toString();
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    const request$ = this.http.get<ArtistaDTO>(`${this.apiUrl}/${key}`).pipe(
      map(dto => this.mapDto(dto)),
      tap(artist => this.cache.set(key, of(artist))),
      shareReplay(1)
    );

    this.cache.set(key, request$);
    return request$;
  }

  private mapDto(dto: ArtistaDTO): SongArtist {
    return {
      id: dto.idArtista.toString(),
      artisticName: dto.nombreArtistico || 'Artista',
      profileImage: dto.fotoPerfilArtistico || null,
      userId: dto.idUsuario?.toString() ?? null,
      slug: dto.slugArtistico ?? null,
      bio: dto.biografiaArtistico ?? null
    };
  }
}

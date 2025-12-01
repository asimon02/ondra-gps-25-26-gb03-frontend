import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../enviroments/enviroment';

/**
 * Evento emitido cuando cambia el estado de favoritos.
 */
export interface FavoritoChangeEvent {
  /** Tipo de contenido afectado ('CANCIÓN' o 'ÁLBUM') */
  tipo: 'CANCIÓN' | 'ÁLBUM';

  /** ID del contenido afectado */
  idContenido: number;

  /** Acción realizada sobre el favorito ('AGREGADO' o 'ELIMINADO') */
  accion: 'AGREGADO' | 'ELIMINADO';

  /** Fecha y hora del evento */
  timestamp: Date;

  /** Para eventos de tipo ALBUM, incluye los IDs de las canciones del álbum */
  idsCanciones?: number[];
}

/**
 * Servicio centralizado para gestionar favoritos y emitir notificaciones reactivas
 * cuando se agregan o eliminan canciones o álbumes.
 */
@Injectable({
  providedIn: 'root'
})
export class FavoritosService {
  /** URL base del endpoint de favoritos */
  private readonly favoritesUrl = `${environment.apis.contenidos}/favoritos`;

  /** Subject interno para emitir eventos de cambios en favoritos */
  private favoritosChanged$ = new Subject<FavoritoChangeEvent>();

  /** Observable público al que los componentes pueden suscribirse */
  public onFavoritoChanged = this.favoritosChanged$.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Agrega una canción a favoritos.
   * @param idCancion ID de la canción a agregar
   * @returns Observable con la respuesta del backend
   */
  agregarCancionAFavoritos(idCancion: number): Observable<any> {
    const payload = { tipoContenido: 'CANCIÓN', idCancion };

    return this.http.post<any>(this.favoritesUrl, payload).pipe(
      tap(() => this.emitirCambio('CANCIÓN', idCancion, 'AGREGADO'))
    );
  }

  /**
   * Elimina una canción de favoritos.
   * @param idCancion ID de la canción a eliminar
   * @returns Observable<void>
   */
  eliminarCancionDeFavoritos(idCancion: number): Observable<void> {
    return this.http.delete<void>(`${this.favoritesUrl}/canciones/${idCancion}`).pipe(
      tap(() => this.emitirCambio('CANCIÓN', idCancion, 'ELIMINADO'))
    );
  }

  /**
   * Agrega un álbum a favoritos.
   * @param idAlbum ID del álbum a agregar
   * @returns Observable con la respuesta del backend
   */
  agregarAlbumAFavoritos(idAlbum: number): Observable<any> {
    const payload = { tipoContenido: 'ÁLBUM', idAlbum };

    return this.http.post<any>(this.favoritesUrl, payload).pipe(
      tap(() => this.emitirCambio('ÁLBUM', idAlbum, 'AGREGADO'))
    );
  }

  /**
   * Agrega un álbum y todas sus canciones a favoritos.
   * Emite eventos individuales para el álbum y cada canción.
   *
   * @param idAlbum ID del álbum
   * @param idsCanciones IDs de las canciones del álbum
   * @returns Observable con la respuesta del backend
   */
  agregarAlbumConCancionesAFavoritos(idAlbum: number, idsCanciones: number[]): Observable<any> {
    const payload = { tipoContenido: 'ÁLBUM', idAlbum };

    return this.http.post<any>(this.favoritesUrl, payload).pipe(
      tap(() => {
        this.emitirCambio('ÁLBUM', idAlbum, 'AGREGADO', idsCanciones);

        idsCanciones.forEach(idCancion => {
          const payloadCancion = { tipoContenido: 'CANCIÓN', idCancion };
          this.http.post<any>(this.favoritesUrl, payloadCancion).subscribe(() => {
            this.emitirCambio('CANCIÓN', idCancion, 'AGREGADO');
          });
        });
      })
    );
  }

  /**
   * Elimina un álbum de favoritos.
   * @param idAlbum ID del álbum a eliminar
   * @returns Observable<void>
   */
  eliminarAlbumDeFavoritos(idAlbum: number): Observable<void> {
    return this.http.delete<void>(`${this.favoritesUrl}/albumes/${idAlbum}`).pipe(
      tap(() => this.emitirCambio('ÁLBUM', idAlbum, 'ELIMINADO'))
    );
  }

  /**
   * Elimina un álbum y todas sus canciones de favoritos.
   * Emite eventos individuales para el álbum y cada canción.
   *
   * @param idAlbum ID del álbum
   * @param idsCanciones IDs de las canciones del álbum
   * @returns Observable<void>
   */
  eliminarAlbumConCancionesDeFavoritos(idAlbum: number, idsCanciones: number[]): Observable<void> {
    return this.http.delete<void>(`${this.favoritesUrl}/albumes/${idAlbum}`).pipe(
      tap(() => {
        this.emitirCambio('ÁLBUM', idAlbum, 'ELIMINADO', idsCanciones);

        idsCanciones.forEach(idCancion => {
          this.http.delete<void>(`${this.favoritesUrl}/canciones/${idCancion}`).subscribe(() => {
            this.emitirCambio('CANCIÓN', idCancion, 'ELIMINADO');
          });
        });
      })
    );
  }

  /**
   * Verifica si una canción está marcada como favorita.
   * @param idCancion ID de la canción
   * @returns Observable<boolean>
   */
  esCancionFavorita(idCancion: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.favoritesUrl}/canciones/${idCancion}/check`);
  }

  /**
   * Verifica si un álbum está marcado como favorito.
   * @param idAlbum ID del álbum
   * @returns Observable<boolean>
   */
  esAlbumFavorito(idAlbum: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.favoritesUrl}/albumes/${idAlbum}/check`);
  }

  /**
   * Emite un evento de cambio en favoritos.
   *
   * @param tipo Tipo de contenido ('CANCIÓN' o 'ÁLBUM')
   * @param idContenido ID del contenido afectado
   * @param accion Acción realizada ('AGREGADO' o 'ELIMINADO')
   * @param idsCanciones Opcional. IDs de las canciones asociadas (para álbumes)
   */
  private emitirCambio(
    tipo: 'CANCIÓN' | 'ÁLBUM',
    idContenido: number,
    accion: 'AGREGADO' | 'ELIMINADO',
    idsCanciones?: number[]
  ): void {
    this.favoritosChanged$.next({
      tipo,
      idContenido,
      accion,
      timestamp: new Date(),
      idsCanciones
    });
  }
}

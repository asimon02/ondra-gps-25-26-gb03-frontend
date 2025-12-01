import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../enviroments/enviroment';

/**
 * Estadísticas de seguimiento de un usuario
 */
export interface FollowStats {
  /** Cantidad de seguidores del usuario */
  followers: number;

  /** Cantidad de usuarios que sigue el usuario */
  following: number;
}

/**
 * Servicio para manejar seguimientos entre usuarios.
 * Permite obtener estadísticas, verificar seguimientos y seguir/dejar de seguir usuarios.
 */
@Injectable({
  providedIn: 'root'
})
export class FollowService {
  /** URL base del endpoint de seguimientos */
  private readonly baseUrl = `${environment.apis.usuarios}/seguimientos`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene las estadísticas de seguimiento de un usuario.
   *
   * @param userId ID del usuario a consultar
   * @returns Observable con el número de seguidores y seguidos
   */
  getStats(userId: string | number): Observable<FollowStats> {
    if (environment.useMock) {
      return of({ followers: 0, following: 0 });
    }

    return this.http.get<any>(`${this.baseUrl}/${userId}/estadisticas`).pipe(
      map(dto => ({
        followers: Number(dto?.seguidores ?? dto?.followers ?? 0),
        following: Number(dto?.seguidos ?? dto?.following ?? 0)
      }))
    );
  }

  /**
   * Verifica si el usuario actual sigue a otro usuario.
   *
   * @param userId ID del usuario a verificar
   * @returns Observable<boolean> indicando si se sigue o no
   */
  isFollowing(userId: string | number): Observable<boolean> {
    if (environment.useMock) {
      return of(false);
    }
    return this.http.get<boolean>(`${this.baseUrl}/${userId}/verificar`);
  }

  /**
   * Sigue a un usuario.
   *
   * @param userId ID del usuario a seguir
   * @returns Observable<void>
   */
  follow(userId: string | number): Observable<void> {
    if (environment.useMock) {
      return of(void 0);
    }
    return this.http.post<void>(this.baseUrl, { idUsuarioASeguir: Number(userId) });
  }

  /**
   * Deja de seguir a un usuario.
   *
   * @param userId ID del usuario a dejar de seguir
   * @returns Observable<void>
   */
  unfollow(userId: string | number): Observable<void> {
    if (environment.useMock) {
      return of(void 0);
    }
    return this.http.delete<void>(`${this.baseUrl}/${userId}`);
  }
}

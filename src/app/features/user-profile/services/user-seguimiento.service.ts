import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  UsuarioBasico,
  EstadisticasSeguimiento,
  SeguirUsuarioRequest
} from '../models/seguimiento.model';
import { environment } from '../../../../enviroments/enviroment';

/**
 * Servicio para gestionar seguimientos de usuarios.
 * Permite obtener estadísticas, seguidores, seguidos y realizar acciones de seguimiento.
 */
@Injectable({
  providedIn: 'root'
})
export class UserSeguimientoService {
  private readonly apiUrl = `${environment.apis.usuarios}/seguimientos`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene estadísticas de seguimiento de un usuario.
   * @param idUsuario ID del usuario
   * @returns Observable con las estadísticas de seguimiento
   */
  obtenerEstadisticas(idUsuario: number): Observable<EstadisticasSeguimiento> {
    return this.http.get<EstadisticasSeguimiento>(`${this.apiUrl}/${idUsuario}/estadisticas`);
  }

  /**
   * Obtiene la lista de usuarios que sigue un usuario.
   * @param idUsuario ID del usuario
   * @returns Observable con la lista de usuarios seguidos
   */
  obtenerSeguidos(idUsuario: number): Observable<UsuarioBasico[]> {
    return this.http.get<UsuarioBasico[]>(`${this.apiUrl}/${idUsuario}/seguidos`);
  }

  /**
   * Obtiene la lista de seguidores de un usuario.
   * @param idUsuario ID del usuario
   * @returns Observable con la lista de seguidores
   */
  obtenerSeguidores(idUsuario: number): Observable<UsuarioBasico[]> {
    return this.http.get<UsuarioBasico[]>(`${this.apiUrl}/${idUsuario}/seguidores`);
  }

  /**
   * Inicia el seguimiento de un usuario.
   * @param idUsuarioASeguir ID del usuario a seguir
   * @returns Observable con la respuesta de la acción
   */
  seguirUsuario(idUsuarioASeguir: number): Observable<any> {
    const request: SeguirUsuarioRequest = { idUsuarioASeguir };
    return this.http.post(this.apiUrl, request);
  }

  /**
   * Deja de seguir a un usuario.
   * @param idUsuario ID del usuario a dejar de seguir
   * @returns Observable<void>
   */
  dejarDeSeguir(idUsuario: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${idUsuario}`);
  }

  /**
   * Verifica si el usuario actual sigue a otro usuario.
   * @param idUsuario ID del usuario a verificar
   * @returns Observable<boolean> indicando si se sigue al usuario
   */
  verificarSeguimiento(idUsuario: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/${idUsuario}/verificar`);
  }
}

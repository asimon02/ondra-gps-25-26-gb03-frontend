import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../enviroments/enviroment';

/**
 * DTO para agregar preferencias (debe coincidir con AgregarPreferenciasDTO.java)
 */
export interface AgregarPreferenciasDTO {
  idsGeneros: number[];  // ✅ camelCase como en Java
}

/**
 * DTO de preferencia de género
 */
export interface PreferenciaGeneroDTO {
  idGenero: number;
  nombreGenero: string;
}

@Injectable({
  providedIn: 'root'
})
export class RecomendacionesService {
  private http = inject(HttpClient);

  // URL base para el microservicio de recomendaciones
  private readonly API_URL = `${environment.apis.recomendaciones}/usuarios`;

  /**
   * Agrega géneros musicales a las preferencias del usuario
   *
   * Endpoint: POST /api/usuarios/{idUsuario}/preferencias
   * Body: { "idsGeneros": [1, 3, 5, 7] }
   *
   * @param idUsuario ID del usuario
   * @param idsGeneros Array de IDs de géneros
   * @returns Observable<any>
   */
  agregarPreferencias(idUsuario: number, idsGeneros: number[]): Observable<any> {
    // ✅ CORRECTO: Usa camelCase "idsGeneros"
    const body: AgregarPreferenciasDTO = {
      idsGeneros: idsGeneros
    };

    const url = `${this.API_URL}/${idUsuario}/preferencias`;

    console.log('📤 POST Preferencias:');
    console.log('   → URL:', url);
    console.log('   → Body:', body);

    return this.http.post(url, body).pipe(
      tap((response) => {
        console.log('✅ Respuesta del servidor:', response);
      })
    );
  }

  /**
   * Obtiene las preferencias del usuario
   *
   * Endpoint: GET /api/usuarios/{idUsuario}/preferencias
   *
   * @param idUsuario ID del usuario
   * @returns Observable<PreferenciaGeneroDTO[]>
   */
  obtenerPreferencias(idUsuario: number): Observable<PreferenciaGeneroDTO[]> {
    return this.http.get<PreferenciaGeneroDTO[]>(
      `${this.API_URL}/${idUsuario}/preferencias`
    );
  }

  /**
   * Elimina todas las preferencias de un usuario
   *
   * Endpoint: DELETE /api/usuarios/{idUsuario}/preferencias
   *
   * @param idUsuario ID del usuario
   * @returns Observable<void>
   */
  eliminarPreferencias(idUsuario: number): Observable<void> {
    return this.http.delete<void>(
      `${this.API_URL}/${idUsuario}/preferencias`
    );
  }
}

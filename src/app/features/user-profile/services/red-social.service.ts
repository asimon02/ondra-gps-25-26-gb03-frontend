import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { RedSocial, RedSocialCrear, RedSocialEditar } from '../models/red-social.model';
import { environment } from '../../../../enviroments/enviroment';

/**
 * Servicio para gestionar las redes sociales de los artistas.
 * Permite listar, crear, editar y eliminar redes sociales.
 * El token JWT se agrega automáticamente mediante el interceptor.
 */
@Injectable({
  providedIn: 'root'
})
export class RedSocialService {
  private readonly apiUrl = `${environment.apis.usuarios}/artistas`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todas las redes sociales de un artista.
   * @param artistaId ID del artista
   * @returns Observable con la lista de redes sociales
   */
  listarRedesSociales(artistaId: number): Observable<RedSocial[]> {
    const url = `${this.apiUrl}/${artistaId}/redes`;
    return this.http.get<RedSocial[]>(url).pipe(catchError(this.handleError));
  }

  /**
   * Crea una nueva red social para un artista.
   * @param artistaId ID del artista
   * @param datos Datos de la red social a crear
   * @returns Observable con la red social creada
   */
  crearRedSocial(artistaId: number, datos: RedSocialCrear): Observable<RedSocial> {
    const url = `${this.apiUrl}/${artistaId}/redes`;
    this.validarRedSocial(datos);
    return this.http.post<RedSocial>(url, datos).pipe(catchError(this.handleError));
  }

  /**
   * Edita una red social existente de un artista.
   * @param artistaId ID del artista
   * @param idRedSocial ID de la red social a editar
   * @param datos Datos de la red social a actualizar
   * @returns Observable con la red social actualizada
   */
  editarRedSocial(
    artistaId: number,
    idRedSocial: number,
    datos: RedSocialEditar
  ): Observable<RedSocial> {
    const url = `${this.apiUrl}/${artistaId}/redes/${idRedSocial}`;
    if (datos.urlRedSocial) {
      this.validarUrl(datos.urlRedSocial);
    }
    return this.http.put<RedSocial>(url, datos).pipe(catchError(this.handleError));
  }

  /**
   * Elimina una red social de un artista.
   * @param artistaId ID del artista
   * @param idRedSocial ID de la red social a eliminar
   * @returns Observable<void>
   */
  eliminarRedSocial(artistaId: number, idRedSocial: number): Observable<void> {
    const url = `${this.apiUrl}/${artistaId}/redes/${idRedSocial}`;
    return this.http.delete<void>(url).pipe(catchError(this.handleError));
  }

  // ==================== MÉTODOS PRIVADOS ====================

  /**
   * Valida los datos de una red social antes de enviarlos al servidor.
   * @param datos Datos de la red social
   */
  private validarRedSocial(datos: RedSocialCrear): void {
    if (!datos.tipoRedSocial) {
      throw new Error('El tipo de red social es obligatorio');
    }
    this.validarUrl(datos.urlRedSocial);
  }

  /**
   * Valida la URL de una red social.
   * @param url URL de la red social
   */
  private validarUrl(url: string): void {
    if (!url || !url.trim()) {
      throw new Error('La URL de la red social es obligatoria');
    }

    const urlTrimmed = url.trim();

    if (urlTrimmed.length < 10) {
      throw new Error('La URL debe tener al menos 10 caracteres');
    }

    if (urlTrimmed.length > 500) {
      throw new Error('La URL no puede exceder 500 caracteres');
    }

    if (!/^https?:\/\/.+/.test(urlTrimmed)) {
      throw new Error('La URL debe comenzar con http:// o https://');
    }
  }

  /**
   * Maneja los errores de las llamadas HTTP.
   * @param error Objeto de error HTTP
   * @returns Observable que lanza un Error
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'Ha ocurrido un error inesperado';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 400:
          errorMessage = error.error?.message || 'Datos inválidos. Verifica la información ingresada';
          break;
        case 403:
          errorMessage = 'No tienes permisos para realizar esta acción';
          break;
        case 404:
          errorMessage = 'Red social o artista no encontrado';
          break;
        case 409:
          errorMessage = 'Ya existe una red social de este tipo registrada';
          break;
        case 500:
          errorMessage = 'Error del servidor. Inténtalo más tarde';
          break;
        default:
          errorMessage = error.error?.message || `Error del servidor (${error.status})`;
      }
    }

    console.error('Error en RedSocialService:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}

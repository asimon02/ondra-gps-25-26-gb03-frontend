import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../enviroments/enviroment';
import {
  MetodoPagoUsuarioDTO,
  MetodoCobroArtistaDTO
} from '../models/payment.model';

/**
 * Servicio para gestión de métodos de pago (usuarios) y cobro (artistas)
 */
@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  /** Cliente HTTP inyectado */
  private http = inject(HttpClient);

  /** URL base de la API de usuarios/artistas */
  private apiUrl = `${environment.apis.usuarios}`;

  // ==================== MÉTODOS DE PAGO (USUARIOS) ====================

  /**
   * Lista todos los métodos de pago de un usuario
   * GET /api/usuarios/{id}/metodos-pago
   * @param idUsuario ID del usuario
   * @returns Observable con arreglo de métodos de pago
   */
  listarMetodosPago(idUsuario: number): Observable<MetodoPagoUsuarioDTO[]> {
    return this.http.get<MetodoPagoUsuarioDTO[]>(
      `${this.apiUrl}/usuarios/${idUsuario}/metodos-pago`
    );
  }

  /**
   * Crea un nuevo método de pago para un usuario
   * POST /api/usuarios/{id}/metodos-pago
   * @param idUsuario ID del usuario
   * @param datos Datos del método de pago (pueden incluir número de tarjeta, CVV, etc.)
   * @returns Observable con el método de pago creado
   */
  crearMetodoPago(
    idUsuario: number,
    datos: any
  ): Observable<MetodoPagoUsuarioDTO> {
    return this.http.post<MetodoPagoUsuarioDTO>(
      `${this.apiUrl}/usuarios/${idUsuario}/metodos-pago`,
      datos
    );
  }

  /**
   * Elimina un método de pago de un usuario
   * DELETE /api/usuarios/{id}/metodos-pago/{id_metodo}
   * @param idUsuario ID del usuario
   * @param idMetodoPago ID del método de pago
   * @returns Observable con mensaje de texto
   */
  eliminarMetodoPago(idUsuario: number, idMetodoPago: number): Observable<string> {
    return this.http.delete(
      `${this.apiUrl}/usuarios/${idUsuario}/metodos-pago/${idMetodoPago}`,
      { responseType: 'text' }
    );
  }

  /**
   * Actualiza un método de pago existente de un usuario
   * PUT /api/usuarios/{id}/metodos-pago/{id_metodo}
   * @param idUsuario ID del usuario
   * @param idMetodoPago ID del método de pago
   * @param datos Campos a actualizar
   * @returns Observable con el método de pago actualizado
   */
  actualizarMetodoPago(
    idUsuario: number,
    idMetodoPago: number,
    datos: any
  ): Observable<MetodoPagoUsuarioDTO> {
    return this.http.put<MetodoPagoUsuarioDTO>(
      `${this.apiUrl}/usuarios/${idUsuario}/metodos-pago/${idMetodoPago}`,
      datos
    );
  }

  // ==================== MÉTODOS DE COBRO (ARTISTAS) ====================

  /**
   * Lista todos los métodos de cobro de un artista
   * GET /api/artistas/{id}/metodos-cobro
   * @param idArtista ID del artista
   * @returns Observable con arreglo de métodos de cobro
   */
  listarMetodosCobro(idArtista: number): Observable<MetodoCobroArtistaDTO[]> {
    return this.http.get<MetodoCobroArtistaDTO[]>(
      `${this.apiUrl}/artistas/${idArtista}/metodos-cobro`
    );
  }

  /**
   * Crea un nuevo método de cobro para un artista
   * POST /api/artistas/{id}/metodos-cobro
   * @param idArtista ID del artista
   * @param datos Datos del método de cobro (pueden incluir IBAN, PayPal, etc.)
   * @returns Observable con el método de cobro creado
   */
  crearMetodoCobro(
    idArtista: number,
    datos: any
  ): Observable<MetodoCobroArtistaDTO> {
    return this.http.post<MetodoCobroArtistaDTO>(
      `${this.apiUrl}/artistas/${idArtista}/metodos-cobro`,
      datos
    );
  }

  /**
   * Elimina un método de cobro de un artista
   * DELETE /api/artistas/{id}/metodos-cobro/{id_metodo}
   * @param idArtista ID del artista
   * @param idMetodoCobro ID del método de cobro
   * @returns Observable con mensaje de texto
   */
  eliminarMetodoCobro(idArtista: number, idMetodoCobro: number): Observable<string> {
    return this.http.delete(
      `${this.apiUrl}/artistas/${idArtista}/metodos-cobro/${idMetodoCobro}`,
      { responseType: 'text' }
    );
  }

  /**
   * Actualiza un método de cobro existente de un artista
   * PUT /api/artistas/{id}/metodos-cobro/{id_metodo}
   * @param idArtista ID del artista
   * @param idMetodoCobro ID del método de cobro
   * @param datos Campos a actualizar
   * @returns Observable con el método de cobro actualizado
   */
  actualizarMetodoCobro(
    idArtista: number,
    idMetodoCobro: number,
    datos: any
  ): Observable<MetodoCobroArtistaDTO> {
    return this.http.put<MetodoCobroArtistaDTO>(
      `${this.apiUrl}/artistas/${idArtista}/metodos-cobro/${idMetodoCobro}`,
      datos
    );
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../enviroments/enviroment';
import {
  MetodoPagoUsuarioDTO,
  MetodoCobroArtistaDTO
} from '../models/payment.model';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apis.usuarios}`;

  // ==================== MÉTODOS DE PAGO (USUARIOS) ====================

  /**
   * Lista todos los métodos de pago de un usuario
   * GET /api/usuarios/{id}/metodos-pago
   */
  listarMetodosPago(idUsuario: number): Observable<MetodoPagoUsuarioDTO[]> {
    return this.http.get<MetodoPagoUsuarioDTO[]>(
      `${this.apiUrl}/usuarios/${idUsuario}/metodos-pago`
    );
  }

  /**
   * Crea un nuevo método de pago para un usuario
   * POST /api/usuarios/{id}/metodos-pago
   */
  crearMetodoPago(
    idUsuario: number,
    datos: any // Usamos any para permitir campos opcionales dinámicos
  ): Observable<MetodoPagoUsuarioDTO> {
    return this.http.post<MetodoPagoUsuarioDTO>(
      `${this.apiUrl}/usuarios/${idUsuario}/metodos-pago`,
      datos
    );
  }

  /**
   * ✅ SOLUCIÓN: Elimina un método de pago de un usuario con responseType: 'text'
   * DELETE /api/usuarios/{id}/metodos-pago/{id_metodo}
   */
  eliminarMetodoPago(idUsuario: number, idMetodoPago: number): Observable<string> {
    return this.http.delete(
      `${this.apiUrl}/usuarios/${idUsuario}/metodos-pago/${idMetodoPago}`,
      { responseType: 'text' }
    );
  }

  // ==================== MÉTODOS DE COBRO (ARTISTAS) ====================

  /**
   * Lista todos los métodos de cobro de un artista
   * GET /api/artistas/{id}/metodos-cobro
   */
  listarMetodosCobro(idArtista: number): Observable<MetodoCobroArtistaDTO[]> {
    return this.http.get<MetodoCobroArtistaDTO[]>(
      `${this.apiUrl}/artistas/${idArtista}/metodos-cobro`
    );
  }

  /**
   * Crea un nuevo método de cobro para un artista
   * POST /api/artistas/{id}/metodos-cobro
   */
  crearMetodoCobro(
    idArtista: number,
    datos: any // Usamos any para permitir campos opcionales dinámicos
  ): Observable<MetodoCobroArtistaDTO> {
    return this.http.post<MetodoCobroArtistaDTO>(
      `${this.apiUrl}/artistas/${idArtista}/metodos-cobro`,
      datos
    );
  }

  /**
   * OLUCIÓN: Elimina un método de cobro de un artista con responseType: 'text'
   * DELETE /api/artistas/{id}/metodos-cobro/{id_metodo}
   */
  eliminarMetodoCobro(idArtista: number, idMetodoCobro: number): Observable<string> {
    return this.http.delete(
      `${this.apiUrl}/artistas/${idArtista}/metodos-cobro/${idMetodoCobro}`,
      { responseType: 'text' }
    );
  }

  actualizarMetodoPago(idUsuario: number, idMetodoPago: number, datos: any): Observable<MetodoPagoUsuarioDTO> {
    return this.http.put<MetodoPagoUsuarioDTO>(
      `${this.apiUrl}/usuarios/${idUsuario}/metodos-pago/${idMetodoPago}`,
      datos
    );
  }

  actualizarMetodoCobro(idArtista: number, idMetodoCobro: number, datos: any): Observable<MetodoCobroArtistaDTO> {
    return this.http.put<MetodoCobroArtistaDTO>(
      `${this.apiUrl}/artistas/${idArtista}/metodos-cobro/${idMetodoCobro}`,
      datos
    );
  }
}

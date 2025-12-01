import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../enviroments/enviroment';

/**
 * DTO que representa la configuración pública de la aplicación
 */
export interface ConfigPublicaDTO {
  /** Google OAuth Client ID */
  googleClientId: string;

  /** Nombre de la aplicación */
  appName: string;
}

/**
 * Servicio para obtener y cachear la configuración pública desde el backend.
 *
 * Incluye valores como:
 * - Google OAuth Client ID
 * - Nombre de la aplicación
 * - Otros valores de configuración públicos
 */
@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  /** Cliente HTTP de Angular */
  private http = inject(HttpClient);

  /** URL base de la API de configuración */
  private apiUrl = `${environment.apis.usuarios}/config`;

  /** Cache en memoria de la configuración pública */
  private config = signal<ConfigPublicaDTO | null>(null);

  /**
   * Obtiene la configuración pública desde el backend.
   * Cachea el resultado en memoria.
   *
   * @returns Observable que emite la configuración pública
   */
  obtenerConfigPublica(): Observable<ConfigPublicaDTO> {
    return this.http.get<ConfigPublicaDTO>(`${this.apiUrl}/public`).pipe(
      tap(config => {
        this.config.set(config);
        console.log('✅ Configuración pública cargada:', config);
      })
    );
  }

  /**
   * Obtiene el Google Client ID desde la configuración cacheada en memoria.
   *
   * @returns Google Client ID o null si no está cargado
   */
  getGoogleClientId(): string | null {
    return this.config()?.googleClientId || null;
  }

  /**
   * Obtiene el nombre de la aplicación desde la configuración cacheada.
   *
   * @returns Nombre de la aplicación o null si no está cargado
   */
  getAppName(): string | null {
    return this.config()?.appName || null;
  }

  /**
   * Verifica si la configuración pública ya ha sido cargada y cacheada.
   *
   * @returns true si la configuración está cargada, false en caso contrario
   */
  isConfigLoaded(): boolean {
    return this.config() !== null;
  }
}

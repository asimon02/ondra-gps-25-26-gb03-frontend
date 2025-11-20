import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../enviroments/enviroment';

/**
 * DTO con configuración pública de la aplicación
 */
export interface ConfigPublicaDTO {
  googleClientId: string;
  appName: string;
}

/**
 * Servicio para obtener configuración pública desde el backend.
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
  private http = inject(HttpClient);
  private apiUrl = `${environment.apis.usuarios}/config`;

  // Cache de configuración en memoria
  private config = signal<ConfigPublicaDTO | null>(null);

  /**
   * Obtiene la configuración pública desde el backend.
   * Cachea el resultado en memoria.
   *
   * @returns Observable con la configuración pública
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
   * Obtiene el Google Client ID cacheado en memoria.
   *
   * @returns Google Client ID o null si no está cargado
   */
  getGoogleClientId(): string | null {
    return this.config()?.googleClientId || null;
  }

  /**
   * Obtiene el nombre de la aplicación cacheado.
   *
   * @returns Nombre de la aplicación o null
   */
  getAppName(): string | null {
    return this.config()?.appName || null;
  }

  /**
   * Verifica si la configuración ya está cargada.
   *
   * @returns true si está cargada, false en caso contrario
   */
  isConfigLoaded(): boolean {
    return this.config() !== null;
  }
}

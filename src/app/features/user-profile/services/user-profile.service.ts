// src/app/features/user-profile/services/user-profile.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserProfile } from '../models/user-profile.model';
import { environment } from '../../../../enviroments/enviroment';

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
  private apiUrlUsuarios = `${environment.apis.usuarios}/usuarios`;
  private apiUrlArtistas = `${environment.apis.usuarios}/artistas`;
  private apiUrlConvertirse = `${environment.apis.usuarios}/convertirse-artista`; // 👈 Nueva URL
  private imagenesUrl = `${environment.apis.usuarios}/imagenes`;

  constructor(private http: HttpClient) {}

  obtenerPerfil(idUsuario: number): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrlUsuarios}/${idUsuario}`);
  }

  // ✅ Editar campos de USUARIO (nombre, apellidos, foto)
  editarPerfilUsuario(idUsuario: number, datos: EditUserProfile): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.apiUrlUsuarios}/${idUsuario}`, datos);
  }

  // ✅ Editar campos de ARTISTA (nombre artístico, biografía, foto artística)
  editarPerfilArtista(idArtista: number, datos: EditArtistaProfile): Observable<any> {
    return this.http.put<any>(`${this.apiUrlArtistas}/${idArtista}`, datos);
  }

  cambiarPassword(idUsuario: number, datos: ChangePasswordRequest): Observable<string> {
    return this.http.put(`${this.apiUrlUsuarios}/${idUsuario}/cambiar-password`, datos, {
      responseType: 'text'
    });
  }

  subirImagenPerfil(file: File): Observable<{ url: string; mensaje: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string; mensaje: string }>(
      `${this.imagenesUrl}/usuario`,
      formData
    );
  }

  subirImagenPerfilArtista(file: File): Observable<{ url: string; mensaje: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string; mensaje: string }>(
      `${this.imagenesUrl}/artista`,
      formData
    );
  }

  /**
   * 🔥 CORREGIDO: Convertir usuario en artista enviando MultipartFile
   * Ahora envía FormData con archivo + datos JSON
   */
  convertirseEnArtista(file: File, datos: {
    nombreArtistico: string;
    biografiaArtistico: string;
  }): Observable<any> {
    const formData = new FormData();

    // Agregar la foto como archivo
    formData.append('foto', file);

    // Agregar los datos como JSON
    formData.append('datos', new Blob([JSON.stringify(datos)], { type: 'application/json' }));

    return this.http.post<any>(this.apiUrlConvertirse, formData); // 👈 URL correcta
  }

  /**
   * Eliminar imagen de Cloudinary
   */
  eliminarImagen(url: string): Observable<any> {
    return this.http.delete<any>(`${this.imagenesUrl}/eliminar`, {
      params: { url }
    });
  }

  // ✅ Renunciar al perfil de artista (volver a ser usuario normal)
  dejarDeSerArtista(idArtista: number): Observable<SuccessfulResponseDTO> {
    return this.http.post<SuccessfulResponseDTO>(
      `${this.apiUrlArtistas}/${idArtista}/renunciar`,
      {}
    );
  }

  // ✅ Eliminar cuenta completamente (marca como inactivo)
  eliminarCuenta(idArtista: number): Observable<SuccessfulResponseDTO> {
    return this.http.delete<SuccessfulResponseDTO>(
      `${this.apiUrlArtistas}/${idArtista}`
    );
  }
}

// ✅ Interfaces
export interface EditUserProfile {
  nombreUsuario?: string;
  apellidosUsuario?: string;
  fotoPerfil?: string;
}

export interface EditArtistaProfile {
  nombreArtistico?: string;
  biografiaArtistico?: string;
  fotoPerfilArtistico?: string;
}

export interface ChangePasswordRequest {
  passwordActual: string;
  nuevaPassword: string;
}

export interface SuccessfulResponseDTO {
  successful: string;
  message: string;
  statusCode: number;
  timestamp: string;
}

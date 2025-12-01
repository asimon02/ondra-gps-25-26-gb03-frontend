import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserProfile } from '../models/user-profile.model';
import { environment } from '../../../../enviroments/enviroment';

/**
 * Servicio para gestionar perfiles de usuario y artista.
 * Proporciona operaciones CRUD sobre perfiles, gestión de imágenes,
 * cambio de contraseña y transiciones entre tipos de usuario.
 */
@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
  private apiUrlUsuarios = `${environment.apis.usuarios}/usuarios`;
  private apiUrlArtistas = `${environment.apis.usuarios}/artistas`;
  private apiUrlConvertirse = `${environment.apis.usuarios}/convertirse-artista`;
  private imagenesUrl = `${environment.apis.usuarios}/imagenes`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene el perfil completo de un usuario
   * @param idUsuario ID del usuario
   * @returns Observable con el perfil del usuario
   */
  obtenerPerfil(idUsuario: number): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrlUsuarios}/${idUsuario}`);
  }

  /**
   * Actualiza la información personal del usuario (nombre, apellidos, foto)
   * @param idUsuario ID del usuario
   * @param datos Datos del perfil de usuario a actualizar
   * @returns Observable con el perfil actualizado
   */
  editarPerfilUsuario(idUsuario: number, datos: EditUserProfile): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.apiUrlUsuarios}/${idUsuario}`, datos);
  }

  /**
   * Actualiza la información del perfil de artista (nombre artístico, biografía, foto artística)
   * @param idArtista ID del artista
   * @param datos Datos del perfil artístico a actualizar
   * @returns Observable con la respuesta de la actualización
   */
  editarPerfilArtista(idArtista: number, datos: EditArtistaProfile): Observable<any> {
    return this.http.put<any>(`${this.apiUrlArtistas}/${idArtista}`, datos);
  }

  /**
   * Cambia la contraseña del usuario
   * @param idUsuario ID del usuario
   * @param datos Contraseña actual y nueva contraseña
   * @returns Observable con mensaje de confirmación
   */
  cambiarPassword(idUsuario: number, datos: ChangePasswordRequest): Observable<string> {
    return this.http.put(`${this.apiUrlUsuarios}/${idUsuario}/cambiar-password`, datos, {
      responseType: 'text'
    });
  }

  /**
   * Sube una imagen de perfil de usuario a Cloudinary
   * @param file Archivo de imagen a subir
   * @returns Observable con la URL de la imagen subida
   */
  subirImagenPerfil(file: File): Observable<{ url: string; mensaje: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string; mensaje: string }>(
      `${this.imagenesUrl}/usuario`,
      formData
    );
  }

  /**
   * Sube una imagen de perfil artístico a Cloudinary
   * @param file Archivo de imagen a subir
   * @returns Observable con la URL de la imagen subida
   */
  subirImagenPerfilArtista(file: File): Observable<{ url: string; mensaje: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string; mensaje: string }>(
      `${this.imagenesUrl}/artista`,
      formData
    );
  }

  /**
   * Convierte un usuario normal en artista
   * Envía la foto de perfil artístico y los datos del artista como FormData
   * @param file Foto de perfil artístico
   * @param datos Información del artista (nombre artístico y biografía)
   * @returns Observable con la respuesta de la conversión
   */
  convertirseEnArtista(file: File, datos: {
    nombreArtistico: string;
    biografiaArtistico: string;
  }): Observable<any> {
    const formData = new FormData();

    formData.append('foto', file);
    formData.append('datos', new Blob([JSON.stringify(datos)], { type: 'application/json' }));

    return this.http.post<any>(this.apiUrlConvertirse, formData);
  }

  /**
   * Elimina una imagen de Cloudinary
   * @param url URL de la imagen a eliminar
   * @returns Observable con la respuesta de la eliminación
   */
  eliminarImagen(url: string): Observable<any> {
    return this.http.delete<any>(`${this.imagenesUrl}/eliminar`, {
      params: { url }
    });
  }

  /**
   * Permite que un artista renuncie a su perfil artístico y vuelva a ser usuario normal
   * @param idArtista ID del artista
   * @returns Observable con mensaje de confirmación
   */
  dejarDeSerArtista(idArtista: number): Observable<SuccessfulResponseDTO> {
    return this.http.post<SuccessfulResponseDTO>(
      `${this.apiUrlArtistas}/${idArtista}/renunciar`,
      {}
    );
  }

  /**
   * Elimina la cuenta de un artista (marca como inactivo)
   * @param idArtista ID del artista
   * @returns Observable con mensaje de confirmación
   */
  eliminarCuenta(idArtista: number): Observable<SuccessfulResponseDTO> {
    return this.http.delete<SuccessfulResponseDTO>(
      `${this.apiUrlArtistas}/${idArtista}`
    );
  }
}

/**
 * DTO para editar información personal del usuario
 * Todos los campos son opcionales para permitir actualizaciones parciales
 */
export interface EditUserProfile {
  /** Nombre del usuario */
  nombreUsuario?: string;

  /** Apellidos del usuario */
  apellidosUsuario?: string;

  /** URL de la foto de perfil */
  fotoPerfil?: string;
}

/**
 * DTO para editar información del perfil de artista
 * Todos los campos son opcionales para permitir actualizaciones parciales
 */
export interface EditArtistaProfile {
  /** Nombre artístico */
  nombreArtistico?: string;

  /** Biografía del artista */
  biografiaArtistico?: string;

  /** URL de la foto de perfil artístico */
  fotoPerfilArtistico?: string;
}

/**
 * DTO para solicitud de cambio de contraseña
 */
export interface ChangePasswordRequest {
  /** Contraseña actual del usuario */
  passwordActual: string;

  /** Nueva contraseña a establecer */
  nuevaPassword: string;
}

/**
 * Respuesta estándar de operaciones exitosas del backend
 */
export interface SuccessfulResponseDTO {
  /** Indicador de éxito */
  successful: string;

  /** Mensaje descriptivo de la operación */
  message: string;

  /** Código de estado HTTP */
  statusCode: number;

  /** Timestamp de la respuesta */
  timestamp: string;
}

// src/app/features/shared/services/file-upload.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../enviroments/enviroment';
import {
  AudioResponseDTO,
  PortadaResponseDTO,
  SuccessfulResponseDTO
} from '../models/multimedia.model';

/**
 * Servicio para gestión de archivos multimedia con Cloudinary
 * Alineado con MultimediaController del backend
 */
@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apis.contenidos}/multimedia`;

  // ========== ENDPOINTS DE AUDIO ==========

  /**
   * POST /api/multimedia/cancion/audio
   * Sube un archivo de audio para una canción
   *
   * Formatos permitidos: MP3, WAV, FLAC, M4A, OGG
   * Tamaño máximo: 50MB
   *
   * @param file Archivo de audio
   * @returns AudioResponseDTO con URL, duración y formato
   */
  subirAudioCancion(file: File): Observable<AudioResponseDTO> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<AudioResponseDTO>(
      `${this.apiUrl}/cancion/audio`,
      formData
    );
  }

  // ========== ENDPOINTS DE PORTADAS ==========

  /**
   * POST /api/multimedia/cancion/portada
   * Sube una imagen de portada para una canción
   *
   * Formatos permitidos: JPG, PNG, WEBP
   * Tamaño máximo: 5MB
   * Transformación: 1000x1000px
   *
   * @param file Archivo de imagen
   * @returns PortadaResponseDTO con URL de la imagen
   */
  subirPortadaCancion(file: File): Observable<PortadaResponseDTO> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<PortadaResponseDTO>(
      `${this.apiUrl}/cancion/portada`,
      formData
    );
  }

  /**
   * POST /api/multimedia/album/portada
   * Sube una imagen de portada para un álbum
   *
   * Formatos permitidos: JPG, PNG, WEBP
   * Tamaño máximo: 5MB
   * Transformación: 1000x1000px
   *
   * @param file Archivo de imagen
   * @returns PortadaResponseDTO con URL de la imagen
   */
  subirPortadaAlbum(file: File): Observable<PortadaResponseDTO> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<PortadaResponseDTO>(
      `${this.apiUrl}/album/portada`,
      formData
    );
  }

  // ========== ENDPOINTS DE ELIMINACIÓN ==========

  /**
   * DELETE /api/multimedia?url={fileUrl}
   * Elimina un archivo multimedia de Cloudinary
   *
   * @param fileUrl URL completa del archivo a eliminar
   * @returns SuccessfulResponseDTO con resultado de la operación
   */
  eliminarArchivo(fileUrl: string): Observable<SuccessfulResponseDTO> {
    return this.http.delete<SuccessfulResponseDTO>(
      `${this.apiUrl}?url=${encodeURIComponent(fileUrl)}`
    );
  }

  // ========== MÉTODOS DE UTILIDAD ==========

  /**
   * Valida que un archivo sea una imagen válida
   */
  validarImagen(file: File): { valido: boolean; error?: string } {
    const formatosPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const tamanoMaximo = 5 * 1024 * 1024; // 5MB

    if (!formatosPermitidos.includes(file.type)) {
      return {
        valido: false,
        error: 'Formato no permitido. Use JPG, PNG o WEBP'
      };
    }

    if (file.size > tamanoMaximo) {
      return {
        valido: false,
        error: 'La imagen no puede superar los 5MB'
      };
    }

    return { valido: true };
  }

  /**
   * Valida que un archivo sea un audio válido
   */
  validarAudio(file: File): { valido: boolean; error?: string } {
    const formatosPermitidos = [
      'audio/mpeg',      // MP3
      'audio/wav',       // WAV
      'audio/flac',      // FLAC
      'audio/mp4',       // M4A
      'audio/ogg'        // OGG
    ];
    const tamanoMaximo = 50 * 1024 * 1024; // 50MB

    if (!formatosPermitidos.includes(file.type)) {
      return {
        valido: false,
        error: 'Formato no permitido. Use MP3, WAV, FLAC, M4A u OGG'
      };
    }

    if (file.size > tamanoMaximo) {
      return {
        valido: false,
        error: 'El audio no puede superar los 50MB'
      };
    }

    return { valido: true };
  }
}

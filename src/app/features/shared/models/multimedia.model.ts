// src/app/features/shared/models/multimedia.model.ts

/**
 * Respuesta al subir un archivo de audio
 * Basado en AudioResponseDTO del backend
 */
export interface AudioResponseDTO {
  url: string;           // URL de Cloudinary del audio
  duracion: number;      // Duración en segundos
  formato: string;       // Formato del audio (mp3, wav, etc.)
  mensaje: string;       // Mensaje de confirmación
}

/**
 * Respuesta al subir una imagen de portada
 * Basado en PortadaResponseDTO del backend
 */
export interface PortadaResponseDTO {
  url: string;           // URL de Cloudinary de la imagen
  mensaje: string;       // Mensaje de confirmación
  dimensiones: string;   // Dimensiones de la imagen (ej: "1000x1000")
}

/**
 * Respuesta de eliminación exitosa
 * Basado en SuccessfulResponseDTO del backend
 */
export interface SuccessfulResponseDTO {
  successful: string;    // Mensaje de éxito
  message: string;       // Mensaje descriptivo
  statusCode: number;    // Código HTTP
  timestamp: string;     // Fecha y hora de la operación
}

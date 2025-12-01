/**
 * Respuesta al subir un archivo de audio
 * Basado en AudioResponseDTO del backend
 */
export interface AudioResponseDTO {
  /** URL pública del audio en Cloudinary */
  url: string;

  /** Duración del audio en segundos */
  duracion: number;

  /** Formato del audio (mp3, wav, etc.) */
  formato: string;

  /** Mensaje de confirmación o estado */
  mensaje: string;
}

/**
 * Respuesta al subir una imagen de portada
 * Basado en PortadaResponseDTO del backend
 */
export interface PortadaResponseDTO {
  /** URL pública de la portada en Cloudinary */
  url: string;

  /** Mensaje de confirmación o estado */
  mensaje: string;

  /** Dimensiones de la imagen, ejemplo: "1000x1000" */
  dimensiones: string;
}

/**
 * Respuesta de eliminación exitosa
 * Basado en SuccessfulResponseDTO del backend
 */
export interface SuccessfulResponseDTO {
  /** Mensaje de éxito corto */
  successful: string;

  /** Mensaje descriptivo detallado */
  message: string;

  /** Código HTTP de la operación */
  statusCode: number;

  /** Fecha y hora de la operación en formato ISO */
  timestamp: string;
}

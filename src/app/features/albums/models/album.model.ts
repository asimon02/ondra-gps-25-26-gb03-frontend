/**
 * DTO de álbum con información resumida.
 * Usado en listados y vistas de catálogo.
 */
export interface AlbumDTO {
  /** ID único del álbum */
  idAlbum: number;
  /** Título del álbum */
  tituloAlbum: string;
  /** ID del artista propietario */
  idArtista: number;
  /** Género musical del álbum */
  genero: string;
  /** Precio del álbum completo */
  precioAlbum: number;
  /** URL de la imagen de portada */
  urlPortada: string;
  /** Número total de canciones en el álbum */
  totalCanciones: number;
  /** Duración total del álbum en segundos */
  duracionTotalSegundos: number;
  /** Total de reproducciones de todas las canciones del álbum */
  totalPlayCount: number;
  /** Valoración promedio del álbum (null si no tiene valoraciones) */
  valoracionMedia: number | null;
  /** Total de comentarios en el álbum */
  totalComentarios: number;
  /** Fecha de publicación del álbum (ISO 8601) */
  fechaPublicacion: string;
  /** Descripción o información adicional del álbum */
  descripcion: string;
}

/**
 * DTO de álbum con información completa incluyendo tracklist.
 * Usado en vistas de detalle de álbum.
 */
export interface AlbumDetalleDTO {
  /** ID único del álbum */
  idAlbum: number;
  /** Título del álbum */
  tituloAlbum: string;
  /** ID del artista propietario */
  idArtista: number;
  /** Género musical del álbum */
  genero: string;
  /** Precio del álbum completo */
  precioAlbum: number;
  /** URL de la imagen de portada */
  urlPortada: string;
  /** Número total de canciones en el álbum */
  totalCanciones: number;
  /** Duración total del álbum en segundos */
  duracionTotalSegundos: number;
  /** Total de reproducciones de todas las canciones del álbum */
  totalPlayCount: number;
  /** Valoración promedio del álbum (null si no tiene valoraciones) */
  valoracionMedia: number | null;
  /** Total de comentarios en el álbum */
  totalComentarios: number;
  /** Fecha de publicación del álbum (ISO 8601) */
  fechaPublicacion: string;
  /** Descripción o información adicional del álbum */
  descripcion: string;
  /** Lista completa de canciones del álbum ordenadas por número de pista */
  trackList: CancionAlbumDTO[];
}

/**
 * DTO de canción dentro de un álbum.
 * Incluye información específica del contexto del álbum como número de pista.
 */
export interface CancionAlbumDTO {
  /** ID único de la canción */
  idCancion: number;
  /** Título de la canción */
  tituloCancion: string;
  /** Duración de la canción en segundos */
  duracionSegundos: number;
  /** Número de pista dentro del álbum */
  trackNumber: number;
  /** URL de la portada de la canción */
  urlPortada: string;
  /** URL del archivo de audio */
  urlAudio: string;
  /** Precio individual de la canción */
  precioCancion: number;
  /** Total de reproducciones de la canción */
  reproducciones: number;
}

/**
 * DTO para la creación de un nuevo álbum.
 */
export interface CrearAlbumDTO {
  /** Título del álbum */
  tituloAlbum: string;
  /** ID del género musical */
  idGenero: number;
  /** Precio del álbum */
  precioAlbum: number;
  /** URL de la imagen de portada */
  urlPortada: string;
  /** Descripción opcional del álbum */
  descripcion?: string;
}

/**
 * DTO para la edición de un álbum existente.
 * Todos los campos son opcionales para permitir actualizaciones parciales.
 */
export interface EditarAlbumDTO {
  /** Nuevo título del álbum */
  tituloAlbum?: string;
  /** Nuevo ID del género musical */
  idGenero?: number;
  /** Nuevo precio del álbum */
  precioAlbum?: number;
  /** Nueva URL de la imagen de portada */
  urlPortada?: string;
  /** Nueva descripción del álbum */
  descripcion?: string;
}

/**
 * DTO para agregar una canción existente a un álbum.
 */
export interface AgregarCancionAlbumDTO {
  /** ID de la canción a agregar */
  idCancion: number;
  /** Número de pista que ocupará en el álbum */
  numeroPista: number;
}

/**
 * DTO de respuesta paginada de álbumes.
 */
export interface AlbumesPaginadosDTO {
  /** Array de álbumes en la página actual */
  albumes: AlbumDTO[];
  /** Número de la página actual (1-indexed) */
  paginaActual: number;
  /** Total de páginas disponibles */
  totalPaginas: number;
  /** Total de elementos en el dataset completo */
  totalElementos: number;
  /** Número de elementos por página */
  elementosPorPagina: number;
}

/**
 * DTO con estadísticas de reproducción de un artista.
 */
export interface EstadisticasArtistaDTO {
  /** ID del artista */
  idArtista: number;
  /** Total de reproducciones acumuladas de todas sus canciones */
  totalReproducciones: number;
}

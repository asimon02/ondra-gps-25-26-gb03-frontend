/**
 * DTO que representa una canción básica en la plataforma
 */
export interface CancionDTO {
  /** ID único de la canción */
  idCancion: number;
  /** Título de la canción */
  tituloCancion: string;
  /** ID del artista que subió la canción */
  idArtista: number;
  /** Género musical de la canción */
  genero: string;
  /** Precio de la canción (simulado) */
  precioCancion: number;
  /** Duración de la canción en segundos */
  duracionSegundos: number;
  /** URL de la portada de la canción */
  urlPortada: string;
  /** URL del archivo de audio */
  urlAudio: string;
  /** Cantidad de reproducciones */
  reproducciones: number;
  /** Valoración media de la canción (puede ser null si no hay valoraciones) */
  valoracionMedia: number | null;
  /** Total de comentarios recibidos */
  totalComentarios: number;
  /** Fecha de publicación en formato ISO */
  fechaPublicacion: string;
  /** Descripción de la canción */
  descripcion: string;
  /** Album asociado, puede ser null si no pertenece a ningún álbum */
  album: AlbumResumenDTO | null;
}

/**
 * DTO que representa una canción con detalle extendido
 */
export interface CancionDetalleDTO {
  idCancion: number;
  tituloCancion: string;
  idArtista: number;
  genero: string;
  precioCancion: number;
  duracionSegundos: number;
  urlPortada: string;
  urlAudio: string;
  reproducciones: number;
  valoracionMedia: number | null;
  totalComentarios: number;
  fechaPublicacion: string;
  descripcion: string;
  /** Lista de álbumes a los que pertenece la canción */
  albumes: AlbumResumenConPistaDTO[];
}

/**
 * Resumen de álbum básico
 */
export interface AlbumResumenDTO {
  /** ID del álbum */
  idAlbum: number;
  /** Título del álbum */
  tituloAlbum: string;
  /** URL de la portada del álbum */
  urlPortada: string;
}

/**
 * Resumen de álbum incluyendo la posición de la canción dentro del álbum
 */
export interface AlbumResumenConPistaDTO {
  /** ID del álbum */
  idAlbum: number;
  /** Título del álbum */
  tituloAlbum: string;
  /** URL de la portada del álbum */
  urlPortada: string;
  /** Número de pista dentro del álbum */
  numeroPista: number;
}

/**
 * DTO para crear una nueva canción
 */
export interface CrearCancionDTO {
  /** Título de la canción */
  tituloCancion: string;
  /** ID del género musical */
  idGenero: number;
  /** Precio de la canción (simulado) */
  precioCancion: number;
  /** Duración de la canción en segundos */
  duracionSegundos: number;
  /** URL opcional de la portada de la canción */
  urlPortada?: string;
  /** URL del archivo de audio */
  urlAudio: string;
  /** Descripción opcional de la canción */
  descripcion?: string;
}

/**
 * DTO para editar los datos de una canción existente
 */
export interface EditarCancionDTO {
  /** Nuevo título de la canción */
  tituloCancion?: string;
  /** Nuevo ID de género */
  idGenero?: number;
  /** Nuevo precio */
  precioCancion?: number;
  /** Nueva URL de portada */
  urlPortada?: string;
  /** Nueva descripción */
  descripcion?: string;
}

/**
 * DTO que representa un listado paginado de canciones
 */
export interface CancionesPaginadasDTO {
  /** Lista de canciones de la página actual */
  canciones: CancionDTO[];
  /** Número de la página actual */
  paginaActual: number;
  /** Total de páginas disponibles */
  totalPaginas: number;
  /** Total de elementos disponibles */
  totalElementos: number;
  /** Número de elementos por página */
  elementosPorPagina: number;
}

/**
 * DTO que representa la respuesta de reproducción de una canción
 */
export interface ReproduccionResponseDTO {
  /** ID de la canción */
  id: string;
  /** Total de reproducciones acumuladas */
  totalPlays: number;
}

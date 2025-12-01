/**
 * Información básica del artista asociado a una canción.
 */
export interface SongArtist {
  /** Identificador único del artista. */
  id: string;

  /** Nombre artístico del artista. */
  artisticName: string;

  /** URL de la imagen de perfil del artista, si está disponible. */
  profileImage: string | null;

  /** Identificador del usuario propietario, si existe. */
  userId?: string | null;

  /** Identificador legible para URLs. */
  slug?: string | null;

  /** Biografía del artista, si está definida. */
  bio?: string | null;

  /** Indica si el artista está destacado o en tendencia. */
  isTrending?: boolean;

  /** Fecha de inicio de actividad o relevancia, si se proporciona. */
  startDate?: string;
}

/**
 * Información resumida del álbum donde aparece una canción.
 */
export interface SongAlbumSummary {
  /** Identificador único del álbum. */
  id: string;

  /** Título del álbum. */
  title: string;

  /** URL de la portada del álbum. */
  coverUrl: string;

  /** Número de pista dentro del álbum, si aplica. */
  trackNumber?: number;
}

/**
 * Representa la información completa de una canción dentro del sistema.
 */
export interface Song {
  /** Identificador único de la canción. */
  id: string;

  /** Título de la canción. */
  title: string;

  /** Artista principal asociado a la canción. */
  artist: SongArtist;

  /** Duración total de la canción, medida en segundos. */
  duration: number;

  /** Género musical principal de la canción. */
  genre: string;

  /** Precio de compra de la canción. */
  price: number;

  /** URL de la portada asociada a la canción. */
  coverUrl: string;

  /** URL del archivo de audio. */
  audioUrl: string;

  /** Número total de reproducciones acumuladas. */
  playCount: number;

  /** Fecha oficial de publicación de la canción. */
  releaseDate: string;

  /** Valoración media de la canción. */
  averageRating: number | null;

  /** Descripción o información adicional de la canción. */
  description?: string;

  /** Número total de comentarios asociados. */
  totalComments?: number;

  /** Indica si la canción está marcada como favorita en el frontend. */
  isFavorite: boolean;

  /** Indica si la canción fue adquirida por el usuario en el frontend. */
  isPurchased: boolean;

  /** Lista de álbumes en los que aparece la canción. */
  albums: SongAlbumSummary[];
}

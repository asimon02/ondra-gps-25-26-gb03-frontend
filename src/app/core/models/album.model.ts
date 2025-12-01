import { Song } from './song.model';

/**
 * Representa la información básica de un artista asociado a un álbum.
 */
export interface AlbumArtist {
  /** Identificador único del artista. */
  id: string;

  /** Nombre artístico del artista. */
  artisticName: string;

  /** URL de la imagen de perfil del artista, si existe. */
  profileImage: string | null;

  /** Identificador del usuario propietario, si aplica. */
  userId?: string | null;

  /** Identificador legible para URLs, si está disponible. */
  slug?: string | null;

  /** Biografía del artista, si está definida. */
  bio?: string | null;
}

/**
 * Representa una pista dentro de un álbum, extendiendo la información base de una canción.
 */
export interface AlbumTrack extends Song {
  /** Número de pista dentro del álbum. */
  trackNumber: number;

  /** Fecha en la que la pista fue agregada al álbum. */
  addedDate?: string;
}

/**
 * Representa la información completa de un álbum musical.
 */
export interface Album {
  /** Identificador único del álbum. */
  id: string;

  /** Título oficial del álbum. */
  title: string;

  /** Descripción o reseña general del álbum. */
  description?: string;

  /** URL de la imagen de portada del álbum. */
  coverUrl: string;

  /** Fecha de publicación del álbum. */
  releaseDate: string;

  /** Género musical principal del álbum. */
  genre: string;

  /** Precio del álbum. */
  price: number;

  /** Duración total del álbum en segundos. */
  totalDuration: number;

  /** Cantidad total de pistas incluidas en el álbum. */
  totalTracks: number;

  /** Número total de reproducciones acumuladas del álbum. */
  totalPlayCount: number;

  /** Valoración promedio del álbum. */
  averageRating: number | null;

  /** Cantidad total de comentarios asociados al álbum. */
  totalComments?: number;

  /** Información del artista al que pertenece el álbum. */
  artist: AlbumArtist;

  /** Identificador del artista usado para consultas y filtros. */
  artistId: string;

  /** Lista completa de pistas que componen el álbum. */
  trackList: AlbumTrack[];

  /** Indica si el usuario ha marcado el álbum como favorito. */
  isFavorite?: boolean;

  /** Indica si el usuario ha adquirido el álbum. */
  isPurchased?: boolean;
}

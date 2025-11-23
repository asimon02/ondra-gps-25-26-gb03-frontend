import { Song } from './song.model';

export interface AlbumArtist {
  id: string;
  artisticName: string;
  profileImage: string | null;
  userId?: string | null;
  slug?: string | null;
  bio?: string | null;
}

export interface AlbumTrack extends Song {
  trackNumber: number; // numeroPista del backend
  addedDate?: string; // fechaAgregado del backend (de AlbumCancion)
}

export interface Album {
  id: string; // idAlbum del backend
  title: string; // tituloAlbum del backend
  description?: string; // descripcion del backend (opcional)
  coverUrl: string; // urlPortada del backend
  releaseDate: string; // fechaPublicacion del backend
  genre: string; // genero del backend (singular, ya que es un enum)
  price: number; // precioAlbum del backend
  totalDuration: number; // duracionTotalSegundos del backend
  totalTracks: number; // totalCanciones del backend
  totalPlayCount: number; // totalPlayCount del backend
  averageRating: number | null; // valoracionMedia del backend
  totalComments?: number; // totalComentarios del backend
  artist: AlbumArtist; // idArtista en backend, expandido en frontend
  artistId: string; // idArtista del backend (para filtros)
  trackList: AlbumTrack[]; // trackList del backend
  isFavorite?: boolean; // Estado del frontend (no existe en backend)
  isPurchased?: boolean; // Estado del frontend (no existe en backend)
}

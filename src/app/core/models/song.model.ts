export interface SongArtist {
  id: string;
  artisticName: string;
  profileImage: string | null;
  userId?: string | null;
  slug?: string | null;
  bio?: string | null;
}

export interface SongAlbumSummary {
  id: string;
  title: string;
  coverUrl: string;
  trackNumber?: number;
}

export interface Song {
  id: string;
  title: string;
  artist: SongArtist;
  duration: number; // duracionSegundos del backend
  genre: string; // genero del backend (singular, ya que es un enum)
  price: number; // precioCancion del backend
  coverUrl: string; // urlPortada del backend
  audioUrl: string; // urlAudio del backend
  playCount: number; // reproducciones del backend
  releaseDate: string; // fechaPublicacion del backend
  averageRating: number | null; // valoracionMedia del backend
  description?: string; // descripcion del backend (opcional)
  totalComments?: number; // totalComentarios del backend
  isFavorite: boolean; // Estado del frontend (no existe en backend)
  isPurchased: boolean; // Estado del frontend (no existe en backend)
  albums: SongAlbumSummary[]; // Lista de albumes donde aparece la cancion
}

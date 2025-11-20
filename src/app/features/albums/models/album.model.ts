// src/app/features/albums/models/album.model.ts

export interface AlbumDTO {
  idAlbum: number;
  tituloAlbum: string;
  idArtista: number;
  genero: string;
  precioAlbum: number;
  urlPortada: string;
  totalCanciones: number;
  duracionTotalSegundos: number;
  totalPlayCount: number;
  valoracionMedia: number | null;
  totalComentarios: number;
  fechaPublicacion: string;
  descripcion: string;
}

export interface AlbumDetalleDTO {
  idAlbum: number;
  tituloAlbum: string;
  idArtista: number;
  genero: string;
  precioAlbum: number;
  urlPortada: string;
  totalCanciones: number;
  duracionTotalSegundos: number;
  totalPlayCount: number;
  valoracionMedia: number | null;
  totalComentarios: number;
  fechaPublicacion: string;
  descripcion: string;
  trackList: CancionAlbumDTO[];
}

export interface CancionAlbumDTO {
  idCancion: number;
  tituloCancion: string;
  duracionSegundos: number;
  trackNumber: number;
  urlPortada: string;
  urlAudio: string;
  precioCancion: number;
  reproducciones: number;
}

export interface CrearAlbumDTO {
  tituloAlbum: string;
  idGenero: number;
  precioAlbum: number;
  urlPortada: string;
  descripcion?: string;
}

export interface EditarAlbumDTO {
  tituloAlbum?: string;
  idGenero?: number;
  precioAlbum?: number;
  urlPortada?: string;
  descripcion?: string;
}

export interface AgregarCancionAlbumDTO {
  idCancion: number;
  numeroPista: number;
}

export interface AlbumesPaginadosDTO {
  albumes: AlbumDTO[];
  paginaActual: number;
  totalPaginas: number;
  totalElementos: number;
  elementosPorPagina: number;
}

export interface EstadisticasArtistaDTO {
  idArtista: number;
  totalReproducciones: number;
}

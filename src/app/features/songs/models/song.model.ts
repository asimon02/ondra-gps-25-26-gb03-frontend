// src/app/features/songs/models/song.model.ts

export interface CancionDTO {
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
  album: AlbumResumenDTO | null;
}

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
  albumes: AlbumResumenConPistaDTO[];
}

export interface AlbumResumenDTO {
  idAlbum: number;
  tituloAlbum: string;
  urlPortada: string;
}

export interface AlbumResumenConPistaDTO {
  idAlbum: number;
  tituloAlbum: string;
  urlPortada: string;
  numeroPista: number;
}

export interface CrearCancionDTO {
  tituloCancion: string;
  idGenero: number;
  precioCancion: number;
  duracionSegundos: number;
  urlPortada?: string;
  urlAudio: string;
  descripcion?: string;
}

export interface EditarCancionDTO {
  tituloCancion?: string;
  idGenero?: number;
  precioCancion?: number;
  urlPortada?: string;
  descripcion?: string;
}

export interface CancionesPaginadasDTO {
  canciones: CancionDTO[];
  paginaActual: number;
  totalPaginas: number;
  totalElementos: number;
  elementosPorPagina: number;
}

export interface ReproduccionResponseDTO {
  id: string;
  totalPlays: number;
}

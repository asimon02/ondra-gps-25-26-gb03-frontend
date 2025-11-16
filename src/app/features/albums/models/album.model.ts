export interface AlbumDTO {
  idAlbum: number;
  tituloAlbum: string;
  descripcionAlbum?: string;
  fechaLanzamiento: string;
  urlPortada?: string;
  precioAlbum: number;
  artista: {
    idArtista: number;
    nombreArtistico: string;
  };
  genero: {
    idGenero: number;
    nombreGenero: string;
  };
  canciones: Array<{
    idCancion: number;
    tituloCancion: string;
    duracionSegundos: number;
    numeroCancion: number;
  }>;
  totalCanciones: number;
  duracionTotalSegundos: number;
}

export interface CrearAlbumDTO {
  tituloAlbum: string;
  descripcionAlbum?: string;
  fechaLanzamiento: string; // YYYY-MM-DD
  urlPortada?: string;
  precioAlbum: number;
  idGenero: number;
}

export interface AgregarCancionAlbumDTO {
  idCancion: number;
  numeroCancion: number;
}

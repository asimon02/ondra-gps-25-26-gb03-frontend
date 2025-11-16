export interface CancionDTO {
  idCancion: number;
  tituloCancion: string;
  duracionSegundos: number;
  fechaLanzamiento: string;
  urlAudio: string;
  urlPortada?: string;
  precioCancion: number;
  reproducciones: number;
  artista: {
    idArtista: number;
    nombreArtistico: string;
  };
  genero: {
    idGenero: number;
    nombreGenero: string;
  };
  album?: {
    idAlbum: number;
    tituloAlbum: string;
  };
}

export interface CrearCancionDTO {
  tituloCancion: string;
  duracionSegundos: number;
  fechaLanzamiento: string; // YYYY-MM-DD
  urlAudio: string;
  urlPortada?: string;
  precioCancion: number;
  idGenero: number;
  idAlbum?: number;
}

export interface ArchivoAudioResponseDTO {
  url_audio: string;
  public_id: string;
  format: string;
  duracion_segundos?: number;
  tamano_bytes: number;
  fecha_subida: string;
}

export interface ArchivoImagenResponseDTO {
  url_imagen: string;
  url_thumbnail: string;
  public_id: string;
  format: string;
  ancho: number;
  alto: number;
  tamano_bytes: number;
  fecha_subida: string;
}

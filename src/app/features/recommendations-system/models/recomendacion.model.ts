export interface CancionRecomendada {
  id_cancion: number;
  titulo: string;
  id_genero: number;
  nombre_genero: string;
}

export interface AlbumRecomendado {
  id_album: number;
  titulo: string;
  id_genero: number;
  nombre_genero: string;
}

export interface RecomendacionesResponse {
  id_usuario: number;
  total_recomendaciones: number;
  canciones: CancionRecomendada[];
  albumes: AlbumRecomendado[];
}

export enum TipoRecomendacion {
  CANCION = 'cancion',
  ALBUM = 'album',
  AMBOS = 'ambos'
}
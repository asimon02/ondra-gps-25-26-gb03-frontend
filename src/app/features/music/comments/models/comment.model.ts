export type CommentContentType = 'CANCION' | 'ALBUM';

export interface CommentDTO {
  idComentario: number;
  idUsuario: number;
  tipoUsuario: 'USUARIO' | 'ARTISTA' | 'NORMAL';
  nombreUsuario: string;
  tipoContenido: CommentContentType;
  idContenido: number;
  contenido: string;
  fechaPublicacion: string;
  fechaUltimaEdicion: string | null;
  editado: boolean;
  tituloContenido?: string | null;
  urlPortada?: string | null;
}

export interface CommentsPageDTO {
  comentarios: CommentDTO[];
  paginaActual: number;
  totalPaginas: number;
  totalElementos: number;
  elementosPorPagina: number;
}

export interface CrearComentarioDTO {
  tipoContenido: CommentContentType;
  idCancion?: number;
  idAlbum?: number;
  contenido: string;
}

export interface EditarComentarioDTO {
  contenido: string;
}

export interface SuccessfulResponseDTO {
  successful: string;
  message: string;
  statusCode: number;
  timestamp: string;
}

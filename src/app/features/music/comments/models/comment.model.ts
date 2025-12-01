/**
 * Tipo de contenido asociado a un comentario.
 */
export type CommentContentType = 'CANCIÓN' | 'ÁLBUM';

/**
 * Representa un comentario en la aplicación.
 */
export interface CommentDTO {
  idComentario: number;
  idUsuario: number;
  tipoUsuario: 'USUARIO' | 'ARTISTA' | 'NORMAL';
  nombreUsuario: string;
  slug: string | null; // Slug público del usuario
  urlFotoPerfil: string | null;
  tipoContenido: CommentContentType;
  idContenido: number;
  contenido: string;
  fechaPublicacion: string;
  fechaUltimaEdicion: string | null;
  editado: boolean;
  tituloContenido?: string | null; // Opcional: título de la canción o álbum
  urlPortada?: string | null;      // Opcional: URL de la portada
}

/**
 * Paginación de comentarios.
 */
export interface CommentsPageDTO {
  comentarios: CommentDTO[];
  paginaActual: number;
  totalPaginas: number;
  totalElementos: number;
  elementosPorPagina: number;
}

/**
 * DTO para crear un nuevo comentario.
 */
export interface CrearComentarioDTO {
  tipoContenido: CommentContentType;
  idCancion?: number;
  idAlbum?: number;
  contenido: string;
}

/**
 * DTO para editar un comentario existente.
 */
export interface EditarComentarioDTO {
  contenido: string;
}

/**
 * DTO genérico para respuestas exitosas de la API.
 */
export interface SuccessfulResponseDTO {
  successful: string;
  message: string;
  statusCode: number;
  timestamp: string;
}

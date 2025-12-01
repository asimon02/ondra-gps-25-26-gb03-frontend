/**
 * Datos necesarios para crear una nueva valoración de contenido.
 */
export interface CrearValoracionDTO {
  /** Tipo de contenido que se está valorando (canción o álbum). */
  tipoContenido: 'CANCIÓN' | 'ÁLBUM';

  /** Identificador de la canción valorada, si aplica. */
  idCancion: number | null;

  /** Identificador del álbum valorado, si aplica. */
  idAlbum: number | null;

  /** Valor numérico asignado por el usuario. */
  valor: number;
}

/**
 * Datos necesarios para editar una valoración existente.
 */
export interface EditarValoracionDTO {
  /** Nuevo valor asignado a la valoración. */
  valor: number;
}

/**
 * Información completa de una valoración registrada en el sistema.
 */
export interface ValoracionDTO {
  /** Identificador único de la valoración. */
  idValoracion: number;

  /** Identificador del usuario que realizó la valoración. */
  idUsuario: number;

  /** Tipo de usuario que realizó la valoración. */
  tipoUsuario: string;

  /** Nombre del usuario que realizó la valoración. */
  nombreUsuario: string;

  /** Tipo de contenido valorado (canción o álbum). */
  tipoContenido: 'CANCIÓN' | 'ÁLBUM';

  /** Identificador del contenido valorado. */
  idContenido: number;

  /** Valor asignado por el usuario. */
  valor: number;

  /** Fecha en la que se realizó la valoración. */
  fechaValoracion: string;

  /** Fecha de la última edición de la valoración, si existe. */
  fechaUltimaEdicion: string | null;

  /** Indica si la valoración fue editada posteriormente. */
  editada: boolean;

  /** Título del contenido valorado. */
  tituloContenido: string;

  /** URL de la portada del contenido valorado. */
  urlPortada: string;
}

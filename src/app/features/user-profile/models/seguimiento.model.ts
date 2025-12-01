/**
 * Información básica de un usuario del sistema
 */
export interface UsuarioBasico {
  /** Identificador único del usuario */
  idUsuario: number;

  /** Nombre del usuario */
  nombreUsuario: string;

  /** Apellidos del usuario */
  apellidosUsuario: string;

  /** Nombre artístico (solo para artistas) */
  nombreArtistico?: string;

  /** URL de la foto de perfil del usuario */
  fotoPerfil: string | null;

  /** Tipo de cuenta del usuario */
  tipoUsuario: 'NORMAL' | 'ARTISTA';

  /** Slug único del usuario para URLs amigables */
  slug?: string;

  /** Slug único del perfil artístico para URLs amigables */
  slugArtistico?: string;
}

/**
 * Estadísticas de seguimiento de un usuario
 */
export interface EstadisticasSeguimiento {
  /** ID del usuario propietario de las estadísticas */
  idUsuario: number;

  /** Cantidad de usuarios que este usuario sigue */
  seguidos: number;

  /** Cantidad de usuarios que siguen a este usuario */
  seguidores: number;
}

/**
 * DTO para realizar una acción de seguir a otro usuario
 */
export interface SeguirUsuarioRequest {
  /** ID del usuario al que se desea seguir */
  idUsuarioASeguir: number;
}

/**
 * Tipos de modal disponibles para mostrar listas de seguimiento
 */
export type ModalType = 'seguidos' | 'seguidores' | null;

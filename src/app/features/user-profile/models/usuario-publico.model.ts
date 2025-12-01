/**
 * Información pública de un usuario
 * Versión reducida del perfil de usuario sin datos sensibles,
 * utilizada para mostrar perfiles a otros usuarios
 */
export interface UsuarioPublico {
  /** Identificador único del usuario */
  idUsuario: number;

  /** Slug único para URLs amigables */
  slug: string;

  /** Nombre del usuario */
  nombreUsuario: string;

  /** Apellidos del usuario */
  apellidosUsuario: string;

  /** URL de la foto de perfil del usuario */
  fotoPerfil: string | null;

  /** Tipo de cuenta del usuario */
  tipoUsuario: 'NORMAL' | 'ARTISTA';

  /** Fecha de registro del usuario */
  fechaRegistro: string | number[];

  /** ID del perfil de artista (solo para usuarios tipo ARTISTA) */
  idArtista?: number;

  /** Nombre artístico (solo para artistas) */
  nombreArtistico?: string;

  /** Slug único del perfil artístico */
  slugArtistico?: string;

  /** Biografía del artista */
  biografiaArtistico?: string;

  /** URL de la foto de perfil artístico */
  fotoPerfilArtistico?: string;
}

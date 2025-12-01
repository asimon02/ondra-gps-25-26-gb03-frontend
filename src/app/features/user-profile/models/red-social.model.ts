/**
 * Representa una red social asociada a un artista
 */
export interface RedSocial {
  /** Identificador único de la red social */
  idRedSocial: number;

  /** ID del artista propietario de esta red social */
  idArtista: number;

  /** Tipo de red social (INSTAGRAM, X, FACEBOOK, etc.) */
  tipoRedSocial: string;

  /** URL del perfil en la red social */
  urlRedSocial: string;
}

/**
 * DTO para crear una nueva red social
 */
export interface RedSocialCrear {
  /** Tipo de red social a crear */
  tipoRedSocial: string;

  /** URL del perfil en la red social */
  urlRedSocial: string;
}

/**
 * DTO para editar una red social existente
 * Todos los campos son opcionales para permitir actualizaciones parciales
 */
export interface RedSocialEditar {
  /** Tipo de red social (opcional) */
  tipoRedSocial?: string;

  /** URL del perfil en la red social (opcional) */
  urlRedSocial?: string;
}

/**
 * Información de configuración para un tipo de red social
 * Incluye metadata para presentación visual
 */
export interface TipoRedSocialInfo {
  /** Valor interno del tipo de red social */
  value: string;

  /** Etiqueta visible para el usuario */
  label: string;

  /** Identificador del icono asociado */
  icon: string;

  /** Color temático de la red social */
  color: string;
}

/**
 * Catálogo de tipos de redes sociales soportadas
 * Incluye configuración de presentación para cada plataforma
 */
export const TIPOS_REDES_SOCIALES: TipoRedSocialInfo[] = [
  { value: 'INSTAGRAM', label: 'Instagram', icon: 'instagram', color: 'pink' },
  { value: 'X', label: 'X (Twitter)', icon: 'x', color: 'black' },
  { value: 'FACEBOOK', label: 'Facebook', icon: 'facebook', color: 'blue' },
  { value: 'YOUTUBE', label: 'YouTube', icon: 'youtube', color: 'red' },
  { value: 'TIKTOK', label: 'TikTok', icon: 'tiktok', color: 'black' },
  { value: 'SPOTIFY', label: 'Spotify', icon: 'spotify', color: 'green' },
  { value: 'SOUNDCLOUD', label: 'SoundCloud', icon: 'soundcloud', color: 'orange' }
];

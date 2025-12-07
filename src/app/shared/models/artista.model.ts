/**
 * DTO que representa el perfil público de un artista.
 */
export interface ArtistaDTO {
  /** Identificador único del artista */
  idArtista: number;

  /** Identificador del usuario asociado al artista */
  idUsuario: number;

  /** Nombre artístico del artista */
  nombreArtistico: string;

  /** Biografía opcional del artista */
  biografiaArtistico?: string;

  /** URL de la foto de perfil artística */
  fotoPerfilArtistico?: string;

  /** Slug único para URLs amigables */
  slugArtistico?: string;

  /** Indica si el artista está marcado como tendencia */
  esTendencia: boolean;

  /** Lista de redes sociales del artista */
  redesSociales: RedSocialDTO[];
}

/**
 * DTO que representa una red social asociada a un artista.
 */
export interface RedSocialDTO {
  /** Identificador único de la red social */
  idRedSocial: number;

  /** Identificador del artista asociado */
  idArtista: number;

  /** Tipo de red social (ej. Instagram, Twitter) */
  tipoRedSocial: string;

  /** URL de la red social */
  urlRedSocial: string;
}

/**
 * DTO utilizado para editar los datos de un artista.
 */
export interface EditarArtistaDTO {
  /** Nuevo nombre artístico */
  nombreArtistico?: string;

  /** Nueva biografía */
  biografiaArtistico?: string;

  /** Nueva foto de perfil artística */
  fotoPerfilArtistico?: string;
}

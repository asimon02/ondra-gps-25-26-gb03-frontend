import { TipoUsuario } from '../../../core/models/auth.model';

/**
 * Perfil completo de un usuario del sistema
 * Incluye información personal y campos específicos para artistas
 */
export interface UserProfile {
  /** Identificador único del usuario */
  idUsuario: number;

  /** Correo electrónico del usuario */
  emailUsuario: string;

  /** Nombre del usuario */
  nombreUsuario: string;

  /** Apellidos del usuario */
  apellidosUsuario: string;

  /** Tipo de cuenta del usuario */
  tipoUsuario: TipoUsuario;

  /** URL de la foto de perfil del usuario */
  fotoPerfil: string | null;

  /** Slug único para URLs amigables */
  slug: string;

  /** Indica si la cuenta está activa */
  activo: boolean;

  /** Indica si el usuario permite autenticación con Google */
  permiteGoogle: boolean;

  /** Indica si el usuario completó el proceso de onboarding */
  onboardingCompletado: boolean;

  /** UID de Google (si aplica) */
  googleUid?: string;

  /** Indica si el email ha sido verificado */
  emailVerificado: boolean;

  /** Fecha de registro del usuario */
  fechaRegistro: string | number[];

  /** ID del perfil de artista (solo para usuarios tipo ARTISTA) */
  idArtista?: number;

  /** Nombre artístico (solo para artistas) */
  nombreArtistico?: string;

  /** Biografía del artista */
  biografiaArtistico?: string;

  /** Slug único del perfil artístico */
  slugArtistico?: string;

  /** URL de la foto de perfil artístico */
  fotoPerfilArtistico?: string;
}

/**
 * DTO para editar información personal del usuario
 * Todos los campos son opcionales para permitir actualizaciones parciales
 */
export interface EditUserProfile {
  /** Nombre del usuario */
  nombreUsuario?: string;

  /** Apellidos del usuario */
  apellidosUsuario?: string;

  /** URL de la foto de perfil */
  fotoPerfil?: string;
}

/**
 * DTO para editar información del perfil de artista
 * Todos los campos son opcionales para permitir actualizaciones parciales
 */
export interface EditArtistaProfile {
  /** Nombre artístico */
  nombreArtistico?: string;

  /** Biografía del artista */
  biografiaArtistico?: string;

  /** URL de la foto de perfil artístico */
  fotoPerfilArtistico?: string;
}

/**
 * DTO para solicitud de cambio de contraseña
 */
export interface ChangePasswordRequest {
  /** Contraseña actual del usuario */
  passwordActual: string;

  /** Nueva contraseña a establecer */
  nuevaPassword: string;
}

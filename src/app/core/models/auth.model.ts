import {ArtistaDTO} from '../../shared/models/artista.model';

/**
 * Enumeración de tipos de usuario
 */
export enum TipoUsuario {
  NORMAL = 'NORMAL',
  ARTISTA = 'ARTISTA'
}

export interface UsuarioDTO {
  idUsuario: number;
  emailUsuario: string;
  nombreUsuario: string;
  apellidosUsuario: string;
  tipoUsuario: TipoUsuario;
  fotoPerfil: string | null;
  activo: boolean;
  permiteGoogle: boolean;
  onboardingCompletado: boolean;
  emailVerificado: boolean;
  slug?: string;

  // ✅ AGREGAR estos campos de artista
  idArtista?: number;
  nombreArtistico?: string;
  biografiaArtistico?: string;
  slugArtistico?: string;
  fotoPerfilArtistico?: string;
}

/**
 * Respuesta de autenticación (login/registro exitoso)
 * Coincide exactamente con AuthResponseDTO del backend
 */
export interface AuthResponseDTO {
  token: string;          // Access token (JWT corto)
  refreshToken: string;   // Refresh token (largo plazo)
  usuario: UsuarioDTO;    // Información del usuario autenticado
  tipo: string;           // Tipo de token (normalmente "Bearer")
}

/**
 * DTO para login con email y contraseña
 */
export interface LoginUsuarioDTO {
  emailUsuario: string;
  passwordUsuario: string;
}

/**
 * DTO para registro de nuevo usuario
 */
export interface RegistroUsuarioDTO {
  emailUsuario: string;
  passwordUsuario: string;
  nombreUsuario: string;
  apellidosUsuario: string;
  tipoUsuario: TipoUsuario | string; // Permite string para compatibilidad
}

/**
 * DTO para login con Google
 */
export interface LoginGoogleDTO {
  idToken: string;
}

/**
 * DTO para solicitar renovación de token
 */
export interface RefreshTokenRequestDTO {
  refreshToken: string;
}

/**
 * Respuesta al renovar tokens
 * Coincide con RefreshTokenResponseDTO del backend
 */
export interface RefreshTokenResponseDTO {
  accessToken: string;
  refreshToken: string;
  tipo: string; // "Bearer"
}

/**
 * DTO para solicitar recuperación de contraseña
 */
export interface RecuperarPasswordDTO {
  emailUsuario: string;
}

/**
 * DTO para restablecer contraseña con token
 */
export interface RestablecerPasswordDTO {
  emailUsuario: string;
  codigoVerificacion: string;
  nuevaPassword: string;
}

/**
 * DTO para reenviar email de verificación
 */
export interface ReenviarVerificacionDTO {
  emailUsuario: string;
}

/**
 * DTO para editar perfil de usuario
 */
export interface EditarUsuarioDTO {
  nombreUsuario?: string;
  apellidosUsuario?: string;
  fotoPerfil?: string;
}

/**
 * DTO para cambiar contraseña (usuario autenticado)
 */
export interface CambiarPasswordDTO {
  passwordActual: string;
  passwordNueva: string;
}

/**
 * Estado de autenticación para el frontend
 */
export interface AuthState {
  isAuthenticated: boolean;
  user: UsuarioDTO | null;
  accessToken: string | null;
  refreshToken: string | null;
  tokenType: string;
  isLoading: boolean;
  error: string | null;
}

/**
 * Payload decodificado del JWT
 */
export interface JwtPayload {
  sub: string;        // userId
  email: string;
  tipo: TipoUsuario;
  iat: number;        // issued at (timestamp)
  exp: number;        // expiration (timestamp)
}

/**
 * Constantes de autenticación
 */
export const AUTH_CONSTANTS = {
  TOKEN_TYPE: 'Bearer',
  TOKEN_PREFIX: 'Bearer ',
  LOCAL_STORAGE_KEYS: {
    USER: 'ondra_user',
    ACCESS_TOKEN: 'ondra_access_token',
    REFRESH_TOKEN: 'ondra_refresh_token',
    TOKEN_TYPE: 'ondra_token_type'
  }
} as const;

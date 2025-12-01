/**
 * Tipos de usuario disponibles.
 */
export enum TipoUsuario {
  NORMAL = 'NORMAL',
  ARTISTA = 'ARTISTA'
}

/**
 * Datos principales de un usuario dentro del sistema.
 * Incluye información opcional relacionada con artistas cuando aplica.
 */
export interface UsuarioDTO {
  /** Identificador único del usuario. */
  idUsuario: number;

  /** Correo electrónico del usuario. */
  emailUsuario: string;

  /** Nombre del usuario. */
  nombreUsuario: string;

  /** Apellidos del usuario. */
  apellidosUsuario: string;

  /** Tipo de usuario (normal o artista). */
  tipoUsuario: TipoUsuario;

  /** URL de la foto de perfil del usuario, si existe. */
  fotoPerfil: string | null;

  /** Indica si la cuenta del usuario está activa. */
  activo: boolean;

  /** Indica si el usuario tiene permitido autenticarse mediante Google. */
  permiteGoogle: boolean;

  /** Indica si el onboarding inicial está completado. */
  onboardingCompletado: boolean;

  /** Indica si el correo electrónico fue verificado. */
  emailVerificado: boolean;

  /** Identificador legible para URLs. */
  slug?: string;

  /** Identificador del artista asociado, si el usuario es artista. */
  idArtista?: number;

  /** Nombre artístico del usuario, si aplica. */
  nombreArtistico?: string;

  /** Biografía del artista, si existe. */
  biografiaArtistico?: string;

  /** Slug del artista utilizado en URLs. */
  slugArtistico?: string;

  /** Foto de perfil del artista, si está disponible. */
  fotoPerfilArtistico?: string;
}

/**
 * Respuesta devuelta tras un proceso de autenticación exitoso.
 * Equivalente a AuthResponseDTO del backend.
 */
export interface AuthResponseDTO {
  /** Token de acceso de corta duración (JWT). */
  token: string;

  /** Token de actualización de larga duración. */
  refreshToken: string;

  /** Datos del usuario autenticado. */
  usuario: UsuarioDTO;

  /** Tipo de token utilizado, generalmente "Bearer". */
  tipo: string;
}

/**
 * Datos requeridos para iniciar sesión con usuario y contraseña.
 */
export interface LoginUsuarioDTO {
  /** Correo electrónico del usuario. */
  emailUsuario: string;

  /** Contraseña del usuario. */
  passwordUsuario: string;
}

/**
 * Datos para registrar un nuevo usuario.
 */
export interface RegistroUsuarioDTO {
  /** Correo electrónico del nuevo usuario. */
  emailUsuario: string;

  /** Contraseña de acceso del usuario. */
  passwordUsuario: string;

  /** Nombre del usuario. */
  nombreUsuario: string;

  /** Apellidos del usuario. */
  apellidosUsuario: string;

  /** Tipo de usuario (normal o artista). */
  tipoUsuario: TipoUsuario | string;
}

/**
 * Datos de autenticación mediante Google.
 */
export interface LoginGoogleDTO {
  /** ID Token generado por Google para el usuario. */
  idToken: string;
}

/**
 * Solicitud para renovar un token de acceso.
 */
export interface RefreshTokenRequestDTO {
  /** Token de actualización previamente entregado. */
  refreshToken: string;
}

/**
 * Respuesta devuelta tras renovar los tokens.
 * Equivalente a RefreshTokenResponseDTO del backend.
 */
export interface RefreshTokenResponseDTO {
  /** Nuevo token de acceso. */
  accessToken: string;

  /** Nuevo token de actualización. */
  refreshToken: string;

  /** Tipo de token devuelto, normalmente "Bearer". */
  tipo: string;
}

/**
 * Datos necesarios para solicitar la recuperación de contraseña.
 */
export interface RecuperarPasswordDTO {
  /** Correo electrónico vinculado a la cuenta. */
  emailUsuario: string;
}

/**
 * Datos para restablecer la contraseña mediante código de verificación.
 */
export interface RestablecerPasswordDTO {
  /** Correo electrónico del usuario. */
  emailUsuario: string;

  /** Código de verificación recibido. */
  codigoVerificacion: string;

  /** Nueva contraseña elegida por el usuario. */
  nuevaPassword: string;
}

/**
 * Datos para solicitar un reenvío del correo de verificación.
 */
export interface ReenviarVerificacionDTO {
  /** Correo electrónico del usuario. */
  emailUsuario: string;
}

/**
 * Datos para editar la información del perfil del usuario.
 */
export interface EditarUsuarioDTO {
  /** Nuevo nombre del usuario. */
  nombreUsuario?: string;

  /** Nuevos apellidos del usuario. */
  apellidosUsuario?: string;

  /** Nueva imagen de perfil del usuario. */
  fotoPerfil?: string;
}

/**
 * Datos necesarios para cambiar la contraseña desde un usuario autenticado.
 */
export interface CambiarPasswordDTO {
  /** Contraseña actual del usuario. */
  passwordActual: string;

  /** Nueva contraseña que se desea establecer. */
  passwordNueva: string;
}

/**
 * Estado de autenticación utilizado en el frontend para gestionar acceso,
 * usuario actual, tokens y condiciones de carga o error.
 */
export interface AuthState {
  /** Indica si el usuario está autenticado. */
  isAuthenticated: boolean;

  /** Usuario autenticado o null si no hay sesión activa. */
  user: UsuarioDTO | null;

  /** Token de acceso actual. */
  accessToken: string | null;

  /** Token de actualización vigente. */
  refreshToken: string | null;

  /** Tipo de token utilizado. */
  tokenType: string;

  /** Estado de carga para operaciones de autenticación. */
  isLoading: boolean;

  /** Mensaje de error en procesos de autenticación, si existe. */
  error: string | null;
}

/**
 * Datos decodificados del JWT entregado por el backend.
 */
export interface JwtPayload {
  /** Identificador del usuario. */
  sub: string;

  /** Correo electrónico incluido en el token. */
  email: string;

  /** Tipo de usuario. */
  tipo: TipoUsuario;

  /** Momento de emisión del token (timestamp). */
  iat: number;

  /** Momento de expiración del token (timestamp). */
  exp: number;
}

/**
 * Conjunto de constantes relacionadas con autenticación y almacenamiento local.
 */
export const AUTH_CONSTANTS = {
  /** Tipo de token utilizado en el sistema. */
  TOKEN_TYPE: 'Bearer',

  /** Prefijo utilizado para encabezados Authorization. */
  TOKEN_PREFIX: 'Bearer ',

  /** Claves empleadas para almacenar datos de autenticación en localStorage. */
  LOCAL_STORAGE_KEYS: {
    USER: 'ondra_user',
    ACCESS_TOKEN: 'ondra_access_token',
    REFRESH_TOKEN: 'ondra_refresh_token',
    TOKEN_TYPE: 'ondra_token_type'
  }
} as const;

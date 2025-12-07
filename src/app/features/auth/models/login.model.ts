/**
 * Valores del formulario de inicio de sesión.
 */
export interface LoginFormValue {
  /** Correo electrónico del usuario */
  email: string;

  /** Contraseña del usuario */
  password: string;
}

/**
 * Valores del formulario de registro de usuario.
 */
export interface RegistroFormValue {
  /** Nombre del usuario */
  nombre: string;

  /** Apellidos del usuario */
  apellidos: string;

  /** Correo electrónico del usuario */
  email: string;

  /** Contraseña del usuario */
  password: string;

  /** Confirmación de la contraseña */
  confirmPassword: string;

  /** Tipo de usuario */
  tipoUsuario: 'NORMAL' | 'ARTISTA';

  /** Géneros musicales preferidos por el usuario */
  generosPreferidos: string[];
}

/**
 * Valores del formulario para solicitar recuperación de contraseña.
 */
export interface RecuperarPasswordFormValue {
  /** Correo electrónico del usuario */
  email: string;
}

/**
 * Valores del formulario para restablecer la contraseña.
 */
export interface RestablecerPasswordFormValue {
  /** Código de verificación enviado al correo del usuario */
  codigoVerificacion: string;

  /** Nueva contraseña */
  nuevaPassword: string;

  /** Confirmación de la nueva contraseña */
  confirmarPassword: string;
}

/**
 * Exportación de constantes y utilidades relacionadas con géneros musicales.
 */
export { GENEROS_MUSICALES, GENERO_ID_MAP, convertirGenerosAIds } from '../../../core/models/generos.model';

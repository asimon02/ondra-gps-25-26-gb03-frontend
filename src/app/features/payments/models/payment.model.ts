// ==================== MODELOS DE RESPUESTA ====================

/**
 * Representa un método de pago de un usuario.
 */
export interface MetodoPagoUsuarioDTO {
  /** ID único del método de pago */
  idMetodoPago: number;

  /** Tipo de método: 'tarjeta', 'paypal', 'bizum', 'transferencia' */
  tipo: string;

  /** Nombre del propietario del método */
  propietario: string;

  /** Dirección asociada al método */
  direccion: string;

  /** País */
  pais: string;

  /** Provincia */
  provincia: string;

  /** Código postal */
  codigoPostal: string;

  /** Número de tarjeta (solo si tipo = 'tarjeta') */
  numeroTarjeta?: string;

  /** Fecha de caducidad de la tarjeta (solo 'tarjeta') */
  fechaCaducidad?: string;

  /** Código CVV (solo 'tarjeta') */
  cvv?: string;

  /** Email de PayPal (solo 'paypal') */
  emailPaypal?: string;

  /** Teléfono de Bizum (solo 'bizum') */
  telefonoBizum?: string;

  /** IBAN (solo 'transferencia') */
  iban?: string;

  /** Fecha de creación del registro */
  fechaCreacion: string;

  /** Fecha de última actualización */
  fechaActualizacion: string;
}

/**
 * Representa un método de cobro de un artista.
 * No incluye campos de tarjeta.
 */
export interface MetodoCobroArtistaDTO {
  idMetodoCobro: number;
  tipo: string;
  propietario: string;
  direccion: string;
  pais: string;
  provincia: string;
  codigoPostal: string;
  emailPaypal?: string;
  telefonoBizum?: string;
  iban?: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

// ==================== DTOs DE CREACIÓN ====================

/**
 * DTO para crear un método de pago de usuario.
 */
export interface MetodoPagoUsuarioCrearDTO {
  metodoPago: string; // 'TARJETA', 'PAYPAL', 'BIZUM', 'TRANSFERENCIA'
  propietario: string;
  direccion: string;
  pais: string;
  provincia: string;
  codigoPostal: string;
  numeroTarjeta?: string;
  fechaCaducidad?: string;
  cvv?: string;
  emailPaypal?: string;
  telefonoBizum?: string;
  iban?: string;
}

/**
 * DTO para crear un método de cobro de artista.
 * No permite tarjeta.
 */
export interface MetodoCobroArtistaCrearDTO {
  metodoPago: string; // 'PAYPAL', 'BIZUM', 'TRANSFERENCIA'
  propietario: string;
  direccion: string;
  pais: string;
  provincia: string;
  codigoPostal: string;
  emailPaypal?: string;
  telefonoBizum?: string;
  iban?: string;
}

// ==================== DTOs DE EDICIÓN ====================

/**
 * DTO para actualizar un método de pago de usuario.
 */
export interface MetodoPagoUsuarioEditarDTO {
  propietario?: string;
  numeroTarjeta?: string;
  fechaCaducidad?: string;
  cvv?: string;
  emailPaypal?: string;
  telefonoBizum?: string;
  iban?: string;
}

/**
 * DTO para actualizar un método de cobro de artista.
 * No permite tarjeta.
 */
export interface MetodoCobroArtistaEditarDTO {
  propietario?: string;
  emailPaypal?: string;
  telefonoBizum?: string;
  iban?: string;
}

// ==================== TIPOS Y CONSTANTES ====================

/** Tipos de métodos de pago disponibles */
export type TipoMetodoPago = 'tarjeta' | 'paypal' | 'transferencia' | 'bizum';

/** Métodos de pago que pueden usar los usuarios */
export const METODOS_PAGO_USUARIO: TipoMetodoPago[] = [
  'tarjeta',
  'paypal',
  'transferencia',
  'bizum'
];

/** Métodos de cobro que pueden usar los artistas (sin tarjeta) */
export const METODOS_COBRO_ARTISTA: TipoMetodoPago[] = [
  'paypal',
  'transferencia',
  'bizum'
];

/** Lista de países disponibles */
export const PAISES = [
  'España',
  'Francia',
  'Alemania',
  'Italia',
  'Portugal',
  'Reino Unido',
  'Otro'
];

/** Lista de provincias de España */
export const PROVINCIAS_ESPANA = [
  'Madrid',
  'Barcelona',
  'Cáceres',
  'Badajoz',
  'Valencia',
  'Sevilla',
  'Málaga',
  'Murcia',
  'Bilbao',
  'Alicante',
  'Otra'
];

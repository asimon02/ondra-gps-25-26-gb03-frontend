// ==================== MODELOS DE RESPUESTA ====================

export interface MetodoPagoUsuarioDTO {
  idMetodoPago: number;
  tipo: string; // 'tarjeta', 'paypal', 'bizum', 'transferencia'
  propietario: string;
  direccion: string;
  pais: string;
  provincia: string;
  codigoPostal: string;
  // Campos específicos por tipo
  numeroTarjeta?: string;
  fechaCaducidad?: string;
  cvv?: string;
  emailPaypal?: string;
  telefonoBizum?: string;
  iban?: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface MetodoCobroArtistaDTO {
  idMetodoCobro: number;
  tipo: string;
  propietario: string;
  direccion: string;
  pais: string;
  provincia: string;
  codigoPostal: string;
  // Campos específicos (SIN numeroTarjeta, fechaCaducidad, cvv)
  emailPaypal?: string;
  telefonoBizum?: string;
  iban?: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

// ==================== DTOs DE CREACIÓN ====================

export interface MetodoPagoUsuarioCrearDTO {
  metodoPago: string; // 'TARJETA', 'PAYPAL', 'BIZUM', 'TRANSFERENCIA'
  propietario: string;
  direccion: string;
  pais: string;
  provincia: string;
  codigoPostal: string;
  // Campos específicos opcionales según el tipo
  numeroTarjeta?: string;
  fechaCaducidad?: string;
  cvv?: string;
  emailPaypal?: string;
  telefonoBizum?: string;
  iban?: string;
}

export interface MetodoCobroArtistaCrearDTO {
  metodoPago: string; // 'PAYPAL', 'BIZUM', 'TRANSFERENCIA' (NO 'TARJETA')
  propietario: string;
  direccion: string;
  pais: string;
  provincia: string;
  codigoPostal: string;
  // Campos específicos (SIN campos de tarjeta)
  emailPaypal?: string;
  telefonoBizum?: string;
  iban?: string;
}

// ==================== DTOs DE EDICIÓN ====================

export interface MetodoPagoUsuarioEditarDTO {
  propietario?: string;
  numeroTarjeta?: string;
  fechaCaducidad?: string;
  cvv?: string;
  emailPaypal?: string;
  telefonoBizum?: string;
  iban?: string;
}

export interface MetodoCobroArtistaEditarDTO {
  propietario?: string;
  emailPaypal?: string;
  telefonoBizum?: string;
  iban?: string;
}

// ==================== TIPOS Y CONSTANTES ====================

export type TipoMetodoPago = 'tarjeta' | 'paypal' | 'transferencia' | 'bizum';

// Usuarios pueden usar todos los métodos
export const METODOS_PAGO_USUARIO: TipoMetodoPago[] = [
  'tarjeta',
  'paypal',
  'transferencia',
  'bizum'
];

// Artistas NO pueden usar tarjeta para cobros
export const METODOS_COBRO_ARTISTA: TipoMetodoPago[] = [
  'paypal',
  'transferencia',
  'bizum'
];

export const PAISES = [
  'España',
  'Francia',
  'Alemania',
  'Italia',
  'Portugal',
  'Reino Unido',
  'Otro'
];

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

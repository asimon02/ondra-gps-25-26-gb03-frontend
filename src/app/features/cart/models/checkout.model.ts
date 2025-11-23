// src/app/features/cart/models/checkout.model.ts

export interface ShippingAddress {
  nombre: string;
  apellidos: string;
  direccion: string;
  ciudad: string;
  codigoPostal: string;
  pais: string;
  telefono: string;
}

export interface PaymentInfo {
  numeroTarjeta: string;
  nombreTitular: string;
  fechaExpiracion: string;
  cvv: string;
}

export interface CheckoutData {
  direccion: ShippingAddress;
  pago: PaymentInfo;
}
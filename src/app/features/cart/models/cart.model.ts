// src/app/features/cart/models/cart.model.ts

export type ProductType = 'album' | 'cancion';

export interface CartItem {
  id: string;
  titulo: string;
  artista: string;
  tipo: ProductType;
  precio: number;
  imagen: string;
  cantidad?: number;
  idCarritoItem?: number; // ID del item en el carrito del backend
  idOriginal?: number; // ID original de la canción o álbum
}

export interface CartSummary {
  items: CartItem[];
  total: number;
  itemCount: number;
}
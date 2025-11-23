// src/app/features/cart/services/cart.service.ts

import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../../enviroments/enviroment';
import { CartItem, CartSummary } from '../models/cart.model';

interface BackendCarritoDTO {
  idCarrito: number;
  idUsuario: number;
  items: BackendCarritoItemDTO[];
  cantidadItems: number;
  precioTotal: number;
  fechaCreacion: string;
  fechaActualizacion: string;
}

interface BackendCarritoItemDTO {
  idCarritoItem: number;
  tipoProducto: 'CANCION' | 'ALBUM';
  idCancion?: number;
  idAlbum?: number;
  precio: number;
  urlPortada: string;
  nombreArtistico: string;
  titulo: string;
  fechaAgregado: string;
}

interface AgregarAlCarritoDTO {
  tipoProducto: 'CANCION' | 'ALBUM';
  idCancion?: number;
  idAlbum?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apis.contenidos}/carrito`;

  private cartItems = signal<CartItem[]>([]);

  // Computed para obtener el resumen del carrito
  cartSummary = computed<CartSummary>(() => {
    const items = this.cartItems();
    const total = items.reduce((sum, item) => sum + item.precio, 0);
    return {
      items,
      total,
      itemCount: items.length
    };
  });

  constructor() {
    // Cargar carrito del backend al inicializar
    this.loadCartFromBackend();
  }

  /**
   * Carga el carrito desde el backend
   */
  loadCartFromBackend(): void {
    this.http.get<BackendCarritoDTO>(this.apiUrl).subscribe({
      next: (carritoDTO) => {
        const items = this.mapBackendItemsToCartItems(carritoDTO.items);
        this.cartItems.set(items);
      },
      error: (error) => {
        console.error('Error al cargar el carrito desde el backend:', error);
        // Si falla, inicializar carrito vacío
        this.cartItems.set([]);
      }
    });
  }

  /**
   * Obtener items del carrito
   */
  getCartItems(): CartItem[] {
    return this.cartItems();
  }

  /**
   * Obtener carrito desde el backend (Observable)
   */
  obtenerCarrito(): Observable<BackendCarritoDTO> {
    return this.http.get<BackendCarritoDTO>(this.apiUrl).pipe(
      tap(carritoDTO => {
        const items = this.mapBackendItemsToCartItems(carritoDTO.items);
        this.cartItems.set(items);
      })
    );
  }

  /**
   * Agregar item al carrito (conectado al backend)
   */
  addToCart(item: CartItem): Observable<BackendCarritoDTO> {
    const dto: AgregarAlCarritoDTO = {
      tipoProducto: item.tipo === 'cancion' ? 'CANCION' : 'ALBUM',
      idCancion: item.tipo === 'cancion' ? Number(item.id.split('-')[1]) : undefined,
      idAlbum: item.tipo === 'album' ? Number(item.id.split('-')[1]) : undefined
    };

    return this.http.post<BackendCarritoDTO>(`${this.apiUrl}/items`, dto).pipe(
      tap(carritoDTO => {
        const items = this.mapBackendItemsToCartItems(carritoDTO.items);
        this.cartItems.set(items);
      })
    );
  }

  /**
   * Agregar canción al carrito
   */
  addCancionToCart(idCancion: number, titulo: string, artista: string, precio: number, imagen: string): Observable<BackendCarritoDTO> {
    const dto: AgregarAlCarritoDTO = {
      tipoProducto: 'CANCION',
      idCancion: idCancion
    };

    return this.http.post<BackendCarritoDTO>(`${this.apiUrl}/items`, dto).pipe(
      tap(carritoDTO => {
        const items = this.mapBackendItemsToCartItems(carritoDTO.items);
        this.cartItems.set(items);
      })
    );
  }

  /**
   * Agregar álbum al carrito
   */
  addAlbumToCart(idAlbum: number, titulo: string, artista: string, precio: number, imagen: string): Observable<BackendCarritoDTO> {
    const dto: AgregarAlCarritoDTO = {
      tipoProducto: 'ALBUM',
      idAlbum: idAlbum
    };

    return this.http.post<BackendCarritoDTO>(`${this.apiUrl}/items`, dto).pipe(
      tap(carritoDTO => {
        const items = this.mapBackendItemsToCartItems(carritoDTO.items);
        this.cartItems.set(items);
      })
    );
  }

  /**
   * Eliminar item del carrito (conectado al backend)
   */
  removeFromCart(itemId: string): void {
    const idCarritoItem = Number(itemId.split('-')[0]);
    
    this.http.delete<BackendCarritoDTO>(`${this.apiUrl}/items/${idCarritoItem}`).subscribe({
      next: (carritoDTO) => {
        const items = this.mapBackendItemsToCartItems(carritoDTO.items);
        this.cartItems.set(items);
      },
      error: (error) => {
        console.error('Error al eliminar item del carrito:', error);
      }
    });
  }

  /**
   * Vaciar carrito (conectado al backend)
   */
  clearCart(): void {
    this.http.delete(`${this.apiUrl}`).subscribe({
      next: () => {
        this.cartItems.set([]);
      },
      error: (error) => {
        console.error('Error al vaciar el carrito:', error);
      }
    });
  }

  /**
   * Finalizar compra (conectado al backend)
   */
  finalizarCompra(idMetodoPago: number): Observable<any> {
    const params = new HttpParams().set('idMetodoPago', idMetodoPago.toString());
    
    return this.http.post(`${this.apiUrl}/checkout`, null, { params }).pipe(
      tap(() => {
        // Vaciar carrito local después de compra exitosa
        this.cartItems.set([]);
      })
    );
  }

  /**
   * Verificar si un item está en el carrito
   */
  isInCart(itemId: string): boolean {
    return this.cartItems().some(item => {
      // Comparar por el ID del backend (idCancion o idAlbum)
      const [_, id] = itemId.split('-');
      return item.id.includes(id);
    });
  }

  /**
   * Mapear items del backend a formato del frontend
   */
  private mapBackendItemsToCartItems(backendItems: BackendCarritoItemDTO[]): CartItem[] {
    return backendItems.map(item => ({
      id: `${item.idCarritoItem}-${item.tipoProducto === 'CANCION' ? item.idCancion : item.idAlbum}`,
      titulo: item.titulo,
      artista: item.nombreArtistico,
      tipo: item.tipoProducto === 'CANCION' ? 'cancion' : 'album',
      precio: item.precio,
      imagen: item.urlPortada,
      idCarritoItem: item.idCarritoItem,
      idOriginal: item.tipoProducto === 'CANCION' ? item.idCancion : item.idAlbum
    }));
  }
}
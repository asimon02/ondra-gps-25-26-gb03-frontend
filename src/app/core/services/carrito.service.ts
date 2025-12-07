import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../enviroments/enviroment';

export interface CarritoItemDTO {
  idCarritoItem: number;
  tipoProducto: 'CANCIÓN' | 'ÁLBUM';
  idCancion?: number;
  idAlbum?: number;
  precio: number;
  urlPortada: string;
  nombreArtistico: string;
  slugArtista: string;
  titulo: string;
  fechaAgregado: string;
}

export interface CarritoDTO {
  idCarrito: number;
  idUsuario: number;
  items: CarritoItemDTO[];
  cantidadItems: number;
  precioTotal: number;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface AgregarAlCarritoDTO {
  tipoProducto: 'CANCIÓN' | 'ÁLBUM';
  idCancion?: number;
  idAlbum?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CarritoService {
  private apiUrl = `${environment.apis.contenidos}/carrito`;

  private carritoSubject = new BehaviorSubject<CarritoDTO | null>(null);
  public carrito$ = this.carritoSubject.asObservable();

  private cantidadItemsSubject = new BehaviorSubject<number>(0);
  public cantidadItems$ = this.cantidadItemsSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Obtiene el carrito del usuario autenticado desde el backend
   * @returns Observable con el carrito completo
   */
  obtenerCarrito(): Observable<CarritoDTO> {
    return this.http.get<CarritoDTO>(this.apiUrl).pipe(
      tap(carrito => {
        this.carritoSubject.next(carrito);
        this.cantidadItemsSubject.next(carrito.cantidadItems);
      })
    );
  }

  /**
   * Agrega un item al carrito
   * @param dto Datos del item a agregar
   * @returns Observable con el carrito actualizado
   */
  agregarItem(dto: AgregarAlCarritoDTO): Observable<CarritoDTO> {
    return this.http.post<CarritoDTO>(`${this.apiUrl}/items`, dto).pipe(
      tap(carrito => {
        this.carritoSubject.next(carrito);
        this.cantidadItemsSubject.next(carrito.cantidadItems);
      })
    );
  }

  /**
   * Elimina un item del carrito por su ID
   * @param idCarritoItem ID del item a eliminar
   * @returns Observable con el carrito actualizado
   */
  eliminarItem(idCarritoItem: number): Observable<CarritoDTO> {
    return this.http.delete<CarritoDTO>(`${this.apiUrl}/items/${idCarritoItem}`).pipe(
      tap(carrito => {
        this.carritoSubject.next(carrito);
        this.cantidadItemsSubject.next(carrito.cantidadItems);
      })
    );
  }

  /**
   * Vacía completamente el carrito
   * @returns Observable<void>
   */
  vaciarCarrito(): Observable<any> {
    return this.http.delete(`${this.apiUrl}`).pipe(
      tap(() => {
        this.carritoSubject.next(null);
        this.cantidadItemsSubject.next(0);
      })
    );
  }

  /**
   * Finaliza la compra del carrito
   * @param idMetodoPago ID del método de pago (opcional)
   * @returns Observable<void>
   */
  finalizarCompra(idMetodoPago: number | null): Observable<any> {
    let url = `${this.apiUrl}/checkout`;
    if (idMetodoPago !== null) {
      url += `?idMetodoPago=${idMetodoPago}`;
    }
    return this.http.post(url, {}).pipe(
      tap(() => {
        this.carritoSubject.next(null);
        this.cantidadItemsSubject.next(0);
      })
    );
  }

  /**
   * Obtiene la cantidad actual de items en el carrito
   * @returns Número de items en el carrito
   */
  getCantidadItems(): number {
    return this.cantidadItemsSubject.value;
  }

  /**
   * Inicializa el carrito cargando los datos desde el backend
   */
  inicializarCarrito(): void {
    this.obtenerCarrito().subscribe({
      next: () => console.log('Carrito inicializado'),
      error: (err) => console.error('Error al inicializar carrito:', err)
    });
  }

  /**
   * Verifica si una canción está en el carrito
   * @param idCancion ID de la canción
   * @returns true si está en el carrito, false si no
   */
  isCancionEnCarrito(idCancion: number): boolean {
    const carrito = this.carritoSubject.value;
    return !!carrito?.items?.some(item => item.tipoProducto === 'CANCIÓN' && item.idCancion === idCancion);
  }

  /**
   * Verifica si un álbum está en el carrito
   * @param idAlbum ID del álbum
   * @returns true si está en el carrito, false si no
   */
  isAlbumEnCarrito(idAlbum: number): boolean {
    const carrito = this.carritoSubject.value;
    return !!carrito?.items?.some(item => item.tipoProducto === 'ÁLBUM' && item.idAlbum === idAlbum);
  }

  /**
   * Obtiene el carrito actual desde el BehaviorSubject
   * @returns Carrito actual o null si no hay
   */
  getCarritoActual(): CarritoDTO | null {
    return this.carritoSubject.value;
  }

  /**
   * Limpia el estado local del carrito (sin llamar al backend)
   * Se utiliza al cerrar sesión
   */
  limpiarEstadoLocal(): void {
    this.carritoSubject.next(null);
    this.cantidadItemsSubject.next(0);
  }
}

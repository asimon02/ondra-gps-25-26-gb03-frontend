import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { CarritoService, CarritoDTO, CarritoItemDTO } from '../../../core/services/carrito.service';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';
import { CheckoutStateService } from '../../../core/services/checkout-state.service';

/**
 * Componente que gestiona la vista del carrito de compras.
 * Permite visualizar items, eliminarlos, vaciar el carrito y proceder al pago.
 */
@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule, BackButtonComponent],
  templateUrl: './carrito.component.html',
  styleUrl: './carrito.component.scss'
})
export class CarritoComponent implements OnInit {
  /** Carrito actual del usuario */
  carrito: CarritoDTO | null = null;

  /** Indica si se está cargando información del carrito */
  isLoading = true;

  /** Mensaje de error en caso de fallo al cargar o modificar el carrito */
  error: string | null = null;

  constructor(
    private carritoService: CarritoService,
    private router: Router,
    private location: Location,
    private checkoutState: CheckoutStateService
  ) {}

  /**
   * Inicializa la carga del carrito al montar el componente.
   */
  ngOnInit(): void {
    this.cargarCarrito();
  }

  /**
   * Obtiene los datos del carrito desde el servicio y actualiza el estado local.
   */
  cargarCarrito(): void {
    this.isLoading = true;
    this.error = null;

    this.carritoService.obtenerCarrito().subscribe({
      next: (carrito) => {
        this.carrito = carrito;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar el carrito:', err);
        this.error = 'Error al cargar el carrito. Por favor, intenta de nuevo.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Elimina un item específico del carrito.
   * @param idCarritoItem ID del item a eliminar
   */
  eliminarItem(idCarritoItem: number): void {
    this.carritoService.eliminarItem(idCarritoItem).subscribe({
      next: (carrito) => {
        this.carrito = carrito;
      },
      error: (err) => {
        console.error('Error al eliminar item:', err);
        alert('Error al eliminar el item. Por favor, intenta de nuevo.');
      }
    });
  }

  /**
   * Vacía todos los items del carrito, previa confirmación.
   */
  vaciarCarrito(): void {
    if (!confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
      return;
    }

    this.carritoService.vaciarCarrito().subscribe({
      next: () => {
        this.cargarCarrito();
      },
      error: (err) => {
        console.error('Error al vaciar carrito:', err);
        alert('Error al vaciar el carrito. Por favor, intenta de nuevo.');
      }
    });
  }

  /**
   * Navega a la sección de exploración de contenidos.
   */
  continuarComprando(): void {
    this.router.navigate(['/explorar']);
  }

  /**
   * Prepara el contexto de checkout y navega a la pasarela de pago.
   */
  procederAlPago(): void {
    if (!this.carrito || this.carrito.items.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    this.checkoutState.setContext({
      origin: 'CARRITO',
      isFree: (this.carrito.precioTotal ?? 0) === 0,
      metodoPagoId: null,
      metodoGuardado: true
    });

    this.router.navigate(['/pasarela-pago']);
  }

  /**
   * Obtiene la URL de la imagen del item.
   * @param item Item del carrito
   * @returns URL de portada o imagen por defecto
   */
  getItemImage(item: CarritoItemDTO): string {
    return item.urlPortada || '/assets/images/default-cover.png';
  }

  /**
   * Obtiene el tipo legible del item.
   * @param item Item del carrito
   * @returns 'Canción' o 'Álbum' según el tipo de producto
   */
  getItemType(item: CarritoItemDTO): string {
    return item.tipoProducto === 'CANCIÓN' ? 'Canción' : 'Álbum';
  }

  /**
   * Navega a la página de detalle del item seleccionado.
   * @param item Item del carrito
   */
  navegarADetalle(item: CarritoItemDTO): void {
    if (item.tipoProducto === 'CANCIÓN' && item.idCancion) {
      this.router.navigate(['/cancion', item.idCancion]);
    } else if (item.tipoProducto === 'ÁLBUM' && item.idAlbum) {
      this.router.navigate(['/album', item.idAlbum]);
    }
  }

  /**
   * Navega al perfil del artista asociado al item.
   * Detiene la propagación del evento de click.
   * @param item Item del carrito
   * @param event Evento de click
   */
  navegarAPerfilArtista(item: CarritoItemDTO, event: Event): void {
    event.stopPropagation();
    if (item.slugArtista) {
      this.router.navigate(['/artista', item.slugArtista]);
    }
  }
}

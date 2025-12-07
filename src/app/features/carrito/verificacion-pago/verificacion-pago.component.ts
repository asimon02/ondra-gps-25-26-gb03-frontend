import { Component, OnInit, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';
import { AgregarAlCarritoDTO, CarritoDTO, CarritoService } from '../../../core/services/carrito.service';
import { CheckoutContext, CheckoutStateService } from '../../../core/services/checkout-state.service';

/**
 * Componente de verificación de pago.
 * Gestiona el proceso de checkout, incluyendo compras directas desde detalle de producto
 * y compras desde el carrito.
 */
@Component({
  selector: 'app-verificacion-pago',
  standalone: true,
  imports: [CommonModule, BackButtonComponent],
  templateUrl: './verificacion-pago.component.html',
  styleUrl: './verificacion-pago.component.scss'
})
export class VerificacionPagoComponent implements OnInit, AfterViewInit {
  private router = inject(Router);
  private carritoService = inject(CarritoService);
  private checkoutState = inject(CheckoutStateService);

  /** Indica si la verificación del pago está en curso */
  isVerifying = true;

  /** Indica si la compra se confirmó correctamente */
  isConfirmed = false;

  /** Indica si ocurrió un error en el proceso de pago */
  hasError = false;

  /** Mensaje de error en el proceso */
  errorMessage = '';

  /** Mensaje actual mostrado durante el proceso de verificación */
  processingMessage = 'Verificando compra...';

  /** Mensajes de estado que se muestran durante el proceso */
  private readonly mensajesProceso = [
    'Verificando compra...',
    'Procesando pago...',
    'Confirmando transacción...',
    'Finalizando compra...'
  ];

  /** Contexto actual de checkout */
  private context: CheckoutContext | null = null;

  /**
   * Inicializa el componente y obtiene el contexto de checkout.
   */
  ngOnInit(): void {
    this.context = this.checkoutState.getContext();
    this.iniciarProceso();
  }

  /**
   * Asegura que la vista esté en la parte superior al cargar.
   */
  ngAfterViewInit(): void {
    setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: 'smooth' }), 0);
  }

  /**
   * Inicia el proceso de verificación de compra.
   */
  private iniciarProceso(): void {
    this.isVerifying = true;
    this.hasError = false;
    this.errorMessage = '';

    this.carritoService.obtenerCarrito().subscribe({
      next: (carrito) => {
        if (this.context?.origin === 'DETALLE') {
          this.prepararCarritoDetalle(carrito);
        } else {
          if (!carrito || carrito.items.length === 0) {
            this.handleError('No hay productos en el carrito para procesar.');
            return;
          }
          this.procesarCheckout(this.resolverMetodoPago());
        }
      },
      error: () => this.handleError('No se pudo cargar el carrito. Intentalo de nuevo.')
    });
  }

  /**
   * Prepara el carrito para compras directas desde detalle de producto.
   * @param carrito Carrito actual
   */
  private prepararCarritoDetalle(carrito: CarritoDTO | null): void {
    if (!this.context?.idContenido || !this.context?.tipoContenido) {
      this.handleError('Faltan datos del producto seleccionado.');
      return;
    }

    if (!this.context.snapshot) {
      const snapshot = carrito?.items?.map(item => ({
        tipoProducto: item.tipoProducto,
        idCancion: item.idCancion,
        idAlbum: item.idAlbum
      })) || [];
      this.context = { ...this.context, snapshot };
      this.checkoutState.setContext(this.context);
    }

    const agregarItem = () => {
      const dto: AgregarAlCarritoDTO = this.context!.tipoContenido === 'CANCIÓN'
        ? { tipoProducto: 'CANCIÓN', idCancion: this.context!.idContenido }
        : { tipoProducto: 'ÁLBUM', idAlbum: this.context!.idContenido };

      this.carritoService.agregarItem(dto).subscribe({
        next: () => this.procesarCheckout(this.resolverMetodoPago()),
        error: () => this.handleError('No se pudo preparar la compra. Vuelve a intentarlo.')
      });
    };

    const limpiarYAgregar = () => {
      this.carritoService.vaciarCarrito().subscribe({
        next: agregarItem,
        error: agregarItem
      });
    };

    if (!carrito || carrito.items.length === 0) {
      agregarItem();
      return;
    }

    limpiarYAgregar();
  }

  /**
   * Determina el método de pago a utilizar.
   * @returns ID del método de pago o null si es gratuito
   */
  private resolverMetodoPago(): number | null {
    if (this.context?.isFree) {
      return null;
    }
    return this.context?.metodoPagoId ?? null;
  }

  /**
   * Procesa el checkout finalizando la compra.
   * @param idMetodoPago ID del método de pago a usar
   */
  private procesarCheckout(idMetodoPago: number | null): void {
    if (!this.context?.isFree && (idMetodoPago === null || idMetodoPago === undefined)) {
      this.handleError('Selecciona un método de pago antes de continuar.');
      return;
    }

    let indice = 0;
    const intervalo = setInterval(() => {
      indice = (indice + 1) % this.mensajesProceso.length;
      this.processingMessage = this.mensajesProceso[indice];
    }, 1200);

    setTimeout(() => {
      this.carritoService.finalizarCompra(idMetodoPago).subscribe({
        next: () => {
          clearInterval(intervalo);
          this.isVerifying = false;
          this.isConfirmed = true;
          this.handlePostCompra();
        },
        error: (error) => {
          clearInterval(intervalo);
          this.handleError(error.error?.message || 'Hubo un error al procesar tu compra.');
        }
      });
    }, 1500);
  }

  /**
   * Maneja errores en el proceso de verificación o compra.
   * @param message Mensaje de error
   */
  private handleError(message: string): void {
    this.isVerifying = false;
    this.hasError = true;
    this.errorMessage = message;

    if (this.context?.origin === 'DETALLE') {
      this.restaurarCarritoSnapshot();
    }
  }

  /**
   * Reinicia el proceso de pago desde la pasarela.
   */
  retryPayment(): void {
    this.router.navigate(['/pasarela-pago']);
  }

  /**
   * Maneja acciones posteriores a la compra según el origen.
   */
  private handlePostCompra(): void {
    if (this.context?.origin === 'DETALLE') {
      this.restaurarCarritoSnapshot(() => {
        setTimeout(() => {
          this.checkoutState.clear();
          this.router.navigate(['/home']);
        }, 5200);
      });
      return;
    }

    this.carritoService.vaciarCarrito().subscribe({
      next: () => this.finalizarRedireccionCarrito(),
      error: () => this.finalizarRedireccionCarrito()
    });
  }

  /**
   * Finaliza el proceso y redirige al home tras limpiar carrito y contexto.
   */
  private finalizarRedireccionCarrito(): void {
    this.checkoutState.clear();
    setTimeout(() => {
      this.router.navigate(['/home']);
    }, 5200);
  }

  /**
   * Restaura el snapshot del carrito original.
   * @param onComplete Callback a ejecutar al finalizar la restauración
   */
  private restaurarCarritoSnapshot(onComplete?: () => void): void {
    const snapshot = this.context?.snapshot || [];

    const finish = () => onComplete && onComplete();

    this.carritoService.vaciarCarrito().subscribe({
      next: () => this.reagregarSnapshot(snapshot, finish),
      error: () => this.reagregarSnapshot(snapshot, finish)
    });
  }

  /**
   * Reagrega los items del snapshot al carrito.
   * @param snapshot Items a restaurar
   * @param onComplete Callback a ejecutar al finalizar
   */
  private reagregarSnapshot(snapshot: AgregarAlCarritoDTO[], onComplete?: () => void): void {
    const addNext = (index: number) => {
      if (index >= snapshot.length) {
        if (onComplete) onComplete();
        return;
      }

      this.carritoService.agregarItem(snapshot[index]).subscribe({
        next: () => addNext(index + 1),
        error: () => addNext(index + 1)
      });
    };

    addNext(0);
  }
}

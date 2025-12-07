import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CarritoService, CarritoDTO, AgregarAlCarritoDTO } from '../../../core/services/carrito.service';
import { PaymentService } from '../../payments/services/payment.service';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { MetodoPagoUsuarioDTO } from '../../payments/models/payment.model';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';
import { CheckoutStateService, CheckoutContext } from '../../../core/services/checkout-state.service';
import { AddPaymentMethodModalComponent } from '../../payments/components/add-payment-method-modal/add-payment-method-modal.component';

/**
 * Componente para la pasarela de pago.
 * Permite seleccionar métodos de pago, procesar pagos y gestionar el carrito.
 */
@Component({
  selector: 'app-pasarela-pago',
  standalone: true,
  imports: [CommonModule, FormsModule, BackButtonComponent, AddPaymentMethodModalComponent],
  templateUrl: './pasarela-pago.component.html',
  styleUrl: './pasarela-pago.component.scss'
})
export class PasarelaPagoComponent implements OnInit {
  /** Carrito actual del usuario */
  carrito: CarritoDTO | null = null;

  /** Indicador de carga de datos */
  isLoading = true;

  /** Indicador de procesamiento de pago */
  isProcessing = false;

  /** Contexto de checkout */
  private checkoutContext: CheckoutContext | null = null;

  /** Controla visibilidad del modal para agregar método de pago */
  mostrarModalMetodo = false;

  /** Métodos de pago guardados del usuario */
  metodosPagoGuardados: MetodoPagoUsuarioDTO[] = [];

  /** ID del método de pago seleccionado */
  metodoSeleccionado: number | null = null;

  /** Controla visibilidad del formulario de nuevo método */
  mostrarFormularioNuevo = false;

  /** Controla si se debe guardar el método nuevo */
  guardarMetodo = false;

  /** Datos del formulario de pago */
  paymentData = {
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    email: '',
    address: '',
    city: '',
    postalCode: ''
  };

  constructor(
    private carritoService: CarritoService,
    private paymentService: PaymentService,
    private authState: AuthStateService,
    private router: Router,
    private checkoutState: CheckoutStateService
  ) {}

  /**
   * Inicializa el componente.
   * Asegura el contexto de checkout y carga carrito y métodos de pago.
   */
  ngOnInit(): void {
    this.ensureCheckoutContext();
    this.capturarSnapshotCarrito(() => {
      this.cargarCarrito();
      this.cargarMetodosPago();
    });
  }

  /**
   * Asegura que exista un contexto de checkout y redirige si la compra es gratuita.
   */
  private ensureCheckoutContext(): void {
    this.checkoutContext = this.checkoutState.getContext() ?? { origin: 'CARRITO', isFree: false, metodoPagoId: null };
    this.checkoutState.setContext(this.checkoutContext);

    if (this.checkoutContext.isFree) {
      this.router.navigate(['/verificacion-pago']);
    }
  }

  /**
   * Captura el snapshot del carrito en caso de compras desde detalle de producto.
   * @param onDone Callback a ejecutar al finalizar
   */
  private capturarSnapshotCarrito(onDone: () => void): void {
    if (this.checkoutContext?.origin !== 'DETALLE' || this.checkoutContext.snapshot) {
      onDone();
      return;
    }

    this.carritoService.obtenerCarrito().subscribe({
      next: (carrito) => {
        const snapshot = carrito?.items?.map(item => ({
          tipoProducto: item.tipoProducto,
          idCancion: item.idCancion,
          idAlbum: item.idAlbum
        })) || [];
        this.checkoutContext = { ...this.checkoutContext!, snapshot };
        this.checkoutState.setContext(this.checkoutContext);
        onDone();
      },
      error: () => onDone()
    });
  }

  /**
   * Carga el carrito de compras y prepara el carrito si se trata de un solo item.
   */
  cargarCarrito(): void {
    this.isLoading = true;

    this.carritoService.obtenerCarrito().subscribe({
      next: (carrito) => {
        if (this.checkoutContext?.origin === 'DETALLE') {
          this.prepareSingleItemCarrito(carrito);
        } else {
          this.handleCarritoLoaded(carrito);
        }
      },
      error: () => {
        alert('Error al cargar el carrito');
        this.router.navigate(['/carrito']);
      }
    });
  }

  /**
   * Maneja el carrito cargado normalmente.
   * @param carrito Carrito cargado
   */
  private handleCarritoLoaded(carrito: CarritoDTO | null): void {
    this.carrito = carrito;

    if (!carrito || carrito.items.length === 0) {
      alert('El carrito esta vacio');
      this.router.navigate(['/carrito']);
      return;
    }

    this.isLoading = false;
  }

  /**
   * Prepara el carrito para compras directas de un solo item.
   * @param carrito Carrito actual
   */
  private prepareSingleItemCarrito(carrito: CarritoDTO | null): void {
    if (carrito && carrito.items.length > 0) {
      this.carritoService.vaciarCarrito().subscribe({
        next: () => this.addContextItemToCarrito(),
        error: () => this.addContextItemToCarrito()
      });
      return;
    }
    this.addContextItemToCarrito();
  }

  /**
   * Agrega el item del contexto al carrito.
   */
  private addContextItemToCarrito(): void {
    const ctx = this.checkoutContext;

    if (!ctx?.tipoContenido || !ctx.idContenido) {
      alert('No se pudo preparar la compra. Intenta de nuevo.');
      this.router.navigate(['/explorar']);
      return;
    }

    const dto: AgregarAlCarritoDTO = ctx.tipoContenido === 'CANCIÓN'
      ? { tipoProducto: 'CANCIÓN', idCancion: ctx.idContenido }
      : { tipoProducto: 'ÁLBUM', idAlbum: ctx.idContenido };

    this.carritoService.agregarItem(dto).subscribe({
      next: (carritoPreparado) => this.handleCarritoLoaded(carritoPreparado),
      error: () => {
        alert('No se pudo preparar la compra. Intenta de nuevo.');
        this.router.navigate(['/explorar']);
      }
    });
  }

  /**
   * Carga los métodos de pago del usuario.
   * @param seleccionarUltimo Indica si se debe seleccionar automáticamente el último método
   */
  cargarMetodosPago(seleccionarUltimo = false): void {
    const usuario = this.authState.currentUser();
    if (!usuario) return;

    this.paymentService.listarMetodosPago(usuario.idUsuario).subscribe({
      next: (metodos) => {
        this.metodosPagoGuardados = metodos;

        if (metodos.length > 0) {
          this.mostrarFormularioNuevo = false;
          if (seleccionarUltimo) {
            const ultimo = metodos[metodos.length - 1];
            this.metodoSeleccionado = ultimo?.idMetodoPago ?? null;
          }
        } else {
          this.mostrarFormularioNuevo = false;
          this.metodoSeleccionado = null;
          this.mostrarModalMetodo = true;
        }
      },
      error: () => {
        this.mostrarFormularioNuevo = false;
      }
    });
  }

  /**
   * Selecciona un método de pago existente.
   * @param idMetodo ID del método de pago
   */
  seleccionarMetodo(idMetodo: number): void {
    this.metodoSeleccionado = idMetodo;
    this.mostrarFormularioNuevo = false;
  }

  /**
   * Muestra el modal para agregar un nuevo método de pago.
   */
  mostrarNuevoMetodo(): void {
    this.mostrarModalMetodo = true;
    this.metodoSeleccionado = null;
  }

  /**
   * Procesa el pago usando el método seleccionado.
   */
  procesarPago(): void {
    if (!this.metodoSeleccionado) {
      alert('Por favor, selecciona un metodo de pago o anade uno nuevo');
      return;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.isProcessing = true;
    this.irAVerificacion(this.metodoSeleccionado, true);
    this.isProcessing = false;
  }

  /**
   * Navega a la verificación de pago y actualiza el contexto.
   * @param idMetodoPago ID del método de pago
   * @param metodoGuardado Indica si el método está guardado
   */
  private irAVerificacion(idMetodoPago: number | null, metodoGuardado: boolean): void {
    this.checkoutState.updateContext({
      metodoPagoId: idMetodoPago,
      metodoGuardado
    });
    this.router.navigate(['/verificacion-pago']);
  }

  /**
   * Cierra el modal de agregar método de pago.
   */
  onCloseModalMetodo(): void {
    this.mostrarModalMetodo = false;
  }

  /**
   * Callback cuando un nuevo método de pago ha sido creado.
   * Actualiza la lista de métodos y selecciona el último.
   */
  onMetodoCreado(): void {
    this.mostrarModalMetodo = false;
    this.cargarMetodosPago(true);
  }

  /**
   * Valida los datos del formulario de pago.
   * @returns True si el formulario es válido
   */
  validarFormulario(): boolean {
    if (!this.paymentData.cardNumber || this.paymentData.cardNumber.length < 16) {
      alert('Por favor, ingresa un numero de tarjeta valido');
      return false;
    }
    if (!this.paymentData.cardName || this.paymentData.cardName.trim().length < 3) {
      alert('Por favor, ingresa el nombre del titular de la tarjeta');
      return false;
    }
    if (!this.paymentData.expiryDate || !this.validarFechaExpiracion(this.paymentData.expiryDate)) {
      alert('Por favor, ingresa una fecha de expiracion valida (MM/AA)');
      return false;
    }
    if (!this.paymentData.cvv || this.paymentData.cvv.length < 3) {
      alert('Por favor, ingresa un CVV valido');
      return false;
    }
    if (!this.paymentData.email || !this.validarEmail(this.paymentData.email)) {
      alert('Por favor, ingresa un email valido');
      return false;
    }
    return true;
  }

  /**
   * Valida el formato de un email.
   * @param email Email a validar
   * @returns True si el email es válido
   */
  validarEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /**
   * Valida el formato de fecha de expiración (MM/AA).
   * @param fecha Fecha a validar
   * @returns True si la fecha es válida
   */
  validarFechaExpiracion(fecha: string): boolean {
    const regex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
    return regex.test(fecha);
  }

  /**
   * Formatea el número de tarjeta agregando espacios cada 4 dígitos.
   */
  formatCardNumber(): void {
    let value = this.paymentData.cardNumber.replace(/\s/g, '').replace(/\D/g, '');
    value = value.substring(0, 16);
    this.paymentData.cardNumber = value.match(/.{1,4}/g)?.join(' ') || value;
  }

  /**
   * Formatea la fecha de expiración a MM/AA.
   */
  formatExpiryDate(): void {
    let value = this.paymentData.expiryDate.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    this.paymentData.expiryDate = value;
  }

  /**
   * Formatea el CVV para que tenga máximo 4 dígitos numéricos.
   */
  formatCVV(): void {
    this.paymentData.cvv = this.paymentData.cvv.replace(/\D/g, '').substring(0, 4);
  }
}

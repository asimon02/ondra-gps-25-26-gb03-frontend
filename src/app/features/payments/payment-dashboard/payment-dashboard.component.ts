import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PaymentService } from '../services/payment.service';
import { CobrosService, CobrosPaginadosDTO, FiltrosCobrosDTO, TotalesDTO } from '../services/cobros.service';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { MetodoPagoUsuarioDTO, MetodoCobroArtistaDTO } from '../models/payment.model';
import { AddPaymentMethodModalComponent } from '../components/add-payment-method-modal/add-payment-method-modal.component';
import { PaymentIconComponent } from '../components/payment-icon/payment-icon.component';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';
import { FormsModule } from '@angular/forms';

/** Tipos de métodos de pago válidos */
type TipoMetodoPago = 'tarjeta' | 'paypal' | 'bizum' | 'transferencia';

/**
 * Componente principal de dashboard de pagos y cobros.
 */
@Component({
  selector: 'app-payment-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AddPaymentMethodModalComponent,
    PaymentIconComponent,
    BackButtonComponent
  ],
  templateUrl: './payment-dashboard.component.html',
  styleUrls: ['./payment-dashboard.component.scss']
})
export class PaymentDashboardComponent implements OnInit {
  /** Servicios inyectados */
  private paymentService = inject(PaymentService);
  private cobrosService = inject(CobrosService);
  private authState = inject(AuthStateService);
  private router = inject(Router);

  /** Usuario actual */
  currentUser = this.authState.currentUser;

  /** Indica si el usuario es artista */
  isArtista = computed(() => this.currentUser()?.tipoUsuario === 'ARTISTA');

  /** Métodos de pago/cobro disponibles */
  metodosPago = signal<(MetodoPagoUsuarioDTO | MetodoCobroArtistaDTO)[]>([]);

  /** Método predeterminado */
  metodoPredeterminado = signal<number | null>(null);

  /** Indica si se está cargando información */
  isLoading = signal(true);

  /** Mostrar modal de creación de método */
  mostrarModal = signal(false);

  /** Mensaje de error */
  errorMessage = signal<string | null>(null);

  /** Datos de cobros paginados */
  cobrosData = signal<CobrosPaginadosDTO | null>(null);

  /** Totales de cobros del artista */
  totales = signal<TotalesDTO | null>(null);

  /** Estado de carga de cobros */
  isLoadingCobros = signal(false);

  /** Vista actual: métodos o cobros */
  vistaActual = signal<'metodos' | 'cobros'>('metodos');

  /** Filtros aplicados a la lista de cobros */
  filtros = signal<FiltrosCobrosDTO>({
    ordenarPor: 'FECHA',
    direccion: 'DESC',
    pagina: 1,
    limite: 20
  });

  /** Opciones de filtros */
  estadosDisponibles = ['PENDIENTE', 'PAGADO', 'CANCELADO'];
  tiposCobro = ['COMPRA', 'REPRODUCCION'];
  tiposContenido = ['CANCION', 'ALBUM'];

  /** Inicializa el componente */
  ngOnInit(): void {
    window.scrollTo(0, 0);
    this.cargarMetodos();

    if (this.isArtista()) {
      this.cargarTotales();
    }
  }

  /** Carga los métodos de pago/cobro según el usuario */
  cargarMetodos(): void {
    const user = this.currentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    if (this.isArtista()) {
      const idArtista = user.idArtista;
      if (!idArtista) {
        this.errorMessage.set('No se encontró el perfil de artista');
        this.isLoading.set(false);
        return;
      }

      this.paymentService.listarMetodosCobro(idArtista).subscribe({
        next: (metodos) => {
          this.metodosPago.set(metodos);
          const predeterminado = localStorage.getItem(`metodoCobro_predeterminado_${idArtista}`);
          if (predeterminado) {
            this.metodoPredeterminado.set(parseInt(predeterminado));
          } else if (metodos.length > 0) {
            this.establecerMetodoPredeterminado(metodos[0].idMetodoCobro);
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error al cargar métodos de cobro:', error);
          this.errorMessage.set('Error al cargar los métodos de cobro');
          this.isLoading.set(false);
        }
      });
    } else {
      this.paymentService.listarMetodosPago(user.idUsuario).subscribe({
        next: (metodos) => {
          this.metodosPago.set(metodos);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error al cargar métodos de pago:', error);
          this.errorMessage.set('Error al cargar los métodos de pago');
          this.isLoading.set(false);
        }
      });
    }
  }

  /** Carga los totales de cobros del artista */
  cargarTotales(): void {
    const user = this.currentUser();
    if (!user?.idArtista) return;

    this.cobrosService.obtenerTotales(user.idArtista).subscribe({
      next: (totales) => this.totales.set(totales),
      error: (error) => console.error('Error al cargar totales:', error)
    });
  }

  /** Carga los cobros del artista según los filtros actuales */
  cargarCobros(): void {
    const user = this.currentUser();
    if (!user?.idArtista) return;

    this.isLoadingCobros.set(true);
    const filtrosActuales = { ...this.filtros(), idArtista: user.idArtista };

    this.cobrosService.listarCobros(filtrosActuales).subscribe({
      next: (data) => {
        this.cobrosData.set(data);
        this.isLoadingCobros.set(false);
      },
      error: (error) => {
        console.error('Error al cargar cobros:', error);
        this.isLoadingCobros.set(false);
      }
    });
  }

  /**
   * Cambia la vista entre 'metodos' y 'cobros'
   * @param vista Vista a mostrar
   */
  cambiarVista(vista: 'metodos' | 'cobros'): void {
    this.vistaActual.set(vista);
    if (vista === 'cobros' && !this.cobrosData()) {
      this.cargarCobros();
    }
  }

  /** Aplica nuevos filtros y recarga los cobros */
  aplicarFiltros(nuevosFiltros: Partial<FiltrosCobrosDTO>): void {
    this.filtros.update(f => ({ ...f, ...nuevosFiltros, pagina: 1 }));
    this.cargarCobros();
  }

  /** Cambia la página de los cobros */
  cambiarPagina(pagina: number): void {
    this.filtros.update(f => ({ ...f, pagina }));
    this.cargarCobros();
  }

  /** Resetea los filtros a valores por defecto */
  limpiarFiltros(): void {
    this.filtros.set({
      ordenarPor: 'FECHA',
      direccion: 'DESC',
      pagina: 1,
      limite: 20
    });
    this.cargarCobros();
  }

  /**
   * Establece un método de cobro predeterminado
   * @param idMetodo ID del método
   */
  establecerMetodoPredeterminado(idMetodo: number): void {
    const user = this.currentUser();
    if (!user?.idArtista) return;

    this.metodoPredeterminado.set(idMetodo);
    localStorage.setItem(`metodoCobro_predeterminado_${user.idArtista}`, idMetodo.toString());
    console.log('✅ Método de cobro predeterminado establecido:', idMetodo);
  }

  /** Comprueba si un método es predeterminado */
  esPredeterminado(idMetodo: number): boolean {
    return this.metodoPredeterminado() === idMetodo;
  }

  /** Abre el modal para crear un nuevo método */
  abrirModal(): void {
    this.mostrarModal.set(true);
  }

  /** Cierra el modal de creación de método */
  cerrarModal(): void {
    this.mostrarModal.set(false);
  }

  /** Evento disparado al crear un nuevo método */
  onMetodoCreado(): void {
    this.cerrarModal();
    this.cargarMetodos();
  }

  /**
   * Elimina un método de pago o cobro
   * @param metodo Método a eliminar
   */
  eliminarMetodo(metodo: MetodoPagoUsuarioDTO | MetodoCobroArtistaDTO): void {
    const confirmar = confirm(
      `¿Estás seguro de que deseas eliminar este método de ${this.isArtista() ? 'cobro' : 'pago'}?`
    );
    if (!confirmar) return;

    const user = this.currentUser();
    if (!user) return;

    if (this.isArtista() && 'idMetodoCobro' in metodo) {
      const idArtista = user.idArtista;
      if (!idArtista) return;

      if (this.esPredeterminado(metodo.idMetodoCobro)) {
        this.metodoPredeterminado.set(null);
        localStorage.removeItem(`metodoCobro_predeterminado_${idArtista}`);
      }

      this.paymentService.eliminarMetodoCobro(idArtista, metodo.idMetodoCobro).subscribe({
        next: () => {
          console.log('✅ Método de cobro eliminado');
          this.cargarMetodos();
        },
        error: (error) => {
          console.error('❌ Error al eliminar método de cobro:', error);
          alert('Error al eliminar el método de cobro');
        }
      });
    } else if ('idMetodoPago' in metodo) {
      this.paymentService.eliminarMetodoPago(user.idUsuario, metodo.idMetodoPago).subscribe({
        next: () => {
          console.log('✅ Método de pago eliminado');
          this.cargarMetodos();
        },
        error: (error) => {
          console.error('❌ Error al eliminar método de pago:', error);
          alert('Error al eliminar el método de pago');
        }
      });
    }
  }

  /**
   * Obtiene el tipo de método seguro
   * @param metodo Método a evaluar
   * @returns Tipo de método
   */
  getTipo(metodo: any): TipoMetodoPago {
    const tipo = metodo.tipo?.toLowerCase() || 'tarjeta';
    const tiposValidos: TipoMetodoPago[] = ['tarjeta', 'paypal', 'bizum', 'transferencia'];
    return tiposValidos.includes(tipo as TipoMetodoPago) ? (tipo as TipoMetodoPago) : 'tarjeta';
  }

  /** Obtiene el nombre del propietario */
  getPropietario(metodo: any): string {
    return metodo.propietario || 'Sin titular';
  }

  /** Formatea la dirección completa */
  getDireccion(metodo: any): string {
    return `${metodo.direccion}, ${metodo.codigoPostal} ${metodo.provincia}, ${metodo.pais}`;
  }

  /**
   * Obtiene el título de detalle según tipo
   * @param tipo Tipo de método
   */
  getTituloDetalle(tipo: string): string {
    const titulos: { [key: string]: string } = {
      'tarjeta': 'Tarjeta',
      'paypal': 'Email PayPal',
      'bizum': 'Teléfono Bizum',
      'transferencia': 'IBAN'
    };
    return titulos[tipo.toLowerCase()] || '📄 Detalles';
  }

  /**
   * Obtiene detalle específico del método
   * @param metodo Método a evaluar
   */
  getDetalle(metodo: any): string {
    const tipo = this.getTipo(metodo);
    switch(tipo) {
      case 'tarjeta':
        return metodo.numeroTarjeta ? `**** **** **** ${metodo.numeroTarjeta.slice(-4)}` : 'Sin número';
      case 'paypal':
        return metodo.emailPaypal || 'Sin email';
      case 'bizum':
        return metodo.telefonoBizum || 'Sin teléfono';
      case 'transferencia':
        return metodo.iban ? `${metodo.iban.substring(0, 4)} **** **** ${metodo.iban.slice(-4)}` : 'Sin IBAN';
      default:
        return 'Sin detalles';
    }
  }

  /**
   * Formatea una fecha a formato dd/mm/yyyy
   * @param fecha Fecha a formatear
   */
  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  /**
   * Formatea un monto a moneda EUR
   * @param monto Monto a formatear
   */
  formatearMonto(monto: number): string {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(monto);
  }

  /** Devuelve los meses del año */
  getMesesDelAnio(): number[] {
    return Array.from({ length: 12 }, (_, i) => i + 1);
  }

  /** Devuelve los últimos 5 años */
  getAniosDisponibles(): number[] {
    const anioActual = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => anioActual - i);
  }

  /** Calcula el total de la página de cobros */
  calcularTotalPagina(cobros: any[]): number {
    return cobros.reduce((sum, c) => sum + c.monto, 0);
  }

  /** Obtiene el nombre legible del método de cobro */
  getNombreMetodoCobro(cobro: any): string {
    if (cobro.nombreMetodoCobro) return cobro.nombreMetodoCobro;
    if (cobro.idMetodoCobro) {
      const metodo = this.metodosPago().find((m: any) =>
        'idMetodoCobro' in m && m.idMetodoCobro === cobro.idMetodoCobro
      );
      if (metodo) {
        return this.mapearTipoANombre(metodo.tipo?.toLowerCase());
      }
    }
    return '-';
  }

  /** Mapea tipo interno a nombre legible */
  private mapearTipoANombre(tipo: string): string {
    const nombres: { [key: string]: string } = {
      'paypal': 'PayPal',
      'transferencia': 'Transferencia',
      'bizum': 'Bizum',
      'tarjeta': 'Tarjeta'
    };
    return nombres[tipo] || tipo;
  }
}

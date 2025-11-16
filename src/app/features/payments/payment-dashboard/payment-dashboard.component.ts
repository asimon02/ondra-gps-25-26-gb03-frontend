import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PaymentService } from '../services/payment.service';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { MetodoPagoUsuarioDTO, MetodoCobroArtistaDTO } from '../models/payment.model';
import { AddPaymentMethodModalComponent } from '../components/add-payment-method-modal/add-payment-method-modal.component';
import { PaymentIconComponent } from '../components/payment-icon/payment-icon.component';

type TipoMetodoPago = 'tarjeta' | 'paypal' | 'bizum' | 'transferencia';

@Component({
  selector: 'app-payment-dashboard',
  standalone: true,
  imports: [CommonModule, AddPaymentMethodModalComponent, PaymentIconComponent],
  templateUrl: './payment-dashboard.component.html',
  styleUrls: ['./payment-dashboard.component.scss']
})
export class PaymentDashboardComponent implements OnInit {
  private paymentService = inject(PaymentService);
  private authState = inject(AuthStateService);
  private router = inject(Router);

  currentUser = this.authState.currentUser;
  isArtista = computed(() => this.currentUser()?.tipoUsuario === 'ARTISTA');

  metodosPago = signal<(MetodoPagoUsuarioDTO | MetodoCobroArtistaDTO)[]>([]);
  isLoading = signal(true);
  mostrarModal = signal(false);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    window.scrollTo(0, 0);
    this.cargarMetodos();
  }

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

  abrirModal(): void {
    this.mostrarModal.set(true);
  }

  cerrarModal(): void {
    this.mostrarModal.set(false);
  }

  onMetodoCreado(): void {
    this.cerrarModal();
    this.cargarMetodos();
  }

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

  // ✅ SOLUCIÓN: Retornar el tipo específico con validación
  getTipo(metodo: any): TipoMetodoPago {
    const tipo = metodo.tipo?.toLowerCase() || 'tarjeta';
    const tiposValidos: TipoMetodoPago[] = ['tarjeta', 'paypal', 'bizum', 'transferencia'];
    return tiposValidos.includes(tipo as TipoMetodoPago)
      ? (tipo as TipoMetodoPago)
      : 'tarjeta';
  }

  getPropietario(metodo: any): string {
    return metodo.propietario || 'Sin titular';
  }

  getDireccion(metodo: any): string {
    return `${metodo.direccion}, ${metodo.codigoPostal} ${metodo.provincia}, ${metodo.pais}`;
  }

  getTituloDetalle(tipo: string): string {
    const titulos: { [key: string]: string } = {
      'tarjeta': 'Tarjeta',
      'paypal': 'Email PayPal',
      'bizum': 'Teléfono Bizum',
      'transferencia': 'IBAN'
    };
    return titulos[tipo.toLowerCase()] || '📄 Detalles';
  }

  getDetalle(metodo: any): string {
    const tipo = this.getTipo(metodo);
    switch(tipo) {
      case 'tarjeta':
        return metodo.numeroTarjeta
          ? `**** **** **** ${metodo.numeroTarjeta.slice(-4)}`
          : 'Sin número';
      case 'paypal':
        return metodo.emailPaypal || 'Sin email';
      case 'bizum':
        return metodo.telefonoBizum || 'Sin teléfono';
      case 'transferencia':
        return metodo.iban
          ? `${metodo.iban.substring(0, 4)} **** **** ${metodo.iban.slice(-4)}`
          : 'Sin IBAN';
      default:
        return 'Sin detalles';
    }
  }

  volverAPerfil(): void {
    this.router.navigate(['/perfil/info']);
  }
}

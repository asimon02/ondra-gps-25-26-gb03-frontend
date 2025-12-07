// src/app/features/cart/components/payment-verification/payment-verification.component.ts

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-payment-verification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-verification.component.html',
  styleUrl: './payment-verification.component.scss'
})
export class PaymentVerificationComponent implements OnInit {
  private router = inject(Router);
  private cartService = inject(CartService);

  isVerifying = true;
  isConfirmed = false;

  ngOnInit(): void {
    // Obtener el ID del método de pago del localStorage
    const idMetodoPago = Number(localStorage.getItem('idMetodoPago') || '1');
    
    // Simular verificación de pago (3 segundos)
    setTimeout(() => {
      // Llamar al backend para finalizar la compra
      this.cartService.finalizarCompra(idMetodoPago).subscribe({
        next: () => {
          this.isVerifying = false;
          this.isConfirmed = true;

          // Limpiar datos temporales
          localStorage.removeItem('lastCheckout');
          localStorage.removeItem('idMetodoPago');

          // Redirigir al home después de 5 segundos
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 5000);
        },
        error: (error) => {
          console.error('Error al finalizar la compra:', error);
          this.isVerifying = false;
          alert('Error al procesar la compra. Por favor, intenta de nuevo.');
          this.router.navigate(['/cart']);
        }
      });
    }, 3000);
  }
}
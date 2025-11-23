// src/app/features/cart/cart.component.ts

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CartService } from './services/cart.service';
import { CartItem } from './models/cart.model';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent implements OnInit {
  private cartService = inject(CartService);
  private router = inject(Router);
  
  cartSummary = this.cartService.cartSummary;
  isLoading = true;

  ngOnInit(): void {
    // Cargar carrito desde el backend
    this.loadCart();
  }

  private loadCart(): void {
    this.isLoading = true;
    this.cartService.obtenerCarrito().subscribe({
      next: () => {
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar el carrito:', error);
        this.isLoading = false;
      }
    });
  }

  removeItem(itemId: string): void {
    if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      this.cartService.removeFromCart(itemId);
    }
  }

  clearCart(): void {
    if (confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
      this.cartService.clearCart();
    }
  }

  getProductTypeLabel(tipo: CartItem['tipo']): string {
    return tipo === 'album' ? 'Álbum' : 'Canción';
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  }

  checkout(): void {
    if (this.cartSummary().itemCount === 0) {
      alert('El carrito está vacío');
      return;
    }
    this.router.navigate(['/cart/checkout']);
  }
}
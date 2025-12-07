// src/app/features/cart/components/checkout/checkout.component.ts

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss'
})
export class CheckoutComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private cartService = inject(CartService);

  cartSummary = this.cartService.cartSummary;
  
  checkoutForm: FormGroup;
  currentStep = 1; // 1: Dirección, 2: Pago

  constructor() {
    this.checkoutForm = this.fb.group({
      // Datos de envío
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      direccion: ['', [Validators.required, Validators.minLength(5)]],
      ciudad: ['', [Validators.required]],
      codigoPostal: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
      pais: ['España', [Validators.required]],
      telefono: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
      
      // Datos de pago
      numeroTarjeta: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]],
      nombreTitular: ['', [Validators.required, Validators.minLength(3)]],
      fechaExpiracion: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]],
      cvv: ['', [Validators.required, Validators.pattern(/^\d{3}$/)]]
    });
  }

  // Rellenar con datos de ejemplo
  fillTestData(): void {
    this.checkoutForm.patchValue({
      nombre: 'Juan',
      apellidos: 'García López',
      direccion: 'Calle Mayor 123, 3º B',
      ciudad: 'Madrid',
      codigoPostal: '28013',
      pais: 'España',
      telefono: '612345678',
      numeroTarjeta: '4532123456789012',
      nombreTitular: 'JUAN GARCIA LOPEZ',
      fechaExpiracion: '12/25',
      cvv: '123'
    });
  }

  nextStep(): void {
    if (this.currentStep === 1) {
      // Validar campos de dirección
      const shippingFields = ['nombre', 'apellidos', 'direccion', 'ciudad', 'codigoPostal', 'pais', 'telefono'];
      const shippingValid = shippingFields.every(field => this.checkoutForm.get(field)?.valid);
      
      if (shippingValid) {
        this.currentStep = 2;
      } else {
        this.markShippingFieldsAsTouched();
      }
    }
  }

  previousStep(): void {
    if (this.currentStep === 2) {
      this.currentStep = 1;
    }
  }

  private markShippingFieldsAsTouched(): void {
    ['nombre', 'apellidos', 'direccion', 'ciudad', 'codigoPostal', 'pais', 'telefono'].forEach(field => {
      this.checkoutForm.get(field)?.markAsTouched();
    });
  }

  processPayment(): void {
    if (this.checkoutForm.valid) {
      // Guardar datos del checkout en localStorage (opcional)
      localStorage.setItem('lastCheckout', JSON.stringify(this.checkoutForm.value));
      
      // Por ahora, usar un método de pago simulado (ID = 1)
      // En producción, aquí deberías seleccionar el método de pago real del usuario
      const idMetodoPago = 1;
      
      // Guardar el ID del método de pago para usarlo en la verificación
      localStorage.setItem('idMetodoPago', idMetodoPago.toString());
      
      // Navegar a la pantalla de verificación
      this.router.navigate(['/cart/verification']);
    } else {
      Object.keys(this.checkoutForm.controls).forEach(key => {
        this.checkoutForm.get(key)?.markAsTouched();
      });
    }
  }

  cancelCheckout(): void {
    if (confirm('¿Seguro que quieres cancelar el proceso de compra?')) {
      this.router.navigate(['/cart']);
    }
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  }

  // Helper para mostrar errores
  getErrorMessage(fieldName: string): string {
    const control = this.checkoutForm.get(fieldName);
    if (!control || !control.errors || !control.touched) return '';

    if (control.errors['required']) return 'Este campo es obligatorio';
    if (control.errors['minlength']) return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
    if (control.errors['pattern']) {
      if (fieldName === 'codigoPostal') return 'Código postal inválido (5 dígitos)';
      if (fieldName === 'telefono') return 'Teléfono inválido (9 dígitos)';
      if (fieldName === 'numeroTarjeta') return 'Número de tarjeta inválido (16 dígitos)';
      if (fieldName === 'fechaExpiracion') return 'Formato: MM/AA';
      if (fieldName === 'cvv') return 'CVV inválido (3 dígitos)';
    }
    return 'Campo inválido';
  }
}
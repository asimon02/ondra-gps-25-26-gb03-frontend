import { Component, Output, EventEmitter, Input, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { PaymentService } from '../../services/payment.service';
import { AuthStateService } from '../../../../core/services/auth-state.service';
import { PaymentIconComponent } from '../payment-icon/payment-icon.component';
import {
  METODOS_PAGO_USUARIO,
  METODOS_COBRO_ARTISTA,
  TipoMetodoPago,
  PAISES,
  PROVINCIAS_ESPANA
} from '../../models/payment.model';

@Component({
  selector: 'app-add-payment-method-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PaymentIconComponent],
  templateUrl: './add-payment-method-modal.component.html',
  styleUrls: ['./add-payment-method-modal.component.scss']
})
export class AddPaymentMethodModalComponent implements OnInit {
  @Input() isArtista = false;
  @Output() closeModal = new EventEmitter<void>();
  @Output() metodoCreado = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private paymentService = inject(PaymentService);
  private authState = inject(AuthStateService);

  paymentForm!: FormGroup;
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  metodoSeleccionado = signal<TipoMetodoPago | null>(null);
  metodosDisponibles: TipoMetodoPago[] = [];

  paises = PAISES;
  provincias = PROVINCIAS_ESPANA;

  ngOnInit(): void {
    this.metodosDisponibles = this.isArtista ? METODOS_COBRO_ARTISTA : METODOS_PAGO_USUARIO;
    this.initializeForm();
  }

  private initializeForm(): void {
    this.paymentForm = this.fb.group({
      metodo: ['', [Validators.required]],
      propietario: ['', [Validators.required, Validators.minLength(3)]],
      direccion: ['', [Validators.required, Validators.minLength(5)]],
      pais: ['España', [Validators.required]],
      provincia: ['', [Validators.required]],
      codigoPostal: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
      // Campos específicos de tarjeta
      numeroTarjeta: [''],
      fechaCaducidad: [''],
      cvv: [''],
      // Campos específicos de otros métodos
      emailPaypal: [''],
      telefonoBizum: [''],
      iban: ['']
    });

    // ✅ SOLUCIÓN: Usar { emitEvent: false } para evitar bucles infinitos
    this.paymentForm.get('metodo')?.valueChanges.subscribe((metodo: TipoMetodoPago) => {
      this.metodoSeleccionado.set(metodo);
      this.actualizarValidaciones(metodo);
    });
  }

  private actualizarValidaciones(metodo: TipoMetodoPago): void {
    // Resetear todas las validaciones de campos específicos
    this.paymentForm.get('numeroTarjeta')?.clearValidators();
    this.paymentForm.get('fechaCaducidad')?.clearValidators();
    this.paymentForm.get('cvv')?.clearValidators();
    this.paymentForm.get('emailPaypal')?.clearValidators();
    this.paymentForm.get('telefonoBizum')?.clearValidators();
    this.paymentForm.get('iban')?.clearValidators();

    // Aplicar validaciones según el método
    switch (metodo) {
      case 'tarjeta':
        this.paymentForm.get('numeroTarjeta')?.setValidators([
          Validators.required,
          Validators.pattern(/^\d{16}$/)
        ]);
        this.paymentForm.get('fechaCaducidad')?.setValidators([
          Validators.required,
          Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)
        ]);
        this.paymentForm.get('cvv')?.setValidators([
          Validators.required,
          Validators.pattern(/^\d{3,4}$/)
        ]);
        break;

      case 'paypal':
        this.paymentForm.get('emailPaypal')?.setValidators([
          Validators.required,
          Validators.email
        ]);
        break;

      case 'bizum':
        this.paymentForm.get('telefonoBizum')?.setValidators([
          Validators.required,
          Validators.pattern(/^(\+34)?[6-9]\d{8}$/)
        ]);
        break;

      case 'transferencia':
        this.paymentForm.get('iban')?.setValidators([
          Validators.required,
          this.ibanValidator()
        ]);
        break;
    }

    // ✅ SOLUCIÓN: Actualizar solo los campos específicos, NO todos los controles
    // Esto evita el bucle infinito
    ['numeroTarjeta', 'fechaCaducidad', 'cvv', 'emailPaypal', 'telefonoBizum', 'iban'].forEach(key => {
      this.paymentForm.get(key)?.updateValueAndValidity({ emitEvent: false });
    });
  }

  private ibanValidator() {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (!control.value) return null;
      const ibanPattern = /^ES\d{22}$/;
      const valid = ibanPattern.test(control.value.replace(/\s/g, ''));
      return valid ? null : { invalidIban: true };
    };
  }

  onSubmit(): void {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const user = this.authState.currentUser();
    if (!user) {
      this.errorMessage.set('Usuario no autenticado');
      this.isSubmitting.set(false);
      return;
    }

    const formValue = this.paymentForm.value;
    const metodo = this.metodoSeleccionado();

    if (this.isArtista) {
      const idArtista = user.idArtista;
      if (!idArtista) {
        this.errorMessage.set('Perfil de artista no encontrado');
        this.isSubmitting.set(false);
        return;
      }

      // ✅ DTO para artista (sin campos de tarjeta)
      const dto = {
        metodoPago: formValue.metodo.toUpperCase(),
        propietario: formValue.propietario,
        direccion: formValue.direccion,
        pais: formValue.pais,
        provincia: formValue.provincia,
        codigoPostal: formValue.codigoPostal,
        emailPaypal: metodo === 'paypal' ? formValue.emailPaypal : undefined,
        telefonoBizum: metodo === 'bizum' ? formValue.telefonoBizum : undefined,
        iban: metodo === 'transferencia' ? formValue.iban.replace(/\s/g, '') : undefined
      };

      this.paymentService.crearMetodoCobro(idArtista, dto).subscribe({
        next: () => {
          console.log('✅ Método de cobro creado');
          this.isSubmitting.set(false);
          this.metodoCreado.emit();
        },
        error: (error) => {
          console.error('❌ Error al crear método de cobro:', error);
          this.errorMessage.set(error.error?.message || 'Error al crear el método de cobro');
          this.isSubmitting.set(false);
        }
      });
    } else {
      // ✅ DTO para usuario (con todos los campos)
      const dto = {
        metodoPago: formValue.metodo.toUpperCase(),
        propietario: formValue.propietario,
        direccion: formValue.direccion,
        pais: formValue.pais,
        provincia: formValue.provincia,
        codigoPostal: formValue.codigoPostal,
        numeroTarjeta: metodo === 'tarjeta' ? formValue.numeroTarjeta : undefined,
        fechaCaducidad: metodo === 'tarjeta' ? formValue.fechaCaducidad : undefined,
        cvv: metodo === 'tarjeta' ? formValue.cvv : undefined,
        emailPaypal: metodo === 'paypal' ? formValue.emailPaypal : undefined,
        telefonoBizum: metodo === 'bizum' ? formValue.telefonoBizum : undefined,
        iban: metodo === 'transferencia' ? formValue.iban.replace(/\s/g, '') : undefined
      };

      this.paymentService.crearMetodoPago(user.idUsuario, dto).subscribe({
        next: () => {
          console.log('✅ Método de pago creado');
          this.isSubmitting.set(false);
          this.metodoCreado.emit();
        },
        error: (error) => {
          console.error('❌ Error al crear método de pago:', error);
          this.errorMessage.set(error.error?.message || 'Error al crear el método de pago');
          this.isSubmitting.set(false);
        }
      });
    }
  }

  close(): void {
    this.closeModal.emit();
  }

  getNombreMetodo(metodo: TipoMetodoPago): string {
    const nombres: { [key: string]: string } = {
      'tarjeta': 'Tarjeta',
      'paypal': 'PayPal',
      'transferencia': 'Transferencia',
      'bizum': 'Bizum'
    };
    return nombres[metodo] || metodo;
  }

  // Getters para validación
  get metodo() { return this.paymentForm.get('metodo'); }
  get propietario() { return this.paymentForm.get('propietario'); }
  get direccion() { return this.paymentForm.get('direccion'); }
  get pais() { return this.paymentForm.get('pais'); }
  get provincia() { return this.paymentForm.get('provincia'); }
  get codigoPostal() { return this.paymentForm.get('codigoPostal'); }
  get numeroTarjeta() { return this.paymentForm.get('numeroTarjeta'); }
  get fechaCaducidad() { return this.paymentForm.get('fechaCaducidad'); }
  get cvv() { return this.paymentForm.get('cvv'); }
  get emailPaypal() { return this.paymentForm.get('emailPaypal'); }
  get telefonoBizum() { return this.paymentForm.get('telefonoBizum'); }
  get iban() { return this.paymentForm.get('iban'); }

  isFieldInvalid(field: AbstractControl | null): boolean {
    return !!(field && field.invalid && field.touched);
  }

  hasError(field: AbstractControl | null, errorType: string): boolean {
    return !!(field && field.hasError(errorType) && field.touched);
  }
}

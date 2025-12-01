import { Component, Output, EventEmitter, signal, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { UserProfileService } from '../../services/user-profile.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-change-password-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './change-password-modal.component.html',
  styleUrls: ['./change-password-modal.component.scss']
})
export class ChangePasswordModalComponent {
  /**
   * ID del usuario cuya contraseña será modificada.
   */
  @Input() userId!: number;

  /**
   * Evento emitido para cerrar el modal.
   */
  @Output() closeModal = new EventEmitter<void>();

  /**
   * Evento emitido después de que la contraseña se haya cambiado correctamente.
   */
  @Output() passwordChanged = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private userProfileService = inject(UserProfileService);
  private router = inject(Router);
  private authService = inject(AuthService);

  /**
   * Formulario para modificar la contraseña del usuario.
   */
  passwordForm!: FormGroup;

  /**
   * Indica si la solicitud de cambio de contraseña está en curso.
   */
  isSubmitting = signal(false);

  /**
   * Mensaje de éxito mostrado tras un cambio exitoso.
   */
  successMessage = signal<string | null>(null);

  /**
   * Mensaje de error generado durante la operación de cambio de contraseña.
   */
  errorMessage = signal<string | null>(null);

  /**
   * Visibilidad del campo de contraseña actual.
   */
  showCurrentPassword = signal(false);

  /**
   * Visibilidad del campo de nueva contraseña.
   */
  showNewPassword = signal(false);

  /**
   * Visibilidad del campo de confirmación de contraseña.
   */
  showConfirmPassword = signal(false);

  constructor() {
    this.initializeForm();
  }

  /**
   * Inicializa el formulario con sus campos y validadores.
   */
  private initializeForm(): void {
    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', [Validators.required]],
        newPassword: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]]
      },
      { validators: this.passwordMatchValidator }
    );
  }

  /**
   * Validador que comprueba que las nuevas contraseñas coinciden.
   * @param control Grupo de controles del formulario.
   */
  private passwordMatchValidator(control: AbstractControl): { [key: string]: any } | null {
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');

    if (!newPassword || !confirmPassword) {
      return null;
    }

    return newPassword.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  /**
   * Envía la solicitud de cambio de contraseña si el formulario es válido.
   */
  onSubmit(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.clearMessages();

    const formValue = this.passwordForm.value;
    const dto = {
      passwordActual: formValue.currentPassword,
      nuevaPassword: formValue.newPassword
    };

    this.userProfileService.cambiarPassword(this.userId, dto).subscribe({
      next: () => {
        this.successMessage.set('Contraseña cambiada correctamente. Redirigiendo al login...');
        this.passwordForm.reset();
        this.isSubmitting.set(false);

        setTimeout(() => {
          this.authService.logout();
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (error) => {
        console.error('Error al cambiar contraseña:', error);
        this.errorMessage.set(error.error?.message || 'Error al cambiar la contraseña');
        this.isSubmitting.set(false);
      }
    });
  }

  /**
   * Cierra el modal.
   */
  close(): void {
    this.closeModal.emit();
  }

  /** Alterna visibilidad del campo de contraseña actual. */
  toggleCurrentPassword(): void {
    this.showCurrentPassword.update(v => !v);
  }

  /** Alterna visibilidad del campo de nueva contraseña. */
  toggleNewPassword(): void {
    this.showNewPassword.update(v => !v);
  }

  /** Alterna visibilidad del campo de confirmación de contraseña. */
  toggleConfirmPassword(): void {
    this.showConfirmPassword.update(v => !v);
  }

  /**
   * Limpia mensajes de error y éxito.
   */
  private clearMessages(): void {
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  /** Getters de acceso rápido a los controles del formulario. */
  get currentPassword() { return this.passwordForm.get('currentPassword'); }
  get newPassword() { return this.passwordForm.get('newPassword'); }
  get confirmPassword() { return this.passwordForm.get('confirmPassword'); }

  /**
   * Indica si un campo del formulario es inválido y fue tocado.
   */
  isFieldInvalid(field: AbstractControl | null): boolean {
    return !!(field && field.invalid && field.touched);
  }

  /**
   * Verifica si un campo contiene un error específico.
   */
  hasError(field: AbstractControl | null, errorType: string): boolean {
    return !!(field && field.hasError(errorType) && field.touched);
  }
}

import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Componente de modal para confirmar la acción de cerrar sesión.
 * Emite eventos de confirmación o cancelación según la interacción del usuario.
 */
@Component({
  selector: 'app-logout-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logout-confirm-modal.component.html',
  styleUrls: ['./logout-confirm-modal.component.scss']
})
export class LogoutConfirmModalComponent {
  /** Evento emitido al confirmar el cierre de sesión */
  @Output() confirmLogout = new EventEmitter<void>();

  /** Evento emitido al cancelar el cierre de sesión */
  @Output() cancelLogout = new EventEmitter<void>();

  /**
   * Emite el evento de confirmación de cierre de sesión
   */
  confirm(): void {
    this.confirmLogout.emit();
  }

  /**
   * Emite el evento de cancelación de cierre de sesión
   */
  cancel(): void {
    this.cancelLogout.emit();
  }
}

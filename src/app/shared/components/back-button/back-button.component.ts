import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, Location } from '@angular/common';

/**
 * Tipos de variantes visuales del botón
 */
type BackButtonVariant = 'ghost' | 'primary';

/**
 * Componente de botón de retroceso.
 * Permite volver a la página anterior con opciones de estilo y comportamiento.
 */
@Component({
  selector: 'app-back-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './back-button.component.html',
  styles: [`
    :host {
      display: inline-block;
    }
  `]
})
export class BackButtonComponent {
  /** Texto del botón */
  @Input() label = 'Volver';

  /** Variante visual del botón */
  @Input() variant: BackButtonVariant = 'ghost';

  /** Si el botón ocupa todo el ancho disponible */
  @Input() block = false;

  /** Clases CSS adicionales para personalización */
  @Input() extraClasses = '';

  /** Deshabilita la interacción del botón */
  @Input() disabled = false;

  /** Evita navegación automática y solo dispara el evento `back` */
  @Input() disableAutoNav = false;

  /** Evento emitido al hacer clic en el botón */
  @Output() back = new EventEmitter<void>();

  constructor(private location: Location) {}

  /**
   * Obtiene las clases CSS dinámicas para el botón según propiedades
   */
  get buttonClasses(): string {
    const base = 'inline-flex items-center group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed';
    const layout = this.block ? 'w-full justify-center' : '';
    const variantClasses = this.variant === 'primary'
      ? 'px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg'
      : 'px-4 py-2 bg-white text-gray-700 hover:text-blue-600 transition-colors rounded-xl shadow-md hover:shadow-lg border border-gray-200';

    return [base, layout, variantClasses, this.extraClasses].filter(Boolean).join(' ');
  }

  /**
   * Obtiene las clases CSS para el icono del botón según la variante
   */
  get iconClasses(): string {
    const base = 'w-5 h-5 mr-2';
    const hover = this.variant === 'ghost' ? 'transform group-hover:-translate-x-1 transition-transform' : '';
    return [base, hover].filter(Boolean).join(' ');
  }

  /**
   * Maneja el evento de retroceso.
   * Emite el evento `back` y navega hacia atrás a menos que `disableAutoNav` esté activado.
   */
  goBack(): void {
    this.back.emit();

    if (this.disableAutoNav) {
      return;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.location.back();
  }
}

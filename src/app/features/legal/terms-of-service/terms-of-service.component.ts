import { Component } from '@angular/core';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';

/**
 * Componente de los Términos de Servicio.
 * Muestra la información legal y condiciones de uso de la plataforma.
 */
@Component({
  selector: 'app-terms-of-service',
  standalone: true,
  imports: [BackButtonComponent],
  templateUrl: './terms-of-service.component.html',
  styleUrl: './terms-of-service.component.scss'
})
export class TermsOfServiceComponent {}

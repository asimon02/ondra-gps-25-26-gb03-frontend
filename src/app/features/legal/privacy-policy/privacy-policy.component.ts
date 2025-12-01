import { Component } from '@angular/core';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';

/**
 * Componente de la política de privacidad.
 * Muestra la información relacionada con la privacidad de los datos de los usuarios.
 */
@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [BackButtonComponent],
  templateUrl: './privacy-policy.component.html',
  styleUrl: './privacy-policy.component.scss'
})
export class PrivacyPolicyComponent {}

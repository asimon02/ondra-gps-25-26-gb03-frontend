import { Component } from '@angular/core';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';

/**
 * Componente de la política de cookies.
 * Se encarga de mostrar la información sobre el uso de cookies en la plataforma.
 */
@Component({
  selector: 'app-cookies-policy',
  standalone: true,
  imports: [BackButtonComponent],
  templateUrl: './cookies-policy.component.html',
  styleUrl: './cookies-policy.component.scss'
})
export class CookiesPolicyComponent {}

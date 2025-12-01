import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';

/**
 * Componente de pie de página (footer) de la aplicación.
 * Muestra enlaces de navegación, iconos y el año actual.
 */
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, MatIcon],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {
  /** Año actual para mostrar en el footer */
  currentYear: number = new Date().getFullYear();
}

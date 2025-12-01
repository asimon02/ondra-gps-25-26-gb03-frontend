import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ProfileButtonComponent } from '../../profile-button/profile-button.component';
import { CarritoService } from '../../../../core/services/carrito.service';
import { AuthStateService } from '../../../../core/services/auth-state.service';
import { TipoUsuario } from '../../../../core/models/auth.model';

/**
 * Componente de encabezado (header) de la aplicación.
 * Muestra navegación principal, botón de perfil y estado del carrito de compras.
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, ProfileButtonComponent, CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
  /** Opciones para RouterLink, define si la ruta debe coincidir exactamente */
  routerLinkOptions = { exact: true };

  /** Cantidad de items en el carrito visible en el header */
  cantidadItems = 0;

  /** Suscripciones internas del componente */
  private subscription = new Subscription();

  constructor(
    private carritoService: CarritoService,
    private authState: AuthStateService
  ) {}

  /**
   * Inicializa el componente, suscribiéndose a cambios del carrito.
   * Inicializa el carrito solo si el usuario puede usarlo.
   */
  ngOnInit(): void {
    this.subscription.add(
      this.carritoService.cantidadItems$.subscribe(cantidad => {
        this.cantidadItems = this.canShowCart ? cantidad : 0;
      })
    );

    if (this.canShowCart) {
      this.carritoService.inicializarCarrito();
    } else {
      this.cantidadItems = 0;
    }
  }

  /** Limpia todas las suscripciones al destruir el componente */
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  /**
   * Indica si el carrito debe mostrarse.
   * Solo se muestra a usuarios autenticados que no sean ARTISTA.
   */
  get canShowCart(): boolean {
    const user = this.authState.getUserInfo();
    return this.authState.isAuthenticated() && user?.tipoUsuario !== TipoUsuario.ARTISTA;
  }

  /** Indica si el usuario está autenticado */
  get isAuthenticated(): boolean {
    return this.authState.isAuthenticated();
  }
}

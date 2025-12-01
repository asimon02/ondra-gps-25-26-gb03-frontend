import { Component, signal, ViewChild, ElementRef, inject, computed, TemplateRef, ViewContainerRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Overlay, OverlayModule, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal, ComponentPortal } from '@angular/cdk/portal';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { AuthService } from '../../../core/services/auth.service';
import { LogoutConfirmModalComponent } from '../../../shared/components/logout-confirm-modal/logout-confirm-modal.component';

/**
 * Componente de botón de perfil que muestra información del usuario,
 * permite navegar al perfil, acceder a login y cerrar sesión.
 * Incluye un dropdown y modal de confirmación de logout.
 */
@Component({
  selector: 'app-profile-button',
  standalone: true,
  imports: [CommonModule, OverlayModule],
  templateUrl: './profile-button.component.html',
  styleUrl: './profile-button.component.scss'
})
export class ProfileButtonComponent {
  @ViewChild('dropdownTemplate') dropdownTemplate!: TemplateRef<any>;
  @ViewChild('buttonRef') buttonRef!: ElementRef;

  private overlay = inject(Overlay);
  private viewContainerRef = inject(ViewContainerRef);
  private authState = inject(AuthStateService);
  private authService = inject(AuthService);
  private router = inject(Router);

  private overlayRef?: OverlayRef;
  private modalOverlayRef?: OverlayRef;

  /** Señal reactiva de autenticación */
  readonly isAuthenticated = this.authState.isAuthenticated;

  /** Señal reactiva del usuario actual */
  readonly currentUser = this.authState.currentUser;

  /** Computed del email del usuario */
  readonly userEmail = computed(() => this.currentUser()?.emailUsuario || 'usuario@ejemplo.com');

  /** Computed del nombre a mostrar: nombre artístico si es artista, nombre completo si no */
  readonly displayName = computed(() => {
    const user = this.currentUser();
    if (!user) return 'Usuario';
    if (user.tipoUsuario === 'ARTISTA' && user.nombreArtistico) return user.nombreArtistico;
    return `${user.nombreUsuario} ${user.apellidosUsuario}`;
  });

  /** Computed de iniciales del usuario para avatar */
  readonly userInitials = computed(() => {
    const user = this.currentUser();
    if (!user) return 'U';
    if (user.tipoUsuario === 'ARTISTA' && user.nombreArtistico) {
      const parts = user.nombreArtistico.split(' ');
      return parts.length > 1
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : user.nombreArtistico.substring(0, 2).toUpperCase();
    }
    return `${user.nombreUsuario[0]}${user.apellidosUsuario?.[0] || ''}`.toUpperCase();
  });

  /** Computed de foto de perfil del usuario */
  readonly userPhoto = computed(() => {
    const user = this.currentUser();
    if (!user) return null;
    if (user.tipoUsuario === 'ARTISTA' && user.fotoPerfilArtistico) return user.fotoPerfilArtistico;
    return user.fotoPerfil || null;
  });

  /**
   * Alterna la visibilidad del dropdown del perfil
   */
  toggleDropdown(): void {
    if (this.overlayRef?.hasAttached()) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  /**
   * Abre el dropdown del perfil usando Angular CDK Overlay
   */
  openDropdown(): void {
    const buttonWidth = this.buttonRef.nativeElement.offsetWidth;
    const dropdownWidth = Math.max(buttonWidth, 280);

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.buttonRef)
      .withPositions([
        { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 8 },
        { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -8 }
      ]);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      width: dropdownWidth
    });

    const portal = new TemplatePortal(this.dropdownTemplate, this.viewContainerRef);
    this.overlayRef.attach(portal);
    this.overlayRef.backdropClick().subscribe(() => this.closeDropdown());
  }

  /**
   * Cierra el dropdown del perfil y destruye el overlay
   */
  closeDropdown(): void {
    if (this.overlayRef) {
      this.overlayRef.detach();
      this.overlayRef.dispose();
      this.overlayRef = undefined;
    }
  }

  /**
   * Navega a la página de login
   */
  accionAcceder(): void {
    this.router.navigate(['/login']);
  }

  /**
   * Navega a la página de perfil
   */
  accionPerfil(): void {
    this.closeDropdown();
    this.router.navigate(['/perfil/info']);
  }

  /**
   * Inicia el proceso de cierre de sesión mostrando un modal de confirmación
   */
  accionCerrarSesion(): void {
    this.closeDropdown();
    this.openLogoutModal();
  }

  /**
   * Abre un modal de confirmación de logout usando Angular CDK Overlay
   */
  openLogoutModal(): void {
    const positionStrategy = this.overlay.position().global().centerHorizontally().centerVertically();

    this.modalOverlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-dark-backdrop',
      panelClass: 'modal-overlay-pane',
      scrollStrategy: this.overlay.scrollStrategies.block()
    });

    const modalPortal = new ComponentPortal(LogoutConfirmModalComponent);
    const componentRef = this.modalOverlayRef.attach(modalPortal);

    componentRef.instance.confirmLogout.subscribe(() => this.confirmarLogout());
    componentRef.instance.cancelLogout.subscribe(() => this.cancelarLogout());
    this.modalOverlayRef.backdropClick().subscribe(() => this.cancelarLogout());
  }

  /**
   * Cierra el modal de logout y destruye el overlay
   */
  closeLogoutModal(): void {
    if (this.modalOverlayRef) {
      this.modalOverlayRef.detach();
      this.modalOverlayRef.dispose();
      this.modalOverlayRef = undefined;
    }
  }

  /**
   * Confirma el logout y llama al servicio de autenticación
   */
  confirmarLogout(): void {
    this.closeLogoutModal();
    this.authService.logout();
  }

  /**
   * Cancela el logout y cierra el modal
   */
  cancelarLogout(): void {
    this.closeLogoutModal();
  }
}

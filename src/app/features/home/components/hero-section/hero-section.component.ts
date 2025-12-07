import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { trigger, style, transition, animate } from '@angular/animations';
import { MatIcon } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { AuthStateService } from '../../../../core/services/auth-state.service';

/**
 * Componente de sección principal (hero) de la página de inicio.
 * Muestra un carrusel de banners con efecto de apilamiento y animación.
 * Gestiona navegación principal basada en estado de autenticación.
 */
@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIcon],
  templateUrl: './hero-section.component.html',
  styleUrls: ['./hero-section.component.scss'],
  animations: [
    /**
     * Animación de entrada con desvanecimiento y escala.
     */
    trigger('fadeInScale', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('0.6s ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ]
})
export class HeroSectionComponent implements OnInit, OnDestroy {

  /** Lista de banners a mostrar en el carrusel */
  banners = [
    { src: 'assets/images/banner1.jpg', alt: 'Banner 1' },
    { src: 'assets/images/banner2.jpg', alt: 'Banner 2' },
    { src: 'assets/images/banner3.jpg', alt: 'Banner 3' },
    { src: 'assets/images/banner4.jpg', alt: 'Banner 4' }
  ];

  /** Orden actual de apilamiento de banners */
  currentOrder = [0, 1, 2, 3];

  /** ID del intervalo de rotación de banners */
  private intervalId: any;

  constructor(
    private router: Router,
    public authState: AuthStateService
  ) {}

  /**
   * Inicializa la rotación automática de banners.
   */
  ngOnInit(): void {
    this.intervalId = setInterval(() => {
      this.currentOrder.push(this.currentOrder.shift()!);
    }, 4000);
  }

  /**
   * Detiene la rotación de banners al destruir el componente.
   */
  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }

  /**
   * Maneja la acción del botón principal según si el usuario está autenticado.
   * Redirige a perfil o login.
   */
  handleMainAction(): void {
    if (this.authState.isAuthenticated()) {
      this.router.navigate(['/perfil/info']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  /**
   * Devuelve los estilos dinámicos de un banner para lograr efecto de apilamiento.
   * Incluye posición, escala, opacidad y transición suave.
   * @param index Índice del banner en la lista
   * @returns Objeto de estilos CSS aplicable al banner
   */
  getBannerStyle(index: number): any {
    const order = this.currentOrder.indexOf(index);
    const total = this.banners.length;

    if (order === -1) return { opacity: 0, position: 'absolute' };

    const offsetStep = 20;   // separación vertical/horizontal entre capas
    const scaleStep = 0.03;  // diferencia de tamaño entre capas
    const opacityStep = 0.2; // diferencia de opacidad entre capas

    const depth = total - 1 - order;

    return {
      top: `${-depth * offsetStep}px`,
      right: `${-depth * offsetStep}px`,
      transform: `scale(${1 - depth * scaleStep})`,
      zIndex: 10 + (total - depth) * 10,
      opacity: 1 - depth * opacityStep,
      width: '100%',
      height: '100%',
      position: 'absolute',
      transition:
        'top 0.4s ease, right 0.4s ease, transform 0.4s ease, opacity 0.4s ease',
      transformOrigin: 'center center'
    };
  }

}

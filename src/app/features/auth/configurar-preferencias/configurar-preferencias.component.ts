import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { GenreService, GeneroDTO } from '../../shared/services/genre.service';
import { RecomendacionesService } from '../../../core/services/recomendaciones.service';
import { AuthService } from '../../../core/services/auth.service';
import { AuthStateService } from '../../../core/services/auth-state.service';

/**
 * Componente para la configuración inicial de preferencias musicales.
 * Permite seleccionar géneros musicales favoritos o omitir el paso.
 * Se utiliza durante el flujo de onboarding o para reconfiguración de preferencias.
 */
@Component({
  selector: 'app-configurar-preferencias',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './configurar-preferencias.component.html',
  styleUrls: ['./configurar-preferencias.component.scss']
})
export class ConfigurarPreferenciasComponent implements OnInit {
  private genreService = inject(GenreService);
  private recomendacionesService = inject(RecomendacionesService);
  private authService = inject(AuthService);
  private authState = inject(AuthStateService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  /** Lista de todos los géneros disponibles */
  generos = signal<GeneroDTO[]>([]);

  /** IDs de los géneros seleccionados por el usuario */
  generosSeleccionados = signal<number[]>([]);

  /** Indica si los géneros están cargándose */
  generosLoading = signal<boolean>(true);

  /** Indica si se está procesando alguna acción (guardar preferencias, omitir paso) */
  isLoading = signal<boolean>(false);

  /** Mensaje de error para la UI */
  errorMessage = signal<string | null>(null);

  /** Indica si se trata de una reconfiguración de preferencias */
  esReconfiguracion = signal<boolean>(false);

  /** Ruta a la que se redirige después de guardar preferencias */
  rutaRetorno = signal<string>('/');

  /** Usuario actualmente autenticado */
  usuarioActual = this.authState.currentUser;

  /**
   * Inicializa el componente, valida autenticación y carga géneros y preferencias si es necesario
   */
  ngOnInit(): void {
    if (!this.usuarioActual()) {
      this.router.navigate(['/login']);
      return;
    }

    this.route.queryParams.subscribe(params => {
      this.esReconfiguracion.set(params['reconfig'] === 'true');

      const from = params['from'];
      if (from === 'para-ti') {
        this.rutaRetorno.set('/para-ti');
      } else if (from === 'perfil') {
        this.rutaRetorno.set('perfil/info');
      } else {
        this.rutaRetorno.set('/');
      }
    });

    if (!this.esReconfiguracion() && this.usuarioActual()?.onboardingCompletado) {
      this.navigateToHome();
      return;
    }

    this.cargarGeneros();

    if (this.esReconfiguracion()) {
      this.cargarPreferenciasExistentes();
    }
  }

  /**
   * Carga los géneros musicales desde el servicio
   */
  private cargarGeneros(): void {
    this.generosLoading.set(true);
    this.genreService.obtenerTodosLosGeneros().subscribe({
      next: (generos) => {
        this.generos.set(generos);
        this.generosLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set('No se pudieron cargar los géneros. Intenta de nuevo más tarde.');
        this.generosLoading.set(false);
      }
    });
  }

  /**
   * Carga las preferencias existentes del usuario para reconfiguración
   */
  private cargarPreferenciasExistentes(): void {
    const usuario = this.usuarioActual();
    if (!usuario) return;

    this.recomendacionesService.obtenerPreferencias(usuario.idUsuario).subscribe({
      next: (preferencias) => {
        const idsSeleccionados = preferencias
          .map(pref => pref.idGenero)
          .filter(id => id != null && !isNaN(id));

        this.generosSeleccionados.set(idsSeleccionados);
      },
      error: () => {
        // No bloquea la UI si hay error al cargar preferencias
      }
    });
  }

  /**
   * Alterna la selección de un género
   * @param idGenero ID del género a seleccionar/deseleccionar
   */
  toggleGenero(idGenero: number | null | undefined): void {
    if (idGenero == null || isNaN(idGenero)) return;

    const actuales = this.generosSeleccionados();
    if (actuales.includes(idGenero)) {
      this.generosSeleccionados.set(actuales.filter(id => id !== idGenero));
    } else {
      this.generosSeleccionados.set([...actuales, idGenero]);
    }
  }

  /**
   * Verifica si un género está seleccionado
   * @param idGenero ID del género
   * @returns true si el género está seleccionado
   */
  isGeneroSelected(idGenero: number | null | undefined): boolean {
    if (idGenero == null) return false;
    return this.generosSeleccionados().includes(idGenero);
  }

  /**
   * Guarda las preferencias seleccionadas y procesa onboarding
   */
  guardarPreferencias(): void {
    const usuario = this.usuarioActual();
    const generos = this.generosSeleccionados();

    if (!usuario) {
      this.router.navigate(['/login']);
      return;
    }

    const generosInvalidos = generos.filter(id => id == null || isNaN(id) || !Number.isInteger(id));
    if (generosInvalidos.length > 0) {
      this.errorMessage.set(
        `Error: Se detectaron ${generosInvalidos.length} preferencias inválidas. ` +
        `Por favor, recarga la página e intenta de nuevo.`
      );
      return;
    }

    if (generos.length === 0) {
      this.errorMessage.set('Selecciona al menos un género musical');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.recomendacionesService.agregarPreferencias(usuario.idUsuario, generos).subscribe({
      next: () => {
        if (this.esReconfiguracion()) {
          this.isLoading.set(false);
          this.router.navigate([this.rutaRetorno()]);
        } else {
          this.marcarOnboardingYRedireccionar(usuario);
        }
      },
      error: () => {
        this.errorMessage.set('Error al guardar preferencias. Intenta de nuevo.');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Omite la selección de preferencias musicales
   */
  omitirPaso(): void {
    const usuario = this.usuarioActual();
    if (!usuario) {
      this.router.navigate(['/']);
      return;
    }

    if (this.esReconfiguracion()) {
      this.router.navigate([this.rutaRetorno()]);
      return;
    }

    this.isLoading.set(true);
    this.marcarOnboardingYRedireccionar(usuario);
  }

  /**
   * Marca el onboarding como completado y redirige al usuario
   * @param usuario Usuario autenticado
   */
  private marcarOnboardingYRedireccionar(usuario: any): void {
    this.authService.marcarOnboardingCompletado(usuario.idUsuario).subscribe({
      next: () => {
        setTimeout(() => {
          this.navigateToHome();
        }, 500);
      },
      error: () => {
        this.navigateToHome();
      }
    });
  }

  /**
   * Redirige al usuario a la página principal
   */
  private navigateToHome(): void {
    this.router.navigate(['/']);
  }

  /**
   * Reintenta la carga de géneros en caso de error previo
   */
  reintentar(): void {
    this.errorMessage.set(null);
    this.cargarGeneros();
  }

  /**
   * Obtiene la cantidad de géneros seleccionados
   */
  get generosSeleccionadosCount(): number {
    return this.generosSeleccionados().length;
  }
}

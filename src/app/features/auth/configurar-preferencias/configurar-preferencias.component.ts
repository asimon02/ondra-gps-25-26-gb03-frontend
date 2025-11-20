import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GenreService, GeneroDTO } from '../../shared/services/genre.service';
import { RecomendacionesService } from '../../../core/services/recomendaciones.service';
import { AuthService } from '../../../core/services/auth.service';
import { AuthStateService } from '../../../core/services/auth-state.service'; // ✨ AGREGAR

/**
 * Componente de configuración inicial de preferencias musicales.
 *
 * Se muestra una vez después del registro/primer login.
 * Permite al usuario seleccionar sus géneros favoritos o omitir el paso.
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
  private authState = inject(AuthStateService); // ✨ AGREGAR
  private router = inject(Router);

  // Estado del componente
  generos = signal<GeneroDTO[]>([]);
  generosSeleccionados = signal<number[]>([]);
  generosLoading = signal<boolean>(true);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  // ✨ CAMBIO: Usuario actual viene de AuthStateService
  usuarioActual = this.authState.currentUser;

  ngOnInit(): void {
    // Verificar que el usuario esté autenticado
    if (!this.usuarioActual()) {
      console.warn('⚠️ No hay usuario autenticado, redirigiendo a login');
      this.router.navigate(['/login']);
      return;
    }

    // Verificar si ya completó el onboarding (por si accede directamente a la URL)
    if (this.usuarioActual()?.onboardingCompletado) {
      console.log('ℹ️ Usuario ya completó onboarding, redirigiendo');
      this.navigateToHome();
      return;
    }

    this.cargarGeneros();
  }

  /**
   * Carga los géneros musicales desde el backend
   */
  private cargarGeneros(): void {
    console.log('📥 Cargando géneros musicales...');
    this.generosLoading.set(true);

    this.genreService.obtenerTodosLosGeneros().subscribe({
      next: (generos) => {
        this.generos.set(generos);
        this.generosLoading.set(false);
        console.log(`✅ ${generos.length} géneros cargados correctamente`);
      },
      error: (err) => {
        console.error('❌ Error al cargar géneros:', err);
        this.errorMessage.set('No se pudieron cargar los géneros. Intenta de nuevo más tarde.');
        this.generosLoading.set(false);
      }
    });
  }

  /**
   * Alterna la selección de un género
   */
  toggleGenero(idGenero: number): void {
    const actuales = this.generosSeleccionados();

    if (actuales.includes(idGenero)) {
      // Deseleccionar
      this.generosSeleccionados.set(actuales.filter(id => id !== idGenero));
    } else {
      // Seleccionar
      this.generosSeleccionados.set([...actuales, idGenero]);
    }
  }

  /**
   * Verifica si un género está seleccionado
   */
  isGeneroSelected(idGenero: number): boolean {
    return this.generosSeleccionados().includes(idGenero);
  }

  /**
   * Guarda las preferencias seleccionadas y marca onboarding como completado
   */
  guardarPreferencias(): void {
    const usuario = this.usuarioActual();
    const generos = this.generosSeleccionados();

    if (!usuario) {
      this.router.navigate(['/login']);
      return;
    }

    if (generos.length === 0) {
      this.errorMessage.set('⚠️ Selecciona al menos un género musical');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    console.log(`📤 Guardando ${generos.length} preferencias para usuario ${usuario.idUsuario}`);

    // Primero guardar las preferencias
    this.recomendacionesService.agregarPreferencias(
      usuario.idUsuario,
      generos
    ).subscribe({
      next: () => {
        console.log('✅ Preferencias guardadas exitosamente');

        // Luego marcar onboarding como completado
        this.marcarOnboardingYRedireccionar(usuario);
      },
      error: (err) => {
        console.error('❌ Error al guardar preferencias:', err);
        this.errorMessage.set('Error al guardar preferencias. Intenta de nuevo.');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Omite el paso de configuración de preferencias
   * Marca el onboarding como completado sin guardar preferencias
   */
  omitirPaso(): void {
    const usuario = this.usuarioActual();

    if (!usuario) {
      this.router.navigate(['/']);
      return;
    }

    console.log('⏭️ Usuario omitió configuración de preferencias');
    this.isLoading.set(true);

    // Marcar onboarding como completado sin guardar preferencias
    this.marcarOnboardingYRedireccionar(usuario);
  }

  /**
   * Marca el onboarding como completado y redirige al usuario
   */
  private marcarOnboardingYRedireccionar(usuario: any): void {
    this.authService.marcarOnboardingCompletado(usuario.idUsuario).subscribe({
      next: () => {
        console.log('✅ Onboarding marcado como completado');

        // El usuario ya se actualizó en el AuthStateService
        // Pequeño delay para mejor UX
        setTimeout(() => {
          this.navigateToHome();
        }, 500);
      },
      error: (err) => {
        console.error('❌ Error al marcar onboarding:', err);
        // Redireccionar de todas formas para no bloquear al usuario
        this.navigateToHome();
      }
    });
  }

  /**
   * Redirige al usuario a su página de inicio según su tipo
   */
  private navigateToHome(): void {
    const usuario = this.usuarioActual();

    this.router.navigate(['/']);
  }

  /**
   * Reintentar cargar géneros si hubo un error
   */
  reintentar(): void {
    this.errorMessage.set(null);
    this.cargarGeneros();
  }

  /**
   * Obtiene el contador de géneros seleccionados
   */
  get generosSeleccionadosCount(): number {
    return this.generosSeleccionados().length;
  }
}

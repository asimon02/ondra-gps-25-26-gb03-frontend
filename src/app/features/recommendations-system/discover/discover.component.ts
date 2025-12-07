import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DiscoverContentGridComponent } from '../components/discover-content-grid/discover-content-grid.component';
import { GenrePreferencesModalComponent } from '../components/genre-preferences-modal/genre-preferences-modal.component';
import { 
  RecomendacionesService, 
  TipoRecomendacion, 
  RecomendacionesResponse,
  PreferenciaGeneroDTO 
} from '../../../core/services/recomendaciones.service';
import { AuthStateService } from '../../../core/services/auth-state.service';

type CategoriaRecomendacion = 'todas' | 'canciones' | 'albumes';

@Component({
  selector: 'app-discover',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DiscoverContentGridComponent,
    GenrePreferencesModalComponent
  ],
  templateUrl: './discover.component.html',
  styleUrls: ['./discover.component.scss']
})
export class DiscoverComponent implements OnInit {
  private recomendacionesService = inject(RecomendacionesService);
  private authStateService = inject(AuthStateService);
  private router = inject(Router);

  // Estado de datos
  recomendaciones: RecomendacionesResponse | null = null;
  preferencias: PreferenciaGeneroDTO[] = [];
  
  // Estados de carga
  isLoading = false;
  isLoadingPreferencias = false;
  errorMessage = '';

  // Filtros
  categoriaSeleccionada: CategoriaRecomendacion = 'todas';
  limiteRecomendaciones = 20;

  // Modal
  mostrarModalPreferencias = false;

  // Opciones de límite
  opcionesLimite = [10, 20, 30, 50];

  ngOnInit() {
    const usuarioActual = this.authStateService.currentUser();
    
    if (!usuarioActual?.idUsuario) {
      console.log('Usuario no autenticado, redirigiendo a login');
      this.router.navigate(['/login']);
      return;
    }

    console.log('Usuario autenticado:', usuarioActual.idUsuario);
    this.verificarPreferenciasYCargarRecomendaciones();
  }

  /**
   * Verifica si el usuario tiene preferencias y carga recomendaciones
   */
  private verificarPreferenciasYCargarRecomendaciones() {
    const usuarioActual = this.authStateService.currentUser();
    
    if (!usuarioActual?.idUsuario) {
      this.router.navigate(['/login']);
      return;
    }

    this.isLoadingPreferencias = true;
    console.log('🔍 Verificando preferencias del usuario:', usuarioActual.idUsuario);

    // Cargar preferencias
    this.recomendacionesService.obtenerPreferencias(usuarioActual.idUsuario)
      .subscribe({
        next: (preferencias) => {
          console.log('Preferencias cargadas:', preferencias);
          this.preferencias = preferencias;
          this.isLoadingPreferencias = false;

          if (preferencias.length === 0) {
            console.log('Usuario sin preferencias - Mostrando modal');
            // No tiene preferencias - mostrar modal
            this.mostrarModalPreferencias = true;
          } else {
            console.log('Usuario tiene preferencias - Cargando recomendaciones');
            // Tiene preferencias - cargar recomendaciones
            this.cargarRecomendaciones();
          }
        },
        error: (error) => {
          console.error('Error al cargar preferencias:', error);
          this.isLoadingPreferencias = false;
          this.errorMessage = 'Error al cargar tus preferencias';
          // Mostrar modal en caso de error también
          this.mostrarModalPreferencias = true;
        }
      });
  }

  /**
   * Carga las recomendaciones según los filtros actuales
   */
  cargarRecomendaciones() {
    const usuarioActual = this.authStateService.currentUser();
    if (!usuarioActual?.idUsuario) {
      console.log('No hay usuario autenticado');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Determinar el tipo de recomendación
    let tipo: TipoRecomendacion;
    switch (this.categoriaSeleccionada) {
      case 'canciones':
        tipo = TipoRecomendacion.CANCION;
        break;
      case 'albumes':
        tipo = TipoRecomendacion.ALBUM;
        break;
      default:
        tipo = TipoRecomendacion.AMBOS;
    }

    console.log(`Cargando recomendaciones: tipo=${tipo}, limite=${this.limiteRecomendaciones}`);

    this.recomendacionesService.obtenerRecomendaciones(
      usuarioActual.idUsuario,
      tipo,
      this.limiteRecomendaciones
    ).subscribe({
      next: (recomendaciones) => {
        console.log('Recomendaciones cargadas:', recomendaciones);
        this.recomendaciones = recomendaciones;
        this.isLoading = false;

        if (recomendaciones.total_recomendaciones === 0) {
          this.errorMessage = 'No hay recomendaciones disponibles en este momento';
          console.log('No hay recomendaciones disponibles');
        }
      },
      error: (error) => {
        console.error('Error al cargar recomendaciones:', error);
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Error al cargar las recomendaciones';
      }
    });
  }

  /**
   * Cambia la categoría de recomendaciones
   */
  cambiarCategoria(categoria: CategoriaRecomendacion) {
    console.log('Cambiando categoría a:', categoria);
    this.categoriaSeleccionada = categoria;
    this.cargarRecomendaciones();
  }

  /**
   * Cambia el límite de recomendaciones
   */
  cambiarLimite(limite: number) {
    console.log('Cambiando límite a:', limite);
    this.limiteRecomendaciones = limite;
    this.cargarRecomendaciones();
  }

  /**
   * Abre el modal de preferencias
   */
  abrirModalPreferencias() {
    console.log('Abriendo modal de preferencias');
    this.mostrarModalPreferencias = true;
  }

  /**
   * Maneja el cierre del modal de preferencias
   */
  onModalPreferenciasClosed(guardado: boolean) {
    console.log('Modal cerrado. Guardado:', guardado);
    this.mostrarModalPreferencias = false;
    
    if (guardado) {
      console.log('Preferencias guardadas - Recargando datos');
      // Recargar preferencias y recomendaciones
      this.verificarPreferenciasYCargarRecomendaciones();
    } else if (this.preferencias.length === 0) {
      console.log('Modal cerrado sin guardar y sin preferencias - Volviendo al home');
      // Si no guardó y no tiene preferencias, volver atrás
      this.router.navigate(['/']);
    }
  }

  /**
   * Maneja el evento de preferencias guardadas
   */
  onPreferenciasGuardadas() {
    console.log('Evento: Preferencias guardadas - Recargando recomendaciones...');
  }

  /**
   * Recarga las recomendaciones manualmente
   */
  recargarRecomendaciones() {
    console.log('Recargando recomendaciones manualmente');
    this.cargarRecomendaciones();
  }

  /**
   * Obtiene el conteo según la categoría seleccionada
   */
  get conteoActual(): number {
    if (!this.recomendaciones) return 0;

    switch (this.categoriaSeleccionada) {
      case 'canciones':
        return this.recomendaciones.canciones.length;
      case 'albumes':
        return this.recomendaciones.albumes.length;
      default:
        return this.recomendaciones.total_recomendaciones;
    }
  }

  /**
   * Obtiene el texto del género más escuchado
   */
  get generoFavorito(): string {
    if (this.preferencias.length === 0) return 'ninguno';
    return this.preferencias[0].nombre_genero;
  }
}
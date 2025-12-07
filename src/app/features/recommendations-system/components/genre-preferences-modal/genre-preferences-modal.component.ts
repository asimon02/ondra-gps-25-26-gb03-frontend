import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecomendacionesService } from '../../../../core/services/recomendaciones.service';
import { AuthStateService } from '../../../../core/services/auth-state.service';
import { GENEROS_MUSICALES, convertirGenerosAIds } from '../../../../core/models/generos.model';

interface GeneroSeleccionable {
  nombre: string;
  seleccionado: boolean;
}

@Component({
  selector: 'app-genre-preferences-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './genre-preferences-modal.component.html',
  styleUrls: ['./genre-preferences-modal.component.scss']
})
export class GenrePreferencesModalComponent implements OnInit {
  private recomendacionesService = inject(RecomendacionesService);
  private authStateService = inject(AuthStateService);

  @Input() isOpen = false;
  @Input() esPrimeraVez = true;
  @Input() minSelecciones = 3;
  @Output() modalClosed = new EventEmitter<boolean>();
  @Output() preferenciasGuardadas = new EventEmitter<void>();

  generos: GeneroSeleccionable[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  
  get generosSeleccionados(): GeneroSeleccionable[] {
    return this.generos.filter(g => g.seleccionado);
  }

  get cantidadSeleccionada(): number {
    return this.generosSeleccionados.length;
  }

  get puedeGuardar(): boolean {
    return this.cantidadSeleccionada >= this.minSelecciones;
  }

  ngOnInit() {
    this.inicializarGeneros();
    if (!this.esPrimeraVez) {
      this.cargarPreferenciasExistentes();
    }
  }

  // Inicializa la lista de géneros disponibles
  private inicializarGeneros() {
    this.generos = GENEROS_MUSICALES.map(nombre => ({
      nombre,
      seleccionado: false
    }));
  }

  // Carga las preferencias existentes del usuario (si no es primera vez)
  private cargarPreferenciasExistentes() {
    const usuarioActual = this.authStateService.currentUser();
    if (!usuarioActual?.idUsuario) return;

    this.isLoading = true;
    this.recomendacionesService.obtenerPreferencias(usuarioActual.idUsuario)
      .subscribe({
        next: (preferencias) => {
          preferencias.forEach(pref => {
            const genero = this.generos.find(g => g.nombre === pref.nombre_genero);
            if (genero) {
              genero.seleccionado = true;
            }
          });
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error al cargar preferencias:', error);
          this.isLoading = false;
        }
      });
  }

  // Toggle de selección de género
  toggleGenero(genero: GeneroSeleccionable) {
    genero.seleccionado = !genero.seleccionado;
    this.errorMessage = '';
    this.successMessage = '';
  }

  // Seleccionar todos los géneros
  seleccionarTodos() {
    this.generos.forEach(g => g.seleccionado = true);
  }

  // Deseleccionar todos los géneros
  deseleccionarTodos() {
    this.generos.forEach(g => g.seleccionado = false);
  }

  // Guarda las preferencias seleccionadas
  guardarPreferencias() {
    if (!this.puedeGuardar) {
      this.errorMessage = `Debes seleccionar al menos ${this.minSelecciones} géneros musicales`;
      return;
    }

    const usuarioActual = this.authStateService.currentUser();
    if (!usuarioActual?.idUsuario) {
      this.errorMessage = 'No se pudo identificar al usuario';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Convertir nombres de géneros a IDs
    const nombresSeleccionados = this.generosSeleccionados.map(g => g.nombre);
    const idsGeneros = convertirGenerosAIds(nombresSeleccionados);

    this.recomendacionesService.agregarPreferencias(usuarioActual.idUsuario, idsGeneros)
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.successMessage = response.mensaje || '¡Preferencias guardadas exitosamente!';
          
          // Emitir evento de preferencias guardadas
          this.preferenciasGuardadas.emit();

          // Cerrar modal después de 1.5 segundos
          setTimeout(() => {
            this.cerrarModal(true);
          }, 1500);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Error al guardar preferencias';
          console.error('Error al guardar preferencias:', error);
        }
      });
  }

  // Cierra el modal
  cerrarModal(guardado = false) {
    this.isOpen = false;
    this.modalClosed.emit(guardado);
  }

  // Maneja el click en el backdrop
  onBackdropClick() {
    this.cerrarModal(false);
  }

  // Previene que el click en el contenido cierre el modal
  onContentClick(event: Event) {
    event.stopPropagation();
  }
}
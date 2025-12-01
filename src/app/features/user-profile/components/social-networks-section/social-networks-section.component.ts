import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RedSocialService } from '../../services/red-social.service';
import {
  RedSocial,
  RedSocialCrear,
  RedSocialEditar,
  TIPOS_REDES_SOCIALES,
  TipoRedSocialInfo
} from '../../models/red-social.model';

@Component({
  selector: 'app-social-networks-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './social-networks-section.component.html',
  styleUrls: ['./social-networks-section.component.scss']
})
export class SocialNetworksSectionComponent implements OnInit {
  /**
   * ID del artista cuyas redes sociales se gestionan.
   */
  @Input() artistaId!: number;

  /**
   * Lista de redes sociales actuales del artista.
   */
  redesSociales: RedSocial[] = [];

  /**
   * Indica si los datos están cargando.
   */
  isLoading = false;

  /**
   * Estado de visibilidad del modal de creación.
   */
  showAddModal = false;

  /**
   * Estado de visibilidad del modal de edición.
   */
  showEditModal = false;

  /**
   * Estado de visibilidad del modal de eliminación.
   */
  showDeleteModal = false;

  /**
   * Mensaje de error mostrado al usuario.
   */
  errorMessage = '';

  /**
   * Modelo interno para creación de nueva red social.
   */
  nuevaRed: RedSocialCrear = {
    tipoRedSocial: 'INSTAGRAM',
    urlRedSocial: ''
  };

  /**
   * Red social actualmente en edición.
   */
  redEnEdicion: RedSocial | null = null;

  /**
   * Datos modificados para actualizar una red social.
   */
  datosEdicion: RedSocialEditar = {};

  /**
   * Red social seleccionada para eliminación.
   */
  redAEliminar: RedSocial | null = null;

  /**
   * Diccionario con tipos permitidos de redes sociales.
   */
  tiposDisponibles = TIPOS_REDES_SOCIALES;

  constructor(private redSocialService: RedSocialService) {}

  /**
   * Carga inicial de redes sociales del artista.
   */
  ngOnInit(): void {
    this.cargarRedesSociales();
  }

  /**
   * Obtiene todas las redes sociales vinculadas al artista.
   */
  cargarRedesSociales(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.redSocialService.listarRedesSociales(this.artistaId).subscribe({
      next: (redes) => {
        this.redesSociales = redes;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.message;
        this.isLoading = false;
      }
    });
  }

  /** ------ MODAL CREAR ------ **/

  /**
   * Abre el modal para agregar una nueva red social.
   */
  openAddModal(): void {
    this.nuevaRed = {
      tipoRedSocial: 'INSTAGRAM',
      urlRedSocial: ''
    };
    this.errorMessage = '';
    this.showAddModal = true;
  }

  /**
   * Cierra el modal de creación.
   */
  closeAddModal(): void {
    this.showAddModal = false;
    this.errorMessage = '';
  }

  /**
   * Envía la solicitud para crear una nueva red social.
   */
  crearRedSocial(): void {
    this.errorMessage = '';

    this.redSocialService.crearRedSocial(this.artistaId, this.nuevaRed).subscribe({
      next: (redCreada) => {
        this.redesSociales.push(redCreada);
        this.closeAddModal();
      },
      error: (error) => {
        this.errorMessage = error.message;
      }
    });
  }

  /** ------ MODAL EDITAR ------ **/

  /**
   * Abre el modal para editar una red social.
   * @param red Red social a editar.
   */
  openEditModal(red: RedSocial): void {
    this.redEnEdicion = { ...red };
    this.datosEdicion = {
      tipoRedSocial: red.tipoRedSocial,
      urlRedSocial: red.urlRedSocial
    };
    this.errorMessage = '';
    this.showEditModal = true;
  }

  /**
   * Cierra el modal de edición.
   */
  closeEditModal(): void {
    this.showEditModal = false;
    this.redEnEdicion = null;
    this.datosEdicion = {};
    this.errorMessage = '';
  }

  /**
   * Envía la actualización de la red social seleccionada.
   */
  editarRedSocial(): void {
    if (!this.redEnEdicion) return;

    this.errorMessage = '';

    this.redSocialService.editarRedSocial(
      this.artistaId,
      this.redEnEdicion.idRedSocial,
      this.datosEdicion
    ).subscribe({
      next: (redActualizada) => {
        const index = this.redesSociales.findIndex(
          r => r.idRedSocial === redActualizada.idRedSocial
        );

        if (index !== -1) {
          this.redesSociales[index] = redActualizada;
        }

        this.closeEditModal();
      },
      error: (error) => {
        this.errorMessage = error.message;
      }
    });
  }

  /** ------ MODAL ELIMINAR ------ **/

  /**
   * Abre el modal de eliminación.
   * @param red Red social seleccionada para eliminar.
   */
  openDeleteModal(red: RedSocial): void {
    this.redAEliminar = red;
    this.errorMessage = '';
    this.showDeleteModal = true;
  }

  /**
   * Cierra el modal de eliminación.
   */
  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.redAEliminar = null;
    this.errorMessage = '';
  }

  /**
   * Confirma la eliminación de la red social seleccionada.
   */
  confirmarEliminacion(): void {
    if (!this.redAEliminar) return;

    this.errorMessage = '';

    this.redSocialService.eliminarRedSocial(
      this.artistaId,
      this.redAEliminar.idRedSocial
    ).subscribe({
      next: () => {
        this.redesSociales = this.redesSociales.filter(
          r => r.idRedSocial !== this.redAEliminar!.idRedSocial
        );
        this.closeDeleteModal();
      },
      error: (error) => {
        this.errorMessage = error.message;
      }
    });
  }

  /** ------ UTILIDADES ------ **/

  /**
   * Devuelve la información de un tipo de red social.
   * @param tipo Tipo de red social.
   */
  getTipoInfo(tipo: string): TipoRedSocialInfo {
    const info = this.tiposDisponibles.find(
      t => t.value === tipo.toUpperCase()
    );

    return info || {
      value: tipo,
      label: tipo,
      icon: 'globe',
      color: 'gray'
    };
  }

  /**
   * Devuelve la clase de icono para el tipo de red social.
   * @param tipo Tipo de red social.
   */
  getIconClass(tipo: string): string {
    const info = this.getTipoInfo(tipo);

    const colorMap: Record<string, string> = {
      pink: 'text-pink-600',
      black: 'text-gray-900',
      blue: 'text-blue-600',
      red: 'text-red-600',
      green: 'text-green-600',
      orange: 'text-orange-600',
      gray: 'text-gray-600'
    };

    return colorMap[info.color] || 'text-gray-600';
  }
}

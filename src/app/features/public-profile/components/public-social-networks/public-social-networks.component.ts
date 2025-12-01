import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  RedSocial,
  TIPOS_REDES_SOCIALES,
  TipoRedSocialInfo
} from '../../../user-profile/models/red-social.model';
import { RedSocialService } from '../../../user-profile/services/red-social.service';

/**
 * Componente que muestra las redes sociales públicas de un artista.
 * Permite visualizar iconos, colores y enlaces a cada red social.
 */
@Component({
  selector: 'app-public-social-networks',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './public-social-networks.component.html',
  styleUrls: ['./public-social-networks.component.scss']
})
export class PublicSocialNetworksComponent implements OnInit {
  /** ID del artista cuyas redes sociales se mostrarán */
  @Input() artistaId!: number;

  /** Lista de redes sociales obtenidas del backend */
  redesSociales: RedSocial[] = [];

  /** Indicador de carga de datos */
  isLoading = false;

  /** Mensaje de error en caso de fallo */
  errorMessage = '';

  /** Tipos de redes sociales disponibles (para iconos y labels) */
  tiposDisponibles = TIPOS_REDES_SOCIALES;

  constructor(private redSocialService: RedSocialService) {}

  /**
   * Ciclo de vida OnInit: valida artistaId y carga redes sociales
   */
  ngOnInit(): void {
    if (!this.artistaId) {
      this.errorMessage = 'No se pudo cargar las redes sociales del artista';
      return;
    }
    this.cargarRedesSociales();
  }

  /**
   * Carga las redes sociales del artista desde el backend
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
        console.error('Error al cargar redes sociales del artista:', error);
        this.errorMessage = error.message || 'No se pudieron cargar las redes sociales';
        this.isLoading = false;
      }
    });
  }

  /**
   * Obtiene la información de un tipo de red social
   * (icono, label y color) según TIPOS_REDES_SOCIALES
   * @param tipo Tipo de red social (ej. "INSTAGRAM", "TWITTER")
   * @returns Información del tipo de red social
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
   * Obtiene la clase CSS de color correspondiente al tipo de red social
   * @param tipo Tipo de red social
   * @returns Clase CSS de color (Tailwind)
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

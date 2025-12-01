import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ArtistaDTO } from '../../../../shared/models/artista.model';
import { AuthStateService } from '../../../../core/services/auth-state.service';

/**
 * Componente que muestra una lista de artistas en tendencia.
 * Permite navegar a perfiles de artistas y mostrar información básica.
 */
@Component({
  selector: 'app-trending-artists',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trending-artists.component.html',
  styleUrl: './trending-artists.component.scss'
})
export class TrendingArtistsComponent {

  /** Lista de artistas a mostrar */
  @Input() artistas: ArtistaDTO[] = [];

  /** Indicador de carga de datos */
  @Input() isLoading: boolean = false;

  /** Mensaje de error, si aplica */
  @Input() error: string | null = null;

  private router = inject(Router);
  private authState = inject(AuthStateService);

  /**
   * Devuelve la URL de la foto del artista o una imagen por defecto basada en su nombre artístico.
   * @param artista Objeto artista
   * @returns URL de la imagen del artista
   */
  getFotoArtista(artista: ArtistaDTO): string {
    return artista.fotoPerfilArtistico ||
      'https://ui-avatars.com/api/?name=' +
      encodeURIComponent(artista.nombreArtistico) +
      '&background=2563EB&color=fff&size=400';
  }

  /**
   * Obtiene el enlace de una red social específica para un artista.
   * @param artista Artista del cual obtener la red social
   * @param tipo Tipo de red social (ej: 'instagram', 'twitter')
   * @returns URL de la red social o null si no existe
   */
  getRedSocial(artista: ArtistaDTO, tipo: string): string | null {
    const red = artista.redesSociales.find(
      r => r.tipoRedSocial.toLowerCase() === tipo.toLowerCase()
    );
    return red?.urlRedSocial || null;
  }

  /**
   * Navega al perfil del artista.
   * - Si el artista corresponde al usuario actual, redirige a `/perfil/info`.
   * - Si es otro artista, redirige al perfil público usando `slugArtistico`.
   * @param artista Artista a visualizar
   */
  navegarAPerfilArtista(artista: ArtistaDTO): void {
    const currentUser = this.authState.currentUser();

    if (currentUser && currentUser.idUsuario === artista.idUsuario) {
      this.router.navigate(['/perfil/info']);
      return;
    }

    if (artista.slugArtistico) {
      this.router.navigate(['/artista', artista.slugArtistico]);
    } else {
      console.error('Artista sin slugArtistico:', artista);
    }
  }
}

import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ArtistaDTO } from '../../../../shared/models/artista.model';
import { AuthStateService } from '../../../../core/services/auth-state.service';

@Component({
  selector: 'app-trending-artists',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trending-artists.component.html',
  styleUrl: './trending-artists.component.scss'
})
export class TrendingArtistsComponent {
  @Input() artistas: ArtistaDTO[] = [];
  @Input() isLoading: boolean = false;
  @Input() error: string | null = null;

  private router = inject(Router);
  private authState = inject(AuthStateService);

  /**
   * Obtiene la URL de la foto del artista o una imagen por defecto
   */
  getFotoArtista(artista: ArtistaDTO): string {
    return artista.fotoPerfilArtistico || 'https://ui-avatars.com/api/?name=' +
      encodeURIComponent(artista.nombreArtistico) + '&background=2563EB&color=fff&size=400';
  }

  /**
   * Obtiene el enlace de una red social específica
   */
  getRedSocial(artista: ArtistaDTO, tipo: string): string | null {
    const red = artista.redesSociales.find(r => r.tipoRedSocial.toLowerCase() === tipo.toLowerCase());
    return red?.urlRedSocial || null;
  }

  /**
   * Navega al perfil del artista (propio o público)
   */
  navegarAPerfilArtista(artista: ArtistaDTO): void {
    const currentUser = this.authState.currentUser();

    // Si es el propio perfil, ir a /perfil
    if (currentUser && currentUser.idUsuario === artista.idUsuario) {
      this.router.navigate(['/perfil/info']);
      return;
    }

    // Si no, ir al perfil público usando el slug artístico
    if (artista.slugArtistico) {
      this.router.navigate(['/artista', artista.slugArtistico]);
    } else {
      console.error('❌ Artista sin slugArtistico:', artista);
    }
  }
}

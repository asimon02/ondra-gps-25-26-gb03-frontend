import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UsuarioPublico } from '../models/usuario-publico.model';
import { environment } from '../../../../enviroments/enviroment';

/**
 * Servicio para obtener perfiles públicos de usuarios y artistas
 * desde el microservicio de Usuarios.
 */
@Injectable({
  providedIn: 'root'
})
export class PublicProfileService {
  private readonly apiUrl = `${environment.apis.usuarios}/public`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene el perfil público de un usuario por su slug.
   * @param slug Slug único del usuario
   * @returns Observable con los datos públicos del usuario
   */
  obtenerPerfilUsuario(slug: string): Observable<UsuarioPublico> {
    return this.http
      .get<UsuarioPublico>(`${this.apiUrl}/usuarios/${slug}`)
      .pipe(map(perfil => this.normalizarFoto(perfil)));
  }

  /**
   * Obtiene el perfil público de un artista por su slug artístico.
   * @param slugArtistico Slug único del artista
   * @returns Observable con los datos públicos del artista
   */
  obtenerPerfilArtista(slugArtistico: string): Observable<UsuarioPublico> {
    return this.http
      .get<UsuarioPublico>(`${this.apiUrl}/artistas/${slugArtistico}`)
      .pipe(map(perfil => this.normalizarFoto(perfil)));
  }

  /**
   * Normaliza la propiedad de foto para soportar nombres alternativos
   * (p.ej. fotoPerfilArtista) y asegura que la UI reciba la URL correcta.
   */
  private normalizarFoto(perfil: UsuarioPublico): UsuarioPublico {
    const fotoArtista =
      (perfil as any).fotoPerfilArtistico ||
      (perfil as any).fotoPerfilArtista ||
      perfil.fotoPerfil ||
      null;

    const fotoUsuario =
      perfil.fotoPerfil ??
      (perfil as any).fotoPerfilArtistico ??
      (perfil as any).fotoPerfilArtista ??
      null;

    return {
      ...perfil,
      fotoPerfilArtistico: fotoArtista,
      fotoPerfil: fotoUsuario
    };
  }
}

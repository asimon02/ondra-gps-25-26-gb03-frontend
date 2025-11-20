import { Injectable, signal, computed, effect } from '@angular/core';
import { UsuarioDTO, AuthResponseDTO, AUTH_CONSTANTS, TipoUsuario } from '../models/auth.model';

export interface UserInfo {
  idUsuario: number;
  email: string;
  nombre: string;
  apellidos: string;
  tipoUsuario: TipoUsuario;
  fotoPerfil?: string;
  fotoPerfilArtistico?: string;
  idArtista?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthStateService {
  private _currentUser = signal<UsuarioDTO | null>(null);
  private _accessToken = signal<string | null>(null);
  private _refreshToken = signal<string | null>(null);
  private _tokenType = signal<string>(AUTH_CONSTANTS.TOKEN_TYPE);

  public readonly currentUser = this._currentUser.asReadonly();
  public readonly isAuthenticated = computed(() => this._currentUser() !== null);
  public readonly userFullName = computed(() => {
    const user = this._currentUser();
    return user ? `${user.nombreUsuario} ${user.apellidosUsuario}`.trim() : '';
  });
  public readonly userInitials = computed(() => {
    const user = this._currentUser();
    if (!user) return '';
    const nombre = user.nombreUsuario.charAt(0).toUpperCase();
    const apellido = user.apellidosUsuario.charAt(0).toUpperCase();
    return `${nombre}${apellido}`;
  });
  public readonly userPhoto = computed(() => this._currentUser()?.fotoPerfil || null);

  constructor() {
    this.loadFromStorage();

    effect(() => {
      const user = this._currentUser();
      const accessToken = this._accessToken();
      const refreshToken = this._refreshToken();
      const tokenType = this._tokenType();

      if (user && accessToken && refreshToken) {
        localStorage.setItem(AUTH_CONSTANTS.LOCAL_STORAGE_KEYS.USER, JSON.stringify(user));
        localStorage.setItem(AUTH_CONSTANTS.LOCAL_STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        localStorage.setItem(AUTH_CONSTANTS.LOCAL_STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        localStorage.setItem(AUTH_CONSTANTS.LOCAL_STORAGE_KEYS.TOKEN_TYPE, tokenType);
      }
    });
  }

  private loadFromStorage(): void {
    try {
      const user = localStorage.getItem(AUTH_CONSTANTS.LOCAL_STORAGE_KEYS.USER);
      const accessToken = localStorage.getItem(AUTH_CONSTANTS.LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
      const refreshToken = localStorage.getItem(AUTH_CONSTANTS.LOCAL_STORAGE_KEYS.REFRESH_TOKEN);
      const tokenType = localStorage.getItem(AUTH_CONSTANTS.LOCAL_STORAGE_KEYS.TOKEN_TYPE);

      if (user && accessToken && refreshToken) {
        this._currentUser.set(JSON.parse(user));
        this._accessToken.set(accessToken);
        this._refreshToken.set(refreshToken);
        this._tokenType.set(tokenType || AUTH_CONSTANTS.TOKEN_TYPE);
      }
    } catch (error) {
      console.error('Error al cargar datos del localStorage:', error);
      this.clearAuth();
    }
  }

  setAuth(authResponse: AuthResponseDTO): void {
    this._currentUser.set(authResponse.usuario);
    this._accessToken.set(authResponse.token);
    this._refreshToken.set(authResponse.refreshToken);
    this._tokenType.set(authResponse.tipo || AUTH_CONSTANTS.TOKEN_TYPE);
  }

  updateTokens(accessToken: string, refreshToken: string, tipo?: string): void {
    this._accessToken.set(accessToken);
    this._refreshToken.set(refreshToken);
    if (tipo) {
      this._tokenType.set(tipo);
    }

    localStorage.setItem(AUTH_CONSTANTS.LOCAL_STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(AUTH_CONSTANTS.LOCAL_STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    if (tipo) {
      localStorage.setItem(AUTH_CONSTANTS.LOCAL_STORAGE_KEYS.TOKEN_TYPE, tipo);
    }
  }

  getAccessToken(): string | null {
    return this._accessToken();
  }

  getRefreshToken(): string | null {
    return this._refreshToken();
  }

  getTokenType(): string {
    return this._tokenType();
  }

  /**
   * Retorna el token completo con el prefijo "Bearer "
   */
  getFullAuthToken(): string | null {
    const token = this._accessToken();
    const type = this._tokenType();
    return token ? `${type} ${token}` : null;
  }

  /**
   * Obtiene la información del usuario en formato UserInfo
   */
  getUserInfo(): UserInfo | null {
    const user = this._currentUser();
    if (!user) return null;

    return {
      idUsuario: user.idUsuario,
      email: user.emailUsuario,
      nombre: user.nombreUsuario,
      apellidos: user.apellidosUsuario,
      tipoUsuario: user.tipoUsuario,
      fotoPerfil: user.fotoPerfil ?? undefined,
      idArtista: user.idArtista ?? undefined
    };
  }

  /**
   * Actualiza información específica del usuario
   */
  updateUserInfo(updates: Partial<UsuarioDTO>): void {
    const currentUser = this._currentUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates };
      this._currentUser.set(updatedUser);
      localStorage.setItem(AUTH_CONSTANTS.LOCAL_STORAGE_KEYS.USER, JSON.stringify(updatedUser));
    }
  }

  clearAuth(): void {
    this._currentUser.set(null);
    this._accessToken.set(null);
    this._refreshToken.set(null);
    this._tokenType.set(AUTH_CONSTANTS.TOKEN_TYPE);

    localStorage.removeItem(AUTH_CONSTANTS.LOCAL_STORAGE_KEYS.USER);
    localStorage.removeItem(AUTH_CONSTANTS.LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(AUTH_CONSTANTS.LOCAL_STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(AUTH_CONSTANTS.LOCAL_STORAGE_KEYS.TOKEN_TYPE);
  }

  updateUser(user: UsuarioDTO): void {
    this._currentUser.set(user);
    localStorage.setItem(AUTH_CONSTANTS.LOCAL_STORAGE_KEYS.USER, JSON.stringify(user));
  }
}

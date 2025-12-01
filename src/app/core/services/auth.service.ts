import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthStateService } from './auth-state.service';
import { CarritoService } from './carrito.service';
import { MusicPlayerService } from './music-player.service';
import {
  AuthResponseDTO,
  LoginUsuarioDTO,
  RegistroUsuarioDTO,
  LoginGoogleDTO,
  RefreshTokenRequestDTO,
  RefreshTokenResponseDTO,
  RecuperarPasswordDTO,
  RestablecerPasswordDTO,
  ReenviarVerificacionDTO
} from '../models/auth.model';
import { environment } from '../../../enviroments/enviroment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private authState = inject(AuthStateService);
  private carritoService = inject(CarritoService);
  private musicPlayer = inject(MusicPlayerService);

  private readonly API_URL = `${environment.apis.usuarios}/usuarios`;

  /**
   * Registra un nuevo usuario en el sistema.
   * @param registro Datos del usuario a registrar.
   */
  registrar(registro: RegistroUsuarioDTO): Observable<any> {
    return this.http.post(`${this.API_URL}`, registro).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Realiza login con email y contraseña.
   * @param credenciales Credenciales del usuario.
   * @returns Observable con datos de autenticación.
   */
  login(credenciales: LoginUsuarioDTO): Observable<AuthResponseDTO> {
    return this.http.post<AuthResponseDTO>(`${this.API_URL}/login`, credenciales).pipe(
      tap(response => {
        this.authState.setAuth(response);
        this.carritoService.inicializarCarrito();
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Realiza login usando Google.
   * @param dto Token de Google.
   * @returns Observable con datos de autenticación.
   */
  loginGoogle(dto: LoginGoogleDTO): Observable<AuthResponseDTO> {
    return this.http.post<AuthResponseDTO>(`${this.API_URL}/login/google`, dto).pipe(
      tap(response => {
        this.authState.setAuth(response);
        this.carritoService.inicializarCarrito();
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Cierra sesión del usuario, limpia estado local y revoca refresh token en backend.
   */
  logout(): void {
    const refreshToken = this.authState.getRefreshToken();

    this.musicPlayer.stop();
    this.authState.clearAuth();
    this.carritoService.limpiarEstadoLocal();
    this.router.navigate(['/']);

    if (refreshToken) {
      this.http.post<void>(`${this.API_URL}/logout`, { refreshToken })
        .pipe(
          catchError(() => of(undefined))
        )
        .subscribe();
    }
  }

  /**
   * Renueva los tokens de autenticación usando el refresh token.
   * @returns Observable con los nuevos tokens.
   */
  refreshToken(): Observable<RefreshTokenResponseDTO> {
    const refreshToken = this.authState.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No hay refresh token disponible'));
    }

    const body: RefreshTokenRequestDTO = { refreshToken };

    return this.http.post<RefreshTokenResponseDTO>(`${this.API_URL}/refresh`, body).pipe(
      tap(response => {
        this.authState.updateTokens(
          response.accessToken,
          response.refreshToken,
          response.tipo
        );
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Solicita recuperación de contraseña mediante email.
   * @param dto Datos del usuario a recuperar.
   * @returns Observable con mensaje de éxito.
   */
  recuperarPassword(dto: RecuperarPasswordDTO): Observable<string> {
    return this.http.post(`${this.API_URL}/recuperar-password`, dto, {
      responseType: 'text'
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Restablece la contraseña usando código de verificación.
   * @param dto Datos para restablecer contraseña.
   * @returns Observable con mensaje de éxito.
   */
  restablecerPassword(dto: RestablecerPasswordDTO): Observable<string> {
    return this.http.post(`${this.API_URL}/restablecer-password`, dto, {
      responseType: 'text'
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Reenvía email de verificación al usuario.
   * @param dto Datos del usuario.
   * @returns Observable con mensaje de éxito.
   */
  reenviarVerificacion(dto: ReenviarVerificacionDTO): Observable<string> {
    return this.http.post(`${this.API_URL}/reenviar-verificacion`, dto, {
      responseType: 'text'
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Verifica el email del usuario usando token.
   * @param token Token de verificación.
   * @returns Observable con mensaje de éxito.
   */
  verificarEmail(token: string): Observable<string> {
    return this.http.get(`${this.API_URL}/verificar-email`, {
      params: { token },
      responseType: 'text'
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Marca el onboarding como completado para un usuario.
   * @param idUsuario ID del usuario autenticado
   */
  marcarOnboardingCompletado(idUsuario: number): Observable<void> {
    return this.http.patch<void>(
      `${this.API_URL}/${idUsuario}/onboarding-completado`,
      {}
    ).pipe(
      tap(() => {
        const usuarioActual = this.authState.currentUser();
        if (usuarioActual && usuarioActual.idUsuario === idUsuario) {
          this.authState.updateUserInfo({ onboardingCompletado: true });
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Maneja errores HTTP y devuelve Observable con mensaje legible.
   * @param error Error recibido del HttpClient
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ha ocurrido un error desconocido';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 400:
          errorMessage = error.error?.message || 'Datos inválidos';
          break;
        case 401:
          errorMessage = 'Email o contraseña incorrectos';
          break;
        case 403:
          errorMessage = error.error?.message || 'Debes verificar tu email antes de iniciar sesión';
          break;
        case 404:
          errorMessage = 'Usuario no encontrado';
          break;
        case 409:
          errorMessage = error.error?.message || 'El email ya está registrado';
          break;
        case 500:
          errorMessage = 'Error del servidor. Intenta más tarde';
          break;
        default:
          errorMessage = error.error?.message || `Error ${error.status}`;
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}

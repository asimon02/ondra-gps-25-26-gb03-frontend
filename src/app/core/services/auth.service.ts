import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthStateService } from './auth-state.service';
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

  private readonly API_URL = `${environment.apis.usuarios}/usuarios`;

  registrar(registro: RegistroUsuarioDTO): Observable<any> {
    return this.http.post(`${this.API_URL}`, registro).pipe(
      tap(usuario => console.log('✅ Usuario registrado:', usuario)),
      catchError(this.handleError)
    );
  }

  login(credenciales: LoginUsuarioDTO): Observable<AuthResponseDTO> {
    return this.http.post<AuthResponseDTO>(`${this.API_URL}/login`, credenciales).pipe(
      tap(response => {
        this.authState.setAuth(response);
        console.log('✅ Login exitoso:', response.usuario);
      }),
      catchError(this.handleError)
    );
  }

  loginGoogle(dto: LoginGoogleDTO): Observable<AuthResponseDTO> {
    return this.http.post<AuthResponseDTO>(`${this.API_URL}/login/google`, dto).pipe(
      tap(response => {
        this.authState.setAuth(response);
        console.log('✅ Login con Google exitoso:', response.usuario);
      }),
      catchError(this.handleError)
    );
  }

  logout(): void {
    const refreshToken = this.authState.getRefreshToken();

    console.log('🔴 Cerrando sesión...');

    // 1. Limpiar frontend inmediatamente
    this.authState.clearAuth();
    this.router.navigate(['/']);

    // 2. Revocar en backend en segundo plano
    if (refreshToken) {
      this.http.post<void>(`${this.API_URL}/logout`, { refreshToken })
        .pipe(
          catchError(err => {
            console.warn('⚠️ Error al revocar token en servidor:', err);
            return of(undefined);
          })
        )
        .subscribe(() => {
          console.log('✅ Token revocado en el servidor');
        });
    }
  }

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
        console.log('✅ Tokens renovados correctamente');
      }),
      catchError(error => {
        console.error('❌ Error al renovar token:', error);
        return throwError(() => error);
      })
    );
  }

  recuperarPassword(dto: RecuperarPasswordDTO): Observable<string> {
    return this.http.post(`${this.API_URL}/recuperar-password`, dto, {
      responseType: 'text'
    }).pipe(
      tap(() => console.log('✅ Email de recuperación enviado')),
      catchError(this.handleError)
    );
  }

  restablecerPassword(dto: RestablecerPasswordDTO): Observable<string> {
    return this.http.post(`${this.API_URL}/restablecer-password`, dto, {
      responseType: 'text'
    }).pipe(
      tap(() => console.log('✅ Contraseña restablecida')),
      catchError(this.handleError)
    );
  }

  reenviarVerificacion(dto: ReenviarVerificacionDTO): Observable<string> {
    return this.http.post(`${this.API_URL}/reenviar-verificacion`, dto, {
      responseType: 'text'
    }).pipe(
      tap(() => console.log('✅ Correo reenviado')),
      catchError(this.handleError)
    );
  }

  verificarEmail(token: string): Observable<string> {
    return this.http.get(`${this.API_URL}/verificar-email`, {
      params: { token },
      responseType: 'text'
    }).pipe(
      tap(() => console.log('✅ Email verificado')),
      catchError(this.handleError)
    );
  }

  /**
   * ✨ NUEVO: Marca el onboarding como completado para un usuario.
   * Se llama cuando el usuario completa o omite el wizard de preferencias.
   *
   * @param idUsuario ID del usuario autenticado
   * @returns Observable<void>
   */
  marcarOnboardingCompletado(idUsuario: number): Observable<void> {
    return this.http.patch<void>(
      `${this.API_URL}/${idUsuario}/onboarding-completado`,
      {}
    ).pipe(
      tap(() => {
        // Actualizar el usuario actual en AuthStateService
        const usuarioActual = this.authState.currentUser();
        if (usuarioActual && usuarioActual.idUsuario === idUsuario) {
          this.authState.updateUserInfo({ onboardingCompletado: true });
          console.log('✅ Onboarding marcado como completado');
        }
      }),
      catchError(this.handleError)
    );
  }

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

    console.error('❌ Error en AuthService:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}

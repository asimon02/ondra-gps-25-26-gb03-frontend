import { Component, OnInit, inject, signal, NgZone, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { RecomendacionesService } from '../../../core/services/recomendaciones.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConfigService } from '../../../core/services/config.service';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { GenreService, GeneroDTO } from '../../shared/services/genre.service';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';

declare const google: any;

type FormMode = 'login' | 'register' | 'forgot-password' | 'verify-code' | 'reset-password';

/**
 * Componente de autenticación que gestiona login, registro y recuperación de contraseña.
 * Incluye integración con Google Sign-In y verificación de email.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BackButtonComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private recomendacionesService = inject(RecomendacionesService);
  private genreService = inject(GenreService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private ngZone = inject(NgZone);
  private configService = inject(ConfigService);
  private authState = inject(AuthStateService);

  /** Google Client ID cargado desde la configuración del backend */
  GOOGLE_CLIENT_ID = signal<string | null>(null);

  /** Lista de géneros disponibles obtenida desde el backend */
  generos = signal<GeneroDTO[]>([]);

  /** Indicador de carga de géneros */
  generosLoading = signal<boolean>(true);

  /** Modo actual del formulario */
  formMode = signal<FormMode>('login');

  /** Visibilidad del campo de contraseña */
  showPassword = signal(false);

  /** Visibilidad del campo de confirmación de contraseña */
  showConfirmPassword = signal(false);

  /** Indicador de operación en progreso */
  isLoading = signal(false);

  /** Mensaje de éxito a mostrar al usuario */
  successMessage = signal<string | null>(null);

  /** Mensaje de error a mostrar al usuario */
  errorMessage = signal<string | null>(null);

  /** Indicador de inicialización de Google Sign-In */
  googleInitialized = signal(false);

  /** Email utilizado en el proceso de recuperación de contraseña */
  emailRecuperacion = signal<string>('');

  /** Código de verificación para recuperación de contraseña */
  codigoRecuperacion = signal<string>('');

  /** Contador de tiempo restante para reenviar código */
  resendCountdown = signal<number>(0);
  private countdownInterval?: any;

  /** Indicador de token de verificación ya procesado */
  private tokenVerificado = signal(false);

  /** Indicador de verificación de token en progreso */
  private verificandoToken = signal(false);

  /** Formulario de inicio de sesión */
  loginForm!: FormGroup;

  /** Formulario de registro */
  registerForm!: FormGroup;

  /** Formulario de recuperación de contraseña */
  forgotPasswordForm!: FormGroup;

  /** Formulario de verificación de código */
  verifyCodeForm!: FormGroup;

  /** Formulario de restablecimiento de contraseña */
  resetPasswordForm!: FormGroup;

  /**
   * Obtiene la cantidad de géneros seleccionados en el formulario de registro
   */
  get generosSeleccionadosCount(): number {
    const generos = this.registerForm.get('generosPreferidos')?.value;
    return Array.isArray(generos) ? generos.length : 0;
  }

  ngOnInit(): void {
    this.initializeForms();
    this.checkVerificationToken();
    this.cargarConfiguracion();
    this.cargarGeneros();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.googleInitialized()) {
        this.renderGoogleButton();
      }
    }, 500);
  }

  ngOnDestroy(): void {
    this.clearCountdown();
  }

  /**
   * Carga los géneros disponibles desde el backend
   */
  private cargarGeneros(): void {
    this.generosLoading.set(true);

    this.genreService.obtenerTodosLosGeneros().subscribe({
      next: (generos) => {
        this.generos.set(generos);
        this.generosLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar géneros:', err);
        this.generos.set([]);
        this.generosLoading.set(false);
      }
    });
  }

  /**
   * Inicializa todos los formularios reactivos del componente
   */
  private initializeForms(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });

    this.registerForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      tipoUsuario: ['NORMAL', [Validators.required]],
      generosPreferidos: [[]]
    }, { validators: this.passwordMatchValidator });

    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.verifyCodeForm = this.fb.group({
      codigoVerificacion: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });

    this.resetPasswordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  /**
   * Validador personalizado para verificar que las contraseñas coincidan
   */
  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  /**
   * Carga la configuración pública desde el backend, incluyendo el Google Client ID
   */
  private cargarConfiguracion(): void {
    this.configService.obtenerConfigPublica().subscribe({
      next: (config) => {
        this.GOOGLE_CLIENT_ID.set(config.googleClientId);
        this.initializeGoogleSignIn();
      },
      error: (err) => {
        console.error('Error al cargar configuración:', err);
      }
    });
  }

  /**
   * Inicializa el servicio de Google Sign-In
   */
  private initializeGoogleSignIn(): void {
    const clientId = this.GOOGLE_CLIENT_ID();

    if (!clientId) {
      return;
    }

    const checkGoogle = setInterval(() => {
      if (typeof google !== 'undefined' && google.accounts) {
        clearInterval(checkGoogle);

        google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => this.handleGoogleSignIn(response),
          auto_select: false,
          cancel_on_tap_outside: true
        });

        this.googleInitialized.set(true);
      }
    }, 100);

    setTimeout(() => clearInterval(checkGoogle), 10000);
  }

  /**
   * Renderiza el botón de Google Sign-In en el DOM
   */
  private renderGoogleButton(): void {
    const buttonContainer = document.getElementById('google-signin-button');

    if (buttonContainer && this.googleInitialized()) {
      try {
        google.accounts.id.renderButton(
          buttonContainer,
          {
            theme: 'outline',
            size: 'large',
            width: buttonContainer.offsetWidth || 350,
            text: this.formMode() === 'login' ? 'signin_with' : 'signup_with',
            logo_alignment: 'left',
            shape: 'rectangular'
          }
        );
      } catch (error) {
        console.error('Error al renderizar botón de Google:', error);
      }
    }
  }

  /**
   * Re-renderiza el botón de Google Sign-In
   */
  private rerenderGoogleButton(): void {
    const buttonContainer = document.getElementById('google-signin-button');
    if (buttonContainer) {
      buttonContainer.innerHTML = '';
      this.renderGoogleButton();
    }
  }

  /**
   * Maneja la respuesta de autenticación de Google
   * @param response Respuesta con el credential token de Google
   */
  handleGoogleSignIn(response: any): void {
    this.ngZone.run(() => {
      if (!response.credential) {
        this.setError('No se pudo obtener el token de Google');
        return;
      }

      this.isLoading.set(true);
      this.clearMessages();

      this.authService.loginGoogle({ idToken: response.credential }).subscribe({
        next: (authResponse) => {
          this.setSuccess('Inicio de sesión con Google exitoso');
          setTimeout(() => this.navigateAfterLogin(authResponse.usuario.tipoUsuario), 1000);
        },
        error: (err) => {
          this.setError(err.message);
          this.isLoading.set(false);
        }
      });
    });
  }

  /**
   * Verifica si existe un token de verificación de email en los parámetros de la URL
   * Implementa protección contra verificaciones duplicadas
   */
  private checkVerificationToken(): void {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];

      if (token && !this.tokenVerificado() && !this.verificandoToken()) {
        this.verificandoToken.set(true);

        this.authService.verificarEmail(token).subscribe({
          next: (message) => {
            this.tokenVerificado.set(true);
            this.verificandoToken.set(false);

            this.setSuccess('Correo electrónico verificado correctamente');
            this.formMode.set('login');

            this.router.navigate(['/login'], {
              replaceUrl: true,
              queryParams: {}
            });
          },
          error: (err) => {
            console.error('Error al verificar token:', err);

            this.verificandoToken.set(false);
            this.setError(err.message);

            this.router.navigate(['/login'], {
              replaceUrl: true,
              queryParams: {}
            });
          }
        });
      } else if (token && this.tokenVerificado()) {
        this.router.navigate(['/login'], {
          replaceUrl: true,
          queryParams: {}
        });
      }
    });
  }

  /**
   * Procesa la solicitud de recuperación de contraseña (paso 1)
   */
  onForgotPassword(): void {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.clearMessages();

    const { email } = this.forgotPasswordForm.value;
    this.emailRecuperacion.set(email);

    this.authService.recuperarPassword({ emailUsuario: email }).subscribe({
      next: () => {
        this.setSuccess('Código de verificación enviado. Revisa tu bandeja de entrada.');
        this.changeFormMode('verify-code');
        this.startResendCountdown();
        this.isLoading.set(false);
      },
      error: () => {
        this.setSuccess('Si el correo existe, recibirás un código de verificación.');
        this.changeFormMode('verify-code');
        this.startResendCountdown();
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Verifica el código de recuperación ingresado (paso 2)
   */
  onVerifyCode(): void {
    if (this.verifyCodeForm.invalid) {
      this.verifyCodeForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.clearMessages();

    const { codigoVerificacion } = this.verifyCodeForm.value;
    this.codigoRecuperacion.set(codigoVerificacion);

    this.setSuccess('Código verificado correctamente');
    this.changeFormMode('reset-password');
    this.isLoading.set(false);
  }

  /**
   * Restablece la contraseña con el código verificado (paso 3)
   */
  onResetPassword(): void {
    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.clearMessages();

    const formValue = this.resetPasswordForm.value;

    this.authService.restablecerPassword({
      emailUsuario: this.emailRecuperacion(),
      codigoVerificacion: this.codigoRecuperacion(),
      nuevaPassword: formValue.password
    }).subscribe({
      next: () => {
        this.setSuccess('Contraseña restablecida correctamente');
        this.resetPasswordForm.reset();
        this.verifyCodeForm.reset();
        this.emailRecuperacion.set('');
        this.codigoRecuperacion.set('');
        setTimeout(() => this.changeFormMode('login'), 2000);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.setError(err.message || 'Código incorrecto o expirado');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Reenvía el código de verificación si el contador ha terminado
   */
  resendCode(): void {
    if (this.resendCountdown() > 0) return;

    this.isLoading.set(true);

    this.authService.recuperarPassword({
      emailUsuario: this.emailRecuperacion()
    }).subscribe({
      next: () => {
        this.setSuccess('Nuevo código enviado');
        this.startResendCountdown();
        this.isLoading.set(false);
      },
      error: () => {
        this.setSuccess('Nuevo código enviado');
        this.startResendCountdown();
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Inicia el contador de 60 segundos para reenviar código
   */
  private startResendCountdown(): void {
    this.clearCountdown();
    this.resendCountdown.set(60);

    this.countdownInterval = setInterval(() => {
      const current = this.resendCountdown();
      if (current > 0) {
        this.resendCountdown.set(current - 1);
      } else {
        this.clearCountdown();
      }
    }, 1000);
  }

  /**
   * Limpia el intervalo del contador de reenvío
   */
  private clearCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = undefined;
    }
    this.resendCountdown.set(0);
  }

  /**
   * Procesa el inicio de sesión con credenciales tradicionales
   */
  onLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.clearMessages();

    const { email, password } = this.loginForm.value;

    this.authService.login({
      emailUsuario: email,
      passwordUsuario: password
    }).subscribe({
      next: (response) => {
        this.setSuccess('Inicio de sesión exitoso');
        setTimeout(() => this.navigateAfterLogin(response.usuario.tipoUsuario), 1000);
      },
      error: (err) => {
        this.setError(err.message);
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Procesa el registro de un nuevo usuario
   */
  onRegister(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.clearMessages();

    const formValue = this.registerForm.value;

    this.authService.registrar({
      emailUsuario: formValue.email,
      passwordUsuario: formValue.password,
      nombreUsuario: formValue.nombre,
      apellidosUsuario: formValue.apellidos,
      tipoUsuario: formValue.tipoUsuario
    }).subscribe({
      next: (usuarioCreado) => {
        this.mostrarMensajeExito();
      },
      error: (err) => {
        this.setError(err.message);
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Muestra mensaje de éxito tras el registro y redirige al login
   */
  public mostrarMensajeExito(): void {
    this.setSuccess('Registro completado. Revisa tu correo para verificar tu cuenta.');
    this.registerForm.reset({ tipoUsuario: 'NORMAL', generosPreferidos: [] });
    setTimeout(() => this.changeFormMode('login'), 3000);
    this.isLoading.set(false);
  }

  /**
   * Reenvía el correo de verificación de cuenta
   */
  reenviarVerificacion(): void {
    const email = prompt('Introduce tu email para reenviar la verificación:');

    if (!email || !email.includes('@')) {
      this.setError('Email no válido');
      return;
    }

    this.authService.reenviarVerificacion({ emailUsuario: email }).subscribe({
      next: () => this.setSuccess('Correo de verificación reenviado'),
      error: (err) => this.setError(err.message)
    });
  }

  /**
   * Alterna la selección de un género en el formulario de registro
   * @param idGenero ID del género a alternar
   */
  toggleGenero(idGenero: number): void {
    const generosControl = this.registerForm.get('generosPreferidos');
    const generosActuales: number[] = generosControl?.value || [];

    if (generosActuales.includes(idGenero)) {
      generosControl?.setValue(generosActuales.filter((id: number) => id !== idGenero));
    } else {
      generosControl?.setValue([...generosActuales, idGenero]);
    }
  }

  /**
   * Verifica si un género está seleccionado
   * @param idGenero ID del género a verificar
   */
  isGeneroSelected(idGenero: number): boolean {
    const generos: number[] = this.registerForm.get('generosPreferidos')?.value || [];
    return generos.includes(idGenero);
  }

  /**
   * Cambia el modo del formulario y reinicia estados relacionados
   * @param mode Nuevo modo del formulario
   */
  changeFormMode(mode: FormMode): void {
    this.formMode.set(mode);
    this.clearMessages();

    if (mode !== 'verify-code' && mode !== 'reset-password') {
      this.resetAllForms();
    }

    setTimeout(() => this.rerenderGoogleButton(), 100);
  }

  /**
   * Alterna la visibilidad del campo de contraseña
   */
  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  /**
   * Alterna la visibilidad del campo de confirmación de contraseña
   */
  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update(v => !v);
  }

  /**
   * Navega a la ruta correspondiente después del login
   * Redirige a onboarding si no está completado
   * @param tipoUsuario Tipo de usuario autenticado
   */
  private navigateAfterLogin(tipoUsuario: string): void {
    const usuario = this.authState.currentUser();

    if (!usuario) {
      this.router.navigate(['/login']);
      return;
    }

    if (!usuario.onboardingCompletado) {
      this.router.navigate(['/preferencias/configurar']);
      return;
    }

    this.router.navigate(['/']);
  }

  /**
   * Desplaza la vista al inicio de la página
   */
  private scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  /**
   * Establece un mensaje de éxito y desplaza al inicio
   * @param message Mensaje a mostrar
   */
  private setSuccess(message: string): void {
    this.successMessage.set(message);
    this.errorMessage.set(null);
    setTimeout(() => this.scrollToTop(), 100);
  }

  /**
   * Establece un mensaje de error y desplaza al inicio
   * @param message Mensaje a mostrar
   */
  private setError(message: string): void {
    this.errorMessage.set(message);
    this.successMessage.set(null);
    setTimeout(() => this.scrollToTop(), 100);
  }

  /**
   * Limpia todos los mensajes de éxito y error
   */
  private clearMessages(): void {
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  /**
   * Reinicia todos los formularios a su estado inicial
   */
  private resetAllForms(): void {
    this.loginForm.reset();
    this.registerForm.reset({ tipoUsuario: 'NORMAL', generosPreferidos: [] });
    this.forgotPasswordForm.reset();
    this.verifyCodeForm.reset();
    this.resetPasswordForm.reset();
    this.emailRecuperacion.set('');
    this.codigoRecuperacion.set('');
    this.clearCountdown();
  }

  get loginEmail() { return this.loginForm.get('email'); }
  get loginPassword() { return this.loginForm.get('password'); }

  get regNombre() { return this.registerForm.get('nombre'); }
  get regApellidos() { return this.registerForm.get('apellidos'); }
  get regEmail() { return this.registerForm.get('email'); }
  get regPassword() { return this.registerForm.get('password'); }
  get regConfirmPassword() { return this.registerForm.get('confirmPassword'); }
  get regTipoUsuario() { return this.registerForm.get('tipoUsuario'); }

  get forgotEmail() { return this.forgotPasswordForm.get('email'); }
  get verifyCodigo() { return this.verifyCodeForm.get('codigoVerificacion'); }

  get resetPassword() { return this.resetPasswordForm.get('password'); }
  get resetConfirmPassword() { return this.resetPasswordForm.get('confirmPassword'); }

  /**
   * Verifica si un campo tiene errores de validación
   * @param field Campo a validar
   */
  isFieldInvalid(field: AbstractControl | null): boolean {
    return !!(field && field.invalid && field.touched);
  }

  /**
   * Verifica si un campo es válido
   * @param field Campo a validar
   */
  isFieldValid(field: AbstractControl | null): boolean {
    return !!(field && field.valid && field.touched);
  }

  /**
   * Verifica si un campo tiene un error específico
   * @param field Campo a validar
   * @param errorType Tipo de error a buscar
   */
  hasError(field: AbstractControl | null, errorType: string): boolean {
    return !!(field && field.hasError(errorType) && field.touched);
  }

  /**
   * Verifica si el campo de confirmación de contraseña es inválido
   * @param confirmField Campo de confirmación
   * @param form Formulario que contiene el campo
   */
  isConfirmPasswordInvalid(confirmField: AbstractControl | null, form: FormGroup): boolean {
    return this.isFieldInvalid(confirmField) || !!form.errors?.['passwordMismatch'];
  }

  /**
   * Verifica si el campo de confirmación de contraseña es válido
   * @param confirmField Campo de confirmación
   * @param form Formulario que contiene el campo
   */
  isConfirmPasswordValid(confirmField: AbstractControl | null, form: FormGroup): boolean {
    return this.isFieldValid(confirmField) && !form.errors?.['passwordMismatch'];
  }
}

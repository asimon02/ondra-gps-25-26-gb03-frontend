import { Component, OnInit, inject, signal, NgZone, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { RecomendacionesService } from '../../../core/services/recomendaciones.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConfigService } from '../../../core/services/config.service';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { GenreService, GeneroDTO } from '../../shared/services/genre.service';

declare const google: any;

type FormMode = 'login' | 'register' | 'forgot-password' | 'verify-code' | 'reset-password';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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

  GOOGLE_CLIENT_ID = signal<string | null>(null);

  // ✅ NUEVO: Lista de géneros cargada desde el backend
  generos = signal<GeneroDTO[]>([]);
  generosLoading = signal<boolean>(true);

  // Estado del componente
  formMode = signal<FormMode>('login');
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  isLoading = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  googleInitialized = signal(false);

  // Estado para recuperación de contraseña
  emailRecuperacion = signal<string>('');
  codigoRecuperacion = signal<string>('');

  // Temporizador para reenviar código
  resendCountdown = signal<number>(0);
  private countdownInterval?: any;

  // Protección contra doble verificación
  private tokenVerificado = signal(false);
  private verificandoToken = signal(false);

  // Formularios reactivos
  loginForm!: FormGroup;
  registerForm!: FormGroup;
  forgotPasswordForm!: FormGroup;
  verifyCodeForm!: FormGroup;
  resetPasswordForm!: FormGroup;

  get generosSeleccionadosCount(): number {
    const generos = this.registerForm.get('generosPreferidos')?.value;
    return Array.isArray(generos) ? generos.length : 0;
  }

  ngOnInit(): void {
    this.initializeForms();
    this.checkVerificationToken();
    this.cargarConfiguracion(); // ✨ CAMBIO: No llamar directamente initializeGoogleSignIn
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

  // ============================================
  // ✅ NUEVO: CARGA DE GÉNEROS DESDE BACKEND
  // ============================================

  private cargarGeneros(): void {
    console.log('📥 Cargando géneros desde el backend...');
    this.generosLoading.set(true);

    this.genreService.obtenerTodosLosGeneros().subscribe({
      next: (generos) => {
        this.generos.set(generos);
        this.generosLoading.set(false);
        console.log(`✅ ${generos.length} géneros cargados correctamente`);
      },
      error: (err) => {
        console.error('❌ Error al cargar géneros:', err);
        this.generos.set([]);
        this.generosLoading.set(false);
        // No mostramos error al usuario, solo registramos en consola
      }
    });
  }

  // ============================================
  // INICIALIZACIÓN DE FORMULARIOS
  // ============================================

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
      generosPreferidos: [[]] // ✅ Ahora almacenará IDs (números)
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

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  // ============================================
  // GOOGLE SIGN-IN
  // ============================================

  /**
   * ✨ NUEVO: Carga la configuración desde el backend
   */
  private cargarConfiguracion(): void {
    this.configService.obtenerConfigPublica().subscribe({
      next: (config) => {
        this.GOOGLE_CLIENT_ID.set(config.googleClientId);
        console.log('✅ Configuración cargada desde backend');
        this.initializeGoogleSignIn();
      },
      error: (err) => {
        console.error('❌ Error al cargar configuración:', err);
        // No inicializar Google Sign-In si falla
      }
    });
  }

  private initializeGoogleSignIn(): void {
    const clientId = this.GOOGLE_CLIENT_ID(); // ✨ Leer del signal

    if (!clientId) {
      console.warn('⚠️ No se pudo cargar Google Client ID');
      return;
    }

    const checkGoogle = setInterval(() => {
      if (typeof google !== 'undefined' && google.accounts) {
        clearInterval(checkGoogle);

        google.accounts.id.initialize({
          client_id: clientId, // ✨ Usar variable del signal
          callback: (response: any) => this.handleGoogleSignIn(response),
          auto_select: false,
          cancel_on_tap_outside: true
        });

        this.googleInitialized.set(true);
        console.log('✅ Google Sign-In inicializado');
      }
    }, 100);

    setTimeout(() => clearInterval(checkGoogle), 10000);
  }

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
        console.log('✅ Botón de Google renderizado');
      } catch (error) {
        console.error('Error al renderizar botón de Google:', error);
      }
    }
  }

  private rerenderGoogleButton(): void {
    const buttonContainer = document.getElementById('google-signin-button');
    if (buttonContainer) {
      buttonContainer.innerHTML = '';
      this.renderGoogleButton();
    }
  }

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

  // ============================================
  // VERIFICACIÓN DE EMAIL CON PROTECCIÓN
  // ============================================

  private checkVerificationToken(): void {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];

      if (token && !this.tokenVerificado() && !this.verificandoToken()) {
        console.log('🔍 Token de verificación detectado, validando...');

        this.verificandoToken.set(true);

        this.authService.verificarEmail(token).subscribe({
          next: (message) => {
            console.log('✅ Token verificado exitosamente');

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
            console.error('❌ Error al verificar token:', err);

            this.verificandoToken.set(false);
            this.setError(err.message);

            this.router.navigate(['/login'], {
              replaceUrl: true,
              queryParams: {}
            });
          }
        });
      } else if (token && this.tokenVerificado()) {
        console.log('ℹ️ Token ya verificado previamente, limpiando URL...');
        this.router.navigate(['/login'], {
          replaceUrl: true,
          queryParams: {}
        });
      }
    });
  }

  // ============================================
  // RECUPERACIÓN DE CONTRASEÑA (3 PASOS)
  // ============================================

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

  private clearCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = undefined;
    }
    this.resendCountdown.set(0);
  }

  // ============================================
  // ACCIONES DE FORMULARIOS (LOGIN Y REGISTRO)
  // ============================================

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
        console.log('✅ Usuario registrado:', usuarioCreado);
        this.mostrarMensajeExito();
      },
      error: (err) => {
        this.setError(err.message);
        this.isLoading.set(false);
      }
    });
  }

  public mostrarMensajeExito(): void {
    this.setSuccess('Registro completado. Revisa tu correo para verificar tu cuenta.');
    this.registerForm.reset({ tipoUsuario: 'NORMAL', generosPreferidos: [] });
    setTimeout(() => this.changeFormMode('login'), 3000);
    this.isLoading.set(false);
  }

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

  // ============================================
  // ✅ ACTUALIZADO: GESTIÓN DE GÉNEROS CON IDs
  // ============================================

  /**
   * Alterna la selección de un género por su ID
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
   * Verifica si un género está seleccionado por su ID
   */
  isGeneroSelected(idGenero: number): boolean {
    const generos: number[] = this.registerForm.get('generosPreferidos')?.value || [];
    return generos.includes(idGenero);
  }

  // ============================================
  // UTILIDADES
  // ============================================

  changeFormMode(mode: FormMode): void {
    this.formMode.set(mode);
    this.clearMessages();

    if (mode !== 'verify-code' && mode !== 'reset-password') {
      this.resetAllForms();
    }

    setTimeout(() => this.rerenderGoogleButton(), 100);
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update(v => !v);
  }

  private navigateAfterLogin(tipoUsuario: string): void {
    const usuario = this.authState.currentUser();

    if (!usuario) {
      this.router.navigate(['/login']);
      return;
    }

    // Verificar si completó onboarding
    if (!usuario.onboardingCompletado) {
      console.log('ℹ️ Usuario no ha completado onboarding, redirigiendo a configurar preferencias');
      this.router.navigate(['/preferencias/configurar']);
      return;
    }

    this.router.navigate(['/perfil-info']);
  }

  // ============================================
  // MÉTODOS DE MENSAJES CON SCROLL AUTOMÁTICO
  // ============================================

  private scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  private setSuccess(message: string): void {
    this.successMessage.set(message);
    this.errorMessage.set(null);
    setTimeout(() => this.scrollToTop(), 100);
  }

  private setError(message: string): void {
    this.errorMessage.set(message);
    this.successMessage.set(null);
    setTimeout(() => this.scrollToTop(), 100);
  }

  private clearMessages(): void {
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

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

  // ============================================
  // GETTERS PARA VALIDACIÓN (PÚBLICOS)
  // ============================================

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

  isFieldInvalid(field: AbstractControl | null): boolean {
    return !!(field && field.invalid && field.touched);
  }

  isFieldValid(field: AbstractControl | null): boolean {
    return !!(field && field.valid && field.touched);
  }

  hasError(field: AbstractControl | null, errorType: string): boolean {
    return !!(field && field.hasError(errorType) && field.touched);
  }

  isConfirmPasswordInvalid(confirmField: AbstractControl | null, form: FormGroup): boolean {
    return this.isFieldInvalid(confirmField) || !!form.errors?.['passwordMismatch'];
  }

  isConfirmPasswordValid(confirmField: AbstractControl | null, form: FormGroup): boolean {
    return this.isFieldValid(confirmField) && !form.errors?.['passwordMismatch'];
  }
}

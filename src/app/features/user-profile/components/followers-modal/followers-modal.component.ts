import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalType, UsuarioBasico } from '../../models/seguimiento.model';
import { UserSeguimientoService } from '../../services/user-seguimiento.service';
import { AuthStateService } from '../../../../core/services/auth-state.service';
import { UserCardComponent } from '../user-card/user-card.component';

@Component({
  selector: 'app-followers-modal',
  standalone: true,
  imports: [CommonModule, UserCardComponent],
  templateUrl: './followers-modal.component.html',
  styleUrls: ['./followers-modal.component.scss']
})
export class FollowersModalComponent implements OnInit {
  /**
   * Tipo de modal: seguidores o seguidos.
   */
  @Input() modalType!: ModalType;

  /**
   * ID del usuario cuyo listado se está visualizando.
   */
  @Input() userId!: number;

  /**
   * Evento emitido para cerrar el modal.
   */
  @Output() closeModal = new EventEmitter<void>();

  /**
   * Evento emitido cuando las estadísticas deben actualizarse en el padre.
   */
  @Output() statsUpdated = new EventEmitter<void>();

  /**
   * Lista de usuarios que siguen o son seguidos por el usuario.
   */
  usuarios: UsuarioBasico[] = [];

  /**
   * IDs de los usuarios a los que el usuario actual sigue.
   */
  usuariosSiguiendo: Set<number> = new Set();

  /**
   * Estado de carga.
   */
  isLoading = true;

  /**
   * ID del usuario autenticado actualmente.
   */
  currentUserId: number = 0;

  /**
   * Tipo de usuario autenticado (NORMAL o ARTISTA).
   */
  currentUserTipoUsuario: 'NORMAL' | 'ARTISTA' = 'NORMAL';

  constructor(
    private seguimientoService: UserSeguimientoService,
    private authStateService: AuthStateService
  ) {}

  /**
   * Inicializa el componente obteniendo la información del usuario actual
   * y cargando la lista de usuarios correspondientes.
   */
  ngOnInit(): void {
    const user = this.authStateService.getUserInfo();
    if (user?.idUsuario) {
      this.currentUserId = user.idUsuario;
      this.currentUserTipoUsuario = user.tipoUsuario as 'NORMAL' | 'ARTISTA';
    }
    this.cargarUsuarios();
  }

  /**
   * Devuelve el título del modal dependiendo del tipo.
   */
  get title(): string {
    return this.modalType === 'seguidos'
      ? `Seguidos (${this.usuarios.length})`
      : `Seguidores (${this.usuarios.length})`;
  }

  /**
   * Carga la lista de seguidores o seguidos según el tipo del modal.
   */
  cargarUsuarios(): void {
    this.isLoading = true;

    const observable = this.modalType === 'seguidos'
      ? this.seguimientoService.obtenerSeguidos(this.userId)
      : this.seguimientoService.obtenerSeguidores(this.userId);

    observable.subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
        if (this.currentUserId > 0) {
          this.verificarSeguimientos();
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  /**
   * Verifica individualmente si el usuario actual sigue a cada usuario del listado.
   */
  verificarSeguimientos(): void {
    this.usuarios.forEach(usuario => {
      if (usuario.idUsuario === this.currentUserId) {
        return;
      }

      this.seguimientoService.verificarSeguimiento(usuario.idUsuario).subscribe({
        next: (siguiendo) => {
          if (siguiendo) {
            this.usuariosSiguiendo.add(usuario.idUsuario);
          }
        },
        error: (error) => {
          if (error.status !== 403) {
            console.error('Error al verificar seguimiento:', error);
          }
        }
      });
    });
  }

  /**
   * Verifica si el usuario autenticado sigue al usuario indicado.
   */
  isSiguiendo(idUsuario: number): boolean {
    return this.usuariosSiguiendo.has(idUsuario);
  }

  /**
   * Actualiza las listas de seguimiento ante un cambio en el estado de seguir/dejar de seguir.
   */
  onFollowStatusChanged(): void {
    this.usuariosSiguiendo.clear();
    this.cargarUsuarios();
    this.statsUpdated.emit();
  }

  /**
   * Cierra el modal.
   */
  close(): void {
    this.closeModal.emit();
  }

  /**
   * Cierra el modal si se hace clic en el fondo (fuera del contenido).
   */
  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }
}

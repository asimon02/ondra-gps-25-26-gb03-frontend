import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { CommentsService } from '../../services/comments.service';
import { AuthStateService } from '../../../../../core/services/auth-state.service';
import {
  CommentDTO,
  CommentContentType,
  CommentsPageDTO,
  CrearComentarioDTO
} from '../../models/comment.model';

type CommentSectionType = 'song' | 'album';

/**
 * Componente de sección de comentarios.
 * Permite ver, crear, editar y eliminar comentarios para canciones o álbumes.
 */
@Component({
  selector: 'app-comments-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './comments-section.component.html'
})
export class CommentsSectionComponent implements OnInit, OnChanges {
  /** ID del contenido asociado (canción o álbum) */
  @Input({ required: true }) contentId!: number;

  /** Tipo de contenido: 'song' o 'album' */
  @Input({ required: true }) type!: CommentSectionType;

  /** Título del contenido */
  @Input() contentTitle = '';

  /** Evento emitido cuando cambia el total de comentarios */
  @Output() totalChanged = new EventEmitter<number>();

  /** Formulario de creación de comentario */
  form: FormGroup;

  /** Formulario de edición de comentario */
  editForm: FormGroup;

  /** Lista de comentarios cargados */
  comments: CommentDTO[] = [];

  page = 1;
  limit = 100; // número máximo de comentarios por página
  totalPages = 1;
  totalElements = 0;

  isLoading = false;
  isLoadingMore = false;
  isSubmitting = false;
  isEditing = false;
  deletingIds = new Set<number>();
  errorMessage = '';

  editingCommentId: number | null = null;
  menuOpenFor: number | null = null;

  constructor(
    private fb: FormBuilder,
    private commentsService: CommentsService,
    public authState: AuthStateService,
    private router: Router
  ) {
    this.form = this.fb.group({
      contenido: [{ value: '', disabled: !this.isAuthenticated }, [Validators.required, Validators.maxLength(1000)]]
    });

    this.editForm = this.fb.group({
      contenido: [{ value: '', disabled: true }, [Validators.required, Validators.maxLength(1000)]]
    });
  }

  ngOnInit(): void {
    this.loadAllComments();
    this.updateCreateControlDisabled();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['contentId'] || changes['type']) {
      this.loadAllComments();
    }
  }

  /** Indica si el usuario está autenticado */
  get isAuthenticated(): boolean {
    return !!this.authState.isAuthenticated();
  }

  /** Obtiene el ID del usuario actual */
  get currentUserId(): number | null {
    return this.authState.getUserInfo()?.idUsuario ?? null;
  }

  /** Inicial del nombre de usuario para avatar */
  get userLetter(): string {
    const user = this.authState.getUserInfo();
    return user?.nombre?.charAt(0) || user?.apellidos?.charAt(0) || '?';
  }

  /** URL de la foto de perfil del usuario actual */
  get currentUserPhoto(): string | null {
    return this.authState.userPhoto();
  }

  /** Indica si hay más comentarios para paginar */
  get hasMore(): boolean {
    return this.page < this.totalPages;
  }

  /** Envía un nuevo comentario */
  onSubmit(): void {
    if (!this.isAuthenticated) {
      this.errorMessage = 'Inicia sesión para comentar.';
      return;
    }

    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      return;
    }

    const contenido = this.form.value.contenido?.trim();
    if (!contenido) {
      this.form.get('contenido')?.setErrors({ required: true });
      return;
    }

    const payload: CrearComentarioDTO = {
      tipoContenido: this.mapTypeToApi(this.type),
      idCancion: this.type === 'song' ? Number(this.contentId) : undefined,
      idAlbum: this.type === 'album' ? Number(this.contentId) : undefined,
      contenido
    };

    this.isSubmitting = true;
    this.updateCreateControlDisabled();
    this.errorMessage = '';

    this.commentsService.createComment(payload)
      .pipe(finalize(() => { this.isSubmitting = false; this.updateCreateControlDisabled(); }))
      .subscribe({
        next: () => {
          this.form.reset();
          this.updateCreateControlDisabled();
          this.loadAllComments();
        },
        error: () => {
          this.errorMessage = 'No se pudo enviar el comentario. Inténtalo nuevamente.';
        }
      });
  }

  /** Inicia la edición de un comentario existente */
  startEdit(comment: CommentDTO): void {
    if (!this.canManage(comment)) return;
    this.editingCommentId = comment.idComentario;
    this.editForm.setValue({ contenido: comment.contenido });
    this.updateEditControlDisabled(false);
    this.errorMessage = '';
    this.menuOpenFor = null;
  }

  /** Cancela la edición actual */
  cancelEdit(): void {
    this.editingCommentId = null;
    this.updateEditControlDisabled(true);
    this.editForm.reset();
  }

  /** Envía la edición de un comentario */
  submitEdit(): void {
    if (this.editingCommentId === null || this.editForm.invalid || this.isEditing) {
      this.editForm.markAllAsTouched();
      return;
    }

    const contenido = this.editForm.value.contenido?.trim();
    if (!contenido) {
      this.editForm.get('contenido')?.setErrors({ required: true });
      return;
    }

    this.isEditing = true;
    this.updateEditControlDisabled(true);
    this.errorMessage = '';

    this.commentsService.editComment(this.editingCommentId, { contenido })
      .pipe(finalize(() => { this.isEditing = false; this.updateEditControlDisabled(false); }))
      .subscribe({
        next: (updated) => {
          this.comments = this.comments.map(comment =>
            comment.idComentario === updated.idComentario
              ? { ...updated, editado: true }
              : comment
          );
          this.cancelEdit();
        },
        error: () => {
          this.errorMessage = 'No se pudo editar el comentario.';
        }
      });
  }

  /** Elimina un comentario */
  deleteComment(comment: CommentDTO): void {
    if (!this.canManage(comment) || this.deletingIds.has(comment.idComentario)) return;

    const confirmed = confirm('¿Eliminar este comentario?');
    if (!confirmed) return;

    this.deletingIds.add(comment.idComentario);
    this.errorMessage = '';

    this.commentsService.deleteComment(comment.idComentario)
      .pipe(finalize(() => this.deletingIds.delete(comment.idComentario)))
      .subscribe({
        next: () => {
          this.menuOpenFor = null;
          this.loadAllComments();
        },
        error: () => {
          this.errorMessage = 'No se pudo eliminar el comentario.';
        }
      });
  }

  /** Carga más comentarios si hay paginación */
  loadMore(): void {
    if (!this.hasMore || this.isLoadingMore) return;
    this.fetchComments(this.page + 1, true, true);
  }

  /** Detecta scroll para cargar más comentarios */
  onScroll(event: Event): void {
    const element = event.target as HTMLElement;
    const threshold = 100;
    const position = element.scrollTop + element.offsetHeight;
    const height = element.scrollHeight;

    if (position >= height - threshold && this.hasMore && !this.isLoadingMore) {
      this.loadMore();
    }
  }

  /** Indica si el comentario puede ser gestionado por el usuario */
  canManage(comment: CommentDTO): boolean {
    return this.currentUserId !== null && this.currentUserId === comment.idUsuario;
  }

  /** Indica si el comentario pertenece al usuario actual */
  isOwn(comment: CommentDTO): boolean {
    return this.canManage(comment);
  }

  /** Devuelve el nombre a mostrar del comentario */
  getDisplayName(comment: CommentDTO): string {
    return comment.nombreUsuario || 'Usuario desconocido';
  }

  /** Devuelve la URL del avatar del comentario */
  getAvatar(comment: CommentDTO): string | null {
    return comment.urlFotoPerfil || null;
  }

  /** Iniciales del comentario para avatar */
  getInitials(comment: CommentDTO): string {
    const name = this.getDisplayName(comment).trim();
    return name ? name.charAt(0).toUpperCase() : 'U';
  }

  /** URL del perfil del usuario del comentario */
  getProfileUrl(comment: CommentDTO): string | null {
    return comment.slug ? `/usuario/${comment.slug}` : null;
  }

  /** Navega al perfil de otro usuario */
  navigateToProfile(comment: CommentDTO, event: Event): void {
    if (this.isOwn(comment)) {
      event.preventDefault();
      return;
    }

    const url = this.getProfileUrl(comment);
    if (url) this.router.navigate([url]);
  }

  /** Optimización de ngFor */
  trackByCommentId(_: number, item: CommentDTO): number {
    return item.idComentario;
  }

  /** Alterna el menú contextual de un comentario */
  toggleMenu(commentId: number): void {
    this.menuOpenFor = this.menuOpenFor === commentId ? null : commentId;
  }

  /** Cierra el menú contextual */
  closeMenu(): void {
    this.menuOpenFor = null;
  }

  /** Inicializa la carga de comentarios */
  private loadAllComments(): void {
    this.page = 1;
    this.comments = [];
    this.fetchComments(1, false, false);
    this.updateCreateControlDisabled();
  }

  /** Obtiene comentarios desde la API */
  private fetchComments(page: number, append: boolean, loadingMore: boolean): void {
    if (!this.contentId || !this.type) return;

    this.errorMessage = '';
    if (loadingMore) this.isLoadingMore = true;
    else if (page === 1) this.isLoading = true;

    const request$ = this.type === 'song'
      ? this.commentsService.getSongComments(Number(this.contentId), page, this.limit)
      : this.commentsService.getAlbumComments(Number(this.contentId), page, this.limit);

    request$
      .pipe(finalize(() => {
        this.isLoading = false;
        this.isLoadingMore = false;
      }))
      .subscribe({
        next: (pageData) => {
          this.applyPage(pageData, append);
          if (this.hasMore) this.loadMore();
        },
        error: () => {
          if (!append) this.comments = [];
          this.errorMessage = 'No se pudieron cargar los comentarios.';
        }
      });
  }

  /** Aplica datos de la página recibida */
  private applyPage(pageData: CommentsPageDTO, append: boolean): void {
    const incoming = pageData.comentarios || [];
    this.comments = append ? [...this.comments, ...incoming] : incoming;
    this.page = pageData.paginaActual ?? this.page;
    this.totalPages = Math.max(1, pageData.totalPaginas ?? 1);
    this.totalElements = pageData.totalElementos ?? this.totalElements;
    this.limit = pageData.elementosPorPagina ?? this.limit;
    this.totalChanged.emit(this.totalElements);
  }

  /** Mapea el tipo de contenido al formato API */
  private mapTypeToApi(type: CommentSectionType): CommentContentType {
    return type === 'song' ? 'CANCIÓN' : 'ÁLBUM';
  }

  /** Habilita o deshabilita el formulario de creación según estado */
  private updateCreateControlDisabled(): void {
    const control = this.form.get('contenido');
    if (!control) return;
    if (!this.isAuthenticated || this.isSubmitting) control.disable({ emitEvent: false });
    else control.enable({ emitEvent: false });
  }

  /** Indica si se debe mostrar el formulario de creación */
  get shouldShowCommentForm(): boolean {
    return this.isAuthenticated;
  }

  /** Habilita o deshabilita el formulario de edición */
  private updateEditControlDisabled(disabled: boolean): void {
    const control = this.editForm.get('contenido');
    if (!control) return;
    if (disabled) control.disable({ emitEvent: false });
    else control.enable({ emitEvent: false });
  }
}

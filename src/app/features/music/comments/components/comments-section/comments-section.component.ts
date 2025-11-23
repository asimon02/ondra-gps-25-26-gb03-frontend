import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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

@Component({
  selector: 'app-comments-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './comments-section.component.html'
})
export class CommentsSectionComponent implements OnInit, OnChanges {
  @Input({ required: true }) contentId!: number;
  @Input({ required: true }) type!: CommentSectionType;
  @Input() contentTitle = '';
  @Output() totalChanged = new EventEmitter<number>();

  form: FormGroup;
  editForm: FormGroup;

  comments: CommentDTO[] = [];
  page = 1;
  limit = 10;
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
  private avatarCache = new Map<number, string | null>();

  constructor(
    private fb: FormBuilder,
    private commentsService: CommentsService,
    public authState: AuthStateService
  ) {
    this.form = this.fb.group({
      contenido: [{ value: '', disabled: !this.isAuthenticated }, [Validators.required, Validators.maxLength(1000)]]
    });

    this.editForm = this.fb.group({
      contenido: [{ value: '', disabled: true }, [Validators.required, Validators.maxLength(1000)]]
    });
  }

  ngOnInit(): void {
    this.loadInitialComments();
    this.updateCreateControlDisabled();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['contentId'] || changes['type']) {
      this.loadInitialComments();
    }
  }

  get isAuthenticated(): boolean {
    return !!this.authState.isAuthenticated();
  }

  get currentUserId(): number | null {
    return this.authState.getUserInfo()?.idUsuario ?? null;
  }

  get userLetter(): string {
    const user = this.authState.getUserInfo();
    return user?.nombre?.charAt(0) || user?.apellidos?.charAt(0) || '?';
  }

  get hasMore(): boolean {
    return this.page < this.totalPages;
  }

  onSubmit(): void {
    if (!this.isAuthenticated) {
      this.errorMessage = 'Inicia sesion para comentar.';
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
          this.loadInitialComments();
        },
        error: () => {
          this.errorMessage = 'No se pudo enviar el comentario. Intentalo nuevamente.';
        }
      });
  }

  startEdit(comment: CommentDTO): void {
    if (!this.canManage(comment)) {
      return;
    }
    this.editingCommentId = comment.idComentario;
    this.editForm.setValue({ contenido: comment.contenido });
    this.updateEditControlDisabled(false);
    this.errorMessage = '';
    this.menuOpenFor = null;
  }

  cancelEdit(): void {
    this.editingCommentId = null;
    this.updateEditControlDisabled(true);
    this.editForm.reset();
  }

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
            comment.idComentario === updated.idComentario ? updated : comment
          );
          this.cancelEdit();
        },
        error: () => {
          this.errorMessage = 'No se pudo editar el comentario.';
        }
      });
  }

  deleteComment(comment: CommentDTO): void {
    if (!this.canManage(comment) || this.deletingIds.has(comment.idComentario)) {
      return;
    }

    const confirmed = confirm('Eliminar este comentario?');
    if (!confirmed) {
      return;
    }

    this.deletingIds.add(comment.idComentario);
    this.errorMessage = '';

    this.commentsService.deleteComment(comment.idComentario)
      .pipe(finalize(() => this.deletingIds.delete(comment.idComentario)))
      .subscribe({
        next: () => {
          this.menuOpenFor = null;
          this.loadInitialComments();
        },
        error: () => {
          this.errorMessage = 'No se pudo eliminar el comentario.';
        }
      });
  }

  loadMore(): void {
    if (!this.hasMore || this.isLoadingMore) {
      return;
    }
    this.fetchComments(this.page + 1, true, true);
  }

  canManage(comment: CommentDTO): boolean {
    return this.currentUserId !== null && this.currentUserId === comment.idUsuario;
  }

  isOwn(comment: CommentDTO): boolean {
    return this.canManage(comment);
  }

  getDisplayName(comment: CommentDTO): string {
    return comment.nombreUsuario || 'Usuario desconocido';
  }

  getAvatar(comment: CommentDTO): string | null {
    return null;
  }

  getInitials(comment: CommentDTO): string {
    const name = this.getDisplayName(comment).trim();
    return name ? name.charAt(0) : 'U';
  }

  trackByCommentId(_: number, item: CommentDTO): number {
    return item.idComentario;
  }

  toggleMenu(commentId: number): void {
    this.menuOpenFor = this.menuOpenFor === commentId ? null : commentId;
  }

  closeMenu(): void {
    this.menuOpenFor = null;
  }

  private loadInitialComments(): void {
    this.page = 1;
    this.comments = [];
    this.fetchComments(1, false, false);
    this.updateCreateControlDisabled();
  }

  private fetchComments(page: number, append: boolean, loadingMore: boolean): void {
    if (!this.contentId || !this.type) {
      return;
    }

    this.errorMessage = '';
    if (loadingMore) {
      this.isLoadingMore = true;
    } else if (page === 1) {
      this.isLoading = true;
    }

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
        },
        error: () => {
          if (!append) {
            this.comments = [];
          }
          this.errorMessage = 'No se pudieron cargar los comentarios.';
        }
      });
  }

  private applyPage(pageData: CommentsPageDTO, append: boolean): void {
    const incoming = pageData.comentarios || [];
    this.comments = append ? [...this.comments, ...incoming] : incoming;
    this.page = pageData.paginaActual ?? this.page;
    this.totalPages = Math.max(1, pageData.totalPaginas ?? 1);
    this.totalElements = pageData.totalElementos ?? this.totalElements;
    this.limit = pageData.elementosPorPagina ?? this.limit;
    this.totalChanged.emit(this.totalElements);
  }

  private mapTypeToApi(type: CommentSectionType): CommentContentType {
    return type === 'song' ? 'CANCION' : 'ALBUM';
  }

  private updateCreateControlDisabled(): void {
    const control = this.form.get('contenido');
    if (!control) return;
    if (!this.isAuthenticated || this.isSubmitting) {
      control.disable({ emitEvent: false });
    } else {
      control.enable({ emitEvent: false });
    }
  }

  private updateEditControlDisabled(disabled: boolean): void {
    const control = this.editForm.get('contenido');
    if (!control) return;
    if (disabled) {
      control.disable({ emitEvent: false });
    } else {
      control.enable({ emitEvent: false });
    }
  }

}

import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BecomeArtistModalComponent } from '../become-artist-modal/become-artist-modal.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-become-artist-card',
  standalone: true,
  imports: [CommonModule, BecomeArtistModalComponent],
  templateUrl: './become-artist-card.component.html',
  styleUrls: ['./become-artist-card.component.scss']
})
export class BecomeArtistCardComponent {
  /**
   * Estado del modal que permite al usuario iniciar el proceso
   * para convertirse en artista.
   */
  showModal = signal(false);

  constructor(private router: Router) {}

  /**
   * Abre el modal para iniciar el proceso de creación del perfil artístico.
   */
  openModal(): void {
    this.showModal.set(true);
  }

  /**
   * Cierra el modal de creación del perfil artístico.
   */
  closeModal(): void {
    this.showModal.set(false);
  }

  /**
   * Acción ejecutada cuando el perfil artístico ha sido creado.
   * Recarga la página para actualizar el estado del usuario.
   */
  onArtistaCreado(): void {
    window.location.reload();
  }
}

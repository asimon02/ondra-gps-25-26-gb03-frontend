import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Origen del proceso de checkout
 */
export type CheckoutOrigin = 'CARRITO' | 'DETALLE';

/**
 * Contexto de checkout que se mantiene en estado y sessionStorage
 */
export interface CheckoutContext {
  origin: CheckoutOrigin;
  tipoContenido?: 'CANCIÓN' | 'ÁLBUM';
  idContenido?: number;
  isFree?: boolean;
  metodoPagoId?: number | null;
  metodoGuardado?: boolean;
  snapshot?: {
    tipoProducto: 'CANCIÓN' | 'ÁLBUM';
    idCancion?: number;
    idAlbum?: number;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class CheckoutStateService {
  private readonly storageKey = 'checkout-context';
  private contextSubject = new BehaviorSubject<CheckoutContext | null>(this.loadFromStorage());

  /** Observable del contexto de checkout */
  context$ = this.contextSubject.asObservable();

  /**
   * Establece un nuevo contexto de checkout y lo persiste en sessionStorage
   * @param context Contexto completo a guardar
   */
  setContext(context: CheckoutContext): void {
    this.contextSubject.next(context);
    this.persist(context);
  }

  /**
   * Actualiza parcialmente el contexto existente
   * @param partial Propiedades a actualizar
   */
  updateContext(partial: Partial<CheckoutContext>): void {
    const current = this.contextSubject.value ?? { origin: 'CARRITO' as const };
    const updated = { ...current, ...partial };
    this.setContext(updated);
  }

  /**
   * Obtiene el contexto actual de checkout
   * @returns Contexto actual o null si no existe
   */
  getContext(): CheckoutContext | null {
    return this.contextSubject.value;
  }

  /**
   * Limpia el contexto de checkout y lo elimina de sessionStorage
   */
  clear(): void {
    this.contextSubject.next(null);
    this.persist(null);
  }

  /**
   * Carga el contexto desde sessionStorage
   * @returns Contexto almacenado o null si no existe o no es válido
   */
  private loadFromStorage(): CheckoutContext | null {
    try {
      const raw = sessionStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) as CheckoutContext : null;
    } catch {
      return null;
    }
  }

  /**
   * Persiste el contexto actual en sessionStorage
   * @param context Contexto a guardar o null para eliminarlo
   */
  private persist(context: CheckoutContext | null): void {
    try {
      if (!context) {
        sessionStorage.removeItem(this.storageKey);
        return;
      }
      sessionStorage.setItem(this.storageKey, JSON.stringify(context));
    } catch {
      // Ignorar errores de persistencia (ej. SSR)
    }
  }
}

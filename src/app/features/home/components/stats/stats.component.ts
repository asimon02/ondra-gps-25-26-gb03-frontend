import { Component, Input, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatsGlobales } from '../../../../shared/models/stats.model';

/**
 * Componente que muestra estadísticas globales de la plataforma.
 * Permite animar los números incrementándolos de 0 hasta su valor final.
 */
@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.scss']
})
export class StatsComponent implements OnChanges {

  /** Estadísticas globales recibidas desde el componente padre */
  @Input() stats: StatsGlobales | null = null;

  /** Lista de estadísticas a mostrar, incluyendo valor actual para animación */
  displayStats: { label: string; value: number; current: number }[] = [];

  constructor(private cdr: ChangeDetectorRef) {}

  /**
   * Detecta cambios en la propiedad de entrada `stats` y reinicia la animación.
   * @param changes Cambios detectados en las propiedades de entrada
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['stats'] && this.stats) {
      this.initializeStats();
      this.animateNumbers();
    }
  }

  /**
   * Inicializa las estadísticas a mostrar a partir de los datos recibidos.
   * Cada estadística comienza con valor actual en 0 para animación.
   */
  private initializeStats(): void {
    if (!this.stats) return;

    this.displayStats = [
      { label: 'Usuarios activos', value: this.stats.totalUsuarios, current: 0 },
      { label: 'Artistas', value: this.stats.totalArtistas, current: 0 },
      { label: 'Canciones', value: this.stats.totalCanciones, current: 0 },
      { label: 'Reproducciones', value: this.stats.totalReproducciones, current: 0 }
    ];
  }

  /**
   * Anima cada estadística incrementando su valor actual desde 0 hasta el valor final.
   * Se utiliza un intervalo para actualizar el valor y disparar la detección de cambios.
   */
  private animateNumbers(): void {
    this.displayStats.forEach((stat) => {
      let start = 0;
      const increment = stat.value / 80;
      const interval = setInterval(() => {
        start += increment;
        stat.current = Math.floor(start);

        if (start >= stat.value) {
          stat.current = stat.value;
          clearInterval(interval);
        }

        this.cdr.detectChanges();
      }, 25);
    });
  }
}

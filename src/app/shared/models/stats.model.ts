/**
 * DTO que representa estadísticas de usuarios desde el microservicio de Usuarios.
 */
export interface StatsDTO {
  /** Total de usuarios registrados */
  totalUsuarios: number;

  /** Total de artistas registrados */
  totalArtistas: number;
}

/**
 * DTO que representa estadísticas de canciones desde el microservicio de Contenidos.
 */
export interface CancionesStatsDTO {
  /** Total de canciones disponibles en la plataforma */
  totalCanciones: number;

  /** Total de reproducciones acumuladas de todas las canciones */
  totalReproducciones: number;
}

/**
 * DTO que representa estadísticas globales combinadas de usuarios y canciones.
 */
export interface StatsGlobales {
  /** Total de usuarios registrados */
  totalUsuarios: number;

  /** Total de artistas registrados */
  totalArtistas: number;

  /** Total de canciones disponibles */
  totalCanciones: number;

  /** Total de reproducciones acumuladas */
  totalReproducciones: number;
}

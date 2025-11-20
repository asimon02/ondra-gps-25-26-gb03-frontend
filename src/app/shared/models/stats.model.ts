/**
 * DTO para estadísticas de usuarios del microservicio Usuarios
 */
export interface StatsDTO {
  totalUsuarios: number;
  totalArtistas: number;
}

/**
 * DTO para estadísticas de canciones del microservicio Contenidos
 */
export interface CancionesStatsDTO {
  totalCanciones: number;
  totalReproducciones: number;
}

/**
 * Estadísticas globales de la plataforma (combinación de ambos microservicios)
 */
export interface StatsGlobales {
  totalUsuarios: number;
  totalArtistas: number;
  totalCanciones: number;
  totalReproducciones: number;
}

/**
 * Configuración de entorno para producción
 */
export const environment = {
  /** Indica que la aplicación está en modo producción */
  production: true,

  /**
   * En producción siempre se utiliza el backend real
   * true  = utiliza datos mock (no se recomienda en prod)
   * false = utiliza los microservicios reales
   */
  useMock: false,

  /** URLs base de los microservicios */
  apis: {
    /** Microservicio de Usuarios */
    usuarios: 'http://localhost:8080/api',
    /** Microservicio de Contenidos */
    contenidos: 'http://localhost:8081/api',
    /** Microservicio de Recomendaciones */
    recomendaciones: 'http://localhost:8082/api'
  },

  /** Nombre de la aplicación */
  appName: 'ONDRA',

  /** Versión de la aplicación */
  version: '1.0.0'
};

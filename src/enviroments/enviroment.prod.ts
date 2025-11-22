export const environment = {
  production: true,

  /**
   * En producción, siempre usar backend real
   */
  useMock: false,

  // APIs de microservicios
  apis: {
    usuarios: 'http://localhost:8080/api',
    contenidos: 'http://localhost:8081/api',
    recomendaciones: 'http://localhost:8082/api'
  },

  appName: 'ONDRA',
  version: '1.0.0'
};

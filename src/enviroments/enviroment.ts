export const environment = {
  production: false,

  /**
   * Control de modo: true = usa mocks, false = usa backend real
   * Cambiar este valor permite alternar entre modos sin modificar código
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

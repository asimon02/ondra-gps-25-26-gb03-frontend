export interface Genero {
  id_genero: number;
  nombre_genero: string;
}

export interface PreferenciaGenero {
  id_genero: number;
  nombre_genero: string;
}

export interface AgregarPreferenciasRequest {
  ids_generos: number[];
}

export interface PreferenciasResponse {
  mensaje: string;
  generos_agregados: number;
  generos_duplicados: number;
  preferencias: PreferenciaGenero[];
}
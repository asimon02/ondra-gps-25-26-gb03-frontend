/**
 * Lista de géneros musicales disponibles en la plataforma.
 */
export const GENEROS_MUSICALES = [
  'Rock',
  'Pop',
  'Jazz',
  'Blues',
  'Clásica',
  'Reggae',
  'Country',
  'Electrónica',
  'Hip Hop',
  'R&B',
  'Soul',
  'Funk',
  'Metal',
  'Punk',
  'Indie',
  'Folk',
  'Latina',
  'Salsa',
  'Reggaeton',
  'Flamenco',
  'Tango',
  'Bachata',
  'Merengue',
  'Cumbia',
  'Dubstep',
  'House',
  'Techno',
  'Trap',
  'K-Pop',
  'Anime'
];

/**
 * Mapeo de nombres de géneros a los identificadores definidos en el backend.
 * Estos valores deben coincidir con la tabla `generos_musicales`.
 */
export const GENERO_ID_MAP: Record<string, number> = {
  Rock: 1,
  Pop: 2,
  Jazz: 3,
  Blues: 4,
  Clásica: 5,
  Reggae: 6,
  Country: 7,
  Electrónica: 8,
  'Hip Hop': 9,
  'R&B': 10,
  Soul: 11,
  Funk: 12,
  Metal: 13,
  Punk: 14,
  Indie: 15,
  Folk: 16,
  Latina: 17,
  Salsa: 18,
  Reggaeton: 19,
  Flamenco: 20,
  Tango: 21,
  Bachata: 22,
  Merengue: 23,
  Cumbia: 24,
  Dubstep: 25,
  House: 26,
  Techno: 27,
  Trap: 28,
  'K-Pop': 29,
  Anime: 30
};

/**
 * Convierte una lista de nombres de géneros a una lista de IDs.
 *
 * @param nombresGeneros Lista de nombres de géneros.
 * @returns Lista de identificadores de géneros válidos.
 */
export function convertirGenerosAIds(nombresGeneros: string[]): number[] {
  return nombresGeneros
    .map(nombre => GENERO_ID_MAP[nombre])
    .filter(id => id !== undefined);
}

/**
 * Convierte una lista de IDs de géneros a sus nombres correspondientes.
 *
 * @param idsGeneros Lista de identificadores de géneros.
 * @returns Lista de nombres de géneros válidos.
 */
export function convertirIdsAGeneros(idsGeneros: number[]): string[] {
  const idToNameMap = Object.entries(GENERO_ID_MAP).reduce((acc, [name, id]) => {
    acc[id] = name;
    return acc;
  }, {} as Record<number, string>);

  return idsGeneros
    .map(id => idToNameMap[id])
    .filter(nombre => nombre !== undefined);
}

/**
 * Valida si un nombre de género existe en el catálogo disponible.
 *
 * @param nombreGenero Nombre del género a validar.
 * @returns Verdadero si el género es válido.
 */
export function esGeneroValido(nombreGenero: string): boolean {
  return GENEROS_MUSICALES.includes(nombreGenero);
}

/**
 * Retorna el identificador asociado a un género dado.
 *
 * @param nombreGenero Nombre del género.
 * @returns ID del género o undefined si no existe.
 */
export function obtenerIdGenero(nombreGenero: string): number | undefined {
  return GENERO_ID_MAP[nombreGenero];
}

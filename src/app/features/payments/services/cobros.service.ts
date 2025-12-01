import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../enviroments/enviroment';
import { map } from 'rxjs/operators';

/** Información de un cobro individual */
export interface CobroDTO {
  idCobro: number;
  idArtista: number;
  tipoCobro: string;
  monto: number;
  fechaCobro: string;
  tipoContenido: string;
  idCancion?: number;
  idAlbum?: number;
  tituloContenido?: string;
  reproduccionesAcumuladas?: number;
  estado: string;
  idMetodoCobro?: number | null;
  fechaPago?: string;
  descripcion?: string;
  idCompra?: number;
  nombreMetodoCobro?: string | null;
}

/** Cobros paginados */
export interface CobrosPaginadosDTO {
  cobros: CobroDTO[];
  paginaActual: number;
  totalPaginas: number;
  totalElementos: number;
  elementosPorPagina: number;
  totalMonto: number;
  montoPendiente: number;
  montoPagado: number;
}

/** Resumen mensual de cobros */
export interface ResumenCobrosDTO {
  mes: number;
  anio: number;
  totalCobros: number;
  cantidadCobros: number;
  montoPendiente: number;
  montoPagado: number;
}

/** Filtros aplicables al listado de cobros */
export interface FiltrosCobrosDTO {
  idArtista?: number;
  estado?: string;
  tipoCobro?: string;
  tipoContenido?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  mes?: number;
  anio?: number;
  montoMinimo?: number;
  montoMaximo?: number;
  ordenarPor?: string;
  direccion?: string;
  pagina?: number;
  limite?: number;
}

/** Totales agregados de los cobros */
export interface TotalesDTO {
  totalIngresos: number;
  totalPendiente: number;
  totalPagado: number;
}

/**
 * Servicio para gestionar cobros y sus totales
 */
@Injectable({
  providedIn: 'root'
})
export class CobrosService {
  /** Cliente HTTP inyectado */
  private http = inject(HttpClient);

  /** URL base de la API de cobros */
  private apiUrl = `${environment.apis.contenidos}/cobros`;

  /**
   * Valida si un valor es considerado válido
   * Filtra: null, undefined, cadenas vacías, "undefined" y "null"
   * @param valor Valor a validar
   * @returns true si es válido
   */
  private esValorValido(valor: any): boolean {
    if (valor === null || valor === undefined) return false;
    if (typeof valor === 'string') {
      const trimmed = valor.trim().toLowerCase();
      return trimmed !== '' && trimmed !== 'undefined' && trimmed !== 'null';
    }
    return true;
  }

  /**
   * Lista los cobros aplicando filtros opcionales
   * @param filtros Filtros de búsqueda y paginación
   * @returns Observable con los cobros paginados
   */
  listarCobros(filtros: FiltrosCobrosDTO): Observable<CobrosPaginadosDTO> {
    let params = new HttpParams();

    Object.entries(filtros).forEach(([key, value]) => {
      if (this.esValorValido(value)) {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<CobrosPaginadosDTO>(this.apiUrl, { params }).pipe(
      map(response => ({
        ...response,
        cobros: response.cobros.map(cobro => ({
          ...cobro,
          nombreMetodoCobro: cobro.nombreMetodoCobro || 'Sin método asignado',
          idMetodoCobro: cobro.idMetodoCobro ?? null
        }))
      }))
    );
  }

  /**
   * Lista los cobros de un artista filtrando por mes y año
   * @param idArtista ID del artista
   * @param mes Mes (1-12)
   * @param anio Año
   * @param pagina Página de resultados (default 1)
   * @param limite Elementos por página (default 20)
   * @returns Observable con cobros paginados
   */
  listarCobrosPorMes(
    idArtista: number,
    mes: number,
    anio: number,
    pagina: number = 1,
    limite: number = 20
  ): Observable<CobrosPaginadosDTO> {
    const params = new HttpParams()
      .set('idArtista', idArtista.toString())
      .set('mes', mes.toString())
      .set('anio', anio.toString())
      .set('pagina', pagina.toString())
      .set('limite', limite.toString());

    return this.http.get<CobrosPaginadosDTO>(`${this.apiUrl}/mes`, { params }).pipe(
      map(response => ({
        ...response,
        cobros: response.cobros.map(cobro => ({
          ...cobro,
          nombreMetodoCobro: cobro.nombreMetodoCobro || 'Sin método asignado',
          idMetodoCobro: cobro.idMetodoCobro ?? null
        }))
      }))
    );
  }

  /**
   * Obtiene el resumen mensual de cobros de un artista
   * @param idArtista ID del artista
   * @returns Observable con arreglo de resúmenes por mes
   */
  obtenerResumenMensual(idArtista: number): Observable<ResumenCobrosDTO[]> {
    const params = new HttpParams().set('idArtista', idArtista.toString());
    return this.http.get<ResumenCobrosDTO[]>(`${this.apiUrl}/resumen-mensual`, { params });
  }

  /**
   * Obtiene totales de cobros de un artista
   * @param idArtista ID del artista
   * @returns Observable con totales agregados
   */
  obtenerTotales(idArtista: number): Observable<TotalesDTO> {
    const params = new HttpParams().set('idArtista', idArtista.toString());
    return this.http.get<any>(`${this.apiUrl}/totales`, { params }).pipe(
      map(response => ({
        totalIngresos: response.totalIngresos || 0,
        totalPendiente: response.totalPendiente || 0,
        totalPagado: response.totalPagado || 0
      }))
    );
  }

  /**
   * Marca todos los cobros de un método como pagados
   * @param idArtista ID del artista
   * @param idMetodoCobro ID del método de cobro
   */
  marcarComoPagados(idArtista: number, idMetodoCobro: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/marcar-pagados`, { idArtista, idMetodoCobro });
  }

  /**
   * Marca cobros específicos como pagados
   * @param idsCobros IDs de los cobros
   * @param idMetodoCobro ID del método de cobro
   */
  marcarCobrosEspecificosComoPagados(
    idsCobros: number[],
    idMetodoCobro: number
  ): Observable<any> {
    return this.http.post(`${this.apiUrl}/marcar-pagados-especificos`, { idsCobros, idMetodoCobro });
  }
}

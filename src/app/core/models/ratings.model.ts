export interface CrearValoracionDTO {
  tipoContenido: 'CANCION' | 'ALBUM';
  idCancion: number | null;
  idAlbum: number | null;
  valor: number;
}

export interface EditarValoracionDTO {
  valor: number;
}

export interface ValoracionDTO {
  idValoracion: number;
  idUsuario: number;
  tipoUsuario: string;
  nombreUsuario: string;
  tipoContenido: 'CANCION' | 'ALBUM';
  idContenido: number;
  valor: number;
  fechaValoracion: string;
  fechaUltimaEdicion: string | null;
  editada: boolean;
  tituloContenido: string;
  urlPortada: string;
}

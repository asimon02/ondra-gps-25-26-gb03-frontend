// src/app/features/user-profile/models/user-profile.model.ts

import { TipoUsuario } from '../../../core/models/auth.model';

export interface UserProfile {
  idUsuario: number;
  emailUsuario: string;
  nombreUsuario: string;
  apellidosUsuario: string;
  tipoUsuario: TipoUsuario;
  fotoPerfil: string | null;
  slug: string;
  activo: boolean;
  permiteGoogle: boolean;
  onboardingCompletado: boolean;
  googleUid?: string;
  emailVerificado: boolean;
  fechaRegistro: string | number[];

  // ✅ Campos específicos de artista
  idArtista?: number;  // ✅ AGREGAR ESTE CAMPO
  nombreArtistico?: string;
  biografiaArtistico?: string;
  slugArtistico?: string;
  fotoPerfilArtistico?: string;
}

export interface EditUserProfile {
  nombreUsuario?: string;
  apellidosUsuario?: string;
  fotoPerfil?: string;
}

export interface EditArtistaProfile {
  nombreArtistico?: string;
  biografiaArtistico?: string;
  fotoPerfilArtistico?: string;
}

export interface ChangePasswordRequest {
  passwordActual: string;
  nuevaPassword: string;
}

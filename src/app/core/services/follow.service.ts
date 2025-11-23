import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../enviroments/enviroment';

export interface FollowStats {
  followers: number;
  following: number;
}

@Injectable({
  providedIn: 'root'
})
export class FollowService {
  private readonly baseUrl = `${environment.apis.usuarios}/seguimientos`;

  constructor(private http: HttpClient) {}

  getStats(userId: string | number): Observable<FollowStats> {
    if (environment.useMock) {
      return of({ followers: 0, following: 0 });
    }

    return this.http.get<any>(`${this.baseUrl}/${userId}/estadisticas`).pipe(
      map(dto => ({
        followers: Number(dto?.seguidores ?? dto?.followers ?? 0),
        following: Number(dto?.seguidos ?? dto?.following ?? 0)
      }))
    );
  }

  isFollowing(userId: string | number): Observable<boolean> {
    if (environment.useMock) {
      return of(false);
    }
    return this.http.get<boolean>(`${this.baseUrl}/${userId}/verificar`);
  }

  follow(userId: string | number): Observable<void> {
    if (environment.useMock) {
      return of(void 0);
    }
    return this.http.post<void>(this.baseUrl, { idUsuarioASeguir: Number(userId) });
  }

  unfollow(userId: string | number): Observable<void> {
    if (environment.useMock) {
      return of(void 0);
    }
    return this.http.delete<void>(`${this.baseUrl}/${userId}`);
  }
}

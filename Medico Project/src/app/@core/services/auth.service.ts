import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private accessTokenKey = 'access_token';
  private refreshTokenKey = 'refresh_token';
  private refreshUrl = 'http://localhost:8000/api/token/refresh/';
  private loginUrl = 'http://localhost:8000/api/token/';

  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: { username: string; password: string }): Observable<any> {
    return this.http.post<any>(this.loginUrl, credentials).pipe(
      tap((res) => {
        if (res.access && res.refresh) {
          this.saveTokens(res.access, res.refresh);
          console.log('🔐 Tokens saved after login');
        } else {
          console.error('❌ Login response missing tokens');
        }
      })
    );
  }

  saveTokens(access: string, refresh: string) {
    localStorage.setItem(this.accessTokenKey, access);
    localStorage.setItem(this.refreshTokenKey, refresh);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.accessTokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  getUserRole(): string | null {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role || null;
    } catch (err) {
      console.error('❌ Failed to decode token:', err);
      return null;
    }
  }

  isAdmin(): boolean {
    return this.getUserRole() === 'admin';
  }

  isDoctor(): boolean {
    return this.getUserRole() === 'doctor';
  }

  isPatient(): boolean {
    return this.getUserRole() === 'patient';
  }

  getUserInfo():
    | {
        id: number;
        name: string;
        email?: string;
        role?: string;
        picture: string;
        phone?: string;
        country?: string;
        city?: string;
      }
    | null {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));

      const picture = payload.profile_picture
        ? payload.profile_picture.startsWith('http')
          ? payload.profile_picture
          : `http://localhost:8000/${payload.profile_picture.replace(/^\/?/, '')}`
        : 'assets/images/default-avatar.png';

      return {
        id: payload.user_id,
        name:
          `${payload.first_name || ''} ${payload.last_name || ''}`.trim() ||
          payload.username ||
          'User',
        email: payload.email || 'unknown',
        role: payload.role || 'unknown',
        picture,
        phone: payload.phone || '',
        country: payload.country || '',
        city: payload.city || '',
      };
    } catch (err) {
      console.error('❌ Error decoding token:', err);
      return null;
    }
  }

  isLoggedIn(): boolean {
    return !!this.getAccessToken() && !this.isAccessTokenExpired();
  }

  isAccessTokenExpired(): boolean {
    const token = this.getAccessToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp;
      const now = Math.floor(Date.now() / 1000);
      return exp < now;
    } catch {
      return true;
    }
  }

  refreshAccessToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return Promise.resolve(null);

    return new Promise((resolve, reject) => {
      this.http.post<any>(this.refreshUrl, { refresh: refreshToken }).subscribe({
        next: (res) => {
          if (res && res.access) {
            this.saveTokens(res.access, refreshToken);
            resolve(res.access);
          } else {
            this.clearSession();
            this.router.navigate(['/auth/login']);
            reject(null);
          }
        },
        error: (err: HttpErrorResponse) => {
          console.error('❌ Refresh token failed', err);
          this.clearSession();
          this.router.navigate(['/auth/login']);
          reject(null);
        },
      });
    });
  }

  async getValidAccessToken(): Promise<string | null> {
    if (!this.isAccessTokenExpired()) {
      return this.getAccessToken();
    }
    return await this.refreshAccessToken();
  }

  updateUserProfile(formData: FormData) {
    return this.http.patch('http://localhost:8000/api/profile/', formData);
  }

  clearSession(): void {
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
  }
}

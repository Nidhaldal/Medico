import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../@core/services/auth.service';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {}

intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
  const accessToken = this.authService.getAccessToken();

  const isAuthUrl = req.url.includes('/api/token') || req.url.includes('/auth/login');

  // ✅ Do not attach token to login or refresh URLs
  if (accessToken && !isAuthUrl) {
    req = this.addToken(req, accessToken);
  }

  return next.handle(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isAuthUrl) {
        return this.handle401Error(req, next);
      }
      return throwError(() => error);
    })
  );
}


  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      const refreshToken = this.authService.getRefreshToken();
      if (!refreshToken) {
        this.logoutAndRedirect();
        return throwError(() => new Error('No refresh token'));
      }

      return this.refreshAccessToken(refreshToken).pipe(
        switchMap((newAccessToken: string) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(newAccessToken);
          return next.handle(this.addToken(request, newAccessToken));
        }),
        catchError((err) => {
          this.isRefreshing = false;
          this.logoutAndRedirect();
          return throwError(() => err);
        })
      );
    } else {
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(token => next.handle(this.addToken(request, token!)))
      );
    }
  }

  private refreshAccessToken(refreshToken: string): Observable<string> {
    return this.http.post<any>('http://localhost:8000/api/token/refresh/', { refresh: refreshToken }).pipe(
      switchMap((res) => {
        const newAccess = res.access;
        if (newAccess) {
          this.authService.saveTokens(newAccess, refreshToken);
          console.log('[Interceptor] 🔄 Refreshed token:', newAccess);
          return of(newAccess);
        } else {
          return throwError(() => new Error('No access token in refresh response'));
        }
      })
    );
  }

  private logoutAndRedirect(): void {
    this.authService.clearSession();
    this.router.navigate(['/auth/login']);
  }
}

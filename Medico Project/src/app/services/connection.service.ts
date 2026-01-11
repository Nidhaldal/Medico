import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

// -----------------------------
// Interfaces
// -----------------------------
export interface Connection {
  id: number;
  from_user: number;
  from_user_username: string;
  from_user_profile_picture: string;
  to_user: number;
  to_user_username: string;
  to_user_profile_picture: string;
  link_type: string;
  status: 'pending' | 'accepted' | 'new' | 'deleted';
  created_at: string;
    seen?: boolean;
  updated_at: string;
    event?: string; // ✅ add this optional property

  from_user_profile_picture_url?: string;
  to_user_profile_picture_url?: string;
  from_user_role?: string;
  to_user_role?: string;
}

export interface CommunityUser {
  id: number;
  username: string;
  first_name: string;
  last_name?: string;
  role: string;
  profile_picture: string;
  profile_picture_url?: string;
  link_status: 'none' | 'pending' | 'connected';
}

@Injectable({
  providedIn: 'root',
})
export class ConnectionService {
private baseUrl = 'http://localhost:8000/api/user-links/';
  private mediaUrl = 'http://localhost:8000'; 

  constructor(private http: HttpClient) {}

  // -----------------------------
  // Helpers
  // -----------------------------
  private getToken(): string | null {
  
    return localStorage.getItem('access_token');
  }

  private getAuthHeaders() {
    const token = this.getToken();
    if (!token) return {};

    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }),
    };
  }

 private withProfileUrls<T extends { [key: string]: any }>(obj: T): T {
  const fixUrl = (url?: string) => {
    if (!url) return '';
    
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    
    return `${this.mediaUrl}${url}`;
  };

  return {
    ...obj,
    from_user_profile_picture_url: fixUrl(obj.from_user_profile_picture),
    to_user_profile_picture_url: fixUrl(obj.to_user_profile_picture),
    profile_picture_url: fixUrl(obj.profile_picture),
  };
}


  // -----------------------------
  // Current logged-in user ID from JWT
  // -----------------------------
  getCurrentUserId(): number | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload?.user_id || null;
    } catch (e) {
      console.error('Failed to parse JWT', e);
      return null;
    }
  }
  // -----------------------------
// Current logged-in user role from JWT
// -----------------------------
getCurrentUserRole(): 'patient' | 'doctor' | 'kine' | 'prothesist' | null {
  const token = this.getToken();
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    return payload?.role || null;
  } catch (e) {
    console.error('Failed to parse JWT for role', e);
    return null;
  }
}


  // -----------------------------
  // Get all connections
  // -----------------------------
  getConnections(): Observable<Connection[]> {
    const userId = this.getCurrentUserId();
    if (!userId) return of([]);

    return this.http.get<Connection[]>(`${this.baseUrl}my_links/`, this.getAuthHeaders()).pipe(
      map(connections => connections.map(c => this.withProfileUrls(c))),
      catchError(err => {
        console.error('Failed to fetch connections', err);
        return of([]);
      })
    );
  }

  // -----------------------------
  // Remove a connection
  // -----------------------------
  removeConnection(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}${id}/remove_link/`, this.getAuthHeaders()).pipe(
      catchError(err => {
        console.error('Failed to remove connection', err);
        return of(null);
      })
    );
  }

  // -----------------------------
  // Accept / Reject a connection
  // -----------------------------
  acceptConnection(id: number): Observable<Connection> {
    return this.http.post<Connection>(`${this.baseUrl}${id}/accept/`, {}, this.getAuthHeaders()).pipe(
      map(c => this.withProfileUrls(c)),
      catchError(err => {
        console.error('Failed to accept connection', err);
        return of(null as any);
      })
    );
  }

  rejectConnection(id: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}${id}/reject/`, {}, this.getAuthHeaders()).pipe(
      catchError(err => {
        console.error('Failed to reject connection', err);
        return of(null);
      })
    );
  }

  cancelConnection(id: number): Observable<any> {
  return this.http.post<any>(`${this.baseUrl}${id}/cancel/`, {}, this.getAuthHeaders()).pipe(
    catchError(err => {
      console.error('Failed to cancel connection', err);
      return of(null);
    })
  );
}


  // -----------------------------
  // Get all community users
  // -----------------------------
  getCommunityUsers(): Observable<CommunityUser[]> {
    const userId = this.getCurrentUserId();
    if (!userId) return of([]);

    return this.http.get<CommunityUser[]>(`${this.baseUrl}community/`, this.getAuthHeaders()).pipe(
      map(users =>
        users
          .filter(u => u.id !== userId)
          .map(u => this.withProfileUrls(u))
          .map(u => ({ ...u, link_status: u.link_status || 'none' }))
      ),
      catchError(err => {
        console.error('Failed to fetch community users', err);
        return of([]);
      })
    );
  }

  // -----------------------------
  // Create a new connection
  // -----------------------------
  createConnection(toUserId: number, linkType: string = 'doctor_patient'): Observable<Connection> {
    return this.http.post<Connection>(
      `${this.baseUrl}`,
      { to_user: toUserId, link_type: linkType },
      this.getAuthHeaders()
    ).pipe(
      map(c => this.withProfileUrls(c)),
      catchError(err => {
        console.error('Failed to create connection', err);
        return of(null as any);
      })
    );
  }


  // -----------------------------
// Notifications
// -----------------------------
getNotifications(): Observable<Connection[]> {
  return this.http
    .get<Connection[]>(`${this.baseUrl}notifications/`, this.getAuthHeaders())
    .pipe(
      map(notifs => notifs.map(n => this.withProfileUrls(n))),
      catchError(err => {
        console.error('Failed to fetch notifications', err);
        return of([]);
      })
    );
}
}


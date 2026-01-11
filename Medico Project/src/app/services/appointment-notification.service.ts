import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { WebSocketService } from './websocket.service';
import { AuthService } from '../@core/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AppointmentNotificationService {
  private wsUrl = 'ws://localhost:8000/ws/appointments/';

  constructor(
    private ws: WebSocketService,
    private authService: AuthService
  ) {}

  /**
   * Initialize the WebSocket connection for appointment notifications.
   */
  init(): void {
    const token = this.authService.getAccessToken();
    if (!token) {
      console.warn('⚠️ No JWT token found for WebSocket');
      return;
    }

    console.log('🚀 Initializing appointment WebSocket...');
    this.ws.connect(this.wsUrl, token);
  }

  /**
   * Observable to get appointment notifications for the current user.
   */
  getNotifications(): Observable<any> {
    const userInfo = this.authService.getUserInfo();
    const userRole = userInfo?.role;

    return this.ws.getMessages().pipe(
      filter((msg: any) => {
        // Must be appointment events
        if (!msg.event || !msg.event.startsWith('appointment_')) return false;

        // Role filtering: doctor only gets doctor-targeted events, patient gets patient-targeted
        if (msg.target && userRole) {
          return msg.target === userRole;
        }

        return true; // fallback if no target provided
      }),
      map((msg: any) => ({
        type: msg.event,
        appointment: msg.appointment,
        target: msg.target || null,
      }))
    );
  }

  /**
   * Send a message via WebSocket.
   */
  sendNotificationMessage(data: any): void {
    this.ws.sendMessage(data);
  }

  /**
   * Disconnect the WebSocket connection.
   */
  disconnect(): void {
    console.log('🔌 Disconnecting appointment WebSocket...');
    this.ws.disconnect();
  }
}

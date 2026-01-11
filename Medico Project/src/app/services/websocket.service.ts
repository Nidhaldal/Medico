import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket?: WebSocket;
  private messages$ = new Subject<any>();
  private reconnectDelay = 3000; 
  private reconnectTimeout?: any;

  connect(url: string, token: string): void {
    if (!token) {
      console.warn('⚠️ No token provided for WebSocket');
      return;
    }

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected, skipping...');
      return;
    }

    console.log(`📡 Connecting WebSocket to ${url} with token:`, token);

    this.socket = new WebSocket(`${url}?token=${token}`);

    this.socket.onopen = () => {
      console.info('✅ WebSocket connected');
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = undefined;
      }
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 WebSocket message received:', data);
        this.messages$.next(data);
      } catch (err) {
        console.error('❌ Invalid WebSocket message:', event.data, err);
      }
    };

    this.socket.onclose = (event) => {
      console.warn('⚠️ WebSocket closed', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean
      });
      this.scheduleReconnect(url, token);
    };

    this.socket.onerror = (err) => {
      console.error('❌ WebSocket error:', err);
      this.socket?.close(); 
    };
  }

  private scheduleReconnect(url: string, token: string) {
    if (!this.reconnectTimeout) {
      console.log(`⏳ Reconnecting WebSocket in ${this.reconnectDelay / 1000}s...`);
      this.reconnectTimeout = setTimeout(() => {
        this.connect(url, token);
      }, this.reconnectDelay);
    }
  }

  getMessages(): Observable<any> {
    return this.messages$.asObservable();
  }

  sendMessage(data: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('📤 Sending WebSocket message:', data);
      this.socket.send(JSON.stringify(data));
    } else {
      console.warn('⚠️ Cannot send message, WebSocket not open.');
    }
  }

  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting WebSocket');
      this.socket.close();
      this.socket = undefined;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }
  }
}

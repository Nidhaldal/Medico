import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from '../../@core/services/auth.service';

export interface WSMessage {
  id?: number;
  message: string;
  sender_id: number;
  sender_username: string;
  created_at?: string;
  read_by?: number[];
  tempId?: number;
  thread_id?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ChatWebsocketService {
  // One WebSocket per thread
  private sockets: { [threadId: number]: WebSocket } = {};
  private messagesMap: { [threadId: number]: WSMessage[] } = {};
  private messagesSubjects: { [threadId: number]: BehaviorSubject<WSMessage[]> } = {};
  private queue: { [threadId: number]: WSMessage[] } = {};
  private isConnected: { [threadId: number]: boolean } = {};

  constructor(private authService: AuthService) {}

  connect(threadId: number) {
    if (!this.messagesSubjects[threadId]) {
      this.messagesSubjects[threadId] = new BehaviorSubject<WSMessage[]>([]);
      this.messagesMap[threadId] = [];
      this.queue[threadId] = [];
      this.isConnected[threadId] = false;
    }

    if (this.sockets[threadId] && this.isConnected[threadId]) return;

    const token = this.authService.getAccessToken();
    if (!token) return console.warn('⚠️ No JWT token found for WebSocket');

    const wsUrl = `ws://localhost:8000/ws/chat/${threadId}/?token=${token}`;
    const ws = new WebSocket(wsUrl);
    this.sockets[threadId] = ws;

    ws.onopen = () => {
      this.isConnected[threadId] = true;
      console.info(`✅ WebSocket connected for thread ${threadId}`);
      // Send queued messages
      this.queue[threadId].forEach(msg => this.sendMessage(msg));
      this.queue[threadId] = [];
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const tid = data.thread?.id || data.thread_id || threadId;

        if (!this.messagesMap[tid]) this.messagesMap[tid] = [];
        if (!this.messagesSubjects[tid]) this.messagesSubjects[tid] = new BehaviorSubject<WSMessage[]>([]);

        const msg: WSMessage = {
          id: data.id,
          message: data.message || data.text || '',
          sender_id: data.sender?.id || data.sender_id,
          sender_username: data.sender?.username || data.sender_username,
          created_at: data.created_at || new Date().toISOString(),
          read_by: (data.read_by || []).map((u: any) => u.id),
          tempId: data.tempId,
          thread_id: tid
        };

        const threadMessages = this.messagesMap[tid];

        // Replace temp message if exists
        if (msg.tempId) {
          const index = threadMessages.findIndex(m => m.tempId === msg.tempId);
          if (index !== -1) threadMessages[index] = msg;
          else threadMessages.push(msg);
        } else {
          // Avoid duplicates
          if (!threadMessages.find(m => m.id === msg.id)) {
            threadMessages.push(msg);
          }
        }

        this.messagesSubjects[tid].next([...threadMessages]);
      } catch (err) {
        console.error('❌ Invalid WebSocket message:', event.data, err);
      }
    };

    ws.onclose = () => {
      this.isConnected[threadId] = false;
      console.warn(`⚠️ WebSocket closed for thread ${threadId}, reconnecting in 3s...`);
      setTimeout(() => this.connect(threadId), 3000);
    };

    ws.onerror = (err) => {
      console.error(`❌ WebSocket error for thread ${threadId}:`, err);
      ws.close();
    };
  }

  sendMessage(payload: WSMessage) {
    const threadId = payload.thread_id!;
    if (!this.isConnected[threadId] || !this.sockets[threadId]) {
      this.queue[threadId].push(payload);
      return;
    }
    this.sockets[threadId].send(JSON.stringify(payload));
  }

  disconnect(threadId: number) {
    if (this.sockets[threadId]) {
      this.sockets[threadId].close();
      this.isConnected[threadId] = false;
      delete this.sockets[threadId];
    }
  }

  getMessages(threadId: number) {
    return this.messagesMap[threadId] ? [...this.messagesMap[threadId]] : [];
  }

  getMessages$(threadId: number) {
    if (!this.messagesSubjects[threadId]) {
      this.messagesSubjects[threadId] = new BehaviorSubject<WSMessage[]>([]);
      this.messagesMap[threadId] = [];
      this.queue[threadId] = [];
      this.isConnected[threadId] = false;
    }
    return this.messagesSubjects[threadId].asObservable();
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';


export interface User {
  id: number;
  username: string;
}

export interface Message {
  id: number;
  text: string;          // matches serializer
  created_at: string; 
  sender: User;
  read_by: any[];
  thread?: number;  
    tempId?: number; // <-- add this
     // optional thread ID
}

export interface ThreadDetail {
  id: number;
  participants: User[];
  messages: Message[];
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private apiUrl = 'http://localhost:8000/api'; // adjust if your API URL differs

  constructor(private http: HttpClient) {}




  getThreadWithMessages(threadId: number): Observable<ThreadDetail> {
  return this.http.get<ThreadDetail>(`${this.apiUrl}/threads-with-messages/${threadId}/`).pipe(
    tap(thread => {
      console.log('🟢 [ChatService] Loaded thread:', thread);
      console.log('🟢 [ChatService] Messages:', thread.messages);
    })
  );
}

getOrCreateThreadWithUser(userId: number): Observable<ThreadDetail> {
  return this.http.get<ThreadDetail>(
    `${this.apiUrl}/threads-with-messages/get_or_create_with_user/`,
    { params: { user_id: userId.toString() } }
  ).pipe(
    tap(thread => {
      console.log('🟢 [ChatService] getOrCreateThreadWithUser:', thread);
      console.log('🟢 [ChatService] Messages:', thread.messages);
    })
  );
}


  // Send message via REST (for initial storage, WebSocket handles real-time)
  sendMessage(threadId: number, text: string): Observable<Message> {
    return this.http.post<Message>(`${this.apiUrl}/messages/`, {
      thread: threadId,
      text: text,
    });
  }

  // Mark all messages in thread as read
  markThreadRead(threadId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/threads/${threadId}/mark_read/`, {});
  }

 
}

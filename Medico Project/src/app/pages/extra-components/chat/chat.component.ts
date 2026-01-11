import {
  Component, Input, Output, EventEmitter,
  ElementRef, ViewChild, AfterViewChecked, OnInit, OnDestroy, NgZone
} from '@angular/core';
import { Subscription } from 'rxjs';
import { ChatWebsocketService, WSMessage } from '../../../extra-components/chat/chat-websocket.service';
import { ChatService, Message, ThreadDetail } from './chat.service';
import { AuthService } from '../../../@core/services/auth.service';

@Component({
  selector: 'ngx-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements AfterViewChecked, OnInit, OnDestroy {
  @Input() user: any;
  @Input() threadId!: number;
  @Output() close = new EventEmitter<void>();

  messages: Message[] = [];
  thread?: ThreadDetail;
  messageText: string = '';
  currentUserId?: number;

  private wsSub?: Subscription;
  private wsConnected: boolean = false;
  @ViewChild('chatBody') private chatBody!: ElementRef;

  constructor(
    private chatService: ChatService,
    private wsService: ChatWebsocketService,
    private authService: AuthService,
    private ngZone: NgZone
  ) {
    this.currentUserId = this.authService.getUserInfo()?.id;
  }

  ngOnInit() {
    if (this.threadId) {
      this.initChat(this.threadId);
    } else if (this.user?.id) {
      this.chatService.getOrCreateThreadWithUser(this.user.id).subscribe({
        next: (thread) => {
          if (!thread?.id) return console.error('Failed to get/create thread');
          this.threadId = thread.id;
          this.initChat(this.threadId);
        },
        error: console.error,
      });
    }
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  ngOnDestroy() {
    this.cleanupWebSocket();
  }

  /** Initialize chat: load messages + connect WS */
  private initChat(threadId: number) {
    this.loadThread(threadId);
    this.connectWebSocket(threadId);
  }

  /** Load past messages from API and normalize sender */
  private loadThread(threadId: number) {
    this.chatService.getThreadWithMessages(threadId).subscribe({
      next: (thread) => {
        console.log('🟢 [ChatService] Loaded thread:', thread);
        // normalize sender to always be an object { id, username }
        this.messages = (thread.messages || []).map(m => ({
          ...m,
          sender: typeof m.sender === 'object'
            ? m.sender
            : { id: m.sender, username: (m as any).sender_username || '' },
        }));
        this.thread = thread;

        console.log('🟢 [ChatService] Normalized messages:', this.messages);
        this.scrollToBottom();

        this.chatService.markThreadRead(threadId).subscribe({
          error: console.error,
        });
      },
      error: console.error,
    });
  }

  /** Connect WebSocket for real-time updates */
  private connectWebSocket(threadId: number) {
    // Cleanup old WS subscription before connecting
    this.cleanupWebSocket();

    this.wsService.connect(threadId);
    this.wsConnected = true;

    this.wsSub = this.wsService.getMessages$(threadId).subscribe((msgs: WSMessage[]) => {
      if (!msgs || !msgs.length) return;

      console.log(`🟢 [ChatComponent] WebSocket messages for thread ${threadId}:`, msgs);

      this.ngZone.run(() => {
        msgs.forEach(msg => {
          // Avoid duplicates: check existing ids and tempIds
          if (this.messages.find(m => m.id === msg.id || m.id === msg.tempId)) return;

          const newMessage: Message = {
            id: msg.id || msg.tempId,
            thread: threadId,
            sender: { id: msg.sender_id, username: msg.sender_username || '' },
            text: msg.message,
            created_at: msg.created_at || new Date().toISOString(),
            read_by: msg.read_by || [],
          };

          console.log('🟢 [ChatComponent] Adding new message:', newMessage);
          this.messages.push(newMessage);
        });

        this.scrollToBottom();
      });
    });
  }

  /** Send a new message instantly and via WS */
  sendMessage() {
    if (!this.threadId || !this.messageText.trim()) return;

    const userInfo = this.authService.getUserInfo();
    const tempId = Date.now();

    const localMsg: Message = {
      id: tempId,
      thread: this.threadId,
      sender: { id: userInfo.id, username: userInfo.name },
      text: this.messageText,
      created_at: new Date().toISOString(),
      read_by: [],
    };

    console.log('🟢 [ChatComponent] Sending local message:', localMsg);
    this.messages.push(localMsg);
    this.scrollToBottom();

    // Send through WebSocket
    this.wsService.sendMessage({
      message: this.messageText,
      sender_id: userInfo.id,
      sender_username: userInfo.name,
      tempId,
      thread_id: this.threadId,
    });

    this.messageText = '';
  }

  /** Scroll chat to bottom smoothly */
  private scrollToBottom(): void {
    try {
      const el = this.chatBody?.nativeElement;
      if (!el) return;

      this.ngZone.runOutsideAngular(() => {
        setTimeout(() => {
          el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
        }, 30);
      });
    } catch (e) {
      console.error('scrollToBottom error:', e);
    }
  }

  /** Cleanup WebSocket subscription safely */
  private cleanupWebSocket() {
    if (this.wsSub) {
      this.wsSub.unsubscribe();
      this.wsSub = undefined;
    }
    if (this.threadId && this.wsConnected) {
      this.wsService.disconnect(this.threadId);
      this.wsConnected = false;
    }
  }

  closeChat() {
    this.close.emit();
  }
}

import { Component, OnDestroy, OnInit,ElementRef } from '@angular/core';
import { NbThemeService, NbDialogService } from '@nebular/theme';
import { Router } from '@angular/router';
import { AppointmentService } from '../../services/appointment.service';
import { takeWhile, debounceTime } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { VideoCallComponent } from './video-call/video-call.component';
import { ChatWebsocketService } from '../../extra-components/chat/chat-websocket.service';
import { ChatService } from '../extra-components/chat/chat.service';
import { ConnectionService, Connection, CommunityUser } from '../../services/connection.service';
import { Message } from '../extra-components/chat/chat.service';  // <- make sure this is imported

interface OpenChat {
  user: CommunityUser;
  threadId: number;
  messages: Message[];
}

@Component({
  selector: 'ngx-dashboard',
  styleUrls: ['./dashboard.component.scss'],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit, OnDestroy {
  private alive = true;
  private searchSubject = new Subject<string>();


  connections: Connection[] = [];
  acceptedConnections: Connection[] = [];
  pendingConnections: Connection[] = [];
  filteredConnections: Connection[] = [];

  communityUsers: CommunityUser[] = [];
  filteredCommunityUsers: CommunityUser[] = [];

openChats: { user: CommunityUser; threadId: number; messages: Message[] }[] = [];

  userConnectionStatus: { [userId: number]: 'none' | 'pending' | 'connected' } = {};
  currentUserId: number | null = null;
  currentUserRole: 'patient' | 'doctor' | 'kine' | 'prothesist' | null = null;


  constructor(
    private themeService: NbThemeService,
    private connectionService: ConnectionService,
    private chatService: ChatService,
    private wsService: ChatWebsocketService,  // <-- add this

    private dialogService: NbDialogService,
    private router: Router, 
    private appointmentService: AppointmentService // <-- inject here


  ) {}

  ngOnInit() {
    this.currentUserId = this.connectionService.getCurrentUserId();
    this.currentUserRole = this.connectionService.getCurrentUserRole(); // <-- important


    if (!this.currentUserId) return;

    this.loadConnections();
    this.loadCommunityUsers();

    this.searchSubject
      .pipe(debounceTime(300), takeWhile(() => this.alive))
      .subscribe(query => this.filterCommunity(query));
  }

  // -----------------------------
  private loadConnections() {
    this.connectionService.getConnections().subscribe(
      (res: Connection[]) => {
        this.connections = res;
        this.acceptedConnections = this.connections.filter(c => c.status === 'accepted');
        this.pendingConnections = this.connections.filter(c => c.status === 'pending');
        this.filteredConnections = [...this.connections];
        this.updateCommunityUserStatuses();
      },
      err => console.error('Failed to load connections', err)
    );
  }

  private loadCommunityUsers() {
    this.connectionService.getCommunityUsers().subscribe(
      (res: CommunityUser[]) => {
        if (!this.currentUserId) return;

        this.communityUsers = res.filter(u => u.id !== this.currentUserId);
        this.filteredCommunityUsers = [...this.communityUsers];
        this.updateCommunityUserStatuses();
      },
      err => console.error('Failed to load community users', err)
    );
  }

  private updateCommunityUserStatuses() {
    if (!this.currentUserId) return;
    const newStatus: { [userId: number]: 'none' | 'pending' | 'connected' } = {};

    this.communityUsers.forEach(u => {
      const uid = Number(u.id);
      const link = this.connections.find(c =>
        (c.from_user === this.currentUserId && c.to_user === uid) ||
        (c.to_user === this.currentUserId && c.from_user === uid)
      );

      newStatus[uid] = link ? (link.status === 'pending' ? 'pending' : 'connected') : 'none';
    });

    this.userConnectionStatus = newStatus;
  }

  // ----------------------------- Connections Actions -----------------------------
  connectToUser(userId: number) {
    this.userConnectionStatus[userId] = 'pending';
    this.connectionService.createConnection(userId).subscribe(
      res => {
        if (!res) return;
        this.connections.push(res);
        this.pendingConnections.push(res);
        this.filteredConnections.push(res);
        this.updateCommunityUserStatuses();
      },
      err => this.userConnectionStatus[userId] = 'none'
    );
  }

  acceptConnection(id: number) {
    this.connectionService.acceptConnection(id).subscribe(res => {
      if (!res) return;
      this.connections = this.connections.map(c => c.id === id ? res : c);
      this.acceptedConnections = this.connections.filter(c => c.status === 'accepted');
      this.pendingConnections = this.connections.filter(c => c.status === 'pending');
      this.updateCommunityUserStatuses();
    });
  }

  rejectConnection(id: number) {
    this.connectionService.rejectConnection(id).subscribe(() => {
      this.connections = this.connections.filter(c => c.id !== id);
      this.pendingConnections = this.pendingConnections.filter(c => c.id !== id);
      this.updateCommunityUserStatuses();
    });
  }

  removeConnection(id: number) {
    this.connectionService.removeConnection(id).subscribe(() => {
      this.connections = this.connections.filter(c => c.id !== id);
      this.acceptedConnections = this.acceptedConnections.filter(c => c.id !== id);
      this.pendingConnections = this.pendingConnections.filter(c => c.id !== id);
      this.filteredConnections = this.filteredConnections.filter(c => c.id !== id);
      this.updateCommunityUserStatuses();
    });
  }

  cancelConnection(id: number) {
    this.connectionService.cancelConnection(id).subscribe(() => {
      this.connections = this.connections.filter(c => c.id !== id);
      this.pendingConnections = this.pendingConnections.filter(c => c.id !== id);
      this.updateCommunityUserStatuses();
    });
  }

  // ----------------------------- Search & Filtering -----------------------------
  onSearch(query: string) { this.searchSubject.next(query); }

  private filterCommunity(query: string) {
    const lower = query.toLowerCase();
    this.filteredCommunityUsers = this.communityUsers.filter(
      u => u.username.toLowerCase().includes(lower) ||
           (u.first_name && u.first_name.toLowerCase().includes(lower))
    );
  }

  // ----------------------------- Helpers -----------------------------
  getConnectionButtonStatus(userId: number): string {
    const status = this.userConnectionStatus[userId];
    if (status === 'none') return 'success';
    if (status === 'pending') return 'warning';
    return 'info';
  }

  getConnectionButtonLabel(userId: number): string {
    const status = this.userConnectionStatus[userId];
    if (status === 'none') return 'Connect';
    if (status === 'pending') return 'Pending';
    return 'Connected';
  }

  isConnectionButtonDisabled(userId: number): boolean {
    return this.userConnectionStatus[userId] !== 'none';
  }

  isConnected(userId: number): boolean {
    return this.acceptedConnections.some(
      c => (c.from_user === this.currentUserId && c.to_user === userId) ||
           (c.to_user === this.currentUserId && c.from_user === userId)
    );
  }

  get activeConnections(): Connection[] {
    return this.connections.filter(c => c.status === 'accepted');
  }

  get scrollableCommunityUsers(): CommunityUser[] {
    return this.filteredCommunityUsers;
  }
// ----------------------------- Open Chat -----------------------------
openChat(user: CommunityUser) {
  // Prevent opening multiple chats for the same user
  if (this.openChats.find(c => c.user.id === user.id)) return;

  // Get or create thread with this user
  this.chatService.getOrCreateThreadWithUser(user.id).subscribe({
    next: (thread) => {
      if (!thread || !thread.id) {
        console.error('Thread data is invalid', thread);
        return;
      }

      // Store the open chat with a messages array
      this.openChats.push({ user, threadId: thread.id, messages: [] });

      // Connect WebSocket for this thread
      this.wsService.connect(thread.id);

      // Subscribe to incoming messages for this thread
      this.subscribeThreadMessages(thread.id);
    },
    error: (err) => {
      console.error('Error opening chat', err);
    },
  });
}

// ----------------------------- Helper: Subscribe to Thread Messages -----------------------------
private subscribeThreadMessages(threadId: number) {
  this.wsService.getMessages$(threadId).subscribe(msgs => {
    if (!msgs) return;

    // Find the open chat for this thread
    const chat = this.openChats.find(c => c.threadId === threadId);
    if (!chat) return;

    msgs.forEach(msg => {
      // Avoid duplicates
      if (chat.messages.find(m => m.id === msg.id)) return;

      const newMessage: Message = {
        id: msg.id || Date.now(), // fallback for temp messages
        thread: threadId,
        sender: { id: msg.sender_id, username: msg.sender_username },
        text: msg.message,
        created_at: msg.created_at || new Date().toISOString(),
        read_by: msg.read_by || [],
      };

      chat.messages.push(newMessage);
    });
  });
}



bookAppointment(doctorId: number) {
  console.log('Navigating to appointments with doctor ID:', doctorId);
  this.router.navigate(['/pages/appointments'], { queryParams: { doctorId } });
}


  closeChat(chatUser: { user: CommunityUser; threadId: number }) {
    this.openChats = this.openChats.filter(c => c.user.id !== chatUser.user.id);
  }
 


  openVideoCall(userId: number): void {
  this.dialogService.open(VideoCallComponent, {
    context: { targetUserId: userId },
    closeOnBackdropClick: false,
    hasBackdrop: true,
  });
}


  isProfessional(role: string): boolean {
  return role === 'doctor' || role === 'kine' || role === 'prothesist';
}



  ngOnDestroy() {
    this.alive = false;
  }
}

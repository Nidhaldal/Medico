import { Component, ElementRef,Input, OnDestroy, OnInit } from '@angular/core';
import { NbDialogRef } from '@nebular/theme';
import { ConnectionService } from '../../../services/connection.service';

declare var JitsiMeetExternalAPI: any;

@Component({
  selector: 'ngx-video-call',
  templateUrl: './video-call.component.html',
  styleUrls: ['./video-call.component.scss']
})
export class VideoCallComponent implements OnInit, OnDestroy {
  @Input() targetUserId!: number;  // ✅ Add this line

  private domain = 'meet.jit.si';
  private api: any;
  room: string = '';

  constructor(
    protected dialogRef: NbDialogRef<VideoCallComponent>,
    private el: ElementRef,
    private connectionService: ConnectionService
  ) {}

  ngOnInit(): void {
    // get both users
    const currentUserId = this.connectionService.getCurrentUserId();
    const targetUserId = this.dialogRef.componentRef?.instance['context']?.targetUserId;

    // generate deterministic room name (both sides will match)
    this.room = this.generateRoomName(currentUserId, targetUserId);

    // start the call
    this.startVideoCall();
  }

  generateRoomName(userA: number, userB: number): string {
    if (!userA || !userB) return 'CommunityRoomDefault';
    const sorted = [userA, userB].sort((a, b) => a - b);
    return `CommunityRoom_${sorted[0]}_${sorted[1]}`;
  }

  startVideoCall(): void {
    const container = this.el.nativeElement.querySelector('#jitsi-container');
    const options = {
      roomName: this.room,
      width: '100%',
      height: 600,
      parentNode: container,
    };

    this.api = new JitsiMeetExternalAPI(this.domain, options);
  }

  endCall(): void {
    if (this.api) this.api.dispose();
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    if (this.api) this.api.dispose();
  }
}

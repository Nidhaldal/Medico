import { Component, OnInit, OnDestroy } from '@angular/core';
import { ConnectionService } from '../../services/connection.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'ngx-connections',
  templateUrl: './connections.component.html',
  styleUrls: ['./connections.component.scss'],
})
export class ConnectionsComponent implements OnInit, OnDestroy {
  connections: any[] = [];
  private destroy$ = new Subject<void>();

  constructor(private connectionService: ConnectionService) {}

  ngOnInit(): void {
    this.loadConnections();
  }

  // Fetch connections from backend
  loadConnections(): void {
    this.connectionService.getConnections()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (data) => (this.connections = data),
        (error) => console.error('Failed to load connections', error)
      );
  }

  // Remove a connection
  removeConnection(connectionId: number): void {
    if (!confirm('Are you sure you want to remove this connection?')) return;

    this.connectionService.removeConnection(connectionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        () => {
          // Remove locally to refresh UI
          this.connections = this.connections.filter(c => c.id !== connectionId);
        },
        (error) => console.error('Failed to remove connection', error)
      );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

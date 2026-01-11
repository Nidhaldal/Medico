import { Component, Input } from '@angular/core';

@Component({
  selector: 'ngx-interactive-progress-bar',
  templateUrl: './interactive-progress-bar.component.html',
  styleUrls: ['./interactive-progress-bar.component.scss'],
})
export class InteractiveProgressBarComponent {
  @Input() status: 'pending' | 'approved'| 'accepted' |  'rejected' = 'pending';

  get progressValue(): number {
    switch (this.status) {
      case 'pending': return 50;   // half bar
      case 'approved': return 100; // full bar
      case 'accepted': return 100;         // full bar for both

      case 'rejected': return 100; // full bar
      default: return 0;
    }
  }

  get progressStatus(): string {
    switch (this.status) {
      case 'pending': return 'warning';  // yellow
      case 'approved': return 'success'; // green
        case 'accepted': return 'success';   // green for both

      case 'rejected': return 'danger';  // red
      default: return 'primary';
    }
  }

  get progressLabel(): string {
    switch (this.status) {
      case 'pending': return 'Pending';
      case 'approved': return 'Success';
      case 'accepted': return 'Success';   // green for both
      case 'rejected': return 'Failed';
      default: return '';
    }
  }
}

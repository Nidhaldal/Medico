import { Component, Input } from '@angular/core';

@Component({
  selector: 'ngx-links-summary-card',
  templateUrl: './links-summary-card.component.html',
  styleUrls: ['./links-summary-card.component.scss'],
})
export class LinksSummaryCardComponent {
  @Input() totalSent = 0;
  @Input() totalReceived = 0;
  @Input() pendingSent = 0;
  @Input() pendingReceived = 0;
  @Input() acceptedSent = 0;
  @Input() acceptedReceived = 0;
  @Input() newThisMonthSent = 0;
  @Input() newThisMonthReceived = 0;
  @Input() loading = true;

  @Input() labels: string[] = [];
  @Input() sentData: number[] = [];
  @Input() receivedData: number[] = [];

  flipped = false;

  toggleView() {
    this.flipped = !this.flipped;
  }
}

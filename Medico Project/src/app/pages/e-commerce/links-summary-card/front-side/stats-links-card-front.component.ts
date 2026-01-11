import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { DetailedLinksSummary } from '../../../../@core/data/dashboard.service';

@Component({
  selector: 'ngx-stats-links-card-front',
  styleUrls: ['./stats-links-card-front.component.scss'],
  templateUrl: './stats-links-card-front.component.html',
})
export class StatsLinksCardFrontComponent implements OnChanges {
  private _linksSummary: DetailedLinksSummary | null = null;

  @Input()
  set linksSummary(value: DetailedLinksSummary | null) {
    this._linksSummary = value;
    this.loading = !value;
    this.showChart = !!value;
    console.log('🟢 StatsLinksCardFrontComponent linksSummary set:', value);
    console.log('🟢 loading:', this.loading, 'showChart:', this.showChart);
  }
  get linksSummary(): DetailedLinksSummary | null {
    return this._linksSummary;
  }

  @Input() loading = true;

  flipped = false;
  showChart = false;

  toggleView() {
    this.flipped = !this.flipped;
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('🟢 StatsLinksCardFrontComponent ngOnChanges', changes);
  }
}

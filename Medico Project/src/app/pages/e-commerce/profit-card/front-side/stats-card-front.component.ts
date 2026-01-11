import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { PatientSummary } from '../../../../@core/data/dashboard.service';

@Component({
  selector: 'ngx-stats-card-front',
  styleUrls: ['./stats-card-front.component.scss'],
  templateUrl: './stats-card-front.component.html',
})
export class StatsCardFrontComponent implements OnChanges {
  private _patientSummary: PatientSummary | null = null;

  @Input()
  set patientSummary(value: PatientSummary | null) {
    console.log('🟢 StatsCardFrontComponent patientSummary set:', value);
    this._patientSummary = value;
    this.loading = !value;
    console.log('🟢 StatsCardFrontComponent loading state:', this.loading);
  }
  get patientSummary(): PatientSummary | null {
    return this._patientSummary;
  }

  @Input() loading = true;

  ngOnChanges(changes: SimpleChanges) {
    console.log('🟢 StatsCardFrontComponent ngOnChanges', changes);
    if (changes.patientSummary) {
      console.log('🟢 patientSummary changed:', this.patientSummary);
    }
    if (changes.loading) {
      console.log('🟢 loading changed:', this.loading);
    }
  }
}

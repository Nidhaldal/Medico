import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { PatientSummary } from '../../../@core/data/dashboard.service';

@Component({
  selector: 'ngx-profit-card',
  templateUrl: './profit-card.component.html',
  styleUrls: ['./profit-card.component.scss'],
})
export class ProfitCardComponent implements OnChanges {
  @Input() patientSummary: PatientSummary | null = null;
  @Input() lastSixMonthsTotals: number[] = [];
  @Input() loading = true;
  @Input() userRole: string | null = null;

  flipped = false;

  showFront = false;
  showBack = false;

  constructor() {
    console.log('🟢 ProfitCardComponent constructor');
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('🟢 ProfitCardComponent ngOnChanges', changes);

    this.updateCardVisibility();

    // Auto-update loading to false when data arrives
    if (changes.lastSixMonthsTotals && this.lastSixMonthsTotals.length > 0) {
      this.loading = false;
      console.log('🟢 lastSixMonthsTotals received:', this.lastSixMonthsTotals);
    }

    if (changes.patientSummary && this.patientSummary) {
      console.log('🟢 patientSummary received:', this.patientSummary);
      this.loading = false;
    }
  }

  toggleView() {
    this.flipped = !this.flipped;
    console.log('🟢 toggleView called. Flipped:', this.flipped);
  }

  private updateCardVisibility() {
    const canShow = this.isAdmin() || this.isDoctor() || this.isProthesist();
    this.showFront = canShow;
    this.showBack = canShow;
  }

  isAdmin(): boolean { return this.userRole === 'admin'; }
  isDoctor(): boolean { return this.userRole === 'doctor'; }
  isProthesist(): boolean { return this.userRole === 'prothesist'; }
  isPatient(): boolean { return this.userRole === 'patient'; }
}

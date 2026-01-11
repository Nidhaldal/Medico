import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'ngx-stats-card-back',
  templateUrl: './stats-card-back.component.html',
  styleUrls: ['./stats-card-back.component.scss'],
})
export class StatsCardBackComponent implements OnChanges {
  @Input() points: number[] = [];
  @Input() loading = true;
  @Input() userRole: string | null = null;

  showChart = false;

  ngOnChanges(changes: SimpleChanges) {
  if (changes.points) {
    this.showChart = this.points && this.points.length > 0;
    this.loading = !this.showChart; // auto-update loading
    console.log('🟢 StatsCardBackComponent points:', this.points);
    console.log('🟢 showChart:', this.showChart);
    console.log('🟢 loading:', this.loading);
  }
}


  isAdmin(): boolean { return this.userRole === 'admin'; }
  isDoctor(): boolean { return this.userRole === 'doctor'; }
  isProthesist(): boolean { return this.userRole === 'prothesist'; }
}

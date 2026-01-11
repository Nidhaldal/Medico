import { Component, OnDestroy } from '@angular/core';
import { NbThemeService } from '@nebular/theme';
import { takeWhile } from 'rxjs/operators';
import { DashboardService, AppointmentsSummary } from '../../../@core/data/dashboard.service';

@Component({
  selector: 'ngx-user-activity',
  styleUrls: ['./user-activity.component.scss'],
  templateUrl: './user-activity.component.html',
})
export class ECommerceUserActivityComponent implements OnDestroy {

  private alive = true;

  appointmentsSummary: AppointmentsSummary = {
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
    growth: 0,
    deltaUp: true,
  };

  type = 'month'; // default period
  types = ['week', 'month', 'year'];
  currentTheme: string;

  constructor(private themeService: NbThemeService,
              private dashboardService: DashboardService) {

    this.themeService.getJsTheme()
      .pipe(takeWhile(() => this.alive))
      .subscribe(theme => {
        this.currentTheme = theme.name;
    });

    this.getAppointmentsSummary(this.type);
  }

  onPeriodChange(period: string) {
    this.type = period;
    this.getAppointmentsSummary(period);
  }

  getAppointmentsSummary(period: string) {
    this.dashboardService.getAppointmentsSummary(period)
      .pipe(takeWhile(() => this.alive))
      .subscribe(summary => {
        this.appointmentsSummary = summary;
      });
  }

  ngOnDestroy() {
    this.alive = false;
  }
}

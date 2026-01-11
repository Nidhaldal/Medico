import { Component, OnDestroy, OnInit } from '@angular/core';
import { NbMediaBreakpoint, NbMediaBreakpointsService, NbThemeService } from '@nebular/theme';
import { takeWhile } from 'rxjs/operators';
import { DashboardService } from '../../../@core/data/dashboard.service'; // <- use your service

@Component({
  selector: 'ngx-country-orders',
  styleUrls: ['./country-orders.component.scss'],
  template: `
    <nb-card [size]="breakpoint.width >= breakpoints.md ? 'medium' : 'giant'">
      <nb-card-header>Patient Nationality Statistics</nb-card-header>
      <nb-card-body>
        <ngx-country-orders-map (selectEvent)="selectCountryById($event)"
                                [countryId]="countryName">
        </ngx-country-orders-map>
        <ngx-country-orders-chart [countryName]="countryName"
                                  [data]="countryData"
                                  [labels]="['Patients']"
                                  [maxValue]="maxValue">
        </ngx-country-orders-chart>
      </nb-card-body>
    </nb-card>
  `,
})
export class CountryOrdersComponent implements OnInit, OnDestroy {

  private alive = true;

  countryName = 'USA';
  countryData: number[] = [];
  maxValue = 0;
  breakpoint: NbMediaBreakpoint = { name: '', width: 0 };
  breakpoints: any;

  constructor(
    private themeService: NbThemeService,
    private breakpointService: NbMediaBreakpointsService,
    private dashboardService: DashboardService
  ) {
    this.breakpoints = this.breakpointService.getBreakpointsMap();
  }

  ngOnInit() {
    this.themeService.onMediaQueryChange()
      .pipe(takeWhile(() => this.alive))
      .subscribe(([oldValue, newValue]) => this.breakpoint = newValue);

    // Load initial country data
    this.selectCountryById(this.countryName);
  }
  

  selectCountryById(countryCode: string) {
  this.countryName = countryCode;

  console.log(`[CountryOrders] Fetching data for country: ${countryCode}`);

  // Fetch patient count for this country from backend
  this.dashboardService.getPatientNationalityMap()
  .pipe(takeWhile(() => this.alive))
  .subscribe(map => {
    console.log('[CountryOrders] Raw map data from backend:', map);
    const count = map[this.countryName] || 0; // <-- make sure this.countryName matches backend keys
    this.countryData = [count];
    this.maxValue = count;
    console.log('[CountryOrders] Country:', this.countryName, 'Count:', count);
  });

}


  ngOnDestroy() {
    this.alive = false;
  }
}

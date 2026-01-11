import { AfterViewInit, Component, Input, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { NbThemeService } from '@nebular/theme';
import { takeWhile } from 'rxjs/operators';
import { LayoutService } from '../../../../@core/utils/layout.service';

@Component({
  selector: 'ngx-stats-links-card-back',
  template: `
    <div echarts
         [options]="options"
         class="echart"
         (chartInit)="onChartInit($event)">
    </div>
  `,
})
export class StatsLinksCardBackComponent implements AfterViewInit, OnDestroy, OnChanges {
  private alive = true;

  // 🆕 Accept full summary object
  @Input() linksSummary: any;
@Input() loading: boolean = true;

  // Chart-specific inputs
  labels: string[] = [];
  sentData: number[] = [];
  receivedData: number[] = [];

  echartsIntance: any;
  options: any = {};

  constructor(
    private theme: NbThemeService,
    private layoutService: LayoutService
  ) {
    this.layoutService.onSafeChangeLayoutSize()
      .pipe(takeWhile(() => this.alive))
      .subscribe(() => this.resizeChart());
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.linksSummary) {
      this.labels = this.linksSummary.labels || [];
      this.sentData = this.linksSummary.sentSeries || [];
      this.receivedData = this.linksSummary.receivedSeries || [];
      this.renderChart();
    }
  }

  ngAfterViewInit() {
    this.renderChart();
  }

  private renderChart() {
    this.theme.getJsTheme()
      .pipe(takeWhile(() => this.alive))
      .subscribe(config => {
        const chartVars: any = config.variables.profitBarAnimationEchart;
        this.setChartOption(chartVars);
      });
  }

  setChartOption(chartVars: any) {
    const maxVal = Math.max(...this.sentData, ...this.receivedData, 1);

    this.options = {
      color: [
        chartVars.firstAnimationBarColor || '#5A9BD5',
        chartVars.secondAnimationBarColor || '#ED7D31',
      ],
      grid: { left: 40, right: 40, top: 20, bottom: 20 },
      legend: { show: true },
      tooltip: { trigger: 'axis' },
      xAxis: [{ type: 'category', data: this.labels }],
      yAxis: [{ type: 'value', min: 0, max: maxVal * 1.1 }],
      series: [
        { name: 'Sent', type: 'bar', data: this.sentData },
        { name: 'Received', type: 'bar', data: this.receivedData },
      ],
    };
  }

  onChartInit(echarts: any) { this.echartsIntance = echarts; }
  resizeChart() { if (this.echartsIntance) this.echartsIntance.resize(); }
  ngOnDestroy(): void { this.alive = false; }
}

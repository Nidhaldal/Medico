import { Component, Input, OnInit, OnDestroy, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { NbThemeService } from '@nebular/theme';
import { LayoutService } from '../../../../@core/utils/layout.service';
import { takeWhile } from 'rxjs/operators';

@Component({
  selector: 'ngx-stats-area-chart',
  template: `
    <div echarts
         [options]="options"
         class="echart"
         (chartInit)="onChartInit($event)">
    </div>
  `,
})
export class StatsAreaChartComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {
  @Input() points: number[] = [];

  private alive = true;
  echartsInstance: any;
  options: any = {};

  constructor(private theme: NbThemeService, private layoutService: LayoutService) {}

  ngOnInit(): void {
    this.layoutService.onSafeChangeLayoutSize()
      .pipe(takeWhile(() => this.alive))
      .subscribe(() => this.resizeChart());
  }

  ngAfterViewInit(): void {
    this.renderChartIfReady();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.points && this.points && this.points.length) {
      this.renderChartIfReady();
    }
  }

  private renderChartIfReady() {
    if (!this.points || !this.points.length) return;

    this.theme.getJsTheme()
      .pipe(takeWhile(() => this.alive))
      .subscribe(config => {
        const themeVars = config?.variables?.aresLineEchart || {
          bg: '#fff',
          lineColor: '#3366FF',
          gradient: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(51,102,255,0.3)' }, { offset: 1, color: 'rgba(51,102,255,0)' }] },
          axisLineColor: '#ccc',
          textColor: '#333',
          splitLineColor: '#eee',
          tooltipBg: '#fff',
          tooltipTextColor: '#333',
        };
        this.setChartOptions(themeVars);
      });
  }
  private getLastSixMonthsLabels(): string[] {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = d.toLocaleString('default', { month: 'short' }); // e.g., "Oct"
    const year = d.getFullYear();
    months.push(`${monthName} ${year}`); // e.g., "Oct 2025"
  }
  return months;
}


  setChartOptions(chartVariables: any) {
    const maxPoint = Math.max(...this.points, 1);
    this.options = {
      backgroundColor: chartVariables.bg,
      tooltip: {
        trigger: 'axis',
        formatter: params => `${params[0]?.value ?? 0} Patients`,
        backgroundColor: chartVariables.tooltipBg,
        textStyle: { color: chartVariables.tooltipTextColor },
      },
      grid: { left: '0%', right: '0%', top: '0%', bottom: '0%', containLabel: true },
      xAxis: {
  type: 'category',
  boundaryGap: false,
  data: this.getLastSixMonthsLabels(),
  axisLine: { lineStyle: { color: chartVariables.axisLineColor } },
  axisLabel: { color: chartVariables.textColor },
},
      yAxis: {
        type: 'value',
        min: 0,
        max: maxPoint * 1.2, // ensures even small values are visible
        axisLine: { lineStyle: { color: chartVariables.axisLineColor } },
        splitLine: { lineStyle: { color: chartVariables.splitLineColor } },
        axisLabel: { color: chartVariables.textColor },
      },
      series: [
        {
          type: 'line',
          data: this.points,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          areaStyle: { color: chartVariables.gradient },
          lineStyle: { color: chartVariables.lineColor, width: 3 },
          itemStyle: { color: chartVariables.lineColor },
        },
      ],
    };
  }

  onChartInit(echarts) {
    this.echartsInstance = echarts;
  }

  resizeChart() {
    if (this.echartsInstance) this.echartsInstance.resize();
  }

  ngOnDestroy(): void {
    this.alive = false;
  }
}

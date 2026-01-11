import { AfterViewInit, Component, Input, OnDestroy } from '@angular/core';
import { NbThemeService } from '@nebular/theme';
import { takeWhile } from 'rxjs/operators';
import { LayoutService } from '../../../../@core/utils/layout.service';

@Component({
  selector: 'ngx-stats-bar-animation-chart',
  template: `
    <div echarts
         [options]="options"
         class="echart"
         (chartInit)="onChartInit($event)">
    </div>
  `,
})
export class StatsBarAnimationChartComponent implements AfterViewInit, OnDestroy {
  private alive = true;

  @Input() linesData: { firstLine: number[]; secondLine: number[] } = {
    firstLine: [],
    secondLine: [],
  };

  @Input() labels: string[] = ['Total Patients', 'New This Month'];

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

  ngAfterViewInit() {
    this.theme.getJsTheme()
      .pipe(takeWhile(() => this.alive))
      .subscribe(config => {
        const chartVars: any = config.variables.profitBarAnimationEchart;
        this.setChartOption(chartVars);
      });
  }
setChartOption(chartVariables: any) {
  const total = this.linesData.firstLine[0] || 0;
  const newCount = this.linesData.secondLine[0] || 0;

  const maxVal = Math.max(total, newCount, 1); // avoid zero max

  this.options = {
    color: [
      chartVariables.firstAnimationBarColor || '#5A9BD5',
      chartVariables.secondAnimationBarColor || '#ED7D31',
    ],

    grid: {
      left: 40,
      right: 40,
      top: 20,    // smaller top
      bottom: 20, // smaller bottom
    },

    legend: { show: false },

    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: chartVariables.tooltipBg || '#fff',
      borderColor: chartVariables.tooltipBorderColor || '#ccc',
      borderWidth: chartVariables.tooltipBorderWidth || 1,
      textStyle: {
        color: chartVariables.tooltipTextColor || '#333',
        fontSize: chartVariables.tooltipFontSize || 12,
      },
      formatter: (params) =>
        params
          .map((p) => `<b>${p.name}</b>: ${p.value} Patients`)
          .join('<br/>'),
    },

    xAxis: [
      {
        type: 'category',
        data: ['Total Patients', 'New This Month'],
        axisLine: { show: true, lineStyle: { color: chartVariables.textColor || '#666' } },
        axisLabel: { show: true, color: chartVariables.textColor || '#666' },
        axisTick: { show: false },
      },
    ],

    yAxis: [
      {
        type: 'value',
        min: 0,
        max: maxVal * 1.1, // give small padding above tallest bar
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        splitLine: {
          show: true,
          lineStyle: {
            color: chartVariables.splitLineStyleColor || '#ccc',
            opacity: chartVariables.splitLineStyleOpacity || 0.3,
            width: chartVariables.splitLineStyleWidth || 1,
          },
        },
      },
    ],

    series: [
      {
        name: 'Patients',
        type: 'bar',
        barWidth: '40%',
        barMinHeight: 5, // ensures very small bars are visible
        data: [total, newCount],
        itemStyle: {
          color: (params: any) =>
            params.dataIndex === 0
              ? chartVariables.firstAnimationBarColor
              : chartVariables.secondAnimationBarColor,
        },
        label: {
          show: true,
          position: 'top',
          color: chartVariables.textColor || '#333',
          fontWeight: 600,
          formatter: (params: any) => params.value,
        },
        animationDelay: (idx) => idx * 100,
      },
    ],

    barGap: '30%',
    animationEasing: 'elasticOut',
    animationDelayUpdate: (idx) => idx * 5,
  };
}

  onChartInit(echarts: any) {
    this.echartsIntance = echarts;
  }

  resizeChart() {
    if (this.echartsIntance) {
      this.echartsIntance.resize();
    }
  }

  ngOnDestroy(): void {
    this.alive = false;
  }
}

import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-calendar-day-cell',
  templateUrl: './calendar-day-cell.component.html',
  styleUrls: ['./calendar-day-cell.component.scss']
})
export class CalendarDayCellComponent {
  @Input() date: Date | null = null;
  @Input() hasAppointment: boolean = false;
}

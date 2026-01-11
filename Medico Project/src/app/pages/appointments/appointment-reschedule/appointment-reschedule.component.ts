import { Component, ViewChild, ElementRef, AfterViewInit, Input, ChangeDetectorRef, OnChanges, SimpleChanges } from '@angular/core';
import { NbDialogRef, NbDateService } from '@nebular/theme';

@Component({
  selector: 'app-appointment-reschedule',
  templateUrl: './appointment-reschedule.component.html',
  styleUrls: ['./appointment-reschedule.component.scss']
})
export class AppointmentRescheduleComponent implements AfterViewInit, OnChanges {

  @Input() appointment: any;

 // ✅ initialize with today's date instead of nulls
  range: { start: Date; end: Date } = {
    start: new Date(),
    end: new Date(),
  };
  
  hours: number[] = Array.from({ length: 24 }, (_, i) => i);
  minutes: number[] = Array.from({ length: 60 }, (_, i) => i);
  selectedHour: number = 0;
  selectedMinute: number = 0;
    minDate: Date = new Date();   


  @ViewChild('hourContainer') hourContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('minuteContainer') minuteContainer!: ElementRef<HTMLDivElement>;

  constructor(
    protected dialogRef: NbDialogRef<AppointmentRescheduleComponent>,
    protected dateService: NbDateService<Date>,
    private cdr: ChangeDetectorRef
  ) {}

ngOnChanges(changes: SimpleChanges) {
    if (changes['appointment'] && this.appointment?.scheduled_date) {
      const date = new Date(this.appointment.scheduled_date);

      // ✅ Always set valid Date objects
      this.range = { start: date, end: date };
      this.selectedHour = date.getHours();
      this.selectedMinute = date.getMinutes();
    } else if (!this.appointment?.scheduled_date) {
      // ✅ Fallback (avoid nulls)
      this.range = { start: new Date(), end: new Date() };
    }
  }


  ngAfterViewInit() {
    // Wrap in Promise to avoid NG0100
    if (this.range.start) {
      Promise.resolve().then(() => {
        this.scrollToHour(this.selectedHour);
        this.scrollToMinute(this.selectedMinute);
        this.cdr.detectChanges();
      });
    }
  }

  close() {
    this.dialogRef.close();
  }
save() {
  if (!this.range.start) {
    alert('Please select a date.');
    return;
  }

  // Build a new Date using selected date, hour, and minute
  const newDate = new Date(this.range.start);
  newDate.setHours(this.selectedHour, this.selectedMinute, 0, 0);

  // Prevent selecting past times
  if (newDate <= new Date()) {
    alert('Please select a future date and time.');
    return;
  }

  // ✅ Just use toISOString() — it will correctly send UTC to backend
  this.dialogRef.close({
    appointmentId: this.appointment.id,
    newDate: newDate.toISOString(),
    action: 'reschedule',
  });
}


  formatRange(): string {
    if (!this.range.start) return '';
    if (!this.range.end || this.range.start.getTime() === this.range.end.getTime()) {
      return this.range.start.toLocaleDateString();
    }
    return `${this.range.start.toLocaleDateString()} - ${this.range.end.toLocaleDateString()}`;
  }

  scrollToHour(hour: number) {
    if (this.hourContainer) this.hourContainer.nativeElement.scrollTo({ top: hour * 50, behavior: 'smooth' });
  }

  scrollToMinute(min: number) {
    if (this.minuteContainer) this.minuteContainer.nativeElement.scrollTo({ top: min * 50, behavior: 'smooth' });
  }

  selectHour(hour: number) { this.selectedHour = hour; this.scrollToHour(hour); }
  selectMinute(min: number) { this.selectedMinute = min; this.scrollToMinute(min); }

  onHourScroll(event: Event) {
    const el = event.target as HTMLElement;
    this.selectedHour = this.hours[Math.round(el.scrollTop / 50)];
  }

  onMinuteScroll(event: Event) {
    const el = event.target as HTMLElement;
    this.selectedMinute = this.minutes[Math.round(el.scrollTop / 50)];
  }
}

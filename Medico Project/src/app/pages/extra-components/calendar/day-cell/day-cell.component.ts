import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnDestroy, OnInit } from '@angular/core';
import { NbWindowService } from '@nebular/theme';
import { WindowFormComponent } from '../../../modal-overlays/window/window-form/window-form.component';
import { NbCalendarCell } from '@nebular/theme';
import { AppointmentService } from '../../../../services/appointment.service';
import { AppointmentMapService } from '../../../../services/appointment-map.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'ngx-day-cell',
  templateUrl: './day-cell.component.html',
  styleUrls: ['./day-cell.component.scss'],
})
export class DayCellComponent implements NbCalendarCell<Date, Date>, OnChanges, OnDestroy, OnInit {
  @Input() date: Date;
  @Input() context: any; // <-- nb-calendar passes this via [dayCellContext]
  
  @Output() appointmentAdded = new EventEmitter<any>();
  @Output() select: EventEmitter<Date> = new EventEmitter<Date>();

  doctorId: number | null = null;

  appointmentsMap: { [key: string]: { count: number; status: string } } = {};
  hasPending = false;
  private sub: Subscription;
  private doctorSub: Subscription;

  constructor(
    private windowService: NbWindowService,
    private appointmentMapService: AppointmentMapService,
    private appointmentService: AppointmentService,   // ✅ pull doctorId from here

  ) {
    this.sub = this.appointmentMapService.appointmentsMap$.subscribe(map => {
      this.appointmentsMap = map;
      this.updateStatus();
    });
  }

  ngOnInit(): void {
    // Subscribe to appointment map
    this.sub = this.appointmentMapService.appointmentsMap$.subscribe(map => {
      this.appointmentsMap = map;
      this.updateStatus();
    });

    // Subscribe to doctorId updates
    this.doctorSub = this.appointmentService.getPreselectedDoctorId().subscribe(id => {
      this.doctorId = id;
      console.log('DayCellComponent resolved doctorId:', this.doctorId);
    });
  }


  ngOnChanges(changes: SimpleChanges) {
    if (changes['date']) this.updateStatus();
    if (changes['context'] && this.context?.doctorId) {
      this.doctorId = this.context.doctorId;
    }
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  updateStatus() {
    if (!this.date) return;
    const cellDate = new Date(this.date.getFullYear(), this.date.getMonth(), this.date.getDate());
    const dateKey = cellDate.toDateString();
    this.hasPending = false;

    Object.keys(this.appointmentsMap).forEach(key => {
      const mapDate = new Date(this.appointmentsMap[key].count ? key : '');
      const normalizedMapDate = new Date(mapDate.getFullYear(), mapDate.getMonth(), mapDate.getDate());
      if (normalizedMapDate.toDateString() === dateKey && this.appointmentsMap[key].status === 'pending') {
        this.hasPending = true;
      }
    });
  }
openBookingModal(): void {
    if (!this.doctorId) {
      console.warn('No doctorId available when opening booking modal');
      return;
    }

    this.windowService.open(WindowFormComponent, {
      title: 'Book Appointment',
      context: {
        selectedDate: this.date.toISOString(),
        doctorId: this.doctorId,   // ✅ pass into modal
      },
    });
  }
  onClick() {
    if (!this.date) return;

    console.log('Opening window with doctorId (from context):', this.doctorId);

    const ref = this.windowService.open(WindowFormComponent, {
      title: 'Book Appointment',
      context: {
        selectedDate: this.date.toISOString(),
        doctorId: this.doctorId,  // ✅ now properly passed
      }
    });

    ref.onClose.subscribe(res => {
      if (res) this.appointmentAdded.emit(res);
    });

    this.select.emit(this.date);
  }
}

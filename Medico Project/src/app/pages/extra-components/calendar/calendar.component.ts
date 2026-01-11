import { Component, Input, ChangeDetectorRef, OnInit } from '@angular/core';
import { NbCalendarRange, NbDateService, NbWindowService } from '@nebular/theme';
import { AppointmentMapService } from '../../../services/appointment-map.service'; 
import { AppointmentService } from '../../../services/appointment.service';
import { WindowFormComponent } from '../../modal-overlays/window/window-form/window-form.component';

@Component({
  selector: 'ngx-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
})
export class CalendarComponent implements OnInit {
  @Input() role: 'patient' | 'doctor' | 'prothesist' = 'patient';
  @Input() doctorId: number | null = null; // optional input

  date = new Date();
  date2 = new Date();
  range: NbCalendarRange<Date>;
  appointments: any[] = [];
  minDate: Date = new Date();


  constructor(
    protected dateService: NbDateService<Date>,
    private cd: ChangeDetectorRef,
    private appointmentMapService: AppointmentMapService,
    private appointmentService: AppointmentService,
    private windowService: NbWindowService,
  ) {
    this.range = {
      start: this.dateService.addDay(this.monthStart, 3),
      end: this.dateService.addDay(this.monthEnd, -3),
    };
  }

  ngOnInit() {

    if (!this.doctorId) {
      this.doctorId = this.appointmentService.getPreselectedDoctorIdValue();
    }
    this.loadAppointments();
  }

  get monthStart(): Date {
    return this.dateService.getMonthStart(new Date());
  }

  get monthEnd(): Date {
    return this.dateService.getMonthEnd(new Date());
  }

  loadAppointments() {
    this.appointmentService.getAppointments().subscribe(appts => {
      console.log('Appointments fetched:', appts);
      this.appointments = appts;

      const map: { [key: string]: { count: number; status: 'pending' } } = {};

      appts.forEach(appt => {
        const date = new Date(appt.scheduled_date);
        const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dateKey = localDate.toDateString();

        if (!map[dateKey]) map[dateKey] = { count: 0, status: 'pending' };
        map[dateKey].count++;
      });

      this.appointmentMapService.setMap(map);
    });
  }

  onAppointmentAdded(appointment: any) {
    this.appointments.push(appointment);

    const date = new Date(appointment.scheduled_date);
    const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dateKey = localDate.toDateString();

    this.appointmentMapService.increment(dateKey, 'pending');
    this.cd.detectChanges();
  }

  // Directly open booking modal on date selection
  onDateChange(selectedDate: Date) {
  this.date2 = selectedDate;
  console.log('Selected date changed:', selectedDate);

  const doctorIdToUse = this.doctorId ?? this.appointmentService.getPreselectedDoctorIdValue();
  if (!doctorIdToUse) {
    alert('No doctor selected for booking.');
    return;
  }

  // ✅ Force 9 AM local time
  const fixedDate = new Date(selectedDate);
  fixedDate.setHours(9, 0, 0, 0); // 9:00:00 AM local

  const ref = this.windowService.open(WindowFormComponent, {
    title: 'Book Appointment',
    context: {
      selectedDate: fixedDate, // pass Date object, not ISO string
      doctorId: doctorIdToUse,
    },
  });

  ref.onClose.subscribe(res => {
    if (res) this.onAppointmentAdded(res);
  });
}

}

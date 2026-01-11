import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { AppointmentService } from '../../services/appointment.service';
import { AppointmentNotificationService } from '../../services/appointment-notification.service';

import { ActivatedRoute } from '@angular/router';
import { NbDialogService } from '@nebular/theme';
import { AppointmentRescheduleComponent } from './appointment-reschedule/appointment-reschedule.component';

@Component({
  selector: 'app-appointments-page',
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AppointmentsPageComponent implements OnInit {

  appointments: any[] = [];
  loading: boolean = true;
  preselectedDoctorId: number | null = null;

  selectedDate: string | null = null;
  reason: string = '';
  currentUserRole: string | null = null;
    minDate: Date = new Date();  // today = minimum allowed date


  constructor(
    private appointmentService: AppointmentService,
    private appointmentNotifService: AppointmentNotificationService,
    private route: ActivatedRoute,
    private dialogService: NbDialogService
  ) {}

  // -----------------------------
  // User role extraction from JWT
  // -----------------------------
  getCurrentUserRole(): string | null {
    const token = localStorage.getItem('access_token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload?.role || null;
    } catch (e) {
      console.error('Failed to parse JWT', e);
      return null;
    }
  }

  ngOnInit(): void {
    // 1️⃣ Fetch initial appointments
    this.fetchAppointments();

    // 2️⃣ Get current user role
    this.currentUserRole = this.getCurrentUserRole();

    // 3️⃣ Handle preselected doctor from query params
    this.route.queryParams.subscribe(params => {
      const doctorId = params['doctorId'];
      this.preselectedDoctorId = doctorId ? +doctorId : null;
      this.appointmentService.setPreselectedDoctorId(this.preselectedDoctorId);
    });

    // 4️⃣ Initialize WebSocket notifications
    this.appointmentNotifService.init();
    this.appointmentNotifService.getNotifications().subscribe((notif) => {
      if (!notif || !notif.appointment) return;

      // --- Live update appointments array ---
      const existingIndex = this.appointments.findIndex(a => a.id === notif.appointment.id);

      if (notif.type === 'appointment_created') {
        if (existingIndex === -1) this.appointments.unshift(notif.appointment);
      } else if (notif.type === 'appointment_updated') {
        if (existingIndex > -1)this.appointments[existingIndex] = { ...notif.appointment };
      } else if (notif.type === 'appointment_deleted') {
        if (existingIndex > -1) this.appointments.splice(existingIndex, 1);
      }

      // Optional: log notification
      console.log('🔔 Live appointment event:', notif);
    });
  }

  // -----------------------------
  // Fetch appointments from backend
  // -----------------------------
  fetchAppointments() {
    this.loading = true;
    this.appointmentService.getAppointments().subscribe({
      next: (res) => {
        this.appointments = res;
        console.log('🩺 Fetched appointments:', this.appointments);

        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching appointments:', err);
        this.loading = false;
      }
    });
  }

  // -----------------------------
  // Appointment booking
  // -----------------------------
bookWithDoctor() {
  if (!this.preselectedDoctorId) return alert('Please select a doctor.');
  if (!this.selectedDate || !this.reason.trim()) return alert('Please select a date and enter a reason.');

  // Convert selectedDate to Date object
  const pickedDate = new Date(this.selectedDate);

  // Force fixed 9 AM local time
  pickedDate.setHours(9, 0, 0, 0);

  const payload = {
    doctor: this.preselectedDoctorId,
    scheduled_date: pickedDate.toISOString(), // backend gets UTC ISO
    reason: this.reason.trim(),
  };

  console.log('📤 Sending appointment payload:', payload);

  this.appointmentService.createAppointment(payload).subscribe({
    next: (res) => {
      alert('Appointment successfully booked!');
      this.selectedDate = null;
      this.reason = '';
    },
    error: (err) => {
      alert(err.error?.detail || 'Failed to book appointment. Please try again.');
    }
  });
}





  // -----------------------------
  // Helpers
  // -----------------------------
  getProgressValue(status: string): number {
    switch (status) {
      case 'pending': return 25;
      case 'accepted': return 75;
      case 'approved': return 75;
      case 'reschedule_pending': return 25;
      case 'rejected': return 0;
      default: return 25;
    }
  }

  getMonthlyAppointmentsCount(): number {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    return this.appointments.filter(app => {
      const date = new Date(app.scheduled_date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;
  }

  getAppointmentsForDay(day: Date) {
    return this.appointments.filter(app => {
      const appDate = new Date(app.scheduled_date);
      return appDate.getFullYear() === day.getFullYear() &&
             appDate.getMonth() === day.getMonth() &&
             appDate.getDate() === day.getDate();
    });
  }

  isProfessionalUser(): boolean {
    return ['doctor', 'kine', 'prothesist'].includes(this.currentUserRole || '');
  }

  // -----------------------------
  // Accept / reject appointments
  // -----------------------------
  acceptAppointment(appointment: any) {
    this.appointmentService.acceptAppointment(appointment.id).subscribe({
      next: (res) => {
        if (res?.status) appointment.status = res.status; // update local copy
      },
      error: (err) => console.error(err)
    });
  }

  rejectAppointment(appointment: any) {
    this.appointmentService.rejectAppointment(appointment.id).subscribe({
      next: (res) => {
        const index = this.appointments.findIndex(a => a.id === appointment.id);
        if (index > -1) this.appointments.splice(index, 1); // remove locally
      },
      error: (err) => console.error(err)
    });
  }

  getLocalDate(utcDate: string | Date | null): string {
  if (!utcDate) return 'Not set';
  const dateObj = new Date(utcDate);

  // ✅ FIX: add timezone offset instead of subtracting
  const localDate = new Date(dateObj.getTime() + dateObj.getTimezoneOffset() * 60000);

  return localDate.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}


  // -----------------------------
  // Reschedule
  // -----------------------------
openRescheduleDialog(appointment: any) {
  const ref = this.dialogService.open(AppointmentRescheduleComponent, { context: { appointment } });

  ref.onClose.subscribe((result: { appointmentId: number; newDate?: string; action?: string } | undefined) => {
    if (result?.action === 'reschedule' && result.newDate) {
      this.appointmentService.rescheduleAppointment(result.appointmentId, result.newDate, true).subscribe({
        next: (updated: any) => {  // 👈 allow flexible structure
          const fixed = (updated && updated.appointment) ? updated.appointment : updated;
          console.log('🔄 Updated appointment after reschedule (fixed):', fixed);

          const index = this.appointments.findIndex(a => a.id === result.appointmentId);
          if (index > -1) this.appointments[index] = fixed;
        },
        error: (err) => console.error(err)
      });
    }
  });
}


  confirmReschedule(appointment: any, decision: 'accept' | 'reject') {
    this.appointmentService.confirmReschedule(appointment.id, decision).subscribe({
      next: (res) => {
        const index = this.appointments.findIndex(a => a.id === appointment.id);
        if (decision === 'reject' && index > -1) this.appointments.splice(index, 1);
        else if (decision === 'accept' && index > -1) this.appointments[index].status = 'accepted';
      },
      error: (err) => console.error(err),
    });
  }
}

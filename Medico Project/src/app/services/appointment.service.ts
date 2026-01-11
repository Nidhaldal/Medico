import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable ,   throwError,BehaviorSubject } from 'rxjs';
import { catchError } from 'rxjs/operators';



@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private baseUrl = 'http://localhost:8000/api/appointments/';

  private preselectedDoctorId$ = new BehaviorSubject<number | null>(null);


  constructor(private http: HttpClient) {}


    // expose setter/getter for other components to use
  setPreselectedDoctorId(id: number | null) {
    this.preselectedDoctorId$.next(id);
  }

  getPreselectedDoctorId(): Observable<number | null> {
    return this.preselectedDoctorId$.asObservable();
  }

  // synchronous helper (for quick fallback reads)
  getPreselectedDoctorIdValue(): number | null {
    return this.preselectedDoctorId$.value;
  }

  // GET all appointments (list endpoint)
  getAppointments(): Observable<any> {
    return this.http.get(`${this.baseUrl}list/`);
  }

  // GET appointment by id (you might need a separate endpoint in backend)
  getAppointment(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}${id}/`);
  }

createAppointment(data: any): Observable<any> {
  // Use the doctor field already in the data payload
  const payload = { ...data }; 

  console.log("📤 Sending appointment payload:", payload);

  return this.http.post(this.baseUrl, payload).pipe(
    catchError(err => {
      console.error('Booking API error — debug only', err);
      return throwError(() => err);
    })
  );
}


// Debug logging for booking attempts
logAppointmentAttempt(doctorId: number, patientId: number) {
  return this.http.post(`http://localhost:8000/api/log-appointment-attempt/`, {
    doctor_id: doctorId,
    patient_id: patientId
  });
}


  // UPDATE appointment status
  updateAppointmentStatus(id: number, status: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}${id}/status/`, { status });
  }

  // DELETE appointment (optional, backend may not support)
  deleteAppointment(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}${id}/`);
  }

// Accept
acceptAppointment(id: number): Observable<any> {
  return this.updateAppointmentStatus(id, 'accepted');
}

// Reject
rejectAppointment(id: number): Observable<any> {
  return this.updateAppointmentStatus(id, 'rejected');
}

rescheduleAppointment(id: number, newDate: Date | string, markPending: boolean = false) {
  // Ensure we have a Date object
  const dateObj = typeof newDate === 'string' ? new Date(newDate) : newDate;

  // Prepare payload
  const payload: any = {
    date: dateObj.toISOString().split('T')[0],   // "YYYY-MM-DD"
    hour: dateObj.getHours().toString(),         // "HH"
    minute: dateObj.getMinutes().toString(),     // "MM"
  };

  // If doctor confirms after reschedule, mark as pending
  if (markPending) {
    payload.status = 'reschedule_pending';
  }

  console.log('📤 Sending RESCHEDULE payload:', payload);

  return this.http.patch(`${this.baseUrl}${id}/reschedule/`, payload);
}
// inside AppointmentService
confirmReschedule(appointmentId: number, decision: 'accept' | 'reject'): Observable<any> {
  return this.http.patch(`${this.baseUrl}${appointmentId}/confirm-reschedule/`, {
    decision
  });
}


}

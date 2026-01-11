import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NbWindowRef, NB_WINDOW_CONTEXT } from '@nebular/theme';
import { AppointmentService } from '../../../../services/appointment.service';

@Component({
  template: `
    <form [formGroup]="appointmentForm" (ngSubmit)="submit()" class="form">
      <label for="subject">Subject:</label>
      <input nbInput id="subject" type="text" formControlName="subject" placeholder="Short description" />

      <label for="details">Details:</label>
      <textarea nbInput id="details" formControlName="details" placeholder="Describe your symptoms"></textarea>

      <button nbButton status="success" type="submit" [disabled]="appointmentForm.invalid">Book Appointment</button>
      <button nbButton status="danger" type="button" (click)="close()">Cancel</button>
    </form>
  `,
  styleUrls: ['./window-form.component.scss'],
})
export class WindowFormComponent implements OnInit {
  appointmentForm: FormGroup;
  selectedDate: string;
  doctorId: number | null = null; // ✅ store doctorId here

  constructor(
    public windowRef: NbWindowRef,
    private fb: FormBuilder,
    private appointmentService: AppointmentService,
    @Inject(NB_WINDOW_CONTEXT) private context: any // contains selectedDate & doctorId
  ) {
    this.selectedDate = context?.selectedDate || new Date().toISOString();
    this.doctorId = context?.doctorId || null;

    console.log('WindowFormComponent received context:', context);
    console.log('Resolved doctorId in WindowFormComponent:', this.doctorId);
  }

  ngOnInit() {
    this.appointmentForm = this.fb.group({
      subject: ['', Validators.required],
      details: ['', Validators.required],
    });
  }

  submit() {
    if (this.appointmentForm.invalid) return;

    if (!this.doctorId) {
      alert('Error: Doctor ID is missing. Cannot book appointment.');
      return;
    }

    const { subject, details } = this.appointmentForm.value;

    const payload = {
      doctor: this.doctorId,           // ✅ send correct doctor ID
      scheduled_date: this.selectedDate,
      reason: `[${subject}] ${details}`,
    };

    console.log('📤 Sending appointment payload:', payload);

    this.appointmentService.createAppointment(payload).subscribe({
      next: (res) => {
        console.log('Appointment created', res);
        this.windowRef.close(res); // emit to CalendarComponent
      },
      error: (err) => {
        console.error('Error creating appointment', err);
        alert('Failed to book appointment. Please try again.');
      },
    });
  }

  close() {
    this.windowRef.close();
  }
}

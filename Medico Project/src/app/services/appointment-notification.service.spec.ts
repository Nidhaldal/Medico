import { TestBed } from '@angular/core/testing';

import { AppointmentNotificationService } from './appointment-notification.service';

describe('AppointmentNotificationService', () => {
  let service: AppointmentNotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AppointmentNotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentsPageComponent } from './appointments.component';
import { AppointmentsRoutingModule } from './appointments-routing.module';

import { NbCardModule, NbButtonModule, NbInputModule, NbDatepickerModule, NbDialogModule } from '@nebular/theme';
import { ExtraComponentsModule } from '../extra-components/extra-components.module';
import { AppointmentRescheduleComponent } from './appointment-reschedule/appointment-reschedule.component';

@NgModule({
  declarations: [
    AppointmentsPageComponent,
    AppointmentRescheduleComponent,
  ],
  imports: [
    CommonModule,
    AppointmentsRoutingModule,
    NbCardModule,
    NbButtonModule,
    NbInputModule,             // ✅ For nbInput
    NbDatepickerModule.forRoot(), // ✅ For nb-datepicker & nb-rangepicker
    NbDialogModule.forChild(),    // ✅ For opening dialogs
    ExtraComponentsModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // ✅ Prevent Angular unknown element errors
})
export class AppointmentsModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { NbMenuModule, NbToastrModule, NbCardModule, NbButtonModule } from '@nebular/theme';
import { RecaptchaModule } from 'ng-recaptcha';

import { ThemeModule } from '../@theme/theme.module';
import { PagesRoutingModule } from './pages-routing.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ECommerceModule } from './e-commerce/e-commerce.module';
import { MiscellaneousModule } from './miscellaneous/miscellaneous.module';
import { ProfileModule } from './profile/profile.module';

import { PagesComponent } from './pages.component';
import { AppointmentsPageComponent } from './appointments/appointments.component';
import { ExtraComponentsModule } from './extra-components/extra-components.module'; 
import { AppointmentsModule } from './appointments/appointments.module';

@NgModule({
  imports: [
    PagesRoutingModule,
    ThemeModule,
    NbMenuModule,
    DashboardModule,
    ECommerceModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    NbToastrModule.forRoot(),
    RecaptchaModule,
    MiscellaneousModule,
    ProfileModule,
    NbCardModule,
    NbButtonModule,
    ExtraComponentsModule,
    AppointmentsModule 
  ],
  declarations: [
    PagesComponent,
  ],
})
export class PagesModule {}

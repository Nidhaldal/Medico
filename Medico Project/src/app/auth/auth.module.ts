import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { NbLayoutModule } from '@nebular/theme'; // 
import { AuthLayoutComponent } from './auth-layout/auth-layout.component';
import { NbSelectModule } from '@nebular/theme';
import { FormsModule } from '@angular/forms';

import { HttpClientModule } from '@angular/common/http';
import { AuthRoutingModule } from './auth-routing.module';
import { RecaptchaModule } from 'ng-recaptcha';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';


import { NbInputModule, NbButtonModule, NbCardModule, NbToastrModule } from '@nebular/theme';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
@NgModule({
  declarations: [
    LoginComponent,
        AuthLayoutComponent,
    ResetPasswordComponent,

    RegisterComponent,
     ResetPasswordComponent,

  
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    AuthRoutingModule,
    NbInputModule,
    NbButtonModule,
        FormsModule,

    NbCardModule,
    NbSelectModule,
    NbToastrModule,
     RecaptchaModule,
    NbLayoutModule

  ]
})
export class AuthModule {}

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppointmentsPageComponent } from './appointments.component'; 
import { AuthGuard } from '../../auth/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: AppointmentsPageComponent,
    canActivate: [AuthGuard], // protect with your existing guard
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AppointmentsRoutingModule {}

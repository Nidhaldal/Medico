import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileComponent } from './profile.component';
import { ProfileRoutingModule } from './profile-routing.module';
import { ReactiveFormsModule, FormsModule } from '@angular/forms'; // ✅ Import this

import { NbCardModule } from '@nebular/theme';
import { ThemeModule } from '../../@theme/theme.module';

@NgModule({
  declarations: [ProfileComponent],
  imports: [CommonModule,ReactiveFormsModule, // ✅ Add this
    FormsModule, NbCardModule,ThemeModule, ProfileRoutingModule, 
],
})
export class ProfileModule {}

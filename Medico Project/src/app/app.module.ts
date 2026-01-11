import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { AuthInterceptor } from './auth/auth.interceptor';
import { CoreModule } from './@core/core.module';
import { ThemeModule } from './@theme/theme.module';
import { AppComponent } from './app.component';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { environment } from '../environments/environment';

import { AppRoutingModule } from './app-routing.module';
import {
  NbChatModule,
  NbDatepickerModule,
  NbDialogModule,
   NbCardModule, NbButtonModule, NbIconModule,
  NbMenuModule,
  NbSidebarModule,
  NbToastrModule,
  NbWindowModule,
} from '@nebular/theme';
import { ConfirmDialogComponent } from './shared/confirm-dialog/confirm-dialog.component';
import { CalendarDayCellComponent } from './calendar-day-cell/calendar-day-cell.component';
import { CommunityComponent } from './components/community/community.component';
import { UserSearchComponent } from './components/user-search/user-search.component';
import { UserCardComponent } from './components/user-card/user-card.component';
import { ConnectionsComponent } from './components/connections/connections.component';

@NgModule({
  declarations: [AppComponent, ConfirmDialogComponent, CalendarDayCellComponent, CommunityComponent, UserSearchComponent, UserCardComponent, ConnectionsComponent, ],
  imports: [
    BrowserModule,
     provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideAuth(() => getAuth()),
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutingModule,
    NbCardModule,
    NbButtonModule,
    NbIconModule,
    NbSidebarModule.forRoot(),
    NbMenuModule.forRoot(),
    NbDatepickerModule.forRoot(),
    NbDialogModule.forRoot(),
    NbWindowModule.forRoot(),
    NbToastrModule.forRoot(),
    NbChatModule.forRoot({
      messageGoogleMapKey: 'AIzaSyA_wNuCzia92MAmdLRzmqitRGvCF7wCZPY',
    }),
    CoreModule.forRoot(),
    ThemeModule.forRoot(),
  ],
   providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    }, ],
  bootstrap: [AppComponent], 
})
export class AppModule {
}

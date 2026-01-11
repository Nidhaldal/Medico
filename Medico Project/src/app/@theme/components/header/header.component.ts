import { Router } from '@angular/router';
import { NbToastrService, NbGlobalPhysicalPosition } from '@nebular/theme';
import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  NbMediaBreakpointsService,
  NbMenuService,
  NbSidebarService,
  NbThemeService,
} from '@nebular/theme';
import { LayoutService } from '../../../@core/utils';
import { map, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { AppointmentNotificationService } from '../../../services/appointment-notification.service';
import { AppointmentService } from '../../../services/appointment.service';
import { AuthService } from '../../../@core/services/auth.service';
import { ConnectionService, Connection } from '../../../services/connection.service';

interface AppointmentNotification {
  id: number;
  appointment_id: number;
  from_user_username: string;
  from_user_profile_picture: string;
  event: 'rescheduled' | 'accepted' | 'rejected' | 'deleted' | 'appointment_created' | string;
  created_at: string;
  seen: boolean;
  message: string;
}

type Notification = AppointmentNotification | Connection;

@Component({
  selector: 'ngx-header',
  styleUrls: ['./header.component.scss'],
  templateUrl: './header.component.html',
})
export class HeaderComponent implements OnInit, OnDestroy {
  private destroy$: Subject<void> = new Subject<void>();
  userPictureOnly: boolean = false;
  user: { name: string; picture: string; role?: string } = {
    name: 'User',
    picture: 'assets/images/default-avatar.png',
  };

  notifications: Notification[] = [];
  unreadCount: number = 0;
  showNotifications: boolean = false;

  themes = [
    { value: 'default', name: 'Light' },
    { value: 'dark', name: 'Dark' },
    { value: 'cosmic', name: 'Cosmic' },
    { value: 'corporate', name: 'Corporate' },
  ];

  currentTheme = 'default';
  userMenu = [
    { title: 'Profile', link: '/pages/profile' },
    { title: 'Log out' },
  ];

  constructor(
    private sidebarService: NbSidebarService,
    private menuService: NbMenuService,
    private themeService: NbThemeService,
    private layoutService: LayoutService,
    private breakpointService: NbMediaBreakpointsService,
    private authService: AuthService,
    private toastrService: NbToastrService,
    private appointmentNotifService: AppointmentNotificationService,
    private appointmentService: AppointmentService,
    private connectionService: ConnectionService,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentTheme = this.themeService.currentTheme;

    const userInfo = this.authService.getUserInfo();
    if (userInfo) {
      const backendOrigin = 'http://localhost:8000/';
      const picturePath = userInfo.picture;

      this.user = {
        name: userInfo.name || 'User',
        picture:
          !picturePath || picturePath === ''
            ? 'assets/images/default-avatar.png'
            : picturePath.startsWith('http') || picturePath.startsWith('assets/')
            ? picturePath
            : backendOrigin + picturePath.replace(/^\/?/, ''),
        role: userInfo.role,
      };

      // Load connection notifications
      this.connectionService.getNotifications().subscribe((notifs) => {
        this.notifications = notifs || [];
        this.updateUnreadCount();
      });
    }

    const { xl } = this.breakpointService.getBreakpointsMap();

    this.themeService
      .onMediaQueryChange()
      .pipe(
        map(([, currentBreakpoint]) => currentBreakpoint.width < xl),
        takeUntil(this.destroy$)
      )
      .subscribe((isLessThanXl: boolean) => (this.userPictureOnly = isLessThanXl));

    this.themeService
      .onThemeChange()
      .pipe(
        map(({ name }) => name),
        takeUntil(this.destroy$)
      )
      .subscribe((themeName) => (this.currentTheme = themeName));

    this.menuService
      .onItemClick()
      .pipe(takeUntil(this.destroy$), map(({ item }) => item.title))
      .subscribe((title) => {
        if (title === 'Log out') {
          this.toastrService.success('You have been logged out.', 'Goodbye 👋', {
            duration: 3000,
            status: 'success',
            position: NbGlobalPhysicalPosition.TOP_RIGHT,
            destroyByClick: true,
            icon: 'log-out-outline',
          });

          setTimeout(() => {
            this.authService.clearSession();
            this.router.navigate(['/auth/login']);
          }, 3000);
        }
      });

    // Initialize WebSocket
    this.appointmentNotifService.init();

    // Subscribe to live appointment notifications
    this.appointmentNotifService.getNotifications().subscribe((notif) => {
      if (!notif || !notif.appointment) return;

      console.debug('📨 Live appointment event:', notif);

      const isPatient = this.user.role === 'patient';

      const fromUser = isPatient
        ? {
            username: notif.appointment.doctor_username || 'Unknown',
            profile_picture:
              notif.appointment.doctor_picture || 'assets/images/default-avatar.png',
          }
        : {
            username: notif.appointment.patient_username || 'Unknown',
            profile_picture:
              notif.appointment.patient_picture || 'assets/images/default-avatar.png',
          };

      // Determine actual event: use status if type is 'appointment_updated'
      let eventKey = notif.type;
      if (eventKey === 'appointment_updated' && notif.appointment?.status) {
        eventKey = notif.appointment.status; // accepted, rejected, rescheduled, etc.
      }

      const messageMap: { [key: string]: string } = {
        appointment_created: isPatient
          ? `Appointment booked with ${fromUser.username}`
          : `New appointment request from ${fromUser.username}`,
        accepted: isPatient
          ? `Doctor ${fromUser.username} accepted your appointment`
          : `You accepted ${fromUser.username}'s appointment`,
        rejected: isPatient
          ? `Doctor ${fromUser.username} rejected your appointment`
          : `You rejected ${fromUser.username}'s appointment`,
        rescheduled: isPatient
          ? `Doctor ${fromUser.username} rescheduled your appointment`
          : `${fromUser.username} rescheduled an appointment`,
        deleted: 'Appointment was deleted',
      };

      const friendlyMessage =
        messageMap[eventKey] ||
        (() => {
          console.warn('⚠️ Unknown appointment event type:', notif.type);
          return 'Appointment updated';
        })();

      const friendly: AppointmentNotification = {
        id: notif.appointment.id,
        appointment_id: notif.appointment.id,
        from_user_username: fromUser.username || 'Unknown',
        from_user_profile_picture: fromUser.profile_picture || 'assets/images/default-avatar.png',
        event: eventKey,
        created_at: new Date().toISOString(),
        seen: false,
        message: friendlyMessage,
      };

      // Avoid duplicates
      if (
        this.notifications.some(
          (n) =>
            'appointment_id' in n &&
            n.appointment_id === friendly.appointment_id &&
            n.event === friendly.event
        )
      )
        return;

      this.notifications.unshift(friendly);
      this.updateUnreadCount();

      this.toastrService.info(friendly.message, 'New Appointment Event');
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.appointmentNotifService.disconnect();
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.notifications.forEach((n) => (n.seen = true));
      this.updateUnreadCount();
    }
  }

  updateUnreadCount() {
    this.unreadCount = this.notifications.filter((n) => !n.seen).length;
  }

  changeTheme(themeName: string) {
    this.themeService.changeTheme(themeName);
  }

  toggleSidebar(): boolean {
    this.sidebarService.toggle(true, 'menu-sidebar');
    this.layoutService.changeLayoutSize();
    return false;
  }

  navigateHome() {
    this.menuService.navigateHome();
    return false;
  }

  goToNotification(notif: Notification) {
    if ('appointment_id' in notif) {
      this.router.navigate(['/pages/appointments'], { queryParams: { id: notif.appointment_id } });
    } else if ('link_type' in notif && notif.link_type === 'request') {
      this.router.navigate(['/pages/connections']);
    }
  }

  formatEvent(event?: string): string {
    return event ? event.replace(/_/g, ' ') : 'unknown';
  }
}

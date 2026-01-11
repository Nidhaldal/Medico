import { Component, OnDestroy, OnInit } from '@angular/core';
import { NbMenuService } from '@nebular/theme';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { AuthService } from '../@core/services/auth.service';
import { Router } from '@angular/router';

import { MENU_ITEMS } from './pages-menu';
import { AppMenuItem } from './app-menu-item.model';
@Component({
  selector: 'ngx-pages',
  styleUrls: ['pages.component.scss'],
  template: `
    <ngx-one-column-layout>
      <nb-menu [items]="menu"></nb-menu>
      <router-outlet></router-outlet>
    </ngx-one-column-layout>
  `,
})
export class PagesComponent implements OnInit, OnDestroy {
  menu: AppMenuItem[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private menuService: NbMenuService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Filter menu based on user role
    const userRole = this.authService.getUserRole();
    this.menu = this.filterMenuByRole(MENU_ITEMS, userRole);

    // Logout handling
    this.menuService.onItemClick()
      .pipe(
        filter(({ item }) => item.title === 'Log out'),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        console.log('🚪 Logging out...');
        this.authService.clearSession(); // Remove tokens
        this.router.navigate(['/auth/login']); // Redirect to login
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Recursively filter menu items by user role
   */
  private filterMenuByRole(items: AppMenuItem[], role: string): AppMenuItem[] {
    return items
      .filter(item => !item.roles || item.roles.includes(role))
      .map(item => ({
        ...item,
        children: item.children ? this.filterMenuByRole(item.children, role) : undefined,
      }));
  }
}

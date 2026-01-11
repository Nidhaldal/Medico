import { Component } from '@angular/core';

@Component({
  selector: 'app-auth-layout',
  template: `
      <nb-layout>
      <nb-layout-column>
        <router-outlet></router-outlet>
      </nb-layout-column>
    </nb-layout>
  `,
})
export class AuthLayoutComponent {
  constructor() {
    console.log('%c ✅ AuthLayoutComponent constructed', 'color: green');
  }
}



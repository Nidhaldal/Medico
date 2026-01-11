import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Auth,
  confirmPasswordReset,
  signInWithEmailAndPassword,
  verifyPasswordResetCode,
} from '@angular/fire/auth';
import { NbToastrService, NbGlobalPhysicalPosition } from '@nebular/theme';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
})
export class ResetPasswordComponent implements OnInit {
  username = '';
  newPassword = '';
  oobCode = '';
  email = '';

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private auth: Auth,
    private toastrService: NbToastrService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(async (params) => {
      this.oobCode = params['oobCode'] || '';
      this.email = params['email'] || '';

      if (!this.email && this.oobCode) {
        try {
          this.email = await verifyPasswordResetCode(this.auth, this.oobCode);
        } catch (err) {
          console.error('Invalid or expired code:', err);
          this.toastrService.show(
            'Invalid or expired password reset link.',
            'Error',
            { status: 'danger', position: NbGlobalPhysicalPosition.TOP_RIGHT, duration: 5000 }
          );
        }
      }

      if (!this.email) {
        this.toastrService.show(
          'Missing email. Please use the reset link from your email.',
          'Missing Email',
          { status: 'warning', position: NbGlobalPhysicalPosition.TOP_RIGHT, duration: 5000 }
        );
      }
    });
  }

  async resetPassword(): Promise<void> {
    if (!this.oobCode || !this.newPassword || !this.email || !this.username) {
      this.toastrService.show(
        'Please enter your username and a new password, and ensure you came from the reset email.',
        'Incomplete Data',
        { status: 'warning', position: NbGlobalPhysicalPosition.TOP_RIGHT, duration: 5000 }
      );
      return;
    }

    try {
      await confirmPasswordReset(this.auth, this.oobCode, this.newPassword);

      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        this.email,
        this.newPassword
      );
      const idToken = await userCredential.user.getIdToken(true);
console.log('Sending to backend:', {
  username: this.username,
  email: this.email,
  newPassword: this.newPassword,
});

await this.http
  .post('http://localhost:8000/api/sync-password/', {
    idToken,
    username: this.username,
    newPassword: this.newPassword,
  })
  .toPromise();

      // Success toast
      this.toastrService.show(
        'Password reset successfully! You can now log in with your new password.',
        'Success',
        { status: 'success', position: NbGlobalPhysicalPosition.TOP_RIGHT, duration: 5000 }
      );

      this.router.navigate(['/auth/login']);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-action-code') {
        this.toastrService.show(
          'Invalid or expired reset link.',
          'Error',
          { status: 'danger', position: NbGlobalPhysicalPosition.TOP_RIGHT, duration: 5000 }
        );
      } else {
        this.toastrService.show(
          'Failed to reset password. Please try again.',
          'Error',
          { status: 'danger', position: NbGlobalPhysicalPosition.TOP_RIGHT, duration: 5000 }
        );
      }
    }
  }
}

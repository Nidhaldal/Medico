import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FirebaseAuthService } from '../../services/firebase-auth.service';

import {
  NbToastrService,
  NbGlobalPhysicalPosition,
} from '@nebular/theme';
import { AuthService } from '../../@core/services/auth.service';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  serverError: string | null = null;
  recaptchaToken: string | null = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
      private firebaseAuth: FirebaseAuthService ,  
    private router: Router,
    private toastrService: NbToastrService,
    private authService: AuthService 
  ) {
    console.log('%c ✅ LoginComponent constructed', 'color: green');

    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });

    console.log('%c 🧱 loginForm initialized:', 'color: blue', this.loginForm);
  }

  ngOnInit(): void {
    this.authService.clearSession(); 
    console.log('%c 🧹 Cleared old session on login init', 'color: gray');
  }

  onCaptchaResolved(token: string) {
    this.recaptchaToken = token;
    console.log('%c 🧩 CAPTCHA resolved token:', 'color: teal', token);
  }

 

  onSubmit() {
  console.log('%c 🚀 onSubmit() triggered', 'color: orange');

  this.serverError = null;

  if (this.loginForm.invalid || !this.recaptchaToken) {
    console.warn('❌ Form invalid or CAPTCHA missing');
    if (!this.recaptchaToken) {
      this.serverError = 'Please complete the CAPTCHA.';
      this.toastrService.danger(
        this.serverError,
        'Login Failed',
        {
          duration: 4000,
          position: NbGlobalPhysicalPosition.TOP_RIGHT,
        }
      );
    }
    return;
  }

  const payload = {
    username: this.loginForm.get('username')?.value,
    password: this.loginForm.get('password')?.value,
    captcha_token: this.recaptchaToken,
  };

  this.http.post('http://localhost:8000/api/token/', payload).subscribe({
    next: (res: any) => {
      console.log('%c ✅ Login successful:', 'color: green', res);

      this.authService.saveTokens(res.access, res.refresh); 
      const userRole = this.authService.getUserRole();       

      this.toastrService.success(
        'You have logged in successfully.',
        'Medico welcomes you back!',
        {
          duration: 4000,
          position: NbGlobalPhysicalPosition.TOP_RIGHT,
        }
      );

      this.router.navigate(['/pages/dashboard']);
    },
    error: (err) => {
      console.error('%c ❌ Login error:', 'color: red', err);

      const detail = err.error?.detail;

      if (err.status === 400 || err.status === 401) {
        if (detail?.toLowerCase().includes('username')) {
          this.serverError = 'Wrong username.';
        } else if (detail?.toLowerCase().includes('password')) {
          this.serverError = 'Wrong password.';
        } else if (detail?.toLowerCase().includes('captcha')) {
          this.serverError = 'Invalid CAPTCHA.';
        } else {
          this.serverError = 'Invalid username or password.';
        }

        this.toastrService.danger(
          this.serverError,
          'Login Failed',
          {
            duration: 4000,
            position: NbGlobalPhysicalPosition.TOP_RIGHT,
          }
        );
      } else {
        this.serverError = 'Login failed. Please try again later.';
        this.toastrService.danger(
          this.serverError,
          'Error',
          {
            duration: 4000,
            position: NbGlobalPhysicalPosition.TOP_RIGHT,
          }
        );
      }
    },
  });
}

  forgotPassword() {
  const username = this.loginForm.get('username')?.value;

  if (!username) {
    this.toastrService.warning('Please enter your username first.', 'Warning', {
      duration: 3000,
      position: NbGlobalPhysicalPosition.TOP_RIGHT,
    });
    return;
  }

  this.http.post('http://localhost:8000/api/reset-password/', { username })
    .subscribe({
      next: (res: any) => {
        this.toastrService.success(
          'Password reset link sent! Please check your email.',
          'Email Sent',
          { duration: 4000, position: NbGlobalPhysicalPosition.TOP_RIGHT }
        );
      },
      error: (err) => {
        console.error('❌ Error sending reset email:', err);
        this.toastrService.danger(
          err.error?.detail || 'Failed to send password reset email. Please try again.',
          'Error',
          { duration: 4000, position: NbGlobalPhysicalPosition.TOP_RIGHT }
        );
      }
    });
}


}

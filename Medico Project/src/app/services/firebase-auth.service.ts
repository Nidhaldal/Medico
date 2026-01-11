import { Injectable } from '@angular/core';
import { Auth, sendPasswordResetEmail, confirmPasswordReset } from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class FirebaseAuthService {
  constructor(private auth: Auth) {}

  resetPassword(email: string) {
    return sendPasswordResetEmail(this.auth, email);
  }

  updatePassword(oobCode: string, newPassword: string) {
    return confirmPasswordReset(this.auth, oobCode, newPassword);
  }
}

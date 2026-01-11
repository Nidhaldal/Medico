import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  NbToastrService,
  NbGlobalPhysicalPosition,
} from '@nebular/theme';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  selectedFile: File | null = null;
  serverErrors: any = {};
  toastDuration = 4500;

  countries: any[] = [];
  selectedCountryObj: any = null;

  tunisiaGovernorates: string[] = [
    'Tunis', 'Ariana', 'Ben Arous', 'Manouba', 'Nabeul',
    'Zaghouan', 'Bizerte', 'Beja', 'Jendouba', 'Kef',
    'Siliana', 'Sousse', 'Monastir', 'Mahdia', 'Kairouan',
    'Kasserine', 'Sidi Bouzid', 'Sfax', 'Gafsa', 'Tozeur',
    'Kebili', 'Gabes', 'Medenine', 'Tataouine'
  ];

  availableCities: string[] = [];
  roles = ['patient', 'doctor', 'prothesist', 'kinetherapist'];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private toastrService: NbToastrService,
  ) {
    this.registerForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password2: ['', Validators.required],
      role: ['patient', Validators.required],
      country: ['', Validators.required],
      city: [''],
      phone: [''],
      profile_picture: [null],
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.http.get<any[]>('assets/data/countries.json').subscribe(data => {
      this.countries = data.map(c => ({
        ...c,
        lowerCode: c.code.toLowerCase(),
      }));
    });

    this.registerForm.get('country')?.valueChanges.subscribe(code => {
      this.availableCities = code === 'TN' ? this.tunisiaGovernorates : [];
      if (code !== 'TN') this.registerForm.get('city')?.setValue('');

      this.selectedCountryObj = this.countries.find(c => c.code === code) || null;

      if (this.selectedCountryObj) {
        const prefix = this.selectedCountryObj.dial_code || '';
        const currentPhone = this.registerForm.get('phone')?.value || '';
        if (!currentPhone.startsWith(prefix)) {
          this.registerForm.get('phone')?.setValue(prefix);
        }
      }
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const pass = form.get('password')?.value;
    const confirm = form.get('password2')?.value;
    return pass === confirm ? null : { passwordMismatch: true };
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    this.selectedFile = file;
  }

  onSubmit() {
    this.serverErrors = {};

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const formData = new FormData();
    Object.entries(this.registerForm.value).forEach(([key, value]) => {
      if (key !== 'profile_picture') {
        formData.append(key, value !== null && value !== undefined ? String(value) : '');
      }
    });

    if (this.selectedFile) {
      formData.append('profile_picture', this.selectedFile);
    }

    this.http.post('http://localhost:8000/api/register/', formData).subscribe({
      next: () => {
        this.toastrService.success('Medico welcomes you!', 'Registration Successful', {
          duration: this.toastDuration,
          position: NbGlobalPhysicalPosition.TOP_RIGHT,
        });

        const audio = new Audio('assets/sounds/ding.mp3');
        audio.play();

        setTimeout(() => this.router.navigate(['/auth/login']), this.toastDuration);
      },
      error: err => {
        if (err.error) {
          this.serverErrors = err.error;
        } else {
          this.toastrService.danger('Registration failed. Please try again.', 'Error', {
            duration: this.toastDuration,
            position: NbGlobalPhysicalPosition.TOP_RIGHT,
          });
        }
      }
    });
  }
}

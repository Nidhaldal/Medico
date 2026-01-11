import {
  Component,
  OnInit,
  AfterViewInit,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { NbStepChangeEvent, NbToastrService, NbGlobalPhysicalPosition } from '@nebular/theme';

@Component({
  selector: 'ngx-stepper',
  templateUrl: 'stepper.component.html',
  styleUrls: ['stepper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepperComponent implements OnInit, AfterViewInit {
  firstForm!: UntypedFormGroup;
  secondForm!: UntypedFormGroup;
  thirdForm!: UntypedFormGroup;
  fourthForm!: UntypedFormGroup;

  selectedFile: File | null = null;
  fileError: string | null = null;

  tunisiaGovernorates: string[] = [
    'Tunis', 'Ariana', 'Ben Arous', 'Manouba', 'Nabeul',
    'Zaghouan', 'Bizerte', 'Beja', 'Jendouba', 'Kef',
    'Siliana', 'Sousse', 'Monastir', 'Mahdia', 'Kairouan',
    'Kasserine', 'Sidi Bouzid', 'Sfax', 'Gafsa', 'Tozeur',
    'Kebili', 'Gabes', 'Medenine', 'Tataouine',
  ];

  roles = [
    { value: 'patient', label: 'Patient' },
    { value: 'doctor', label: 'Doctor' },
    { value: 'prothesist', label: 'Prothesist' },
    { value: 'kinetherapist', label: 'Kinetherapist' },
    { value: 'admin', label: 'Admin' },
  ];

  availableCities: string[] = [];
  countries: any[] = [];
  selectedCountryObj: any = null;

  constructor(
    private fb: UntypedFormBuilder,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private toastrService: NbToastrService
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.loadCountries();
    this.watchCountryChanges();
  }

  ngAfterViewInit(): void {
    Promise.resolve().then(() => this.cdr.detectChanges());
  }

  private initForms(): void {
    this.firstForm = this.fb.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
    });

    this.secondForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
    });

    this.thirdForm = this.fb.group({
      password: ['', Validators.required],
      password2: ['', Validators.required],
    }, { validators: this.passwordsMatchValidator });

    this.fourthForm = this.fb.group({
      country: ['', Validators.required],
      city: [''],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9\s\-()]{7,}$/)]],
      role: ['', Validators.required],
    });
  }

  private loadCountries(): void {
    this.http.get<any[]>('assets/data/countries.json').subscribe(data => {
      Promise.resolve().then(() => {
        this.countries = data.map(c => ({
          ...c,
          lowerCode: c.code.toLowerCase(),
        }));
        this.cdr.markForCheck();
      });
    });
  }

  private watchCountryChanges(): void {
    this.fourthForm.get('country')?.valueChanges.subscribe(code => {
      Promise.resolve().then(() => {
        this.availableCities = code === 'TN' ? this.tunisiaGovernorates : [];

        if (code !== 'TN') {
          this.fourthForm.get('city')?.setValue('');
        }

        this.selectedCountryObj = this.countries.find(c => c.code === code) || null;

        if (this.selectedCountryObj) {
          const prefix = this.selectedCountryObj.dial_code || '';
          const currentPhone = this.fourthForm.get('phone')?.value || '';
          if (!currentPhone.startsWith(prefix)) {
            this.fourthForm.get('phone')?.setValue(prefix);
          }
        }

        this.cdr.markForCheck();
      });
    });
  }

  passwordsMatchValidator(group: UntypedFormGroup): { [key: string]: boolean } | null {
    const pass = group.get('password')?.value;
    const confirm = group.get('password2')?.value;
    return pass === confirm ? null : { passwordsMismatch: true };
  }

  onFirstSubmit(): void {
    Promise.resolve().then(() => {
      this.firstForm.markAllAsTouched();
      this.cdr.markForCheck();
    });
  }

  onSecondSubmit(): void {
    Promise.resolve().then(() => {
      this.secondForm.markAllAsTouched();
      this.cdr.markForCheck();
    });
  }

  onThirdSubmit(): void {
    Promise.resolve().then(() => {
      this.thirdForm.markAllAsTouched();
      this.cdr.markForCheck();
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.type.startsWith('image/')) {
        this.selectedFile = file;
        this.fileError = null;
      } else {
        this.selectedFile = null;
        this.fileError = 'Only image files are allowed.';
      }
    }
  }

  onFourthSubmit(): void {
    console.log('Submit clicked');

    Promise.resolve().then(() => {
      this.fourthForm.markAllAsTouched();
      this.cdr.markForCheck();

      if (this.fourthForm.valid) {
        const formData = new FormData();
        formData.append('first_name', this.firstForm.value.first_name);
        formData.append('last_name', this.firstForm.value.last_name);
        formData.append('username', this.secondForm.value.username);
        formData.append('email', this.secondForm.value.email);
        formData.append('password', this.thirdForm.value.password);
        formData.append('password2', this.thirdForm.value.password2);
        formData.append('country', this.fourthForm.value.country);
        formData.append('city', this.fourthForm.value.city || '');
        formData.append('phone', this.fourthForm.value.phone);
        formData.append('role', this.fourthForm.value.role);

        if (this.selectedFile) {
          formData.append('profile_image', this.selectedFile);
        }

        this.http.post('http://localhost:8000/api/accounts/register/', formData).subscribe({
          next: response => {
            console.log('✅ Registration successful', response);

            this.toastrService.success(
              `${this.secondForm.value.username} has been registered successfully.`,
              'User Added',
              {
                duration: 4000,
                position: NbGlobalPhysicalPosition.TOP_RIGHT,
              }
            );

            setTimeout(() => {
              this.router.navigate(['/pages/tables/smart-table']);
            }, 1000);
          },
          error: err => {
            console.error('❌ Registration failed', err);
            this.toastrService.danger(
              'Something went wrong during registration.',
              'Registration Failed',
              {
                duration: 4000,
                position: NbGlobalPhysicalPosition.TOP_RIGHT,
              }
            );
          }
        });
      }
    });
  }

  onStepChange(_: NbStepChangeEvent): void {}
}

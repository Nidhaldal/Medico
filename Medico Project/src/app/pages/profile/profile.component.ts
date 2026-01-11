import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NbToastrService, NbGlobalPhysicalPosition } from '@nebular/theme';
import { AuthService } from '../../@core/services/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  selectedFile: File | null = null;
  serverErrors: any = {};
  toastDuration = 4000;
  editMode = false;

  countries: any[] = [];
  selectedCountryObj: any = null;
  availableCities: string[] = [];

  // Dynamic roles list
  roles: string[] = ['patient', 'doctor', 'prothesist', 'kinetherapist'];

  tunisiaGovernorates: string[] = [
    'Tunis', 'Ariana', 'Ben Arous', 'Manouba', 'Nabeul',
    'Zaghouan', 'Bizerte', 'Beja', 'Jendouba', 'Kef',
    'Siliana', 'Sousse', 'Monastir', 'Mahdia', 'Kairouan',
    'Kasserine', 'Sidi Bouzid', 'Sfax', 'Gafsa', 'Tozeur',
    'Kebili', 'Gabes', 'Medenine', 'Tataouine'
  ];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private toastrService: NbToastrService,
    private authService: AuthService
  ) {
    this.profileForm = this.fb.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: [{ value: '', disabled: true }],
    role: [{ value: '', disabled: true }, Validators.required], 
      phone: [''],
      country: ['', Validators.required],
      city: [''],
      profile_picture: [null],
    });
  }

  ngOnInit(): void {
    // Load countries
    this.http.get<any[]>('assets/data/countries.json').subscribe(data => {
      this.countries = data.map(c => ({
        ...c,
        lowerCode: c.code.toLowerCase(),
      }));
    });

    // Fetch user data from backend
    this.http.get<any>('http://localhost:8000/api/profile/').subscribe(user => {
      this.profileForm.patchValue(user);

      this.selectedCountryObj = this.countries.find(c => c.code === user.country) || null;
      if (user.country === 'TN') {
        this.availableCities = this.tunisiaGovernorates;
      }

      // Preview profile picture
      if (user.profile_picture) {
        this.previewUrl = user.profile_picture;
      }
    });

    // Handle country change
    this.profileForm.get('country')?.valueChanges.subscribe(code => {
      this.availableCities = code === 'TN' ? this.tunisiaGovernorates : [];
      if (code !== 'TN') this.profileForm.get('city')?.setValue('');

      this.selectedCountryObj = this.countries.find(c => c.code === code) || null;

      if (this.selectedCountryObj) {
        const prefix = this.selectedCountryObj.dial_code || '';
        const currentPhone = this.profileForm.get('phone')?.value || '';
        if (!currentPhone.startsWith(prefix)) {
          this.profileForm.get('phone')?.setValue(prefix);
        }
      }
    });
  }

  previewUrl: string | ArrayBuffer | null = null;

  onFileChange(event: any) {
    const file = event.target.files[0];
    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = () => (this.previewUrl = reader.result);
    reader.readAsDataURL(file);
  }

 onSubmit() {
  this.serverErrors = {};
  if (this.profileForm.invalid) return;

  const formData = new FormData();

  // Append all non-file fields except profile_picture
  Object.entries(this.profileForm.getRawValue()).forEach(([key, value]) => {
    if (key !== 'profile_picture') {
      formData.append(key, value !== null && value !== undefined ? String(value) : '');
    }
  });

  // Append profile_picture only if a new file is selected
  if (this.selectedFile) {
    formData.append('profile_picture', this.selectedFile);
  }

  this.http.patch('http://localhost:8000/api/profile/', formData).subscribe({
    next: () => {
      this.toastrService.success('Profile updated successfully', 'Success', {
        duration: this.toastDuration,
        position: NbGlobalPhysicalPosition.TOP_RIGHT,
      });
      this.editMode = false;
      this.selectedFile = null;  // reset selected file after successful update
    },
    error: err => {
      this.serverErrors = err.error || {};
      this.toastrService.danger('Failed to update profile', 'Error', {
        duration: this.toastDuration,
        position: NbGlobalPhysicalPosition.TOP_RIGHT,
      });
    },
  });
}

}

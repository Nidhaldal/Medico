import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LocalDataSource } from 'ng2-smart-table';
import {
  NbDialogService,
  NbToastrService,
  NbGlobalPhysicalPosition,
} from '@nebular/theme';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { AuthService } from '../../../@core/services/auth.service';
interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  role: string;
  phone?: string;
  country?: string;
  city?: string;
}

@Component({
  selector: 'ngx-smart-table',
  templateUrl: './smart-table.component.html',
  styleUrls: ['./smart-table.component.scss'],
})
export class SmartTableComponent implements OnInit {
  source: LocalDataSource = new LocalDataSource();
  loading = false;
  isAdmin = false;

  settings = {
    actions: {
      add: false,
      edit: false,
      position: 'right',
    },
    delete: {
      deleteButtonContent: '<i class="nb-trash"></i>',
      confirmDelete: true,
    },
    columns: {
      id: { title: 'ID', type: 'number' },
      first_name: { title: 'First Name', type: 'string' },
      last_name: { title: 'Last Name', type: 'string' },
      username: { title: 'Username', type: 'string' },
      email: { title: 'E-mail', type: 'string' },
      role: { title: 'Role', type: 'string' },
      phone: {
        title: 'Phone',
        type: 'string',
        valuePrepareFunction: (phone: string) => phone || '—',
      },
      country: {
        title: 'Country',
        type: 'string',
        valuePrepareFunction: (country: string) => country || '—',
      },
      city: {
        title: 'City',
        type: 'string',
        valuePrepareFunction: (city: string) => city || '—',
      },
    },
  };

  constructor(
    private dialogService: NbDialogService,
    private toastrService: NbToastrService,
    private http: HttpClient,
    private authService: AuthService // ✅ inject AuthService
  ) {}

  ngOnInit(): void {
    this.checkUserRoleAndFetch();
  }

  checkUserRoleAndFetch(): void {
    // ✅ use AuthService helper instead of decoding JWT here
    this.isAdmin = this.authService.getUserRole() === 'admin';

    if (this.isAdmin) {
      this.fetchUsers();
    } else {
      this.source.load([]); // keep table empty for non-admins
    }
  }

  fetchUsers(): void {
    this.loading = true;
    this.http
      .get<User[]>('http://localhost:8000/api/accounts/all-users/', {
        headers: {
          Authorization: `Bearer ${this.authService.getAccessToken()}`,
        },
      })
      .subscribe({
        next: (data) => {
          this.source.load(data);
          this.loading = false;
        },
        error: (err) => {
          console.error('❌ Failed to fetch users', err);
          this.loading = false;
        },
      });
  }

  onDeleteConfirm(event: any): void {
    const userId = event.data.id;

    if (!userId) {
      console.warn('⛔ No user ID found for deletion.');
      event.confirm.reject();
      return;
    }

    this.dialogService
      .open(ConfirmDialogComponent, {
        context: {
          message: `Are you sure you want to delete user ${event.data.username}?`,
        },
      })
      .onClose.subscribe((confirmed) => {
        if (confirmed) {
          this.http
            .delete(`http://localhost:8000/api/accounts/user/${userId}/`, {
              headers: {
                Authorization: `Bearer ${this.authService.getAccessToken()}`,
              },
            })
            .subscribe({
              next: () => {
                this.toastrService.success(
                  `${event.data.username} has been deleted.`,
                  'User Deleted',
                  {
                    duration: 4000,
                    position: NbGlobalPhysicalPosition.TOP_RIGHT,
                  }
                );
                event.confirm.resolve();
              },
              error: (err) => {
                console.error('❌ Delete failed', err);
                this.toastrService.danger(
                  `Failed to delete user ${event.data.username}.`,
                  'Delete Error',
                  {
                    duration: 4000,
                    position: NbGlobalPhysicalPosition.TOP_RIGHT,
                  }
                );
                event.confirm.reject();
              },
            });
        } else {
          event.confirm.reject();
        }
      });
  }
}

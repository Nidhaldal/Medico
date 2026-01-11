import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  role: string;
  phone?: string;
}

@Component({
  selector: 'ngx-list',
  templateUrl: 'list.component.html',
  styleUrls: ['list.component.scss'],
})
export class ListComponent implements OnInit {
  users: User[] = [];
  loading = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchUsers();
  }

  fetchUsers(): void {
    this.loading = true;
    this.http.get<User[]>('http://localhost:8000/api/accounts/all-users/').subscribe({
      next: data => {
        this.users = data;
        this.loading = false;
      },
      error: err => {
        console.error('❌ Failed to fetch users', err);
        this.loading = false;
      }
    });
  }

  deleteUser(userId: number): void {
    if (!confirm('Are you sure you want to delete this user?')) return;
    this.http.delete(`http://localhost:8000/api/accounts/user/${userId}/`).subscribe({
      next: () => this.users = this.users.filter(u => u.id !== userId),
      error: err => console.error('❌ Delete failed', err),
    });
  }
}

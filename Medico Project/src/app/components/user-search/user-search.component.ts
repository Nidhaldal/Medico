import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';

@Component({
  selector: 'ngx-user-search',
  templateUrl: './user-search.component.html',
  styleUrls: ['./user-search.component.scss']
})
export class UserSearchComponent implements OnInit {
  
  @Input() users: any[] = []; // all community users
  @Output() connectUser = new EventEmitter<number>(); // emit selected user id to parent

  filteredUsers: any[] = [];

  ngOnInit() {
    this.filteredUsers = [...this.users];
  }

  onSearch(query: string) {
    const lower = query.toLowerCase();
    this.filteredUsers = this.users.filter(u =>
      u.username.toLowerCase().includes(lower) || u.first_name.toLowerCase().includes(lower)
    );
  }

  connect(userId: number) {
    this.connectUser.emit(userId);
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ArticleService {

  private apiUrl = '/api/articles/'; // Django API endpoint

  constructor(private http: HttpClient) { }

  getArticles(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  getArticle(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}${id}/`);
  }

  createArticle(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  updateArticle(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}${id}/`, data);
  }

  deleteArticle(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}${id}/`);
  }
}

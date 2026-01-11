import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, forkJoin, of, combineLatest } from 'rxjs';
import { switchMap, map, catchError, shareReplay } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

// ---------------------------
// Interfaces
// ---------------------------
export interface PatientSummary {
  totalPatients: number;
  newPatientsThisMonth: number;
}

export interface AppointmentsSummary {
  total: number;         
  pending: number;
  accepted: number;
  
  rejected: number;
  growth: number;        
  deltaUp: boolean;      
}
export interface DetailedLinksSummary {
  totalLinksSent: number;
  totalLinksReceived: number;
  pendingSent: number;
  acceptedSent: number;
  pendingReceived: number;
  acceptedReceived: number;
  newThisMonthSent: number;
  newThisMonthReceived: number;
}

export interface NationalityMap {
  [countryCode: string]: number;
}

export interface DashboardData {
  patients: PatientSummary;
  appointments: AppointmentsSummary;
  links: DetailedLinksSummary;
  nationalityMap: NationalityMap;
}

// ---------------------------
// Raw backend response types
// ---------------------------
interface PatientSummaryResponse {
  total_patients: number;
  new_patients_this_month: number;
}

interface AppointmentsSummaryResponse {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  growth: number;
  deltaUp: boolean;
}


interface LinksSummaryResponse {
  total_links_sent: number;
  total_links_received: number;
  pending_sent: number;
  accepted_sent: number;
  pending_received: number;
  accepted_received: number;
  new_this_month_sent: number;
  new_this_month_received: number;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private baseUrl = 'http://localhost:8000/api/dashboard/';

  private selectedMonth$ = new BehaviorSubject<string | null>(null);
  private selectedCountry$ = new BehaviorSubject<string | null>(null);

  public dashboardData$: Observable<DashboardData>;

  constructor(private http: HttpClient, private authService: AuthService) {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${('0' + (now.getMonth() + 1)).slice(-2)}`;
    this.selectedMonth$.next(currentMonth);

   
    this.dashboardData$ = combineLatest([this.selectedMonth$, this.selectedCountry$]).pipe(
      switchMap(() => {
        const params = this.getUserParams();
        return forkJoin({
          patients: this.http.get<PatientSummaryResponse>(`${this.baseUrl}patients-summary/`, { params }).pipe(
            map((data) => ({
              totalPatients: data?.total_patients ?? 0,
              newPatientsThisMonth: data?.new_patients_this_month ?? 0,
            })),
            catchError(() => of({ totalPatients: 0, newPatientsThisMonth: 0 }))
          ),
         appointments: this.http.get<AppointmentsSummaryResponse>(`${this.baseUrl}appointments-summary/`, { params }).pipe(
  map((data) => ({
    total: data?.total ?? 0,
    pending: data?.pending ?? 0,
    accepted: data?.accepted ?? 0,
    rejected: data?.rejected ?? 0,
    growth: data?.growth ?? 0,
    deltaUp: data?.deltaUp ?? true,
  })),
  catchError(() => of({ total: 0, pending: 0, accepted: 0, rejected: 0, growth: 0, deltaUp: true }))
),

          links: this.http.get<LinksSummaryResponse>(`${this.baseUrl}links-summary/`, { params }).pipe(
            map((data) => ({
              totalLinksSent: data?.total_links_sent ?? 0,
              totalLinksReceived: data?.total_links_received ?? 0,
              pendingSent: data?.pending_sent ?? 0,
              acceptedSent: data?.accepted_sent ?? 0,
              pendingReceived: data?.pending_received ?? 0,
              acceptedReceived: data?.accepted_received ?? 0,
              newThisMonthSent: data?.new_this_month_sent ?? 0,
              newThisMonthReceived: data?.new_this_month_received ?? 0,
            })),
            catchError(() => of({
              totalLinksSent: 0,
              totalLinksReceived: 0,
              pendingSent: 0,
              acceptedSent: 0,
              pendingReceived: 0,
              acceptedReceived: 0,
              newThisMonthSent: 0,
              newThisMonthReceived: 0,
            }))
          ),
          nationalityMap: this.http.get<NationalityMap>(`${this.baseUrl}patient-nationality-map/`, { params }).pipe(
            catchError(() => of({}))
          ),
        });
      }),
      shareReplay(1)
    );
  }
  getLinksSummarySentForMonth(month: string): Observable<DetailedLinksSummary> {
    const user = this.authService.getUserInfo();
    if (!user) throw new Error('User not logged in');

    let params = new HttpParams()
      .set('user_id', user.id.toString())
      .set('month', month);

    const country = this.selectedCountry$.value;
    if (country) params = params.set('country', country);

    return this.http.get<LinksSummaryResponse>(`${this.baseUrl}links-summary/`, { params }).pipe(
      map((data) => ({
        totalLinksSent: data?.total_links_sent ?? 0,
        totalLinksReceived: data?.total_links_received ?? 0,
        pendingSent: data?.pending_sent ?? 0,
        acceptedSent: data?.accepted_sent ?? 0,
        pendingReceived: data?.pending_received ?? 0,
        acceptedReceived: data?.accepted_received ?? 0,
        newThisMonthSent: data?.new_this_month_sent ?? 0,
        newThisMonthReceived: data?.new_this_month_received ?? 0,
      })),
      catchError(() => of({
        totalLinksSent: 0,
        totalLinksReceived: 0,
        pendingSent: 0,
        acceptedSent: 0,
        pendingReceived: 0,
        acceptedReceived: 0,
        newThisMonthSent: 0,
        newThisMonthReceived: 0,
      }))
    );
  }

  getLinksSummaryReceivedForMonth(month: string): Observable<DetailedLinksSummary> {
    return this.getLinksSummarySentForMonth(month).pipe(
      map(summary => ({
        ...summary,
        newThisMonthSent: 0,
        pendingSent: 0,
        acceptedSent: 0,
      }))
    );
  }

  // ---------------------------
  // Filter setters
  // ---------------------------
  setSelectedMonth(month: string | null) {
    this.selectedMonth$.next(month);
  }

  setSelectedCountry(country: string | null) {
    this.selectedCountry$.next(country);
  }

  // ---------------------------
  // Filter getters
  // ---------------------------
  getSelectedMonth(): Observable<string | null> {
    return this.selectedMonth$.asObservable();
  }

  getSelectedCountry(): Observable<string | null> {
    return this.selectedCountry$.asObservable();
  }

  getSelectedCountryValue(): string | null {
    return this.selectedCountry$.value;
  }

  // ---------------------------
  // Individual summaries
  // ---------------------------
  getPatientsSummary(): Observable<PatientSummary> {
    return this.dashboardData$.pipe(map((d) => d.patients));
  }


  getDetailedLinksSummary(): Observable<DetailedLinksSummary> {
    return this.dashboardData$.pipe(map((d) => d.links));
  }

  getPatientNationalityMap(): Observable<NationalityMap> {
    return this.dashboardData$.pipe(map((d) => d.nationalityMap));
  }
getAppointmentsSummary(period?: string): Observable<AppointmentsSummary> {
  let params = this.getUserParams();
  if (period) params = params.set('period', period);

  return this.http.get<AppointmentsSummaryResponse[] | AppointmentsSummaryResponse>(`${this.baseUrl}appointments-summary/`, { params }).pipe(
    map((data) => {
      if (Array.isArray(data)) {
        return data.reduce<AppointmentsSummary>(
          (acc, item) => ({
            total: acc.total + (item.total ?? 0),
            pending: acc.pending + (item.pending ?? 0),
            accepted: acc.accepted + (item.accepted ?? 0),
            rejected: acc.rejected + (item.rejected ?? 0),
            growth: item.growth ?? acc.growth,
            deltaUp: item.deltaUp ?? acc.deltaUp,
          }),
          { total: 0, pending: 0, accepted: 0, rejected: 0, growth: 0, deltaUp: true }
        );
      } else {
        return {
          total: data?.total ?? 0,
          pending: data?.pending ?? 0,
          accepted: data?.accepted ?? 0,
          rejected: data?.rejected ?? 0,
          growth: data?.growth ?? 0,
          deltaUp: data?.deltaUp ?? true,
        };
      }
    }),
    catchError(() => of({ total: 0, pending: 0, accepted: 0, rejected: 0, growth: 0, deltaUp: true }))
  );
}


 
getPatientsSummaryForMonth(month: string): Observable<PatientSummary> {
  const params = new HttpParams().set('month', month);

  return this.http.get<PatientSummaryResponse>(`${this.baseUrl}patients-summary/`, { params }).pipe(
    map((data) => ({
      totalPatients: data?.total_patients ?? 0,
      newPatientsThisMonth: data?.new_patients_this_month ?? 0,
    })),
    catchError(() => of({ totalPatients: 0, newPatientsThisMonth: 0 }))
  );
}

  getLinkSummaryChartData(): Observable<{ label: string; value: number }[]> {
    return this.getDetailedLinksSummary().pipe(
      map((summary) => [
        { label: 'Pending Sent', value: summary.pendingSent },
        { label: 'Accepted Sent', value: summary.acceptedSent },
        { label: 'Pending Received', value: summary.pendingReceived },
        { label: 'Accepted Received', value: summary.acceptedReceived },
      ])
    );
  }

  private getUserParams(): HttpParams {
    const user = this.authService.getUserInfo();
    if (!user) throw new Error('User not logged in');

    let params = new HttpParams().set('user_id', user.id.toString());

    const month = this.selectedMonth$.value;
    const country = this.selectedCountry$.value;
    if (month) params = params.set('month', month);
    if (country) params = params.set('country', country);

    return params;
  }

  getPercentageChange(current: number, previous: number): number {
    if (previous === 0) return 100;
    return ((current - previous) / previous) * 100;
  }

  refreshDashboard() {
    this.selectedMonth$.next(this.selectedMonth$.value);
    this.selectedCountry$.next(this.selectedCountry$.value);
  }

  getPatientNationalityMapArray(): Observable<{ code: string; count: number }[]> {
    return this.getPatientNationalityMap().pipe(
      map((map) => Object.entries(map).map(([code, count]) => ({ code, count })))
    );
  }

  getCountryCount(code: string): Observable<number> {
    return this.getPatientNationalityMap().pipe(map((map) => map[code] ?? 0));
  }
}

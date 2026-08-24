import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription, forkJoin } from 'rxjs';
import { AuthService } from '../../@core/services/auth.service';
import {
  DashboardService,
  DashboardData,
  PatientSummary,
  DetailedLinksSummary,
  AppointmentsSummary,
} from '../../@core/data/dashboard.service';

@Component({
  selector: 'ngx-ecommerce',
  templateUrl: './e-commerce.component.html',
})
export class ECommerceComponent implements OnInit, OnDestroy {
  userRole: string | null = null;

  // Front card dashboard data
  dashboardData: DashboardData | null = null;

  // Appointments summary
  appointmentsSummary: AppointmentsSummary | null = null;

  // Historical charts
  lastSixMonths: string[] = [];
  patientsPerMonth: number[] = [];
  sentLinksPerMonth: number[] = [];
  receivedLinksPerMonth: number[] = [];

  // Period selection
  type = 'month'; // default period
  types = ['week', 'month', 'year'];

  private subscriptions: Subscription[] = [];
  private trendsSub?: Subscription;
  private patientsTrendsSub?: Subscription;
  private linksTrendsSub?: Subscription;

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService
  ) {}

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole();

    // Generate last 6 months
    this.lastSixMonths = this.getLastMonths(6);

    // Subscribe to dashboard data
    const dashSub = this.dashboardService.dashboardData$.subscribe({
      next: (data) => {
        this.dashboardData = {
          ...data,
          patients: {
            totalPatients: data.patients?.totalPatients ?? 0,
            newPatientsThisMonth: data.patients?.newPatientsThisMonth ?? 0,
          },
          links: {
            totalLinksSent: data.links?.totalLinksSent ?? 0,
            totalLinksReceived: data.links?.totalLinksReceived ?? 0,
            pendingSent: data.links?.pendingSent ?? 0,
            acceptedSent: data.links?.acceptedSent ?? 0,
            pendingReceived: data.links?.pendingReceived ?? 0,
            acceptedReceived: data.links?.acceptedReceived ?? 0,
            newThisMonthSent: data.links?.newThisMonthSent ?? 0,
            newThisMonthReceived: data.links?.newThisMonthReceived ?? 0,
          },
        };

        this.loadPatientTrends();
        this.loadLinksTrends();
        this.loadAppointmentsSummary(this.type);
      },
      error: (err) => {
        console.error('Dashboard data failed to load', err);
      },
    });
    this.subscriptions.push(dashSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.trendsSub?.unsubscribe();
    this.patientsTrendsSub?.unsubscribe();
    this.linksTrendsSub?.unsubscribe();
  }

  // ---------------------------
  // Historical trends
  // ---------------------------
  private loadPatientTrends(): void {
    if (!this.lastSixMonths.length) return;
    this.patientsTrendsSub?.unsubscribe();

    const requests = this.lastSixMonths.map((month) =>
      this.dashboardService.getPatientsSummaryForMonth(month)
    );

    this.patientsTrendsSub = forkJoin(requests).subscribe({
      next: (results: PatientSummary[]) => {
        this.patientsPerMonth = results.map((r) => r.newPatientsThisMonth ?? 0);
      },
      error: (err) => console.error('Failed to load patient trends', err),
    });
  }

  private loadLinksTrends(): void {
    if (!this.lastSixMonths.length) return;
    this.linksTrendsSub?.unsubscribe();

    const sentRequests = this.lastSixMonths.map((month) =>
      this.dashboardService.getLinksSummarySentForMonth(month)
    );
    const receivedRequests = this.lastSixMonths.map((month) =>
      this.dashboardService.getLinksSummaryReceivedForMonth(month)
    );

    this.linksTrendsSub = forkJoin([forkJoin(sentRequests), forkJoin(receivedRequests)]).subscribe({
      next: ([sentResults, receivedResults]: [DetailedLinksSummary[], DetailedLinksSummary[]]) => {
        this.sentLinksPerMonth = sentResults.map((r) => r.newThisMonthSent ?? 0);
        this.receivedLinksPerMonth = receivedResults.map((r) => r.newThisMonthReceived ?? 0);
      },
      error: (err) => console.error('Failed to load links trends', err),
    });
  }

  // ---------------------------
  // Appointments summary
  // ---------------------------
  loadAppointmentsSummary(period: string): void {
    this.dashboardService.getAppointmentsSummary(period).subscribe({
      next: (summary) => {
        this.appointmentsSummary = summary;
      },
      error: (err) => console.error('Failed to load appointments summary', err),
    });
  }

  onAppointmentsPeriodChange(period: string): void {
    this.type = period;
    this.loadAppointmentsSummary(period);
  }

  // ---------------------------
  // Getters for template
  // ---------------------------
  get patientsSummary() {
    return this.dashboardData?.patients ?? null;
  }

  get linksSummary() {
    return this.dashboardData?.links ?? null;
  }

  get linksSentData(): number[] {
    return this.sentLinksPerMonth;
  }

  get linksReceivedData(): number[] {
    return this.receivedLinksPerMonth;
  }

  // ---------------------------
  // Role checks
  // ---------------------------
  isAdmin(): boolean {
    return this.userRole === 'admin';
  }
  isDoctor(): boolean {
    return this.userRole === 'doctor';
  }
  isProthesist(): boolean {
    return this.userRole === 'prothesist';
  }
  isPatient(): boolean {
    return this.userRole === 'patient';
  }

  // ---------------------------
  // Helper: last N months
  // ---------------------------
  private getLastMonths(count: number): string[] {
    const months: string[] = [];
    const now = new Date();
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${('0' + (d.getMonth() + 1)).slice(-2)}`);
    }
    return months;
  }

  // ---------------------------
  // Refresh
  // ---------------------------
  refresh(): void {
    this.dashboardService.refreshDashboard();
    this.loadAppointmentsSummary(this.type);
  }
}

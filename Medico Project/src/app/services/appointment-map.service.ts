import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type AppointmentStatus = 'pending' | 'approved' | 'rejected';

export interface AppointmentDayInfo {
  count: number;
  status: AppointmentStatus; // for now we'll use 'pending' (yellow)
}

@Injectable({ providedIn: 'root' })
export class AppointmentMapService {
  private _appointmentsMap$ = new BehaviorSubject<{ [key: string]: AppointmentDayInfo }>({});
  /** Observable for components to subscribe to */
  readonly appointmentsMap$ = this._appointmentsMap$.asObservable();

  /** Get current snapshot */
  getMap(): { [key: string]: AppointmentDayInfo } {
    return this._appointmentsMap$.getValue();
  }

  /** Replace entire map */
  setMap(map: { [key: string]: AppointmentDayInfo }): void {
    this._appointmentsMap$.next({ ...map });
  }

  /** Increment count for a date (defaults to 'pending' status) */
  increment(dateKey: string, status: AppointmentStatus = 'pending'): void {
    const current = this.getMap();
    const entry = current[dateKey] || { count: 0, status };
    const next = {
      ...current,
      [dateKey]: { count: entry.count + 1, status },
    };
    this._appointmentsMap$.next(next);
  }

  /** Set explicit status for a date without changing count */
  setStatus(dateKey: string, status: AppointmentStatus): void {
    const current = this.getMap();
    const entry = current[dateKey] || { count: 0, status };
    const next = {
      ...current,
      [dateKey]: { ...entry, status },
    };
    this._appointmentsMap$.next(next);
  }

  /** Clear everything (optional) */
  clear(): void {
    this._appointmentsMap$.next({});
  }
}

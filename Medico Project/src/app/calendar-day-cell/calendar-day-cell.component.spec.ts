import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalendarDayCellComponent } from './calendar-day-cell.component';

describe('CalendarDayCellComponent', () => {
  let component: CalendarDayCellComponent;
  let fixture: ComponentFixture<CalendarDayCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CalendarDayCellComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CalendarDayCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

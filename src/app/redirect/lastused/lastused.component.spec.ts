import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LastusedComponent } from './lastused.component';

describe('LastusedComponent', () => {
  let component: LastusedComponent;
  let fixture: ComponentFixture<LastusedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LastusedComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LastusedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

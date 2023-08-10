import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TracksComponent } from './tracks.component';

describe('TracksComponent', () => {
  let component: TracksComponent;
  let fixture: ComponentFixture<TracksComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TracksComponent]
    });
    fixture = TestBed.createComponent(TracksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IsrcListComponent } from './isrc-list.component';

describe('IsrcListComponent', () => {
  let component: IsrcListComponent;
  let fixture: ComponentFixture<IsrcListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IsrcListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IsrcListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

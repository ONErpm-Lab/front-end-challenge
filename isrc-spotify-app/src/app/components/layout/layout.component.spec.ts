import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { LayoutComponent } from './layout.component';

describe('LayoutComponent', () => {
  let component: LayoutComponent;
  let fixture: ComponentFixture<LayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutComponent, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(LayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

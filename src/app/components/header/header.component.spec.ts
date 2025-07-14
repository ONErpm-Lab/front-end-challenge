import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NotificationService } from '../../services/notification/notification.service';
import { HeaderComponent } from './header.component';

fdescribe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['setNotification']);

    await TestBed.configureTestingModule({
      imports: [
        HeaderComponent,
        MatSlideToggleModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: NotificationService, useValue: notificationServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeDefined();
    expect(component).not.toBeNull();
  });

  it('should initialize with default values', () => {
    expect(component.checked).toBe(false);
    expect(component.disabled).toBe(false);
  });

  it('should update checked property when toggle changes', () => {
    const mockEvent: MatSlideToggleChange = {
      checked: true,
      source: {} as any
    };

    component.onToggleChange(mockEvent);

    expect(component.checked).toBe(true);
  });

  it('should call notification service when toggle changes', () => {
    const mockEvent: MatSlideToggleChange = {
      checked: true,
      source: {} as any
    };

    component.onToggleChange(mockEvent);

    expect(notificationService.setNotification).toHaveBeenCalledWith(true);
  });

  it('should handle toggle change to false', () => {
    const mockEvent: MatSlideToggleChange = {
      checked: false,
      source: {} as any
    };

    component.onToggleChange(mockEvent);

    expect(component.checked).toBe(false);
    expect(notificationService.setNotification).toHaveBeenCalledWith(false);
  });
});
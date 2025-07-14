import { TestBed } from '@angular/core/testing';
import { NotificationService } from './notification.service';

fdescribe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set and emit notification with true value', () => {
    let result: boolean | undefined;
    
    service.getNotification().subscribe(value => {
      result = value;
    });

    service.setNotification(true);
    
    expect(result).toBe(true);
  });

  it('should set and emit notification with false value', () => {
    let result: boolean | undefined;
    
    service.getNotification().subscribe(value => {
      result = value;
    });

    service.setNotification(false);
    
    expect(result).toBe(false);
  });

  it('should return the same Subject instance', () => {
    const subject1 = service.getNotification();
    const subject2 = service.getNotification();
    
    expect(subject1).toBe(subject2);
  });

  it('should emit multiple notifications in sequence', () => {
    const results: boolean[] = [];
    
    service.getNotification().subscribe(value => {
      results.push(value);
    });

    service.setNotification(true);
    service.setNotification(false);
    service.setNotification(true);
    
    expect(results).toEqual([true, false, true]);
  });
});
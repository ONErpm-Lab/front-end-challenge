

import { of } from 'rxjs';

import { LoadingSpinnerComponent } from './loading-spinner.component';
import { LoadingService } from '../../services/loading/loading.service';

describe('LoadingSpinnerComponent', () => {
  let component: LoadingSpinnerComponent;
  let mockLoadingService: Partial<LoadingService>;

  beforeEach(() => {
    mockLoadingService = {
      loading$: of(false)
    };

    component = new LoadingSpinnerComponent(mockLoadingService as LoadingService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize isLoading$ with the loading service observable', (done) => {
    mockLoadingService.loading$ = of(true);

    component = new LoadingSpinnerComponent(mockLoadingService as LoadingService);

    component.isLoading$.subscribe(isLoading => {
      expect(isLoading).toBeTrue();
      done();
    });
  });

  it('should reflect false when loading service emits false', (done) => {
    mockLoadingService.loading$ = of(false);
    component = new LoadingSpinnerComponent(mockLoadingService as LoadingService);

    component.isLoading$.subscribe(isLoading => {
      expect(isLoading).toBeFalse();
      done();
    });
  });
});

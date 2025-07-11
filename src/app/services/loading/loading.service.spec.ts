import { LoadingService } from './loading.service';

describe('LoadingService', () => {
  let service: LoadingService;
  let loadingSubjectSpy: jasmine.Spy;

  beforeEach(() => {
    service = new LoadingService();
    loadingSubjectSpy = spyOn((service as any)._loading, 'next').and.callThrough();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initially emit false', (done) => {
    service.loading$.subscribe(isLoading => {
      expect(isLoading).toBeFalse();
      done();
    });
  });

  it('should emit true when startLoading() is called for the first time', () => {
    service.startLoading();
    expect(loadingSubjectSpy).toHaveBeenCalledWith(true);
    expect(loadingSubjectSpy).toHaveBeenCalledTimes(1);
  });

  it('should not emit true again if startLoading() is called multiple times without stopLoading()', () => {
    service.startLoading();
    service.startLoading();
    service.startLoading();

    expect(loadingSubjectSpy).toHaveBeenCalledWith(true);
    expect(loadingSubjectSpy).toHaveBeenCalledTimes(1);
  });

  it('should emit false when stopLoading() is called and activeRequests becomes 0', () => {
    service.startLoading();
    loadingSubjectSpy.calls.reset();

    service.stopLoading();
    expect(loadingSubjectSpy).toHaveBeenCalledWith(false);
    expect(loadingSubjectSpy).toHaveBeenCalledTimes(1);
  });

  it('should not emit false if stopLoading() is called but activeRequests is not 0', () => {
    service.startLoading();
    service.startLoading();
    loadingSubjectSpy.calls.reset();

    service.stopLoading();
    expect(loadingSubjectSpy).not.toHaveBeenCalled();

    service.stopLoading();
    expect(loadingSubjectSpy).toHaveBeenCalledWith(false);
    expect(loadingSubjectSpy).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple start/stop calls correctly', () => {
    service.startLoading();
    expect(loadingSubjectSpy).toHaveBeenCalledWith(true);
    expect(loadingSubjectSpy).toHaveBeenCalledTimes(1);
    loadingSubjectSpy.calls.reset();

    service.startLoading();
    service.stopLoading();
    expect(loadingSubjectSpy).not.toHaveBeenCalled();

    service.stopLoading();
    expect(loadingSubjectSpy).toHaveBeenCalledWith(false);
    expect(loadingSubjectSpy).toHaveBeenCalledTimes(1);
  });

  it('should correctly reflect loading state via loading$ observable', (done) => {
    const emittedStates: boolean[] = [];

    service.loading$.subscribe(isLoading => {
      emittedStates.push(isLoading);

      if (emittedStates.length === 3) {
        expect(emittedStates).toEqual([false, true, false]);
        done();
      }
    });

    service.startLoading();
    service.stopLoading();
  });
});

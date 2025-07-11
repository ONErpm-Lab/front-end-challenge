import { FormControl, FormGroup, Validators } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { IsrcSearchComponent } from './isrc-search.component';

describe('IsrcSearchComponent', () => {
  let component: IsrcSearchComponent;
  let mockSpotifyApiService: any;

  beforeEach(() => {
    mockSpotifyApiService = jasmine.createSpyObj('SpotifyApiService', ['searchTracksByIsrc']);
    component = new IsrcSearchComponent(mockSpotifyApiService);
    component.ngOnInit();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form with a required ISRC control', () => {
    expect(component.form).toBeInstanceOf(FormGroup);
    expect(component.form.get('isrc')).toBeInstanceOf(FormControl);
    expect(component.form.get('isrc')?.hasValidator(Validators.required)).toBeTrue();
  });

  it('should return the ISRC form control', () => {
    expect(component.isrc).toBe(component.form.get('isrc') as any);
  });


  it('should call spotifyApiService.searchTracksByIsrc and update tracks if form is valid', () => {
    const mockTracks = [{ id: '1', name: 'Track 1' } as any];
    mockSpotifyApiService.searchTracksByIsrc.and.returnValue(of(mockTracks));

    component.isrc.setValue('someISRC');
    component.form.updateValueAndValidity();

    component.searchIsrc();

    expect(mockSpotifyApiService.searchTracksByIsrc).toHaveBeenCalledWith('someISRC');
    expect(component.tracks).toEqual(mockTracks);
  });

  it('should not call spotifyApiService.searchTracksByIsrc if form is invalid', () => {
    component.isrc.setValue('');
    component.form.updateValueAndValidity();

    component.searchIsrc();

    expect(mockSpotifyApiService.searchTracksByIsrc).not.toHaveBeenCalled();
    expect(component.form.touched).toBeTrue();
  });

  it('should mark all form controls as touched if form is invalid', () => {
    component.isrc.setValue('');
    component.form.updateValueAndValidity();
    spyOn(component.form, 'markAllAsTouched');

    component.searchIsrc();

    expect(component.form.markAllAsTouched).toHaveBeenCalled();
  });
});

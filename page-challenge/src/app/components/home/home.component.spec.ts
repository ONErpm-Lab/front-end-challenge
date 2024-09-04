import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TrackListComponent } from '../track-list/track-list.component'; // Ajuste o caminho conforme necessário

describe('TrackListComponent', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, TrackListComponent] // Importação correta para standalone component
    }).compileComponents();

    const fixture = TestBed.createComponent(TrackListComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});


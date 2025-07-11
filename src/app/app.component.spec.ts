import { AppComponent } from './app.component';

let component: AppComponent;

describe('AppComponent', () => {
  beforeEach(() => {
    component = new AppComponent();
  });

  it('deve ter o título correto', () => {
    expect(component.title).toBe('front-end-challenge');
  });
});

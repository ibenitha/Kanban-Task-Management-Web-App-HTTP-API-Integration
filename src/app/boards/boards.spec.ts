import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Boards } from './boards';

describe('Boards', () => {
  let component: Boards;
  let fixture: ComponentFixture<Boards>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Boards],
      providers: [provideRouter([])], // the template's routerLink needs a router context to render
    }).compileComponents();

    fixture = TestBed.createComponent(Boards);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

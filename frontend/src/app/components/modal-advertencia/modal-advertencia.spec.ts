import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalAdvertencia } from './modal-advertencia';

describe('ModalAdvertencia', () => {
  let component: ModalAdvertencia;
  let fixture: ComponentFixture<ModalAdvertencia>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalAdvertencia],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalAdvertencia);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

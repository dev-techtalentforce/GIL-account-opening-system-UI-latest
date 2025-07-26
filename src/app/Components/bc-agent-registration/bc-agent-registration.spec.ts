import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BcAgentRegistration } from './bc-agent-registration';

describe('BcAgentRegistration', () => {
  let component: BcAgentRegistration;
  let fixture: ComponentFixture<BcAgentRegistration>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BcAgentRegistration]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BcAgentRegistration);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

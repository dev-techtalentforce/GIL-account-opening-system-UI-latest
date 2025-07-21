import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddBalance } from './add-balance';

describe('AddBalance', () => {
  let component: AddBalance;
  let fixture: ComponentFixture<AddBalance>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddBalance]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddBalance);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

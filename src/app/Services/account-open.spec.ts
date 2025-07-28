import { TestBed } from '@angular/core/testing';

import { AccountOpen } from './account-open';

describe('AccountOpen', () => {
  let service: AccountOpen;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AccountOpen);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

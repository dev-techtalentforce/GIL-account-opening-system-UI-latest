import { TestBed } from '@angular/core/testing';

import { BcAgentService } from './bc-agent-service';

describe('BcAgentService', () => {
  let service: BcAgentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BcAgentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { NsdlService } from './nsdl-service';

describe('NsdlService', () => {
  let service: NsdlService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NsdlService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

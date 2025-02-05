import { TestBed } from '@angular/core/testing';

import { ZapiService } from './zapi.service';

describe('ZapiService', () => {
  let service: ZapiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ZapiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

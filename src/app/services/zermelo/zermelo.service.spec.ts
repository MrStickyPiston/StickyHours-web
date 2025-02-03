import { TestBed } from '@angular/core/testing';

import { ZermeloService } from './zermelo.service';

describe('ZermeloService', () => {
  let service: ZermeloService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ZermeloService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

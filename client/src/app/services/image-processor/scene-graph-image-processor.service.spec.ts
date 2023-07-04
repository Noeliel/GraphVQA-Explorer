import { TestBed } from '@angular/core/testing';

import { SceneGraphImageProcessorService } from './scene-graph-image-processor.service';

describe('SceneGraphImageProcessorService', () => {
  let service: SceneGraphImageProcessorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SceneGraphImageProcessorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { SceneFactoryService } from './scene-factory.service';

describe('SceneFactoryService', () => {
    let service: SceneFactoryService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(SceneFactoryService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});

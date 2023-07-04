import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SceneBrowserComponent } from './scene-browser.component';

describe('SceneBrowserComponent', () => {
    let component: SceneBrowserComponent;
    let fixture: ComponentFixture<SceneBrowserComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [SceneBrowserComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SceneBrowserComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

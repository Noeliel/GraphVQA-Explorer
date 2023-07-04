import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EvalBrowserComponent } from './eval-browser.component';

describe('EvalBrowserComponent', () => {
    let component: EvalBrowserComponent;
    let fixture: ComponentFixture<EvalBrowserComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [EvalBrowserComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EvalBrowserComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

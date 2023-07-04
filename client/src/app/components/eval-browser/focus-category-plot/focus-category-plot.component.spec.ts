import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FocusCategoryPlotComponent } from './focus-category-plot.component';

describe('FocusCategoryPlotComponent', () => {
    let component: FocusCategoryPlotComponent;
    let fixture: ComponentFixture<FocusCategoryPlotComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [FocusCategoryPlotComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(FocusCategoryPlotComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

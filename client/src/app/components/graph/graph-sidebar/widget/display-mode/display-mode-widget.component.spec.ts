import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplayModeWidgetComponent } from './display-mode-widget.component';

describe('DisplayModeWidgetComponent', () => {
    let component: DisplayModeWidgetComponent;
    let fixture: ComponentFixture<DisplayModeWidgetComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DisplayModeWidgetComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DisplayModeWidgetComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

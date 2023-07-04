import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ElementFilterWidgetComponent } from './element-filter-widget.component';

describe('ElementFilterWidgetComponent', () => {
    let component: ElementFilterWidgetComponent;
    let fixture: ComponentFixture<ElementFilterWidgetComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ElementFilterWidgetComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ElementFilterWidgetComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

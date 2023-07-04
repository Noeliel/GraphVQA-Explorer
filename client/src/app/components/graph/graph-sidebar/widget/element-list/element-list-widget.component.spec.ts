import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ElementListWidgetComponent } from './element-list-widget.component';

describe('ElementListWidgetComponent', () => {
    let component: ElementListWidgetComponent;
    let fixture: ComponentFixture<ElementListWidgetComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ElementListWidgetComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ElementListWidgetComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

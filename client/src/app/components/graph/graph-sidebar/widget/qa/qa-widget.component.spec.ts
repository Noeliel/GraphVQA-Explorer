import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QAWidgetComponent } from './qa-widget.component';

describe('QAWidgetComponent', () => {
    let component: QAWidgetComponent;
    let fixture: ComponentFixture<QAWidgetComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [QAWidgetComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(QAWidgetComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

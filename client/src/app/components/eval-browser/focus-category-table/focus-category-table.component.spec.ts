import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FocusCategoryTableComponent } from './focus-category-table.component';

describe('FocusCategoryTableComponent', () => {
    let component: FocusCategoryTableComponent;
    let fixture: ComponentFixture<FocusCategoryTableComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [FocusCategoryTableComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(FocusCategoryTableComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraphSidebarComponent } from './graph-sidebar.component';

describe('GraphFilterComponent', () => {
    let component: GraphSidebarComponent;
    let fixture: ComponentFixture<GraphSidebarComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [GraphSidebarComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GraphSidebarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

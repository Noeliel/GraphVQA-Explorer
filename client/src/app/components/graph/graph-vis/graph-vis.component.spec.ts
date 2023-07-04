import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraphVisComponent } from './graph-vis.component';

describe('GraphVisComponent', () => {
    let component: GraphVisComponent;
    let fixture: ComponentFixture<GraphVisComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [GraphVisComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GraphVisComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

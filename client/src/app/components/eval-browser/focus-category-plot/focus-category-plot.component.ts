import {
    AfterViewInit,
    Component,
    ElementRef,
    Input,
    ViewChild,
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { EvaluationBrowserPrefsCachingPortal } from 'src/app/entities/preferences/evaluation-browser-prefscachingportal';
import { EvaluationGraphCategory } from 'src/app/models/evaluationgraphcategory.model';
import { Scatterplot } from '../scatterplot';
import * as d3 from 'd3';

@Component({
    selector: 'focus-category-plot',
    templateUrl: './focus-category-plot.component.html',
    styleUrls: ['./focus-category-plot.component.scss'],
})
export class FocusCategoryPlotComponent implements AfterViewInit {
    @ViewChild('plotContainer', { read: ElementRef, static: true })
    plotContainer?: ElementRef<HTMLDivElement>;

    @ViewChild('svgTooltip', { read: ElementRef, static: true })
    private svgTooltipRef!: ElementRef<HTMLDivElement>;
    protected svgTooltip!: d3.Selection<
        HTMLDivElement,
        unknown,
        null,
        undefined
    >;

    @Input() categoryDataSource!: MatTableDataSource<EvaluationGraphCategory>;

    preferences = new EvaluationBrowserPrefsCachingPortal();

    private axis_x = 'frequency_total';
    private axis_y = 'performance_norm_net';

    constructor() {}

    ngAfterViewInit(): void {
        this.prepare_setup_tooltip();
        this.rerenderPlot();
    }

    clearPlot() {
        if (!this.plotContainer) return;

        for (;;) {
            const child = this.plotContainer.nativeElement.firstChild;
            if (child) this.plotContainer.nativeElement.removeChild(child);
            else break;
        }
    }

    rerenderPlot() {
        if (!this.plotContainer) return;

        this.clearPlot();

        const chart = Scatterplot(this.categoryDataSource.filteredData, this, {
            x: (d: EvaluationGraphCategory) => d[this.axis_x as keyof typeof d],
            y: (d: EvaluationGraphCategory) => d[this.axis_y as keyof typeof d],
            title: (d: EvaluationGraphCategory) => d.name,
            xLabel: 'frequency_total' + ' →',
            yLabel: '↑ ' + 'performance_norm_net',
            stroke: 'steelblue',
            fill: 'none',
            width: this.plotContainer.nativeElement.clientWidth - 10,
            height: this.plotContainer.nativeElement.clientHeight - 6,
        } as any);

        this.plotContainer.nativeElement.appendChild(chart as Node);
    }

    private prepare_setup_tooltip(): d3.Selection<
        HTMLDivElement,
        unknown,
        null,
        undefined
    > {
        this.svgTooltip = d3
            .select(this.svgTooltipRef.nativeElement)
            .attr('class', 'tooltip')
            .style('position', 'absolute')
            .style('border', '1px solid #000000')
            .style('border-radius', '4px')
            .style('background-color', '#3A3B3C')
            .style('color', 'white')
            .style('padding-top', '3px')
            .style('padding-right', '3px')
            .style('padding-bottom', '1px')
            .style('padding-left', '3px')
            .style('pointer-events', 'none')
            .style('opacity', '0');

        return this.svgTooltip;
    }

    protected showCategoryTooltip(
        name: string,
        value_x: string,
        value_y: string,
        mouseX: number,
        mouseY: number
    ): void {
        this.svgTooltip
            .html(
                this.tooltipBody(
                    name,
                    this.axis_x,
                    value_x,
                    this.axis_y,
                    value_y
                )
            )
            .style('left', mouseX + 12 + 'px')
            .style('top', mouseY - 28 + 'px');

        this.svgTooltip
            .interrupt()
            .transition()
            .duration(160)
            .style('opacity', '1');
    }

    protected tooltipBody(
        name: string,
        axis_x: string,
        value_x: string,
        axis_y: string,
        value_y: string
    ) {
        return (
            '<b><i>' +
            name +
            '</i></b>' +
            '<br>' +
            axis_x +
            ': ' +
            '<b>' +
            value_x +
            '</b>' +
            '<br>' +
            axis_y +
            ': ' +
            '<b>' +
            value_y +
            '</b>'
        );
    }

    // fade out the tooltip
    protected hideTooltip() {
        this.svgTooltip
            .interrupt()
            .transition()
            .duration(160)
            .style('opacity', '0');
    }
}

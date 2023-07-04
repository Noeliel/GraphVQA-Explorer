import { AfterViewInit, Component, Input, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { EvaluationBrowserPrefsCachingPortal } from 'src/app/entities/preferences/evaluation-browser-prefscachingportal';
import { EvaluationGraphCategory } from 'src/app/models/evaluationgraphcategory.model';

@Component({
    selector: 'focus-category-table',
    templateUrl: './focus-category-table.component.html',
    styleUrls: ['./focus-category-table.component.scss'],
})
export class FocusCategoryTableComponent implements AfterViewInit {
    static availableCategoryColumns: string[] = [
        'name',
        'frequency_total',
        'frequency_pos',
        'frequency_neg',
        'weight_avg_total',
        'weight_avg_pos',
        'weight_avg_neg',
        'performance_norm_net',
        'performance_norm_smax_net',
        'performance_norm_pos',
        'performance_norm_smax_pos',
        'performance_plot',
        'performance_norm_neg',
        'performance_norm_smax_neg',
    ];

    preferences = new EvaluationBrowserPrefsCachingPortal();

    @ViewChild('category_paginator') _paginator!: MatPaginator;
    @ViewChild('category_sort') _sort!: MatSort;

    pageSize = 50;

    @ViewChild('exporter') _exporter: any;

    @Input() categoryDataSource!: MatTableDataSource<EvaluationGraphCategory>;

    constructor() {}

    ngAfterViewInit(): void {
        this.categoryDataSource.paginator = this._paginator;
        this.categoryDataSource.sort = this._sort;
    }

    processFractionForDisplay(raw_confidence: number): string {
        return parseFloat((raw_confidence * 100).toFixed(5)) + '%';
    }

    processBarWidth(value: number) {
        return 'width: ' + value * 100 + '%;';
    }
}

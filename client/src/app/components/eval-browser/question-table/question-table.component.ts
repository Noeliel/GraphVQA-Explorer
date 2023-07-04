import { AfterViewInit, Component, Input, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { EvaluationBrowserPrefsCachingPortal } from 'src/app/entities/preferences/evaluation-browser-prefscachingportal';
import { EvaluationQuestionTableData } from 'src/app/models/evaluationquestiontabledata.model';

@Component({
    selector: 'question-table',
    templateUrl: './question-table.component.html',
    styleUrls: ['./question-table.component.scss'],
})
export class QuestionTableComponent implements AfterViewInit {
    static availableQuestionColumns: string[] = [
        'question_id',
        'scene_id',
        'question',
        'ambiguity',
        'ground_truth',
        'prediction_1',
        'confidence_1',
        'correct_1',
        'prediction_2',
        'confidence_2',
        'correct_2',
        'prediction_3',
        'confidence_3',
        'correct_3',
        'prediction_4',
        'confidence_4',
        'correct_4',
        'prediction_5',
        'confidence_5',
        'correct_5',
        'focus_1',
        'weight_1',
        'focus_2',
        'weight_2',
        'focus_3',
        'weight_3',
        'focus_4',
        'weight_4',
        'focus_5',
        'weight_5',
    ];

    preferences = new EvaluationBrowserPrefsCachingPortal();

    @ViewChild('question_paginator') _paginator!: MatPaginator;
    @ViewChild('question_sort') _sort!: MatSort;

    pageSize = 50;

    @ViewChild('exporter') _exporter: any;

    @Input()
    questionDataSource!: MatTableDataSource<EvaluationQuestionTableData>;

    constructor() {}

    ngAfterViewInit(): void {
        this.questionDataSource.paginator = this._paginator;
        this.questionDataSource.sort = this._sort;
    }

    cellTitleForPrediction(prediction: string, ground_truth: string): string {
        return (
            prediction +
            (prediction == ground_truth ? ' == ' : ' != ') +
            ground_truth
        );
    }

    processConfidenceForDisplay(raw_confidence: number): string {
        return parseFloat((raw_confidence * 100).toFixed(5)) + '%';
    }
}

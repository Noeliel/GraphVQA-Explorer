import { Injectable } from '@angular/core';

import {
    // generate_categories_from_questions,
    palette_from_median_cut_quantization,
} from './module/pkg/gqavis_highperf';

@Injectable({
    providedIn: 'root',
})
export class WasmService {
    constructor() {}

    public palette_from_median_cut_quantization(
        data: Uint8Array,
        depth_bits: number
    ): Uint8Array {
        return palette_from_median_cut_quantization(
            data,
            data.length,
            depth_bits
        );
    }

    /*
    public generate_categories_from_questions(
        questions: EvaluationQuestionTableData[]
    ): EvaluationGraphCategory[] {
        
        // const questions_serialized = JSON.stringify(questions);
        // return generate_categories_from_questions_serialized(
        //     questions_serialized
        // );
        

        return generate_categories_from_questions(questions);
    }
    */
}

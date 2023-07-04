// pub mod evaluationgraphcategory;
// pub mod evaluationquestiontabledata;

// extern crate serde;

use std::{collections::HashMap, vec};
use wasm_bindgen::prelude::*;

// use hashbrown::HashMap;

/*
#[wasm_bindgen]
pub fn generate_categories_from_questions_serialized(questions_serialized: String) -> Box<[EvaluationGraphCategory]> {
    let questions: Vec<EvaluationQuestionTableData> = serde_json::from_str(&questions_serialized).unwrap();
    generate_categories_from_questions(questions)
}
*/

struct EvaluationCategoryCorrectness {
    t_freq: u32,
    f_freq: u32,
    t_total_weight: f64,
    f_total_weight: f64,
}

struct CategoryDataAggregation {
    frequency: u32,
    weight: f64,
    correctness: EvaluationCategoryCorrectness,
}

#[wasm_bindgen]
pub fn generate_categories_from_questions(
    questions: Box<[EvaluationQuestionTableData]>,
) -> Box<[EvaluationGraphCategory]> {
    // todo: just don't use HashMap
    let mut categories_data: HashMap<String, CategoryDataAggregation> = HashMap::new();

    let mut categories: Vec<EvaluationGraphCategory> = vec![];

    let mut max_frequency = 0.0;
    let mut max_avg_weight = 0.0;
    let mut max_avg_weight_t = 0.0;
    let mut max_avg_weight_f = 0.0;
    let mut max_pos_performance = 0.0;
    let mut max_neg_performance = 0.0;

    for q_iter_pair in questions.iter().enumerate() {
        let data: &EvaluationQuestionTableData = q_iter_pair.1;

        {
            let additional_weight = data.weight_1();
            let mut additional_freq_t = 0;
            let mut additional_freq_f = 0;
            let mut additional_weight_t = 0.0;
            let mut additional_weight_f = 0.0;

            if data.correct_1().contains("true") {
                additional_freq_t += 1;
                additional_weight_t += additional_weight;
            } else {
                additional_freq_f += 1;
                additional_weight_f += additional_weight;
            };

            categories_data
                .entry(data.focus_1())
                .and_modify(|e| {
                    e.frequency += 1;
                    e.weight += additional_weight;

                    e.correctness.t_freq += additional_freq_t;
                    e.correctness.f_freq += additional_freq_f;
                    e.correctness.t_total_weight += additional_weight_t;
                    e.correctness.f_total_weight += additional_weight_f;
                })
                .or_insert({
                    CategoryDataAggregation {
                        frequency: 1,
                        weight: additional_weight,
                        correctness: EvaluationCategoryCorrectness {
                            t_freq: additional_freq_t,
                            f_freq: additional_freq_f,
                            t_total_weight: additional_weight_t,
                            f_total_weight: additional_weight_f,
                        },
                    }
                });
        }

        {
            let additional_weight = data.weight_2();
            let mut additional_freq_t = 0;
            let mut additional_freq_f = 0;
            let mut additional_weight_t = 0.0;
            let mut additional_weight_f = 0.0;

            if data.correct_2().contains("true") {
                additional_freq_t += 1;
                additional_weight_t += additional_weight;
            } else {
                additional_freq_f += 1;
                additional_weight_f += additional_weight;
            };

            categories_data
                .entry(data.focus_2())
                .and_modify(|e| {
                    e.frequency += 1;
                    e.weight += additional_weight;

                    e.correctness.t_freq += additional_freq_t;
                    e.correctness.f_freq += additional_freq_f;
                    e.correctness.t_total_weight += additional_weight_t;
                    e.correctness.f_total_weight += additional_weight_f;
                })
                .or_insert({
                    CategoryDataAggregation {
                        frequency: 1,
                        weight: additional_weight,
                        correctness: EvaluationCategoryCorrectness {
                            t_freq: additional_freq_t,
                            f_freq: additional_freq_f,
                            t_total_weight: additional_weight_t,
                            f_total_weight: additional_weight_f,
                        },
                    }
                });
        }

        {
            let additional_weight = data.weight_3();
            let mut additional_freq_t = 0;
            let mut additional_freq_f = 0;
            let mut additional_weight_t = 0.0;
            let mut additional_weight_f = 0.0;

            if data.correct_3().contains("true") {
                additional_freq_t += 1;
                additional_weight_t += additional_weight;
            } else {
                additional_freq_f += 1;
                additional_weight_f += additional_weight;
            };

            categories_data
                .entry(data.focus_3())
                .and_modify(|e| {
                    e.frequency += 1;
                    e.weight += additional_weight;

                    e.correctness.t_freq += additional_freq_t;
                    e.correctness.f_freq += additional_freq_f;
                    e.correctness.t_total_weight += additional_weight_t;
                    e.correctness.f_total_weight += additional_weight_f;
                })
                .or_insert({
                    CategoryDataAggregation {
                        frequency: 1,
                        weight: additional_weight,
                        correctness: EvaluationCategoryCorrectness {
                            t_freq: additional_freq_t,
                            f_freq: additional_freq_f,
                            t_total_weight: additional_weight_t,
                            f_total_weight: additional_weight_f,
                        },
                    }
                });
        }

        {
            let additional_weight = data.weight_4();
            let mut additional_freq_t = 0;
            let mut additional_freq_f = 0;
            let mut additional_weight_t = 0.0;
            let mut additional_weight_f = 0.0;

            if data.correct_4().contains("true") {
                additional_freq_t += 1;
                additional_weight_t += additional_weight;
            } else {
                additional_freq_f += 1;
                additional_weight_f += additional_weight;
            };

            categories_data
                .entry(data.focus_4())
                .and_modify(|e| {
                    e.frequency += 1;
                    e.weight += additional_weight;

                    e.correctness.t_freq += additional_freq_t;
                    e.correctness.f_freq += additional_freq_f;
                    e.correctness.t_total_weight += additional_weight_t;
                    e.correctness.f_total_weight += additional_weight_f;
                })
                .or_insert({
                    CategoryDataAggregation {
                        frequency: 1,
                        weight: additional_weight,
                        correctness: EvaluationCategoryCorrectness {
                            t_freq: additional_freq_t,
                            f_freq: additional_freq_f,
                            t_total_weight: additional_weight_t,
                            f_total_weight: additional_weight_f,
                        },
                    }
                });
        }

        {
            let additional_weight = data.weight_5();
            let mut additional_freq_t = 0;
            let mut additional_freq_f = 0;
            let mut additional_weight_t = 0.0;
            let mut additional_weight_f = 0.0;

            if data.correct_5().contains("true") {
                additional_freq_t += 1;
                additional_weight_t += additional_weight;
            } else {
                additional_freq_f += 1;
                additional_weight_f += additional_weight;
            };

            categories_data
                .entry(data.focus_5())
                .and_modify(|e| {
                    e.frequency += 1;
                    e.weight += additional_weight;

                    e.correctness.t_freq += additional_freq_t;
                    e.correctness.f_freq += additional_freq_f;
                    e.correctness.t_total_weight += additional_weight_t;
                    e.correctness.f_total_weight += additional_weight_f;
                })
                .or_insert({
                    CategoryDataAggregation {
                        frequency: 1,
                        weight: additional_weight,
                        correctness: EvaluationCategoryCorrectness {
                            t_freq: additional_freq_t,
                            f_freq: additional_freq_f,
                            t_total_weight: additional_weight_t,
                            f_total_weight: additional_weight_f,
                        },
                    }
                });
        }
    }

    for cat_count_entry in categories_data.into_iter().enumerate() {
        let entry = cat_count_entry.1;
        let category = entry.0;
        let data = entry.1;

        let frequency = data.frequency;
        let weight_total = data.weight;
        let weight_avg = weight_total / frequency as f64;

        let new_category = EvaluationGraphCategory::new(
            category,
            frequency,
            data.correctness.t_freq,
            data.correctness.f_freq,
            weight_total,
            weight_avg,
            data.correctness.t_total_weight,
            data.correctness.t_total_weight / data.correctness.t_freq as f64,
            data.correctness.f_total_weight,
            data.correctness.f_total_weight / data.correctness.f_freq as f64,
            0.0,
            0.0,
            0.0,
            0.0,
            0.0,
            0.0,
            String::from('='),
        );

        categories.push(new_category);
    }

    categories.into_boxed_slice()
}

#[wasm_bindgen(module = "src/app/models/evaluationquestiontabledata.model")]
extern "C" {
    pub type EvaluationQuestionTableData;

    #[wasm_bindgen(constructor)]
    fn new(
        question_id: String,
        scene_id: String,
        question: String,
        ambiguity: u32,
        ground_truth: String,
        prediction_1: String,
        confidence_1: f64,
        correct_1: String,
        prediction_2: String,
        confidence_2: f64,
        correct_2: String,
        prediction_3: String,
        confidence_3: f64,
        correct_3: String,
        prediction_4: String,
        confidence_4: f64,
        correct_4: String,
        prediction_5: String,
        confidence_5: f64,
        correct_5: String,
        focus_1: String,
        weight_1: f64,
        focus_2: String,
        weight_2: f64,
        focus_3: String,
        weight_3: f64,
        focus_4: String,
        weight_4: f64,
        focus_5: String,
        weight_5: f64,
    ) -> EvaluationQuestionTableData;

    #[wasm_bindgen(method, getter)]
    fn question_id(this: &EvaluationQuestionTableData) -> String;

    #[wasm_bindgen(method, setter)]
    fn set_question_id(this: &EvaluationQuestionTableData, value: String);

    #[wasm_bindgen(method, getter)]
    fn scene_id(this: &EvaluationQuestionTableData) -> String;

    #[wasm_bindgen(method, setter)]
    fn set_scene_id(this: &EvaluationQuestionTableData, value: String);

    #[wasm_bindgen(method, getter)]
    fn question(this: &EvaluationQuestionTableData) -> String;

    #[wasm_bindgen(method, setter)]
    fn set_question(this: &EvaluationQuestionTableData, value: String);

    #[wasm_bindgen(method, getter)]
    fn ambiguity(this: &EvaluationQuestionTableData) -> u32;

    #[wasm_bindgen(method, setter)]
    fn set_ambiguity(this: &EvaluationQuestionTableData, value: u32);

    #[wasm_bindgen(method, getter)]
    fn ground_truth(this: &EvaluationQuestionTableData) -> String;

    #[wasm_bindgen(method, setter)]
    fn set_ground_truth(this: &EvaluationQuestionTableData, value: String);

    #[wasm_bindgen(method, getter)]
    fn prediction_1(this: &EvaluationQuestionTableData) -> String;

    #[wasm_bindgen(method, setter)]
    fn set_prediction_1(this: &EvaluationQuestionTableData, value: String);

    #[wasm_bindgen(method, getter)]
    fn confidence_1(this: &EvaluationQuestionTableData) -> f64;

    #[wasm_bindgen(method, setter)]
    fn set_confidence_1(this: &EvaluationQuestionTableData, value: f64);

    #[wasm_bindgen(method, getter)]
    fn correct_1(this: &EvaluationQuestionTableData) -> String;

    #[wasm_bindgen(method, setter)]
    fn set_correct_1(this: &EvaluationQuestionTableData, value: String);

    #[wasm_bindgen(method, getter)]
    fn prediction_2(this: &EvaluationQuestionTableData) -> String;

    #[wasm_bindgen(method, setter)]
    fn set_prediction_2(this: &EvaluationQuestionTableData, value: String);

    #[wasm_bindgen(method, getter)]
    fn confidence_2(this: &EvaluationQuestionTableData) -> f64;

    #[wasm_bindgen(method, setter)]
    fn set_confidence_2(this: &EvaluationQuestionTableData, value: f64);

    #[wasm_bindgen(method, getter)]
    fn correct_2(this: &EvaluationQuestionTableData) -> String;

    #[wasm_bindgen(method, setter)]
    fn set_correct_2(this: &EvaluationQuestionTableData, value: String);

    #[wasm_bindgen(method, getter)]
    fn prediction_3(this: &EvaluationQuestionTableData) -> String;

    #[wasm_bindgen(method, setter)]
    fn set_prediction_3(this: &EvaluationQuestionTableData, value: String);

    #[wasm_bindgen(method, getter)]
    fn confidence_3(this: &EvaluationQuestionTableData) -> f64;

    #[wasm_bindgen(method, setter)]
    fn set_confidence_3(this: &EvaluationQuestionTableData, value: f64);

    #[wasm_bindgen(method, getter)]
    fn correct_3(this: &EvaluationQuestionTableData) -> String;

    #[wasm_bindgen(method, setter)]
    fn set_correct_3(this: &EvaluationQuestionTableData, value: String);

    #[wasm_bindgen(method, getter)]
    fn prediction_4(this: &EvaluationQuestionTableData) -> String;

    #[wasm_bindgen(method, setter)]
    fn set_prediction_4(this: &EvaluationQuestionTableData, value: String);

    #[wasm_bindgen(method, getter)]
    fn confidence_4(this: &EvaluationQuestionTableData) -> f64;

    #[wasm_bindgen(method, setter)]
    fn set_confidence_4(this: &EvaluationQuestionTableData, value: f64);

    #[wasm_bindgen(method, getter)]
    fn correct_4(this: &EvaluationQuestionTableData) -> String;

    #[wasm_bindgen(method, setter)]
    fn set_correct_4(this: &EvaluationQuestionTableData, value: String);

    #[wasm_bindgen(method, getter)]
    fn prediction_5(this: &EvaluationQuestionTableData) -> String;

    #[wasm_bindgen(method, setter)]
    fn set_prediction_5(this: &EvaluationQuestionTableData, value: String);

    #[wasm_bindgen(method, getter)]
    fn confidence_5(this: &EvaluationQuestionTableData) -> f64;

    #[wasm_bindgen(method, setter)]
    fn set_confidence_5(this: &EvaluationQuestionTableData, value: f64);

    #[wasm_bindgen(method, getter)]
    fn correct_5(this: &EvaluationQuestionTableData) -> String;

    #[wasm_bindgen(method, setter)]
    fn set_correct_5(this: &EvaluationQuestionTableData, value: String);

    #[wasm_bindgen(method, getter)]
    fn focus_1(this: &EvaluationQuestionTableData) -> String;

    #[wasm_bindgen(method, setter)]
    fn set_focus_1(this: &EvaluationQuestionTableData, value: String);

    #[wasm_bindgen(method, getter)]
    fn weight_1(this: &EvaluationQuestionTableData) -> f64;

    #[wasm_bindgen(method, setter)]
    fn set_weight_1(this: &EvaluationQuestionTableData, value: f64);

    #[wasm_bindgen(method, getter)]
    fn focus_2(this: &EvaluationQuestionTableData) -> String;

    #[wasm_bindgen(method, setter)]
    fn set_focus_2(this: &EvaluationQuestionTableData, value: String);

    #[wasm_bindgen(method, getter)]
    fn weight_2(this: &EvaluationQuestionTableData) -> f64;

    #[wasm_bindgen(method, setter)]
    fn set_weight_2(this: &EvaluationQuestionTableData, value: f64);

    #[wasm_bindgen(method, getter)]
    fn focus_3(this: &EvaluationQuestionTableData) -> String;

    #[wasm_bindgen(method, setter)]
    fn set_focus_3(this: &EvaluationQuestionTableData, value: String);

    #[wasm_bindgen(method, getter)]
    fn weight_3(this: &EvaluationQuestionTableData) -> f64;

    #[wasm_bindgen(method, setter)]
    fn set_weight_3(this: &EvaluationQuestionTableData, value: f64);

    #[wasm_bindgen(method, getter)]
    fn focus_4(this: &EvaluationQuestionTableData) -> String;

    #[wasm_bindgen(method, setter)]
    fn set_focus_4(this: &EvaluationQuestionTableData, value: String);

    #[wasm_bindgen(method, getter)]
    fn weight_4(this: &EvaluationQuestionTableData) -> f64;

    #[wasm_bindgen(method, setter)]
    fn set_weight_4(this: &EvaluationQuestionTableData, value: f64);

    #[wasm_bindgen(method, getter)]
    fn focus_5(this: &EvaluationQuestionTableData) -> String;

    #[wasm_bindgen(method, setter)]
    fn set_focus_5(this: &EvaluationQuestionTableData, value: String);

    #[wasm_bindgen(method, getter)]
    fn weight_5(this: &EvaluationQuestionTableData) -> f64;

    #[wasm_bindgen(method, setter)]
    fn set_weight_5(this: &EvaluationQuestionTableData, value: f64);
}

#[wasm_bindgen(module = "src/app/models/evaluationgraphcategory.model")]
extern "C" {
    // fn testrun(this: &EvaluationQuestionTableData) ->String;

    pub type EvaluationGraphCategory;

    #[wasm_bindgen(constructor)]
    fn new(
        name: String,
        frequency_total: u32,
        frequency_pos: u32,
        frequency_neg: u32,
        weight_total: f64,
        weight_avg_total: f64,
        weight_pos: f64,
        weight_avg_pos: f64,
        weight_neg: f64,
        weight_avg_neg: f64,
        performance_pos: f64,
        performance_softmax_pos: f64,
        performance_neg: f64,
        performance_softmax_neg: f64,
        performance_net: f64,
        performance_softmax_net: f64,
        performance_balanced: String,
    ) -> EvaluationGraphCategory;

    #[wasm_bindgen(method, getter)]
    fn name(this: &EvaluationGraphCategory) -> String;

    #[wasm_bindgen(method, setter)]
    fn set_name(this: &EvaluationGraphCategory, value: String);

    #[wasm_bindgen(method, getter)]
    fn frequency_total(this: &EvaluationGraphCategory) -> u32;

    #[wasm_bindgen(method, setter)]
    fn set_frequency_total(this: &EvaluationGraphCategory, value: u32);

    #[wasm_bindgen(method, getter)]
    fn frequency_pos(this: &EvaluationGraphCategory) -> u32;

    #[wasm_bindgen(method, setter)]
    fn set_frequency_pos(this: &EvaluationGraphCategory, value: u32);

    #[wasm_bindgen(method, getter)]
    fn frequency_neg(this: &EvaluationGraphCategory) -> u32;

    #[wasm_bindgen(method, setter)]
    fn set_frequency_neg(this: &EvaluationGraphCategory, value: u32);

    #[wasm_bindgen(method, getter)]
    fn weight_total(this: &EvaluationGraphCategory) -> f64;

    #[wasm_bindgen(method, setter)]
    fn set_weight_total(this: &EvaluationGraphCategory, value: f64);

    #[wasm_bindgen(method, getter)]
    fn weight_avg_total(this: &EvaluationGraphCategory) -> f64;

    #[wasm_bindgen(method, setter)]
    fn set_weight_avg_total(this: &EvaluationGraphCategory, value: f64);

    #[wasm_bindgen(method, getter)]
    fn weight_pos(this: &EvaluationGraphCategory) -> f64;

    #[wasm_bindgen(method, setter)]
    fn set_weight_pos(this: &EvaluationGraphCategory, value: f64);

    #[wasm_bindgen(method, getter)]
    fn weight_avg_pos(this: &EvaluationGraphCategory) -> f64;

    #[wasm_bindgen(method, setter)]
    fn set_weight_avg_pos(this: &EvaluationGraphCategory, value: f64);

    #[wasm_bindgen(method, getter)]
    fn weight_neg(this: &EvaluationGraphCategory) -> f64;

    #[wasm_bindgen(method, setter)]
    fn set_weight_neg(this: &EvaluationGraphCategory, value: f64);

    #[wasm_bindgen(method, getter)]
    fn weight_avg_neg(this: &EvaluationGraphCategory) -> f64;

    #[wasm_bindgen(method, setter)]
    fn set_weight_avg_neg(this: &EvaluationGraphCategory, value: f64);

    #[wasm_bindgen(method, getter)]
    fn performance_pos(this: &EvaluationGraphCategory) -> f64;

    #[wasm_bindgen(method, setter)]
    fn set_performance_pos(this: &EvaluationGraphCategory, value: f64);

    #[wasm_bindgen(method, getter)]
    fn performance_softmax_pos(this: &EvaluationGraphCategory) -> f64;

    #[wasm_bindgen(method, setter)]
    fn set_performance_softmax_pos(this: &EvaluationGraphCategory, value: f64);

    #[wasm_bindgen(method, getter)]
    fn performance_neg(this: &EvaluationGraphCategory) -> f64;

    #[wasm_bindgen(method, setter)]
    fn set_performance_neg(this: &EvaluationGraphCategory, value: f64);

    #[wasm_bindgen(method, getter)]
    fn performance_softmax_neg(this: &EvaluationGraphCategory) -> f64;

    #[wasm_bindgen(method, setter)]
    fn set_performance_softmax_neg(this: &EvaluationGraphCategory, value: f64);

    #[wasm_bindgen(method, getter)]
    fn performance_net(this: &EvaluationGraphCategory) -> f64;

    #[wasm_bindgen(method, setter)]
    fn set_performance_net(this: &EvaluationGraphCategory, value: f64);

    #[wasm_bindgen(method, getter)]
    fn performance_softmax_net(this: &EvaluationGraphCategory) -> f64;

    #[wasm_bindgen(method, setter)]
    fn set_performance_softmax_net(this: &EvaluationGraphCategory, value: f64);

    #[wasm_bindgen(method, getter)]
    fn performance_balanced(this: &EvaluationGraphCategory) -> String;

    #[wasm_bindgen(method, setter)]
    fn set_performance_balanced(this: &EvaluationGraphCategory, value: String);
}

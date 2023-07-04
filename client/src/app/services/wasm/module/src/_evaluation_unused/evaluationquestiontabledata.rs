// extern crate serde;

// use crate::gen_access_impl;
use wasm_bindgen::prelude::*;
// use serde::{Serialize, Deserialize};

use super::EvaluationCategoryCorrectness;

// #[wasm_bindgen]
// #[derive(Serialize, Deserialize, Debug)]
pub struct EvaluationQuestionTableData {
    pub _question_id: String,
    pub _scene_id: String,
    pub _question: String,
    pub _ambiguity: u32,
    pub _ground_truth: String,
    pub _prediction_1: String,
    pub _confidence_1: f64,
    pub _correct_1: String,
    pub _prediction_2: String,
    pub _confidence_2: f64,
    pub _correct_2: String,
    pub _prediction_3: String,
    pub _confidence_3: f64,
    pub _correct_3: String,
    pub _prediction_4: String,
    pub _confidence_4: f64,
    pub _correct_4: String,
    pub _prediction_5: String,
    pub _confidence_5: f64,
    pub _correct_5: String,
    pub _focus_1: String,
    pub _weight_1: f64,
    pub _focus_2: String,
    pub _weight_2: f64,
    pub _focus_3: String,
    pub _weight_3: f64,
    pub _focus_4: String,
    pub _weight_4: f64,
    pub _focus_5: String,
    pub _weight_5: f64,
}

/*
// #[wasm_bindgen]
impl EvaluationQuestionTableData {
    // #[wasm_bindgen(constructor)]
    pub fn new(
        question_id: String,
        scene_id: String,
        question: String,
        ambiguity: u8,
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
    ) -> EvaluationQuestionTableData {
        EvaluationQuestionTableData {
            question_id,
            scene_id,
            question,
            ambiguity,
            ground_truth,
            prediction_1,
            confidence_1,
            correct_1,
            prediction_2,
            confidence_2,
            correct_2,
            prediction_3,
            confidence_3,
            correct_3,
            prediction_4,
            confidence_4,
            correct_4,
            prediction_5,
            confidence_5,
            correct_5,
            focus_1,
            weight_1,
            focus_2,
            weight_2,
            focus_3,
            weight_3,
            focus_4,
            weight_4,
            focus_5,
            weight_5,
        }
    }
}
*/

/*
gen_access_impl!(EvaluationQuestionTableData2, question_id, set_question_id);
gen_access_impl!(EvaluationQuestionTableData2, scene_id, set_scene_id);
gen_access_impl!(EvaluationQuestionTableData2, question, set_question);
gen_access_impl!(EvaluationQuestionTableData2, ground_truth, set_ground_truth);
gen_access_impl!(EvaluationQuestionTableData2, prediction_1, set_prediction_1);
gen_access_impl!(EvaluationQuestionTableData2, correct_1, set_correct_1);
gen_access_impl!(EvaluationQuestionTableData2, prediction_2, set_prediction_2);
gen_access_impl!(EvaluationQuestionTableData2, correct_2, set_correct_2);
gen_access_impl!(EvaluationQuestionTableData2, prediction_3, set_prediction_3);
gen_access_impl!(EvaluationQuestionTableData2, correct_3, set_correct_3);
gen_access_impl!(EvaluationQuestionTableData2, prediction_4, set_prediction_4);
gen_access_impl!(EvaluationQuestionTableData2, correct_4, set_correct_4);
gen_access_impl!(EvaluationQuestionTableData2, prediction_5, set_prediction_5);
gen_access_impl!(EvaluationQuestionTableData2, correct_5, set_correct_5);
gen_access_impl!(EvaluationQuestionTableData2, focus_1, set_focus_1);
gen_access_impl!(EvaluationQuestionTableData2, focus_2, set_focus_2);
gen_access_impl!(EvaluationQuestionTableData2, focus_3, set_focus_3);
gen_access_impl!(EvaluationQuestionTableData2, focus_4, set_focus_4);
gen_access_impl!(EvaluationQuestionTableData2, focus_5, set_focus_5);
*/

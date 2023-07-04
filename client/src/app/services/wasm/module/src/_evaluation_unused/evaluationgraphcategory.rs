// extern crate serde;

// use crate::gen_access;
use wasm_bindgen::prelude::*;
// use serde::{Serialize, Deserialize};

// #[wasm_bindgen]
#[derive(Serialize, Deserialize, Debug)]
pub struct EvaluationGraphCategory {
    pub name: String,
    pub frequency_total: u32,
    pub frequency_pos: u32,
    pub frequency_neg: u32,
    pub weight_total: f32,
    pub weight_avg_total: f32,
    pub weight_pos: f32,
    pub weight_avg_pos: f32,
    pub weight_neg: f32,
    pub weight_avg_neg: f32,
    pub performance_pos: f32,
    pub performance_softmax_pos: f32,
    pub performance_neg: f32,
    pub performance_softmax_neg: f32,
    pub performance_net: f32,
    pub performance_softmax_net: f32,
    pub performance_balanced: String,
}

/*
#[wasm_bindgen]
impl EvaluationGraphCategory2 {
    #[wasm_bindgen(constructor)]
    pub fn new(
        name: String,
        frequency_total: u32,
        frequency_pos: u32,
        frequency_neg: u32,
        weight_total: f32,
        weight_avg_total: f32,
        weight_pos: f32,
        weight_avg_pos: f32,
        weight_neg: f32,
        weight_avg_neg: f32,
        performance_pos: f32,
        performance_softmax_pos: f32,
        performance_neg: f32,
        performance_softmax_neg: f32,
        performance_net: f32,
        performance_softmax_net: f32,
        performance_balanced: String,
    ) -> EvaluationGraphCategory2 {
        EvaluationGraphCategory2 {
            name,
            frequency_total,
            frequency_pos,
            frequency_neg,
            weight_total,
            weight_avg_total,
            weight_pos,
            weight_avg_pos,
            weight_neg,
            weight_avg_neg,
            performance_pos,
            performance_softmax_pos,
            performance_neg,
            performance_softmax_neg,
            performance_net,
            performance_softmax_net,
            performance_balanced,
        }
    }
}
*/

/*
gen_access_impl!(EvaluationGraphCategory, name, set_name);
gen_access_impl!(
    EvaluationGraphCategory,
    performance_balanced,
    set_performance_balanced
);
*/

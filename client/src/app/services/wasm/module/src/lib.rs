use wasm_bindgen::prelude::wasm_bindgen;

// mod evaluation;
mod macros;
mod palettegen;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

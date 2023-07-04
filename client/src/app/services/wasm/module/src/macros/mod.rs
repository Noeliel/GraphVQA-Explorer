// unused
#[macro_export]
macro_rules! gen_access_impl {
    ($class:ident, $field:ident, $set:ident) => {
        #[wasm_bindgen]
        impl $class {
            #[wasm_bindgen(getter)]
            pub fn $field(&self) -> String {
                self.$field.to_string()
            }
            #[wasm_bindgen(setter)]
            pub fn $set(&mut self, value: String) {
                self.$field = value;
            }
        }
    };
}

// unused
#[macro_export]
macro_rules! gen_access {
    ($class:ident, $field:ident, $set:ident, $typ:ident) => {
        #[wasm_bindgen(method, getter)]
        fn $field(this: &$class) -> $typ;

        #[wasm_bindgen(method, setter)]
        fn $set(this: &$class, value: $typ);
    };
}

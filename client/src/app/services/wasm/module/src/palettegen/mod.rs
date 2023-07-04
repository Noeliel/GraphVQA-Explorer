use wasm_bindgen::prelude::*;

// color palette generation

pub struct ColorData {
    pub r: u8,
    pub g: u8,
    pub b: u8,
    pub a: u8,
}

pub struct PixelData {
    pub col: ColorData,
    pub idx: u8,
}

fn format_img_data(img_data: Box<[u8]>, img_data_length: i32) -> Vec<PixelData> {
    let mut iter = img_data.into_iter();
    let mut data = Vec::new();

    let mut i = 0;
    let mut idx = 0;

    while i < img_data_length {
        let r = *iter.next().unwrap_or(&0);
        let g = *iter.next().unwrap_or(&0);
        let b = *iter.next().unwrap_or(&0);
        let a = *iter.next().unwrap_or(&0);

        data.push(PixelData {
            col: ColorData {
                r: r,
                g: g,
                b: b,
                a: a,
            },
            idx: idx,
        });

        i += 4;
        idx += 1;
    }

    data
}

fn restore_img_data_colors(img_data: Vec<ColorData>) -> Box<[u8]> {
    let mut data: Vec<u8> = Vec::new();

    for color in img_data {
        data.push(color.r);
        data.push(color.g);
        data.push(color.b);
        data.push(color.a);
    }

    data.into_boxed_slice()
}

#[allow(dead_code)]
fn restore_img_data_pixels(img_data: Vec<PixelData>) -> Box<[u8]> {
    let mut data: Vec<u8> = Vec::new();

    for pixel in img_data {
        data.push(pixel.col.r);
        data.push(pixel.col.g);
        data.push(pixel.col.b);
        data.push(pixel.col.a);
    }

    data.into_boxed_slice()
}

fn median_cut_quantize_colors(img_data: &[PixelData]) -> ColorData {
    let mut r_count = 0;
    let mut g_count = 0;
    let mut b_count = 0;

    for pixel in img_data {
        r_count += pixel.col.r as usize;
        g_count += pixel.col.g as usize;
        b_count += pixel.col.b as usize;
    }

    let count = img_data.len();
    let r_avg = r_count / count;
    let g_avg = g_count / count;
    let b_avg = b_count / count;

    ColorData {
        r: r_avg as u8,
        g: g_avg as u8,
        b: b_avg as u8,
        a: 1,
    }
}

fn median_cut_generate_colors(img_data: &mut [PixelData], depth_bits: u8) -> Vec<ColorData> {
    if img_data.len() == 0 {
        return vec![];
    }

    if depth_bits == 0 {
        return vec![median_cut_quantize_colors(img_data)];
    }

    let mut r_max = 0;
    let mut r_min = 255;
    let mut g_max = 0;
    let mut g_min = 255;
    let mut b_max = 0;
    let mut b_min = 255;

    let mut i = 0;

    while i < img_data.len() {
        let r = img_data[i].col.r;
        let g = img_data[i].col.g;
        let b = img_data[i].col.b;

        r_max = r.max(r_max);
        r_min = r.min(r_min);

        g_max = g.max(g_max);
        g_min = g.min(g_min);

        b_max = b.max(b_max);
        b_min = b.min(b_min);

        i += 1;
    }

    let r_range = r_max - r_min;
    let g_range = g_max - g_min;
    let b_range = b_max - b_min;

    let mut ranges = [(1u8, g_range), (2u8, b_range), (0u8, r_range)];
    ranges.sort_by(|a, b| {
        return b.1.cmp(&a.1);
    });

    img_data.sort_by(|a: &PixelData, b: &PixelData| match ranges[0].0 {
        1u8 => return b.col.g.cmp(&a.col.g),
        2u8 => return b.col.b.cmp(&a.col.b),
        _ => return b.col.r.cmp(&a.col.r),
    });

    let length = img_data.len();
    let median_index = length / 2; // it's probably fine to just floor
                                   // let median_index = (length as f32 / 2f32).round() as usize;

    let mut result: Vec<ColorData> = Vec::new();

    result.append(&mut median_cut_generate_colors(
        &mut img_data[0..median_index],
        depth_bits - 1,
    ));
    result.append(&mut median_cut_generate_colors(
        &mut img_data[median_index..length],
        depth_bits - 1,
    ));

    result
}

#[wasm_bindgen]
pub fn palette_from_median_cut_quantization(
    img_data: Box<[u8]>,
    img_data_length: i32,
    depth_bits: u8,
) -> Box<[u8]> {
    let mut prepared_data = format_img_data(img_data, img_data_length);
    let colors = median_cut_generate_colors(prepared_data.as_mut_slice(), depth_bits);
    let finished_data = restore_img_data_colors(colors);

    finished_data
}

// EOF color palette generation

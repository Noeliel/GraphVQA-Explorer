import { Injectable } from '@angular/core';
import * as d3 from 'd3';
import { SceneGraph, SceneGraphObject } from 'src/app/entities/scenegraph';
import {
    SimpleLinkedList,
    SimpleLinkedListElement,
} from 'src/app/entities/simplelinkedlist';
import { WasmService } from '../wasm/wasm.service';

@Injectable({
    providedIn: 'root',
})
export class SceneGraphImageProcessorService {
    constructor(private wasm: WasmService) {}

    public async adjustGraphNodeColorsForImage(
        graph: SceneGraph,
        image_data: Blob
    ): Promise<SceneGraph> {
        // const prior = Date.now();

        await Promise.all(
            Object.values(graph.all_objects).map(async (obj) => {
                await this.adjustObjectNodeColorsForImage(obj, image_data);
            })
        );

        // console.log("fibonacci: " + this.wasm.fibonacci(44));

        /*
        const posterior = Date.now();
        const diff = posterior - prior;
        alert(diff + 'ms');
        */

        return graph;
    }

    public async adjustObjectNodeColorsForImage(obj: SceneGraphObject, image_data: Blob): Promise<SceneGraphObject> {
        const canvas = document.createElement('canvas');

        const x = obj.x;
        const y = obj.y;
        const width = obj.w;
        const height = obj.h;

        await this.drawImageBlobToCanvasCropped(
            image_data,
            canvas,
            x,
            y,
            width,
            height
        );

        const ctx = canvas.getContext('2d');
        const img_data = ctx?.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
        );

        if (!img_data) return obj;

        const img_data_data = img_data!.data;

        // const primary_color = this.colorFromBinnedHistogramChannelPeaks(
        // img_data!
        // );
        // const secondary_color = this.colorFromColorFrequency(img_data);

        /*
        const img_data_new =
            this.performMedianCutQuantization(
                img_data_data
            );
        */

        // wasm color palette generation

        const colors =
            this.paletteFromMedianCutQuantizationWASM(img_data_data);
        /*
         */

        // typescript color palette generation
        /*
        const colors =
            this.paletteFromMedianCutQuantization(img_data_data);
        /*
        */

        /*
        const new_image = new ImageData(img_data_new, img_data.width, img_data.height);
        ctx?.putImageData(new_image, 0, 0);
        
        document.body.appendChild(canvas);
        */

        /*
        const fitting = this.findFittingHSLColorPair(colors);
        obj.primary_color = fitting.primary;
        obj.secondary_color = fitting.secondary;
        */

        obj.primary_color = colors[0];
        obj.secondary_color = colors[1];

        return obj;
    }

    // MISC

    private _findFittingColorPair(palette: string[]): {
        primary: string;
        secondary: string;
    } {
        const primary = Number.parseInt(palette[2]);
        const primary_hsl = d3.hsl(this.convertToRBGColorString(primary));

        let secondary: number | undefined = undefined;
        let i = 3;

        while (i < palette.length) {
            const candidate = Number.parseInt(palette[i]);
            const candidate_hsl = d3.hsl(
                this.convertToRBGColorString(candidate)
            );

            const dh = Math.abs(primary_hsl.h - candidate_hsl.h);
            const ds = Math.abs(primary_hsl.s - candidate_hsl.s);
            const dl = Math.abs(primary_hsl.l - candidate_hsl.l);

            if ((dh > 128 || ds > 96) && dl > 64 && dl < 128) {
                secondary = candidate;
                break;
            }

            i++;
        }

        if (!secondary) secondary = Number.parseInt(palette[3]);

        return {
            primary: this.convertToRBGColorString(primary),
            secondary: this.convertToRBGColorString(secondary),
        };
    }

    private convertToRBGColorString(color: number) {
        return (
            '#' +
            this.padHexString(((color >> 16) & 0xff).toString(16)) +
            this.padHexString(((color >> 8) & 0xff).toString(16)) +
            this.padHexString((color & 0xff).toString(16))
        );
    }

    private padHexString(str: string): string {
        return str.length > 1 ? str : '0' + str;
    }

    // ------------------ 1 ------------------

    private colorFromHistogramChannelPeaks(
        img_data: Uint8ClampedArray
    ): string {
        const rD: number[] = [];
        const gD: number[] = [];
        const bD: number[] = [];

        for (let i = 0; i < 256; i++) {
            rD[i] = 0;
            gD[i] = 0;
            bD[i] = 0;
        }

        for (let i = 0; i < img_data!.length; i += 4) {
            rD[img_data![i]]++;
            gD[img_data![i + 1]]++;
            bD[img_data![i + 2]]++;
        }

        let hRi = -1; // intensity
        let hR = -1; // count (we want the highest)
        let hGi = -1;
        let hG = -1;
        let hBi = -1;
        let hB = -1;

        for (let i = 0; i < 256; i++) {
            if (rD[i] > hR) {
                hR = rD[i];
                hRi = i;
            }
            if (gD[i] > hG) {
                hG = gD[i];
                hGi = i;
            }
            if (bD[i] > hB) {
                hB = bD[i];
                hBi = i;
            }
        }

        // console.log('r: ' + hRi + ' g: ' + hGi + ' b: ' + hBi);

        const rs = this.padHexString(hRi.toString(16));
        const gs = this.padHexString(hGi.toString(16));
        const bs = this.padHexString(hBi.toString(16));
        const hex_color = '#' + rs + gs + bs;

        return hex_color;
    }

    /**
     * Don't use this function.
     * @param img_data
     * @returns
     */
    private colorFromHistogramChannelPeaksBinned(
        img_data: Uint8ClampedArray
    ): string {
        const rD: number[] = [];
        const gD: number[] = [];
        const bD: number[] = [];

        for (let i = 0; i < 256 / 16; i++) {
            rD[i] = 0;
            gD[i] = 0;
            bD[i] = 0;
        }

        for (let i = 0; i < img_data!.length; i += 4) {
            rD[Math.round(img_data![i] / 16)]++;
            gD[Math.round(img_data![i + 1] / 16)]++;
            bD[Math.round(img_data![i + 2] / 16)]++;
        }

        let hRi = -1; // intensity
        let hR = -1; // count (we want the highest)
        let hGi = -1;
        let hG = -1;
        let hBi = -1;
        let hB = -1;

        for (let i = 0; i < 256 / 16; i++) {
            if (rD[i] > hR) {
                hR = rD[i];
                hRi = i * 16;
            }
            if (gD[i] > hG) {
                hG = gD[i];
                hGi = i * 16;
            }
            if (bD[i] > hB) {
                hB = bD[i];
                hBi = i * 16;
            }
        }

        // console.log('r: ' + hRi + ' g: ' + hGi + ' b: ' + hBi);

        const rs = this.padHexString(hRi.toString(16));
        const gs = this.padHexString(hGi.toString(16));
        const bs = this.padHexString(hBi.toString(16));
        const hex_color = '#' + rs + gs + bs;

        return hex_color;
    }

    // EOF ------------------ 1 ------------------

    // ------------------ 2 ------------------

    private colorFromColorFrequency(img_data: Uint8ClampedArray): string {
        const colors: { [color: string]: number } = {};

        for (let i = 0; i < img_data!.length; i += 4) {
            const rs = this.padHexString(img_data![i].toString(16));
            const gs = this.padHexString(img_data![i + 1].toString(16));
            const bs = this.padHexString(img_data![i + 2].toString(16));
            const hex_color = '#' + rs + gs + bs;

            let count = colors[hex_color];
            if (!count) count = 0;
            count++;
            colors[hex_color] = count;
        }

        let frequency = -1;
        let most_frequent_color = '#000000';

        Object.keys(colors).forEach((color) => {
            if (colors[color] > frequency) {
                frequency = colors[color];
                most_frequent_color = color;
            }
        });

        return most_frequent_color;
    }

    private colorFromColorFrequencyBinned(
        img_data: Uint8ClampedArray
    ): string[] {
        const colors: { [color: string]: number } = {};

        for (let i = 0; i < img_data!.length; i += 4) {
            const rs = this.binClamped(img_data![i], 16);
            const gs = this.binClamped(img_data![i + 1], 16);
            const bs = this.binClamped(img_data![i + 2], 16);

            const hex_color = ((rs << 16) + (gs << 8) + bs).toString();

            let count = colors[hex_color];
            if (!count) count = 0;
            count++;
            colors[hex_color] = count;
        }

        const sorted_colors: SimpleLinkedList<{
            color: string;
            count: number;
        }> = new SimpleLinkedList();

        Object.keys(colors).forEach((color) => {
            const new_entry = new SimpleLinkedListElement({
                color: color,
                count: colors[color],
            });
            let current = sorted_colors.head;

            if (!current) sorted_colors.head = new_entry;
            else {
                while (
                    current!.next &&
                    current.obj.count > new_entry.obj.count
                ) {
                    current = current.next;
                }

                const backup = current.next;
                current.next = new_entry;
                new_entry.next = backup;
            }
        });

        const color_list = [];
        let current_elem = sorted_colors.head;

        while (current_elem) {
            color_list.push(current_elem.obj.color);
            current_elem = current_elem.next;
        }

        return color_list;
    }

    private binClamped(num: number, range: number) {
        return Math.min(255, Math.max(0, Math.round(num / range) * range));
    }

    // EOF ------------------ 2 ------------------

    // ------------------ 3 ------------------

    private paletteFromBinnedHSL(img_data: Uint8ClampedArray): string[] {
        const colors: { [color: string]: number } = {};

        for (let i = 0; i < img_data!.length; i += 4) {
            const rs = img_data![i];
            const gs = img_data![i + 1];
            const bs = img_data![i + 2];

            const color_rgb = d3.rgb(rs, gs, bs);
            const color_hsl = d3.hsl(color_rgb).formatHex();
            const color_hsl_category = this.downscaledHSLColor(color_hsl);

            let count = colors[color_hsl_category];
            if (!count) count = 0;
            count++;
            colors[color_hsl_category] = count;
        }

        const sorted_colors: SimpleLinkedList<{
            color: string;
            count: number;
        }> = new SimpleLinkedList();

        Object.keys(colors).forEach((color) => {
            const new_entry = new SimpleLinkedListElement({
                color: this.upscaledHSLColor(color),
                count: colors[color],
            });
            let current = sorted_colors.head;

            if (!current) sorted_colors.head = new_entry;
            else {
                while (
                    current!.next &&
                    current.obj.count > new_entry.obj.count
                ) {
                    current = current.next;
                }

                const backup = current.next;
                current.next = new_entry;
                new_entry.next = backup;
            }
        });

        const color_list = [];
        let current_elem = sorted_colors.head;

        while (current_elem) {
            if (current_elem.obj.count > 12)
                color_list.push(current_elem.obj.color);
            current_elem = current_elem.next;
        }

        return color_list;
    }

    private findFittingHSLColorPair(palette: string[]): {
        primary: string;
        secondary: string;
    } {
        const primary = palette[0];
        const primary_hsl = d3.hsl(primary);

        let secondary: string | undefined = undefined;
        let i = 1;

        while (i < palette.length) {
            const candidate = palette[i];
            const candidate_hsl = d3.hsl(candidate);

            const dh = Math.abs(primary_hsl.h - candidate_hsl.h);
            const ds = Math.abs(primary_hsl.s - candidate_hsl.s);
            const dl = Math.abs(primary_hsl.l - candidate_hsl.l);

            if (dh > 32 || ds > 0.2 || dl > 0.4) {
                secondary = candidate;
                break;
            }

            i++;
        }

        if (!secondary) {
            console.log('no match');
            secondary = palette[1];
        }

        return {
            primary: primary,
            secondary: secondary,
        };
    }

    private downscaledHSLColor(color: string): string {
        const color_hsl = d3.hsl(color);
        return d3
            .hsl(
                Math.round(color_hsl.h / 4),
                Math.round((color_hsl.s * 100) / 5) / 100,
                Math.round((color_hsl.l * 100) / 5) / 100
            )
            .formatHex();
    }

    private upscaledHSLColor(color: string): string {
        const col = d3.hsl(color);
        return d3.hsl((col.h * 4) % 360, col.s * 5, col.l * 5).formatHex();
    }

    // EOF ------------------ 3 ------------------

    // ------------------ 4 ------------------
    // median cut quantization
    // based on https://github.com/muthuspark/ml_research/blob/7847ba7678c0dc0db3bbd42bedacb002d85473ed/median%20cut%20color%20quantization.ipynb

    private median_cut_quantize(img_data: number[][]): number[][] {
        // modifies global state -> return variable instead
        // # when it reaches the end, color quantize
        // print("start quantize: ", len(img_arr))

        // r_average = np.mean(img_arr[:,0])
        // g_average = np.mean(img_arr[:,1])
        // b_average = np.mean(img_arr[:,2])

        let r_count = 0;
        let g_count = 0;
        let b_count = 0;

        for (let i = 0; i < img_data!.length; i++) {
            r_count += img_data![i][0];
            g_count += img_data![i][1];
            b_count += img_data![i][2];
        }

        const r_average = Math.round(r_count / img_data.length);
        const g_average = Math.round(g_count / img_data.length);
        const b_average = Math.round(b_count / img_data.length);

        // for data in img_arr:
        //     sample_img[data[3]][data[4]] = [r_average, g_average, b_average, 255]

        const new_data: number[][] = [];

        for (let i = 0; i < img_data!.length; i++)
            new_data.push([
                r_average,
                g_average,
                b_average,
                img_data[i][3],
                img_data[i][4],
            ]);

        return new_data;
    }

    private split_into_buckets(
        img_data: number[][],
        depth_bits: number
    ): number[][] {
        // if len(img_arr) == 0:
        //     return

        if (img_data.length == 0) return [];

        // if depth == 0:
        //     median_cut_quantize(img_arr)
        //     return

        if (depth_bits == 0) return this.median_cut_quantize(img_data);

        // r_range = np.max(img_arr[:,0]) - np.min(img_arr[:,0])
        // g_range = np.max(img_arr[:,1]) - np.min(img_arr[:,1])
        // b_range = np.max(img_arr[:,2]) - np.min(img_arr[:,2])

        let r_max = 0;
        let r_min = 255;
        let g_max = 0;
        let g_min = 255;
        let b_max = 0;
        let b_min = 255;

        for (let i = 0; i < img_data!.length; i++) {
            const r = img_data![i][0];
            const g = img_data![i][1];
            const b = img_data![i][2];

            if (r > r_max) r_max = r;
            if (r < r_min) r_min = r;
            if (g > g_max) g_max = g;
            if (g < g_min) g_min = g;
            if (b > b_max) b_max = b;
            if (b < b_min) b_min = b;
        }

        const r_range = r_max - r_min;
        const g_range = g_max - g_min;
        const b_range = b_max - b_min;

        // space_with_highest_range = 0

        let space_with_highest_range = 0;

        // if g_range >= r_range and g_range >= b_range:
        //     space_with_highest_range = 1
        // elif b_range >= r_range and b_range >= g_range:
        //     space_with_highest_range = 2
        // elif r_range >= b_range and r_range >= g_range:
        //     space_with_highest_range = 0

        if (g_range >= r_range && g_range >= b_range)
            space_with_highest_range = 1;
        else if (b_range >= r_range && b_range >= g_range)
            space_with_highest_range = 2;
        else if (r_range >= b_range && r_range >= g_range)
            space_with_highest_range = 0;

        // print("space_with_highest_range:",space_with_highest_range)
        // # sort the image pixels by color space with highest range

        // img_arr = img_arr[img_arr[:,space_with_highest_range].argsort()]

        img_data = img_data.sort((a, b) => {
            return b[space_with_highest_range] - a[space_with_highest_range];
        });

        // # and find the median and divide the array.

        // median_index = int((len(img_arr)+1)/2)

        const median_index = Math.round(img_data.length / 2);

        // print("median_index:", median_index)
        // #split the array into two blocks

        // split_into_buckets(img_arr[0:median_index], depth-1)
        // split_into_buckets(img_arr[median_index:], depth-1)

        const result: number[][] = [];

        this.split_into_buckets(
            img_data.slice(0, median_index),
            depth_bits - 1
        ).forEach((entry) => {
            result.push(entry);
        });

        this.split_into_buckets(
            img_data.slice(median_index, img_data.length),
            depth_bits - 1
        ).forEach((entry) => {
            result.push(entry);
        });

        return result;
    }

    private format_image_data(img_data_raw: Uint8ClampedArray): number[][] {
        const data = [];

        let idx = 0;
        for (let i = 0; i < img_data_raw!.length; i += 4) {
            const r = img_data_raw![i];
            const g = img_data_raw![i + 1];
            const b = img_data_raw![i + 2];
            const a = img_data_raw![i + 3];

            data.push([r, g, b, a, idx]);
            idx++;
        }

        return data;
    }

    private restore_image_data(img_data: number[][]): Uint8ClampedArray {
        const data = [];

        img_data = img_data.sort((a, b) => {
            return a[4] - b[4]; // sort by idx
        });

        for (let i = 0; i < img_data.length; i++) {
            data.push(img_data[i][0]);
            data.push(img_data[i][1]);
            data.push(img_data[i][2]);
            data.push(img_data[i][3]);
        }

        return new Uint8ClampedArray(data);
    }

    private performMedianCutQuantization(
        img_data: Uint8ClampedArray
    ): Uint8ClampedArray {
        // flattened_img_array = []
        // for rindex, rows in enumerate(sample_img):
        //     for cindex, color in enumerate(rows):
        //         flattened_img_array.append([color[0],color[1],color[2], rindex, cindex])
        // flattened_img_array = np.array(flattened_img_array)

        const prepared_data = this.format_image_data(img_data);

        // split_into_buckets(flattened_img_array, 2)

        const processed_data = this.split_into_buckets(prepared_data, 1);
        const restored_data = this.restore_image_data(processed_data);

        return restored_data;
    }

    // EOF PROCEDURE
    // MODIFIED VERSION FOR PALETTE EXTRACTION BELOW

    private median_cut_quantize_colors(img_data: number[][]): number[] {
        let r_count = 0;
        let g_count = 0;
        let b_count = 0;

        for (let i = 0; i < img_data!.length; i++) {
            r_count += img_data![i][0];
            g_count += img_data![i][1];
            b_count += img_data![i][2];
        }

        const r_average = Math.round(r_count / img_data.length);
        const g_average = Math.round(g_count / img_data.length);
        const b_average = Math.round(b_count / img_data.length);

        return [r_average, g_average, b_average];
    }

    private median_cut_generate_colors(
        img_data: number[][],
        depth_bits: number
    ): number[][] {
        if (img_data.length == 0) return [];

        if (depth_bits == 0) return [this.median_cut_quantize_colors(img_data)];

        let r_max = 0;
        let r_min = 255;
        let g_max = 0;
        let g_min = 255;
        let b_max = 0;
        let b_min = 255;

        for (let i = 0; i < img_data!.length; i++) {
            const r = img_data![i][0];
            const g = img_data![i][1];
            const b = img_data![i][2];

            if (r > r_max) r_max = r;
            if (r < r_min) r_min = r;
            if (g > g_max) g_max = g;
            if (g < g_min) g_min = g;
            if (b > b_max) b_max = b;
            if (b < b_min) b_min = b;
        }

        const r_range = r_max - r_min;
        const g_range = g_max - g_min;
        const b_range = b_max - b_min;

        let space_with_highest_range = 0;

        if (g_range >= r_range && g_range >= b_range)
            space_with_highest_range = 1;
        else if (b_range >= r_range && b_range >= g_range)
            space_with_highest_range = 2;
        else if (r_range >= b_range && r_range >= g_range)
            space_with_highest_range = 0;

        img_data = img_data.sort((a, b) => {
            return b[space_with_highest_range] - a[space_with_highest_range];
        });

        const median_index = Math.round(img_data.length / 2);

        const result: number[][] = [];

        this.median_cut_generate_colors(
            img_data.slice(0, median_index),
            depth_bits - 1
        ).forEach((entry) => {
            result.push(entry);
        });

        this.median_cut_generate_colors(
            img_data.slice(median_index, img_data.length),
            depth_bits - 1
        ).forEach((entry) => {
            result.push(entry);
        });

        return result;
    }

    private median_cut_palette_from_colors(colors: number[][]): string[] {
        return colors.map((color) => {
            return d3.rgb(color[0], color[1], color[2]).formatHex();
        });
    }

    private paletteFromMedianCutQuantization(
        img_data: Uint8ClampedArray
    ): string[] {
        const prepared_data = this.format_image_data(img_data);

        const colors = this.median_cut_generate_colors(prepared_data, 1);

        return this.median_cut_palette_from_colors(colors);
    }

    // EOF ------------------ 4 ------------------

    // ------------------ 5 ------------------

    private paletteFromMedianCutQuantizationWASM(
        img_data: Uint8ClampedArray
    ): string[] {
        const raw_colors = this.wasm.palette_from_median_cut_quantization(
            img_data as unknown as Uint8Array,
            1
        );
        const formatted_colors = this.format_image_data(
            raw_colors as unknown as Uint8ClampedArray
        );
        return this.median_cut_palette_from_colors(formatted_colors);
    }

    // EOF ------------------ 5 ------------------

    private async drawImageBlobToCanvasFull(
        image_data: Blob,
        canvas: HTMLCanvasElement
    ) {
        const ctx = canvas.getContext('2d');
        const bmp = await createImageBitmap(image_data);

        canvas.width = bmp.width;
        canvas.height = bmp.height;

        ctx?.drawImage(bmp, 0, 0);

        bmp.close();
    }

    private async drawImageBlobToCanvasCropped(
        image_data: Blob,
        canvas: HTMLCanvasElement,
        x: number,
        y: number,
        w: number,
        h: number
    ) {
        const ctx = canvas.getContext('2d');
        const bmp = await createImageBitmap(image_data);

        canvas.width = w;
        canvas.height = h;

        ctx?.drawImage(bmp, x, y, w, h, 0, 0, w, h);

        bmp.close();
    }
}

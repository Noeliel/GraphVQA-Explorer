// https://observablehq.com/@d3/scatterplot
// Free to use under the ISC license (see below)
// Modified for the purposes of this project

/**
Copyright 2017–2021 Observable, Inc.
Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
**/

import * as d3 from "d3";

export function Scatterplot(
    data,
    component,
    {
        x = ([x]) => x, // given d in data, returns the (quantitative) x-value
        y = ([, y]) => y, // given d in data, returns the (quantitative) y-value
        r = 5, // (fixed) radius of dots, in pixels
        title, // given d in data, returns the title
        marginTop = 20, // top margin, in pixels
        marginRight = 30, // right margin, in pixels
        marginBottom = 30, // bottom margin, in pixels
        marginLeft = 60, // left margin, in pixels
        inset = r * 2, // inset the default range, in pixels
        insetTop = inset, // inset the default y-range
        insetRight = inset, // inset the default x-range
        insetBottom = inset, // inset the default y-range
        insetLeft = inset, // inset the default x-range
        width = 640, // outer width, in pixels
        height = 400, // outer height, in pixels
        xType = d3.scaleLinear, // type of x-scale
        xDomain, // [xmin, xmax]
        xRange = [marginLeft + insetLeft, width - marginRight - insetRight], // [left, right]
        yType = d3.scaleLinear, // type of y-scale
        yDomain, // [ymin, ymax]
        yRange = [height - marginBottom - insetBottom, marginTop + insetTop], // [bottom, top]
        xLabel, // a label for the x-axis
        yLabel, // a label for the y-axis
        xFormat, // a format specifier string for the x-axis
        yFormat, // a format specifier string for the y-axis
        fill = "none", // fill color for dots
        stroke = "currentColor", // stroke color for the dots
        strokeWidth = 3, // stroke width for dots
        halo = "#fff", // color of label halo
        haloWidth = 3, // padding around the labels
    } = {}
) {
    // for zooming/scaling
    let text = undefined;

    // Compute values.
    const X = d3.map(data, x);
    const Y = d3.map(data, y);
    const T = title == null ? null : d3.map(data, title);
    const I = d3.range(X.length).filter((i) => !isNaN(X[i]) && !isNaN(Y[i]));

    // Compute default domains.
    if (xDomain === undefined) xDomain = d3.extent(X);
    if (yDomain === undefined) yDomain = d3.extent(Y);

    // Construct scales and axes.
    const xScale = xType(xDomain, xRange);
    const yScale = yType(yDomain, yRange);
    const xAxis = d3.axisBottom(xScale).ticks(width / 80, xFormat);
    const yAxis = d3.axisLeft(yScale).ticks(height / 50, yFormat);

    const svg = d3
        .create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

    const xAxisContainer = svg
        .append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(xAxis)
        //.call((g) => g.select(".domain").remove())
        /*.call((g) =>
            g
                .selectAll(".tick line")
                .clone()
                .attr("y2", marginTop + marginBottom - height)
                .attr("stroke-opacity", 0.1)
        )*/
        .call((g) =>
            g
                .selectAll(".tick line")
                .attr("y2", marginTop + marginBottom - height)
                .attr("stroke-opacity", 0.1)
        )
        .call((g) =>
            g
                .append("text")
                .attr("x", width)
                .attr("y", marginBottom - 4)
                .attr("fill", "currentColor")
                .attr("text-anchor", "end")
                .text(xLabel)
        );

    const yAxisContainer = svg
        .append("g")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(yAxis)
        //.call((g) => g.select(".domain").remove())
        /*.call((g) =>
            g
                .selectAll(".tick line")
                .clone()
                .attr("x2", width - marginLeft - marginRight)
                .attr("stroke-opacity", 0.1)
        )*/
        .call((g) =>
            g
                .selectAll(".tick line")
                .attr("x2", width - marginLeft - marginRight)
                .attr("stroke-opacity", 0.1)
        )
        .call((g) =>
            g
                .append("text")
                .attr("x", -marginLeft)
                .attr("y", 10)
                .attr("fill", "currentColor")
                .attr("text-anchor", "start")
                .text(yLabel)
        );

    if (T) {
        const textContainer = svg
            .append("g")
            .attr("font-family", "sans-serif")
            .attr("font-size", 10)
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round");

        textContainer
            .selectAll("text")
            .data(I)
            .join("text")
            .attr("dx", 11)
            .attr("dy", "0.35em")
            .attr("x", (i) => xScale(X[i]))
            .attr("y", (i) => yScale(Y[i]))
            .text((i) => T[i])
            .call((text) => text.clone(true)) // add halo clone
            .attr("fill", "none")
            .attr("stroke", halo)
            .attr("stroke-width", haloWidth);

        text = textContainer.selectAll("text");
    }

    const circlesContainer = svg
        .append("g")
        .attr("fill", fill)
        .attr("stroke", stroke)
        .attr("stroke-width", strokeWidth);

    const circles = circlesContainer
        .selectAll("circle")
        .data(I)
        .join("circle")
        .attr("cx", (i) => xScale(X[i]))
        .attr("cy", (i) => yScale(Y[i]))
        .attr("r", r)
        .on("mouseover", function (event, d) {
            this.setAttribute("fill", "lime");
            component.showCategoryTooltip(
                T[d],
                X[d],
                Y[d],
                event.pageX,
                event.pageY
            );
        })
        .on("mouseout", function () {
            this.setAttribute("fill", fill);
            component.hideTooltip();
        });

    const zoom = d3.zoom().on("zoom", (zoom) => {
        const transform = zoom.transform;

        const newXScale = transform.rescaleX(xScale);
        const newYScale = transform.rescaleY(yScale);

        xAxis.scale(newXScale);
        yAxis.scale(newYScale);

        xAxisContainer.call(xAxis);
        yAxisContainer.call(yAxis);

        xAxisContainer.call((g) =>
            g
                .selectAll(".tick line")
                .attr("y2", marginTop + marginBottom - height)
                .attr("stroke-opacity", 0.1)
        );

        yAxisContainer.call((g) =>
            g
                .selectAll(".tick line")
                .attr("x2", width - marginLeft - marginRight)
                .attr("stroke-opacity", 0.1)
        );

        circles
            .attr("cx", (i) => newXScale(X[i]))
            .attr("cy", (i) => newYScale(Y[i]));

        text?.attr("x", (i) => newXScale(X[i])).attr("y", (i) =>
            newYScale(Y[i])
        );

        // circles?.attr("transform", zoom.transform);
        // text?.attr("transform", zoom.transform);
        // console.log("zoomed");
    });

    svg.call(zoom);

    return svg.node();
}

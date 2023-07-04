import * as d3 from 'd3';
import { GraphVisComponent } from '../../components/graph/graph-vis/graph-vis.component';
import { DisplayMode } from './interfaces/displaymode';
import {
    SceneGraphObject,
    SceneGraphObjectVisibility,
    SceneGraphRelation,
    SceneGraphRelationVisibility,
} from '../scenegraph';
import { Point2D } from 'src/app/models/point2d.model';
import { environment } from 'src/environments/environment';

export abstract class ExplorationTypeDisplayMode extends DisplayMode {
    override controller!: GraphVisComponent;

    // --- DOM ---
    protected svgBG!: d3.Selection<SVGGElement, unknown, null, undefined>;
    protected svgFG!: d3.Selection<SVGGElement, unknown, null, undefined>;
    protected svgBoundingBoxes!: d3.Selection<
        SVGGElement,
        unknown,
        null,
        undefined
    >;
    protected svgCenters!: d3.Selection<SVGGElement, unknown, null, undefined>;

    protected svgDefs!: d3.Selection<SVGDefsElement, unknown, null, undefined>;

    protected svgTooltip!: d3.Selection<
        HTMLDivElement,
        unknown,
        null,
        undefined
    >;
    // ---

    protected prepare_setup_base() {
        // todo: maybe move this into displaymode.ts
        this.canvas.selectChildren().remove();
        d3.select(this.tooltipContainerRef.nativeElement)
            .selectChildren()
            .remove();
        this.widgetContainerRef.clear();

        this.svgBG = this.canvas
            .append('g')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('class', 'bg');

        this.svgFG = this.canvas
            .append('g')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('class', 'graph');
        //.attr('visibility', 'hidden');
    }

    protected prepare_setup_fg_object_boundingboxes(): d3.Selection<
        SVGGElement,
        unknown,
        null,
        undefined
    > {
        this.svgBoundingBoxes = this.svgFG
            .append('g')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('class', 'boundingboxes')
            .style('pointer-events', 'none');

        return this.svgBoundingBoxes;
    }

    protected prepare_setup_fg_object_centers(): d3.Selection<
        SVGGElement,
        unknown,
        null,
        undefined
    > {
        this.svgCenters = this.svgFG
            .append('g')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('class', 'centers');

        return this.svgCenters;
    }

    protected prepare_setup_tooltip(): d3.Selection<
        HTMLDivElement,
        unknown,
        null,
        undefined
    > {
        this.svgTooltip = d3
            .select(this.tooltipContainerRef.nativeElement)
            .attr('class', 'tooltip')
            .style('position', 'absolute')
            .style('border', '1px solid #000000')
            .style('border-radius', '4px')
            .style('background-color', '#3A3B3C')
            .style('color', 'white')
            .style('padding-top', '3px')
            .style('padding-right', '3px')
            .style('padding-bottom', '1px')
            .style('padding-left', '3px')
            .style('pointer-events', 'none')
            .style('opacity', '0');

        return this.svgTooltip;
    }

    protected prepare_setup_defs(): d3.Selection<
        SVGDefsElement,
        unknown,
        null,
        undefined
    > {
        this.svgDefs = this.canvas.append('defs');

        return this.svgDefs;
    }

    protected redraw_update_background():
        | d3.Selection<SVGImageElement, string, SVGGElement, unknown>
        | undefined {
        const image_data = this.controller.image;
        if (!image_data) return undefined;

        const background_selection = this.svgBG
            .selectAll('image.background-image')
            .data([image_data]);

        background_selection.exit().remove();

        const background_update = background_selection
            .enter()
            .append('image')
            .attr('class', 'background-image')
            .merge(
                background_selection as unknown as d3.Selection<
                    SVGImageElement,
                    string,
                    SVGGElement,
                    unknown
                >
            );

        background_update
            .attr('href', (d) => {
                return d;
            })
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('opacity', this.controller.background_visible ? '1' : '0');

        return background_update;
    }

    protected redraw_update_fg_object_boundingboxes(
        data: SceneGraphObject[]
    ):
        | d3.Selection<SVGRectElement, SceneGraphObject, SVGGElement, unknown>
        | undefined {
        // set up object bounding boxes
        const boundingboxes_selection = this.svgBoundingBoxes
            .selectAll('rect.graph-object')
            .data(data);

        boundingboxes_selection.exit().remove();

        const boundingboxes_update = boundingboxes_selection
            .enter()
            .append('rect')
            .attr('class', 'graph-object')
            .merge(
                // todo: less ugly
                boundingboxes_selection as unknown as d3.Selection<
                    SVGRectElement,
                    SceneGraphObject,
                    SVGGElement,
                    unknown
                >
            );

        boundingboxes_update
            .attr('identifier', (d) => {
                return d.id;
            })
            .attr('description', (d) => {
                return d.name;
            })
            .attr('x', (d) => {
                return d.x;
            })
            .attr('y', (d) => {
                return d.y;
            })
            .attr('width', (d) => {
                return d.w;
            })
            .attr('height', (d) => {
                return d.h;
            })
            .attr('fill', 'transparent')
            .attr('stroke-width', '2')
            .attr('stroke', environment.colors.graph_node_bounding_box)
            // if the user has their mouse over an object's circle, it becomes highlighted -> make its bounding box visible
            .attr('visibility', (d) => {
                return SceneGraphObjectVisibility.HIGHLIGHTED == d.visibility
                    ? 'inherit'
                    : 'hidden';
            });

        return boundingboxes_update;
    }

    protected redraw_update_fg_object_centers(
        data: SceneGraphObject[]
    ):
        | d3.Selection<SVGCircleElement, SceneGraphObject, SVGGElement, unknown>
        | undefined {
        const component = this;

        // sort the data such that the biggest circles are drawn first
        // this ensures that objects with smaller weight that are close
        // ...to such with bigger weight remain visible
        const data_sorted: SceneGraphObject[] = Object.assign([], data);
        data_sorted.sort((a, b) => b.weight - a.weight);

        // set up circles as indicators for objects
        const centers_selection = this.svgCenters
            .selectAll('circle.graph-object')
            .data(data_sorted);

        centers_selection.exit().remove();

        const centers_update = centers_selection
            .enter()
            .append('circle')
            .attr('class', 'graph-object')
            .merge(
                // todo: less ugly
                centers_selection as unknown as d3.Selection<
                    SVGCircleElement,
                    SceneGraphObject,
                    SVGGElement,
                    unknown
                >
            );

        centers_update
            .attr('identifier', (d) => {
                return d.id;
            })
            .attr('description', (d) => {
                return d.name;
            })
            // hovering over an object circle should render the object's bounding box and show a tooltip containing
            // ...the object's name and attributes
            .attr('cx', (d) => {
                return d.center.x;
            })
            .attr('cy', (d) => {
                return d.center.y;
            })
            .attr('r', (d) => {
                return component.calculateRadiusForObject(d);
            })
            .attr('stroke', (d) => {
                return environment.colors.graph_node_stroke;
            })
            .attr('fill', (d) => {
                return "url('#half-" + d.id + "')";
            })
            .attr('visibility', (d) => {
                return SceneGraphObjectVisibility.HIDDEN == d.visibility
                    ? 'hidden'
                    : 'inherit';
            });
        /*.append('title') // obsolete, simple tooltips
            .text((d) => {
                return d.name;
            });*/

        return centers_update;
    }

    protected redraw_update_defs(): d3.Selection<
        SVGDefsElement,
        unknown,
        null,
        undefined
    > {
        // return this.svgDefs;

        const defs_selection = this.svgDefs;

        const scene_graph = this.controller.scene?.graph;
        if (!scene_graph) return defs_selection;

        const gradient_selection = defs_selection
            .selectAll('linearGradient.circle-gradient')
            .data(Object.values(scene_graph.all_objects));

        gradient_selection.exit().remove();

        const defs_update = gradient_selection
            .enter()
            .append('linearGradient')
            .attr('class', 'circle-gradient')
            .merge(
                // todo: less ugly
                gradient_selection as unknown as d3.Selection<
                    SVGLinearGradientElement,
                    SceneGraphObject,
                    SVGGElement,
                    unknown
                >
            );

        defs_update
            .attr('id', (d) => {
                return 'half-' + d.id;
            })
            .attr('gradientTransform', 'rotate(0)')
            .html((d) => {
                return (
                    '<stop offset="50%" stop-color="' +
                    d.secondary_color +
                    '"/><stop offset="50%" stop-color="' +
                    d.primary_color +
                    '"/>'
                );
            });

        return defs_selection;
    }

    protected calculateRadiusForObject(object: SceneGraphObject): number {
        return 3;
    }

    protected calculatePathForRelationArrows(
        relation: SceneGraphRelation
    ): string {
        const scene_graph = this.controller.scene?.graph;
        if (!scene_graph) return '';

        const k = 40; // radius

        const from_obj = scene_graph.all_objects[relation.from_obj_id];
        const to_obj = scene_graph.all_objects[relation.to_obj_id];

        const x2 = to_obj.center.x;
        const y2 = to_obj.center.y;

        // find center of eclipse
        const x1 = from_obj.center.x;
        const y1 = from_obj.center.y;

        const cx = (x1 + x2) / 2;
        const cy = (y1 + y2) / 2;
        const dx = (x2 - x1) / 2;
        const dy = (y2 - y1) / 2;
        const dd = Math.sqrt(dx * dx + dy * dy);
        const ex = cx + (dy / dd) * k * ((relation.rank + 2 - 1) / 2);
        const ey = cy - (dx / dd) * k * ((relation.rank + 2 - 1) / 2);

        const vec_t = new Point2D(x2 - ex, y2 - ey).unitVector();
        const vec_s = new Point2D(x1 - ex, y1 - ey).unitVector();

        const to_rad = this.calculateRadiusForObject(to_obj);
        const from_rad = this.calculateRadiusForObject(from_obj);

        const _x2 = x2 - vec_t.x * to_rad; // offset from center to point on circle border
        const _y2 = y2 - vec_t.y * to_rad; // offset from center to point on circle border

        const _x1 = x1 - vec_s.x * from_rad; // offset from center to point on circle border
        const _y1 = y1 - vec_s.y * from_rad; // offset from center to point on circle border

        return (
            'M' + _x1 + ' ' + _y1 + 'Q' + ex + ' ' + ey + ' ' + _x2 + ' ' + _y2
        );
    }

    protected calculatePathForRelationThickness(
        relation: SceneGraphRelation
    ): string {
        const scene_graph = this.controller.scene?.graph;
        if (!scene_graph) return '';

        const k = 40; // radius

        const from_obj = scene_graph.all_objects[relation.from_obj_id];
        const to_obj = scene_graph.all_objects[relation.to_obj_id];

        const x2 = to_obj.center.x;
        const y2 = to_obj.center.y;

        // find center of eclipse
        const x1 = from_obj.center.x;
        const y1 = from_obj.center.y;

        const cx = (x1 + x2) / 2; // x of center point between object 1 and object 2
        const cy = (y1 + y2) / 2; // y of center point between object 1 and object 2
        const dx = (x2 - x1) / 2; // distance to x of center point
        const dy = (y2 - y1) / 2; // distance to y of center point
        const dd = Math.sqrt(dx * dx + dy * dy);
        const ex = cx + (dy / dd) * k * ((relation.rank + 2 - 1) / 2);
        const ey = cy - (dx / dd) * k * ((relation.rank + 2 - 1) / 2);

        const vec_t = new Point2D(x2 - ex, y2 - ey).unitVector();
        const vec_s = new Point2D(x1 - ex, y1 - ey).unitVector();

        const to_rad = this.calculateRadiusForObject(to_obj);
        const from_rad = this.calculateRadiusForObject(from_obj);

        const _x2 = x2 - vec_t.x * to_rad; // offset from center to point on circle border
        const _y2 = y2 - vec_t.y * to_rad; // offset from center to point on circle border

        const _x1 = x1 - vec_s.x * from_rad; // offset from center to point on circle border
        const _y1 = y1 - vec_s.y * from_rad; // offset from center to point on circle border

        const dex = ex - _x1; // distance to x of center point
        const dey = ey - _y1; // distance to y of center point

        const dexa = Math.abs(dex); // distance to x of center point
        const deya = Math.abs(dey); // distance to y of center point

        // calculate first arc
        const x1_1 = _x1 + 1.3 * (dex / dexa) * deya * (1 / (dexa + deya)); // offset origin for first base point
        const y1_1 = _y1 + -1.3 * (dey / deya) * dexa * (1 / (dexa + deya));

        // calculate second arc
        const x1_2 = _x1 - 1.3 * (dex / dexa) * deya * (1 / (dexa + deya)); // offset origin for first base point
        const y1_2 = _y1 - -1.3 * (dey / deya) * dexa * (1 / (dexa + deya));

        const path = d3.path();
        path.moveTo(x1_1, y1_1);
        path.quadraticCurveTo(ex, ey, _x2, _y2);
        path.quadraticCurveTo(ex, ey, x1_2, y1_2);

        return path.toString();
    }

    override handleObjectsInteraction(ids: string[]): DisplayMode {
        this.popoutObjectsAnimated(ids);
        return this;
    }

    protected popoutObjectsAnimated(ids: string[]) {
        const component = this;

        const circles_update = (
            this.svgCenters.selectAll('circle.graph-object') as d3.Selection<
                d3.BaseType,
                SceneGraphObject,
                SVGGElement,
                unknown
            >
        )
            // not very pretty
            .filter((d) => {
                return ids.includes(d.id);
            });

        circles_update
            .transition()
            .duration(250)
            .attr('r', 14)
            .attr('stroke', environment.colors.graph_node_stroke_popout)
            .on('end', function () {
                circles_update
                    .transition()
                    .duration(600)
                    .attr('r', (d) => component.calculateRadiusForObject(d))
                    .attr('stroke', environment.colors.graph_node_stroke);
                /*.attr('fill', (d) => {
                        return "url('#half-" + d.id + "')";
                    })*/
            });
    }

    onObjectMouseOver(event: MouseEvent, obj_id: string) {
        this.showObjectTooltip(obj_id, event.pageX, event.pageY);

        const scene_graph = this.controller.scene?.graph;
        if (!scene_graph) return;

        scene_graph.changeObjectsVisibility(
            null,
            SceneGraphObjectVisibility.HIDDEN
        );
        scene_graph.setObjectsVisibility(
            [obj_id],
            SceneGraphObjectVisibility.HIGHLIGHTED
        );

        this.redraw();
    }

    onObjectMouseOut(event: MouseEvent, obj_id: string) {
        this.hideTooltip();

        const scene_graph = this.controller.scene?.graph;
        if (!scene_graph) return;

        scene_graph.changeObjectsVisibility(
            null,
            SceneGraphObjectVisibility.VISIBLE
        );
        scene_graph.changeRelationsVisibility(
            null,
            SceneGraphRelationVisibility.VISIBLE
        );

        this.redraw();
    }

    onObjectLeftClick(event: MouseEvent, obj_id: string) {
        event.preventDefault();

        // todo: consider doing this using messages instead
        this.controller.root.sidebar.widgetElementList?.highlightListElement(
            obj_id
        );
    }

    onObjectRightClick(event: MouseEvent, obj_id: string) {
        event.preventDefault();

        this.controller.onOpenObjectContextMenu(event, obj_id);
    }

    onRelationMouseOver(event: MouseEvent, rel_id: string) {
        const scene_graph = this.controller.scene?.graph;
        if (!scene_graph) return;

        const rel = scene_graph.all_relations[rel_id];

        this.showRelationTooltip(rel_id, event.pageX, event.pageY);

        scene_graph.changeObjectsVisibility(
            null,
            SceneGraphObjectVisibility.HIDDEN
        );
        scene_graph.setObjectsVisibility(
            [rel.from_obj_id, rel.to_obj_id],
            SceneGraphObjectVisibility.HIGHLIGHTED
        );

        scene_graph.changeRelationsVisibility(
            null,
            SceneGraphRelationVisibility.HIDDEN
        );
        scene_graph.setRelationsVisibility(
            [rel_id],
            SceneGraphRelationVisibility.HIGHLIGHTED
        );

        this.redraw();
    }

    onRelationMouseOut(event: MouseEvent, rel_id: string) {
        this.hideTooltip();

        const scene_graph = this.controller.scene?.graph;
        if (!scene_graph) return;

        scene_graph.changeObjectsVisibility(
            null,
            SceneGraphObjectVisibility.VISIBLE
        );
        scene_graph.changeRelationsVisibility(
            null,
            SceneGraphRelationVisibility.VISIBLE
        );

        this.redraw();
    }

    onRelationLeftClick(event: MouseEvent, rel_id: string) {
        event.preventDefault;

        // todo: consider doing this using messages instead
        this.controller.root.sidebar.widgetElementList?.highlightListElement(
            rel_id
        );
    }

    onRelationRightClick(event: MouseEvent, rel_id: string) {
        event.preventDefault();

        this.controller.onOpenRelationContextMenu(event, rel_id);
    }

    onBackgroundLeftClick(event: MouseEvent) {
        this.controller.closeContextMenu();
    }

    onBackgroundRightClick(event: MouseEvent) {
        event.preventDefault();

        this.controller.onOpenBackgroundContextMenu(event);
    }

    // set up the tooltip with the given object's name and attributes, and then fade it in
    protected showObjectTooltip(
        object_id: string,
        mouseX: number,
        mouseY: number
    ): void {
        this.svgTooltip
            .html(this.tooltipBodyForObject(object_id))
            .style('left', mouseX + 12 + 'px')
            .style('top', mouseY - 28 + 'px');

        this.svgTooltip.transition().duration(160).style('opacity', '0.85');
    }

    protected tooltipBodyForObject(object_id: string) {
        const scene_graph = this.controller.scene?.graph;
        if (!scene_graph) return '';

        const object = scene_graph.all_objects[object_id];
        const attributes = object.attributes;

        return (
            'Name: ' +
            '<b>' +
            object.name +
            '</b>' +
            '<br>' +
            'ID: ' +
            object.id +
            '<br>' +
            'Attributes: ' +
            (attributes.length > 0 ? attributes.join(', ') : '-')
        );
    }

    // set up the tooltip with the given relation's name, and then fade it in
    protected showRelationTooltip(
        relation_id: string,
        mouseX: number,
        mouseY: number
    ): void {
        this.svgTooltip
            .html(this.tooltipBodyForRelation(relation_id))
            .style('left', mouseX + 12 + 'px')
            .style('top', mouseY - 28 + 'px');

        this.svgTooltip.transition().duration(160).style('opacity', '0.85');
    }

    protected tooltipBodyForRelation(relation_id: string): string {
        const scene_graph = this.controller.scene?.graph;

        if (!scene_graph) return '';

        const relation = scene_graph.all_relations[relation_id];
        const from_obj = scene_graph.all_objects[relation.from_obj_id];
        const to_obj = scene_graph.all_objects[relation.to_obj_id];

        return '<i>' + from_obj.name + '</i> → <i>' + to_obj.name + '</i>';
    }

    // fade out the tooltip
    protected hideTooltip() {
        this.svgTooltip.transition().duration(160).style('opacity', '0');
        /*.on('end', function () { // don't do this, causes race conditions between this and showTooltip() resulting in empty tooltips
                component.svgTooltip.html('');
            });*/
    }
}

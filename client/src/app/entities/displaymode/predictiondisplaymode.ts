/**
 * This is the code for displaying the 'Prediction Weight'.
 */

import { ComponentRef, ElementRef, ViewContainerRef } from '@angular/core';
import * as d3 from 'd3';
import { environment } from 'src/environments/environment';
import {
    PredictionDisplayModeDirectionIndication,
    PredictionDisplayModeNodeWeightIndication,
    PredictionDisplayModePreferences,
} from '../preferences/prediction-display-mode-prefscachingportal';
import {
    SceneGraphObject,
    SceneGraphObjectVisibility,
    SceneGraphRelation,
    SceneGraphRelationType,
    SceneGraphRelationVisibility,
} from '../scenegraph';
import { ExplorationTypeDisplayMode } from './explorationtypedisplaymode';
import { DisplayMode } from './interfaces/displaymode';
import { DisplayModeController } from './interfaces/displaymodecontroller';
import { TimelineWidgetComponent } from './widgets/timeline/timeline-widget.component';

export class PredictionDisplayMode extends ExplorationTypeDisplayMode {
    override preferences!: PredictionDisplayModePreferences;

    protected svgLoopbacks!: d3.Selection<
        SVGGElement,
        unknown,
        null,
        undefined
    >;

    protected svgSynthetics!: d3.Selection<
        SVGGElement,
        unknown,
        null,
        undefined
    >;

    protected svgRelations!: d3.Selection<
        SVGGElement,
        unknown,
        null,
        undefined
    >;

    private timelineRef?: ComponentRef<TimelineWidgetComponent>;

    constructor(
        canvas: d3.Selection<SVGGElement, unknown, null, undefined>,
        tooltipContainer: ElementRef,
        widgetContainer: ViewContainerRef,
        controller: DisplayModeController
    ) {
        super(
            canvas,
            tooltipContainer,
            widgetContainer,
            controller,
            new PredictionDisplayModePreferences()
        );
    }

    override prepare(): PredictionDisplayMode {
        super.prepare();
        this.prepare_setup_base();

        this.prepare_setup_defs().html(
            '<marker id="source-marker-regular" viewBox="0 0 20 20" refX="-1" refY="6" markerwidth="15" markerheight="15" stroke="' +
                environment.colors.graph_edge_stroke +
                '" fill="' +
                environment.colors.graph_edge_fill +
                '" orient="auto"><path d="M 11 1 L 1 6 L 11 11 z" /></marker>' +
                '<marker id="target-marker-regular" viewBox="0 0 20 20" refX="13" refY="6" markerwidth="15" markerheight="15" stroke="' +
                environment.colors.graph_edge_stroke +
                '" fill="' +
                environment.colors.graph_edge_fill +
                '" orient="auto"><path d="M 1 1 L 11 6 L 1 11 z" /></marker>' +
                '<marker id="source-marker-synthetic" viewBox="0 0 20 20" refX="-1" refY="6" markerwidth="15" markerheight="15" stroke="' +
                environment.colors.graph_edge_stroke_alt +
                '" fill="' +
                environment.colors.graph_edge_fill_alt +
                '" orient="auto"><path d="M 11 1 L 1 6 L 11 11 z" /></marker>' +
                '<marker id="target-marker-synthetic" viewBox="0 0 20 20" refX="13" refY="6" markerwidth="15" markerheight="15" stroke="' +
                environment.colors.graph_edge_stroke_alt +
                '" fill="' +
                environment.colors.graph_edge_fill_alt +
                '" orient="auto"><path d="M 1 1 L 11 6 L 1 11 z" /></marker>'
        );

        this.prepare_setup_fg_object_centers();
        this.prepare_setup_fg_loopbacks();
        this.prepare_setup_fg_synthetics();
        this.prepare_setup_fg_relations();
        this.prepare_setup_fg_object_boundingboxes();
        this.prepare_setup_tooltip();
        this.prepare_setup_overlay_timeline();

        return this;
    }

    override redraw(): PredictionDisplayMode {
        super.redraw();

        const component = this;

        const scene_graph = this.controller.scene?.graph;
        if (!scene_graph) return this;

        const filtered_objects = Object.values(scene_graph.filtered_objects);
        const filtered_relations = Object.values(
            scene_graph.filtered_relations
        ).filter((rel) => rel.type == SceneGraphRelationType.REGULAR);
        const synthetic_relations = Object.values(
            scene_graph.filtered_relations
        ).filter((rel) => rel.type == SceneGraphRelationType.SYNTHETIC);

        const max_obj_weight = Object.values(scene_graph.all_objects)
            .map((obj) => 3 * Math.log2(obj.weight * 100 + 1))
            .reduce((previous, current) => {
                return current > previous ? current : previous;
            }, 0);

        this.redraw_update_widgets();
        this.redraw_update_background()
            ?.on('contextmenu', function (event) {
                component.onBackgroundRightClick(event);
            })
            .on('click', function (event) {
                component.onBackgroundLeftClick(event);
            });
        this.redraw_update_fg_object_boundingboxes(filtered_objects);
        this.redraw_update_defs();
        this.redraw_update_fg_object_centers(filtered_objects)
            ?.style('opacity', (d) => {
                switch (this.preferences.node_weight_indication) {
                    case PredictionDisplayModeNodeWeightIndication.OPACITY:
                        return (
                            (3 * Math.log2(d.weight * 100 + 1)) / max_obj_weight
                        );

                    default:
                        return 1;
                }
            })
            // hovering over an object circle should render the object's bounding box and show a tooltip containing
            // ...the object's name and attributes
            .on('mouseover', function (event) {
                const id =
                    this.attributes.getNamedItem('identifier')!.nodeValue!;
                component.onObjectMouseOver(event, id);
            })
            .on('mouseout', function (event) {
                const id =
                    this.attributes.getNamedItem('identifier')!.nodeValue!;
                component.onObjectMouseOut(event, id);
            })
            .on('contextmenu', function (event) {
                const id =
                    this.attributes.getNamedItem('identifier')!.nodeValue!;
                component.onObjectRightClick(event, id);
            })
            .on('click', function (event) {
                const id =
                    this.attributes.getNamedItem('identifier')!.nodeValue!;
                component.onObjectLeftClick(event, id);
            });
        this.redraw_update_fg_synthetics(synthetic_relations)
            ?.on('mouseover', function (event) {
                const rel_id =
                    this.attributes.getNamedItem('identifier')!.nodeValue!;
                component.onRelationMouseOver(event, rel_id);
            })
            .on('mouseout', function (event) {
                const rel_id =
                    this.attributes.getNamedItem('identifier')!.nodeValue!;
                component.onRelationMouseOut(event, rel_id);
            })
            .on('contextmenu', function (event) {
                event.preventDefault();
            })
            .on('click', function (event) {
                const id =
                    this.attributes.getNamedItem('identifier')!.nodeValue!;
                component.onRelationLeftClick(event, id);
            });
        this.redraw_update_fg_relations(filtered_relations)
            ?.on('mouseover', function (event) {
                const rel_id =
                    this.attributes.getNamedItem('identifier')!.nodeValue!;
                component.onRelationMouseOver(event, rel_id);
            })
            .on('mouseout', function (event) {
                const rel_id =
                    this.attributes.getNamedItem('identifier')!.nodeValue!;
                component.onRelationMouseOut(event, rel_id);
            })
            .on('contextmenu', function (event) {
                const rel_id =
                    this.attributes.getNamedItem('identifier')!.nodeValue!;
                component.onRelationRightClick(event, rel_id);
            })
            .on('click', function (event) {
                const id =
                    this.attributes.getNamedItem('identifier')!.nodeValue!;
                component.onRelationLeftClick(event, id);
            });

        return this;
    }

    protected prepare_setup_fg_loopbacks() {
        this.svgLoopbacks = this.svgFG
            .append('g')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('class', 'loopbacks');
    }

    protected prepare_setup_fg_synthetics() {
        this.svgSynthetics = this.svgFG
            .append('g')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('class', 'synthetics');
    }

    protected prepare_setup_fg_relations() {
        this.svgRelations = this.svgFG
            .append('g')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('class', 'relations');
    }

    private prepare_setup_overlay_timeline() {
        this.timelineRef = this.widgetContainerRef.createComponent(
            TimelineWidgetComponent
        );
    }

    private redraw_update_widgets() {
        this.timelineRef!.instance.num_steps =
            Object.values(this.controller.scene?.graph?.all_relations || {})[0]
                ?.weights.length || 0;
    }

    /**
     * @returns Correct convolution step index for relation weights to be displayed at any point in time.
     * Only really useful while a GAT prediction is being displayed, as we don't display any relations for the other models.
     */
    public convolution_index(): number {
        return this.timelineRef!.instance.selected_step - 1;
    }

    protected redraw_update_fg_synthetics(
        data: SceneGraphRelation[]
    ):
        | d3.Selection<SVGPathElement, SceneGraphRelation, SVGGElement, unknown>
        | undefined {
        const scene_graph = this.controller.scene?.graph;
        if (!scene_graph) return undefined;

        const component = this;

        // data will be empty for anything but GAT, effectively not drawing any visible relations
        data = data.filter((rel) => rel.weights[this.convolution_index()] > 0);

        const max_weight = this.findMaxRelationWeight();

        const relations_selection = this.svgSynthetics
            .selectAll('path.graph-synthetic')
            .data(data);

        relations_selection.exit().remove();

        const relations_update = relations_selection
            .enter()
            .append('path')
            .attr('class', 'graph-synthetic')
            .merge(
                // todo: less ugly
                relations_selection as unknown as d3.Selection<
                    SVGPathElement,
                    SceneGraphRelation,
                    SVGGElement,
                    unknown
                >
            );

        relations_update
            .attr('identifier', (d) => {
                return d.id;
            })
            .attr('stroke', environment.colors.graph_edge_stroke_alt)
            .attr('visibility', (d) => {
                return SceneGraphRelationVisibility.HIDDEN == d.visibility
                    ? 'hidden'
                    : 'inherit';
            })
            .attr('d', (d) => {
                return component.calculatePathForRelation(d);
            })
            .attr('marker-end', (d) => {
                return component.preferences.direction_indication ==
                    PredictionDisplayModeDirectionIndication.THICKNESS
                    ? ''
                    : 'url(#target-marker-synthetic)';
            })
            .attr('stroke-width', (d) => {
                return component.calculateStrokeWidthForRelation(d);
            })
            .attr('fill', (d) => {
                return component.preferences.direction_indication ==
                    PredictionDisplayModeDirectionIndication.THICKNESS
                    ? environment.colors.graph_edge_fill_alt
                    : 'transparent';
            })
            .style('opacity', (d) =>
                component.calculateOpacityForRelation(d, max_weight)
            );
        //.attr('marker-start', 'url(#source-marker)');
        //.attr('marker-end', (d) => 'url(#target-marker)');

        return relations_update;
    }

    protected redraw_update_fg_relations(
        data: SceneGraphRelation[]
    ):
        | d3.Selection<SVGPathElement, SceneGraphRelation, SVGGElement, unknown>
        | undefined {
        const scene_graph = this.controller.scene?.graph;
        if (!scene_graph) return undefined;

        const component = this;

        // data will be empty for anything but GAT, effectively not drawing any visible relations
        data = data.filter((rel) => rel.weights[this.convolution_index()] > 0);

        const max_weight = this.findMaxRelationWeight();

        const relations_selection = this.svgRelations
            .selectAll('path.graph-relation')
            .data(data);

        relations_selection.exit().remove();

        const relations_update = relations_selection
            .enter()
            .append('path')
            .attr('class', 'graph-relation')
            .merge(
                // todo: less ugly
                relations_selection as unknown as d3.Selection<
                    SVGPathElement,
                    SceneGraphRelation,
                    SVGGElement,
                    unknown
                >
            );

        relations_update
            .attr('identifier', (d) => {
                return d.id;
            })
            .attr('description', (d) => {
                return d.name;
            })
            .attr('stroke', environment.colors.graph_edge_stroke)
            .attr('visibility', (d) => {
                return SceneGraphRelationVisibility.HIDDEN == d.visibility
                    ? 'hidden'
                    : 'inherit';
            })
            .attr('d', (d) => {
                return component.calculatePathForRelation(d);
            })
            .attr('marker-end', (d) => {
                return component.preferences.direction_indication ==
                    PredictionDisplayModeDirectionIndication.THICKNESS
                    ? ''
                    : 'url(#target-marker-regular)';
            })
            .attr('stroke-width', (d) => {
                return component.calculateStrokeWidthForRelation(d);
            })
            .attr('fill', (d) => {
                return component.preferences.direction_indication ==
                    PredictionDisplayModeDirectionIndication.THICKNESS
                    ? environment.colors.graph_edge_fill
                    : 'transparent';
            })
            .style('opacity', (d) =>
                component.calculateOpacityForRelation(d, max_weight)
            );
        //.attr('marker-start', 'url(#source-marker)');
        //.attr('marker-end', (d) => 'url(#target-marker)');

        return relations_update;
    }

    // --------------------------------------------------------------------------

    override calculateRadiusForObject(object: SceneGraphObject): number {
        switch (this.preferences.node_weight_indication) {
            case PredictionDisplayModeNodeWeightIndication.RADIUS:
                return 30 * object.weight;

            case PredictionDisplayModeNodeWeightIndication.AREA:
                return Math.sqrt((object.weight * 2000) / Math.PI);

            default:
                return super.calculateRadiusForObject(object);
        }
    }

    // logarithmic scaling
    /* override calculateRadiusForObject(object: SceneGraphObject): number {
        return 3 * Math.log2(object.weight * 100 + 1);
    } */

    // --------------------------------------------------------------------------

    calculateStrokeWidthForRelation(relation: SceneGraphRelation): string {
        return '0.3px';
    }

    calculatePathForRelation(relation: SceneGraphRelation): string {
        return this.preferences.direction_indication ==
            PredictionDisplayModeDirectionIndication.THICKNESS
            ? this.calculatePathForRelationThickness(relation)
            : this.calculatePathForRelationArrows(relation);
    }

    /**
     * This is a helper method required for normalizing the relation visualization opacity
     * @returns Highest weight value across all relations
     */
    private findMaxRelationWeight(): number {
        const scene_graph = this.controller.scene?.graph;
        if (!scene_graph) return 0;

        return Object.values(scene_graph.all_relations)
            .map((rel) => rel.weights[this.convolution_index()])
            .reduce(
                (previous, current) =>
                    current > previous ? current : previous,
                0
            );
    }

    calculateOpacityForRelation(
        relation: SceneGraphRelation,
        max_weight: number
    ): number {
        // do not call findMaxRelationWeight() here since then you would be
        // ...doing the lookup for each relation instead of once per batch

        if (this.preferences.normalize_relation_opacity) {
            return relation.weights[this.convolution_index()] / max_weight;
        } else {
            return relation.weights[this.convolution_index()];
        }
    }

    override showObjectTooltip(
        object_id: string,
        mouseX: number,
        mouseY: number
    ): void {
        if (this.preferences.show_hovering_tooltips) {
            super.showObjectTooltip(object_id, mouseX, mouseY);
        }
    }

    override tooltipBodyForObject(object_id: string): string {
        const scene_graph = this.controller.scene?.graph;

        if (!scene_graph) return '';

        const objects = scene_graph.all_objects;
        const object = objects[object_id];
        const attributes = objects[object_id].attributes;
        const relations_outgoing_regular = Object.values(
            object.outgoing_relations_dict
        ).filter((r) => r.type == SceneGraphRelationType.REGULAR);
        const incoming_relations = Object.values(
            object.incoming_relations_dict
        );
        const relations_incoming_regular = incoming_relations.filter(
            (r) => r.type == SceneGraphRelationType.REGULAR
        );
        const incoming_weight = incoming_relations
            .flatMap((rel) => rel.weights[this.convolution_index()] || 0)
            .reduce((previous, current) => {
                return previous + current;
            }, 0);

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
            (attributes.length > 0
                ? attributes.map((attr) => '<b>' + attr + '</b>').join(', ')
                : '-') +
            '<br>' +
            'Outgoing Relations: ' +
            (relations_outgoing_regular.length > 0
                ? relations_outgoing_regular
                      .map((r) => {
                          return (
                              '<b>' +
                              r.name +
                              '</b> ' +
                              objects[r.to_obj_id].name +
                              ' (' +
                              (
                                  r.weights[this.convolution_index()] || 0
                              ).toPrecision(6) +
                              ')'
                          );
                      })
                      .join(', ')
                : '-') +
            '<br>' +
            'Incoming Relations: ' +
            (relations_incoming_regular.length > 0
                ? relations_incoming_regular
                      .map((r) => {
                          return (
                              objects[r.from_obj_id].name +
                              ' is <b>' +
                              r.name +
                              '</b>' +
                              ' (' +
                              (
                                  r.weights[this.convolution_index()] || 0
                              ).toPrecision(6) +
                              ')'
                          );
                      })
                      .join(', ')
                : '-') +
            '<br>' +
            'Weight (Gate): ' +
            object.weight.toPrecision(6) +
            '<br>' +
            'Intrinsic Attention Part: ' +
            (1 - incoming_weight).toPrecision(6) +
            '<br>' +
            'Extrinsic Attention Part: ' +
            incoming_weight.toPrecision(6)
        );
    }

    override onObjectMouseOver(event: MouseEvent, obj_id: string) {
        this.showObjectTooltip(obj_id, event.pageX, event.pageY);

        const scene_graph = this.controller.scene?.graph;
        if (!scene_graph) return;

        const obj = scene_graph.all_objects[obj_id];
        const rel_ids: string[] = [];
        const rel_targets: string[] = [];

        if (this.preferences.show_hovering_incoming_edges) {
            rel_ids.push(...Object.keys(obj.incoming_relations_dict));
            rel_targets.push(
                ...Object.values(obj.incoming_relations_dict).map(
                    (rel) => rel.from_obj_id
                )
            );
        }

        if (this.preferences.show_hovering_outgoing_edges) {
            rel_ids.push(...Object.keys(obj.outgoing_relations_dict));
            rel_targets.push(
                ...Object.values(obj.outgoing_relations_dict).map(
                    (rel) => rel.to_obj_id
                )
            );
        }

        scene_graph.changeObjectsVisibility(
            null,
            SceneGraphObjectVisibility.HIDDEN
        );
        scene_graph.setObjectsVisibility(
            [obj_id],
            SceneGraphObjectVisibility.HIGHLIGHTED
        );
        scene_graph.setObjectsVisibility(
            rel_targets,
            SceneGraphObjectVisibility.VISIBLE
        );

        scene_graph.changeRelationsVisibility(
            null,
            SceneGraphRelationVisibility.HIDDEN
        );
        scene_graph.setRelationsVisibility(
            rel_ids,
            SceneGraphRelationVisibility.VISIBLE
        );

        this.redraw();
    }

    override showRelationTooltip(
        relation_id: string,
        mouseX: number,
        mouseY: number
    ): void {
        if (this.preferences.show_hovering_tooltips) {
            super.showRelationTooltip(relation_id, mouseX, mouseY);
        }
    }

    override tooltipBodyForRelation(relation_id: string): string {
        const scene_graph = this.controller.scene?.graph;

        if (!scene_graph) return '';

        const relation = scene_graph.all_relations[relation_id];
        const from_obj = scene_graph.all_objects[relation.from_obj_id];
        const to_obj = scene_graph.all_objects[relation.to_obj_id];
        const weight = relation.weights[this.convolution_index()] * 100;

        let tooltip_text = '';

        switch (relation.type) {
            case SceneGraphRelationType.SYNTHETIC:
                {
                    const counter_rel = Object.values(
                        to_obj.outgoing_relations_dict
                    )
                        .filter((rel) => rel.to_obj_id == relation.from_obj_id)
                        .find((rel) => rel.rank == relation.rank);

                    tooltip_text =
                        'Attention weight of synthetic relation from ' +
                        "'" +
                        from_obj.name +
                        "'" +
                        ' to ' +
                        "'" +
                        to_obj.name +
                        "'" +
                        (counter_rel
                            ? " (possibly counterpart to '" +
                              to_obj.name +
                              ' is ' +
                              counter_rel!.name +
                              ' ' +
                              from_obj.name +
                              "')"
                            : '') +
                        ' accounts for <b>' +
                        weight.toPrecision(6) +
                        '%</b> of ' +
                        "'" +
                        to_obj.name +
                        "'" +
                        ' attention.';
                }
                break;

            default:
                tooltip_text =
                    'Attention weight of ' +
                    "'" +
                    from_obj.name +
                    ' is ' +
                    relation.name +
                    ' ' +
                    to_obj.name +
                    "'" +
                    ' accounts for <b>' +
                    weight.toPrecision(6) +
                    '%</b> of ' +
                    "'" +
                    to_obj.name +
                    "'" +
                    ' attention.';
                break;
        }

        return tooltip_text;
    }

    override handleRelationsInteraction(ids: string[]): DisplayMode {
        const regular_relations = (
            this.svgRelations.selectAll('path.graph-relation') as d3.Selection<
                d3.BaseType,
                SceneGraphRelation,
                SVGGElement,
                unknown
            >
        ) // not very pretty
            .filter((d) => {
                return ids.includes(d.id);
            });
        this.popoutRelationsAnimated(regular_relations);

        const synthetic_relations = (
            this.svgSynthetics.selectAll(
                'path.graph-synthetic'
            ) as d3.Selection<
                d3.BaseType,
                SceneGraphRelation,
                SVGGElement,
                unknown
            >
        ) // not very pretty
            .filter((d) => {
                return ids.includes(d.id);
            });
        this.popoutRelationsAnimated(synthetic_relations);

        return this;
    }

    private popoutRelationsAnimated(
        elements: d3.Selection<
            d3.BaseType,
            SceneGraphRelation,
            SVGGElement,
            unknown
        >
    ) {
        const component = this;
        const scene_graph = this.controller.scene?.graph;
        if (!scene_graph) return;

        const max_weight = this.findMaxRelationWeight();

        elements
            .transition()
            .duration(250)
            .attr('stroke-width', '5px')
            .style('opacity', '1')
            .on('end', function () {
                elements
                    .transition()
                    .duration(600)
                    .attr('stroke-width', (d) => {
                        return component.calculateStrokeWidthForRelation(d);
                    })
                    .style('opacity', (d) =>
                        component.calculateOpacityForRelation(d, max_weight)
                    );
            });
    }
}

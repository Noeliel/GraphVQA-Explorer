/**
 * This is the code for displaying the 'Ground Truth'.
 */

import * as d3 from 'd3';
import { DisplayMode } from './interfaces/displaymode';
import {
    SceneGraphObject,
    SceneGraphObjectVisibility,
    SceneGraphRelation,
    SceneGraphRelationType,
    SceneGraphRelationVisibility,
} from '../scenegraph';
import {
    GroundTruthDisplayModeDirectionIndication,
    GroundTruthDisplayModePreferences,
} from '../preferences/ground-truth-display-mode-prefscachingportal';
import { ElementRef, ViewContainerRef } from '@angular/core';
import { DisplayModeController } from './interfaces/displaymodecontroller';
import { ExplorationTypeDisplayMode } from './explorationtypedisplaymode';
import { environment } from 'src/environments/environment';

export class GroundTruthDisplayMode extends ExplorationTypeDisplayMode {
    override preferences!: GroundTruthDisplayModePreferences;

    protected svgRelations!: d3.Selection<
        SVGGElement,
        unknown,
        null,
        undefined
    >;

    protected svgCenterLabels!: d3.Selection<
        SVGGElement,
        unknown,
        null,
        undefined
    >;

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
            new GroundTruthDisplayModePreferences()
        );
    }

    override prepare(): GroundTruthDisplayMode {
        super.prepare();
        return this.prepare_impl();
    }

    protected prepare_impl(): GroundTruthDisplayMode {
        this.prepare_setup_base();

        this.prepare_setup_defs().html(
            '<marker id="source-marker" viewBox="0 0 20 20" refX="-1" refY="6" markerwidth="15" markerheight="15" stroke="' +
                environment.colors.graph_edge_stroke +
                '" fill="' +
                environment.colors.graph_edge_fill +
                '" orient="auto"><path d="M 11 1 L 1 6 L 11 11 z" /></marker>' +
                '<marker id="target-marker" viewBox="0 0 20 20" refX="13" refY="6" markerwidth="15" markerheight="15" stroke="' +
                environment.colors.graph_edge_stroke +
                '" fill="' +
                environment.colors.graph_edge_fill +
                '" orient="auto"><path d="M 1 1 L 11 6 L 1 11 z" /></marker>'
        );

        this.prepare_setup_fg_relations();
        this.prepare_setup_fg_object_boundingboxes();
        this.prepare_setup_fg_object_centers();
        this.prepare_setup_fg_object_center_labels();
        this.prepare_setup_tooltip();

        return this;
    }

    override redraw(): GroundTruthDisplayMode {
        super.redraw();
        return this.redraw_impl();
    }

    protected redraw_impl(): GroundTruthDisplayMode {
        const component = this;

        const scene_graph = this.controller.scene?.graph;
        if (!scene_graph) return this;

        const filtered_objects = Object.values(scene_graph.filtered_objects);
        const filtered_relations = Object.values(
            scene_graph.filtered_relations
        ).filter((rel) => rel.type == SceneGraphRelationType.REGULAR);

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
            // hovering over an object circle should render the object's bounding box and show a tooltip containing
            // ...the object's name and attributes
            ?.on('mouseover', function (event) {
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

        this.redraw_update_fg_object_center_labels();
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

    protected prepare_setup_fg_relations() {
        this.svgRelations = this.svgFG
            .append('g')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('class', 'relations');
    }

    protected prepare_setup_fg_object_center_labels(): d3.Selection<
        SVGGElement,
        unknown,
        null,
        undefined
    > {
        this.svgCenterLabels = this.svgFG
            .append('g')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('class', 'center-labels');

        return this.svgCenterLabels;
    }

    protected redraw_update_fg_relations(
        data: SceneGraphRelation[]
    ):
        | d3.Selection<SVGPathElement, SceneGraphRelation, SVGGElement, unknown>
        | undefined {
        const scene_graph = this.controller.scene?.graph;
        if (!scene_graph) return undefined;

        const component = this;

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
            //.attr('marker-start', 'url(#source-marker)')
            .attr('marker-end', (d) => {
                return component.preferences.direction_indication ==
                    GroundTruthDisplayModeDirectionIndication.THICKNESS
                    ? ''
                    : 'url(#target-marker)';
            })
            .attr('stroke-width', (d) => {
                return component.calculateStrokeWidthForRelation(d);
            })
            .attr('fill', (d) => {
                return component.preferences.direction_indication ==
                    GroundTruthDisplayModeDirectionIndication.THICKNESS
                    ? environment.colors.graph_edge_fill
                    : 'transparent';
            });

        return relations_update;
    }

    protected redraw_update_fg_object_center_labels():
        | d3.Selection<SVGGElement, SceneGraphObject, SVGGElement, unknown>
        | undefined {
        const scene_graph = this.controller.scene?.graph;
        if (!scene_graph) return undefined;

        const label_pairs_update = this.svgCenterLabels
            .selectAll('g.center-label-pair')
            .data(Object.values(scene_graph.filtered_objects));

        label_pairs_update.exit().remove();

        const new_pairs = label_pairs_update
            .enter()
            .append('g')
            .attr('class', 'center-label-pair');

        new_pairs
            .append('svg:text')
            .attr('class', 'center-label-shadow')
            .style('font', '6px sans-serif')
            .style('pointer-events', 'none')
            .style('stroke', '#333')
            .style('fill', '#fff')
            .style('stroke-width', '1px')
            .style('stroke-opacity', '0.8');

        new_pairs
            .append('svg:text')
            .attr('class', 'center-label')
            .style('font', '6px sans-serif')
            .style('pointer-events', 'none')
            .style('fill', '#fff');

        const labels_update = new_pairs.merge(
            // todo: less ugly
            label_pairs_update as unknown as d3.Selection<
                SVGGElement,
                SceneGraphObject,
                SVGGElement,
                unknown
            >
        );

        labels_update
            .selectChild('text.center-label')
            .attr('x', (d) => {
                return d.center.x + 5;
            })
            .attr('y', (d) => {
                return d.center.y + 2;
            })
            .text(function (d) {
                return d.name;
            });

        labels_update
            .selectChild('text.center-label-shadow')
            .attr('x', (d) => {
                return d.center.x + 5;
            })
            .attr('y', (d) => {
                return d.center.y + 2;
            })
            .text(function (d) {
                return d.name;
            });

        labels_update.style('visibility', (d) => {
            return !this.preferences.show_object_labels ||
                SceneGraphObjectVisibility.HIDDEN == d.visibility
                ? 'hidden'
                : 'visible';
        });

        return labels_update;
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

    override showObjectTooltip(
        object_id: string,
        mouseX: number,
        mouseY: number
    ): void {
        if (this.preferences.show_hovering_tooltips) {
            super.showObjectTooltip(object_id, mouseX, mouseY);
        }
    }

    override tooltipBodyForObject(object_id: string) {
        const scene_graph = this.controller.scene?.graph;

        if (!scene_graph) return '';

        const objects = scene_graph.all_objects;
        const object = objects[object_id];
        const attributes = object.attributes;
        const relations_outgoing_regular = Object.values(
            object.outgoing_relations_dict
        ).filter((r) => r.type == SceneGraphRelationType.REGULAR);
        const relations_incoming_regular = Object.values(
            object.incoming_relations_dict
        ).filter((r) => r.type == SceneGraphRelationType.REGULAR);

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
                              objects[r.to_obj_id].name
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
                              '</b>'
                          );
                      })
                      .join(', ')
                : '-')
        );
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

        return (
            '<i>' +
            from_obj.name +
            '</i> is <b>' +
            relation.name +
            '</b> <i>' +
            to_obj.name +
            '</i>'
        );
    }

    calculateStrokeWidthForRelation(relation: SceneGraphRelation): string {
        return '0.3px';
    }

    calculatePathForRelation(relation: SceneGraphRelation): string {
        return this.preferences.direction_indication ==
            GroundTruthDisplayModeDirectionIndication.THICKNESS
            ? this.calculatePathForRelationThickness(relation)
            : this.calculatePathForRelationArrows(relation);
    }

    override handleRelationsInteraction(ids: string[]): DisplayMode {
        this.popoutRelationsAnimated(ids);
        return this;
    }

    private popoutRelationsAnimated(ids: string[]) {
        const component = this;

        const relations_update = (
            this.svgRelations.selectAll('path.graph-relation') as d3.Selection<
                d3.BaseType,
                SceneGraphRelation,
                SVGGElement,
                unknown
            >
        )
            // not very pretty
            .filter((d) => {
                return ids.includes(d.id);
            });

        relations_update
            .transition()
            .duration(250)
            .attr('stroke-width', '5px')
            .attr('stroke', environment.colors.graph_edge_stroke_popout)
            .on('end', function () {
                relations_update
                    .transition()
                    .duration(600)
                    .attr('stroke-width', (d) => {
                        return component.calculateStrokeWidthForRelation(d);
                    })
                    .attr('stroke', environment.colors.graph_edge_stroke);
            });
    }
}

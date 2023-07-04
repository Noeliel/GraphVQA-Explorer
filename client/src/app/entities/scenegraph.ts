import { SceneGraphRawWrapped } from '../models/scenegraph.model';
import { Point2D } from '../models/point2d.model';
import { FilterConfig, FilterType } from '../models/filterconfig.model';
import { _Crypto } from '../providers/crypto';
import {
    GraphObjectWeights,
    GraphRelationWeightsSteps,
} from '../models/qa.model';
import { environment } from 'src/environments/environment';

export enum SceneGraphRelationVisibility {
    VISIBLE = 0, // relation path is visible
    HIDDEN = 1, // relation path is hidden
    HIGHLIGHTED = 2, // special visibility state
}

export enum SceneGraphObjectVisibility {
    VISIBLE = 0, // only shows object centers
    HIDDEN = 1, // hides object completely
    HIGHLIGHTED = 2, // general usecase: show object centers + object bounding box
}

export enum SceneGraphRelationType {
    REGULAR = 1,
    LOOPBACK = 2,
    SYNTHETIC = 4,
}

export interface SceneGraphRelation {
    id: string;
    name: string;
    from_obj_id: string;
    to_obj_id: string;
    visibility: SceneGraphRelationVisibility;
    weights: number[];
    rank: number; // order in which they appear in the dataset; also determines arc offset
    type: SceneGraphRelationType;
}

export class SceneGraphObject {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    name: string;
    attributes: string[];
    outgoing_relations_dict: { [id: string]: SceneGraphRelation };
    incoming_relations_dict: { [id: string]: SceneGraphRelation };
    visibility: SceneGraphObjectVisibility = SceneGraphObjectVisibility.VISIBLE;
    base_weight: number;
    weight: number;
    primary_color: string;
    secondary_color: string;

    constructor(
        id: string,
        x: number,
        y: number,
        w: number,
        h: number,
        name: string,
        attributes: string[],
        outgoing_relations_dict: { [id: string]: SceneGraphRelation },
        incoming_relations_dict: { [id: string]: SceneGraphRelation },
        base_weight: number,
        weight: number,
        primary_color: string,
        secondary_color: string
    ) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.name = name;
        this.attributes = attributes;
        this.outgoing_relations_dict = outgoing_relations_dict;
        this.incoming_relations_dict = incoming_relations_dict;
        this.base_weight = base_weight;
        this.weight = weight;
        this.primary_color = primary_color;
        this.secondary_color = secondary_color;
    }

    get center(): Point2D {
        return new Point2D(this.x + this.w * 0.5, this.y + this.h * 0.5);
    }
}

export class SceneGraph {
    id: string;
    split: string;
    height: number;
    width: number;
    location?: string;
    weather?: string;
    all_objects: { [id: string]: SceneGraphObject };
    all_relations: { [id: string]: SceneGraphRelation };
    filtered_objects: { [id: string]: SceneGraphObject }; // for filtering
    filtered_relations: { [id: string]: SceneGraphRelation }; // for filtering
    active_filter_config: FilterConfig | null = null;
    _synthetic_weights?: GraphRelationWeightsSteps;

    constructor(
        id: string,
        split: string,
        height: number,
        width: number,
        objects: { [id: string]: SceneGraphObject },
        relations: { [id: string]: SceneGraphRelation },
        location: string | undefined = undefined,
        weather: string | undefined = undefined
    ) {
        this.id = id;
        this.split = split;
        this.height = height;
        this.width = width;
        this.all_objects = objects;
        this.all_relations = relations;
        this.filtered_objects = objects;
        this.filtered_relations = relations;
        this.location = location;
        this.weather = weather;
    }

    get synthetic_weights(): GraphRelationWeightsSteps | undefined {
        return this._synthetic_weights;
    }

    set synthetic_weights(weights: GraphRelationWeightsSteps | undefined) {
        Object.values(this.all_relations).forEach((rel) => {
            if (rel.type == SceneGraphRelationType.SYNTHETIC) {
                this.deleteRelation(rel.id);
            }
        });

        this._synthetic_weights = weights;

        if (this._synthetic_weights && this._synthetic_weights.length > 0) {
            this._synthetic_weights[0].forEach((weight, i) => {
                const from_obj = this.all_objects[weight.from];
                const to_obj = this.all_objects[weight.to];

                if (from_obj && to_obj) {
                    const rel = this.createNewRelation(
                        from_obj,
                        to_obj,
                        true,
                        weight.type
                    );

                    const relation_weight_in_steps =
                        this._synthetic_weights!.map(
                            (step) => step[i].weight[0]
                        ) || [];

                    rel.weights = relation_weight_in_steps;

                    rel.name = '';
                    this.editRelation(rel, false);
                }
            });
        }
    }

    public generateRandomUnusedObjectID(): string {
        let candidate = '';

        do {
            candidate = Math.round(
                1000000 + Math.random() * 8999999
            ).toString();
        } while (this.all_objects[candidate]);

        return candidate;
    }

    public generateRandomUnusedRelationID(): string {
        let candidate = '';

        do {
            candidate = _Crypto.randomUUID();
        } while (this.all_relations[candidate]);

        return candidate;
    }

    public getActiveFilterConfig(): FilterConfig | null {
        return this.active_filter_config;
    }

    public setFilterConfig(config: FilterConfig | null) {
        this.active_filter_config = config;
        this.recomputeFilters();
    }

    protected recomputeFilters() {
        if (!this.active_filter_config) {
            this.filtered_objects = this.all_objects;
            this.filtered_relations = this.all_relations;
            return;
        }

        switch (this.active_filter_config.type) {
            case FilterType.OBJECTS:
                this.filterByObjects(
                    this.active_filter_config.filters,
                    this.active_filter_config.invert,
                    this.active_filter_config.full_match
                );
                break;

            case FilterType.ATTRIBUTES:
                this.filterByAttributes(
                    this.active_filter_config.filters,
                    this.active_filter_config.invert,
                    this.active_filter_config.full_match
                );
                break;

            case FilterType.RELATIONS:
                this.filterByRelations(
                    this.active_filter_config.filters,
                    this.active_filter_config.invert,
                    this.active_filter_config.full_match,
                    this.active_filter_config.include_relation_objects_out,
                    this.active_filter_config.include_relation_objects_inc
                );
                break;

            default:
                break;
        }
    }

    protected filterByObjects(
        filters: string[],
        invert: boolean,
        full_match: boolean
    ) {
        this.filtered_objects = {};
        this.filtered_relations = {};

        filters = filters.map((f) => {
            return f.toLowerCase();
        });

        Object.values(this.all_objects).forEach((obj) => {
            if (
                filters!.some((filter) => {
                    return full_match
                        ? obj.name.toLowerCase() == filter
                        : obj.name.toLowerCase().includes(filter);
                }) != invert
            )
                this.filtered_objects[obj.id] = obj;
        });
    }

    protected filterByAttributes(
        filters: string[],
        invert: boolean,
        full_match: boolean
    ) {
        this.filtered_objects = {};
        this.filtered_relations = {};

        filters = filters.map((f) => {
            return f.toLowerCase();
        });

        Object.values(this.all_objects).forEach((obj) => {
            const obj_attributes = obj.attributes.map((attr) => {
                return attr.toLowerCase();
            });

            if (
                obj_attributes.some((attr) => {
                    return filters!.some((filter) => {
                        return full_match
                            ? attr == filter
                            : attr.includes(filter);
                    });
                }) != invert
            ) {
                this.filtered_objects[obj.id] = obj;
            }
        });
    }

    protected filterByRelations(
        filters: string[],
        invert: boolean,
        full_match: boolean,
        include_objects_out: boolean,
        include_objects_inc: boolean
    ) {
        this.filtered_objects = {};
        this.filtered_relations = {};

        filters = filters.map((f) => {
            return f.toLowerCase();
        });

        Object.values(this.all_relations).forEach((rel) => {
            if (
                filters!.some((filter) => {
                    const src_obj = this.all_objects[rel.from_obj_id];
                    const target_obj = this.all_objects[rel.to_obj_id];

                    if (full_match) {
                        return (
                            rel.name.toLowerCase() == filter ||
                            (include_objects_out &&
                                src_obj.name.toLowerCase() == filter) ||
                            (include_objects_inc &&
                                target_obj.name.toLowerCase() == filter)
                        );
                    } else {
                        return (
                            rel.name.toLowerCase().includes(filter) ||
                            (include_objects_out &&
                                src_obj.name.toLowerCase().includes(filter)) ||
                            (include_objects_inc &&
                                target_obj.name.toLowerCase().includes(filter))
                        );
                    }
                }) != invert
            ) {
                this.filtered_relations[rel.id] = rel;
                this.filtered_objects[rel.from_obj_id] =
                    this.all_objects[rel.from_obj_id];
                this.filtered_objects[rel.to_obj_id] =
                    this.all_objects[rel.to_obj_id];
            }
        });
    }

    public setObjectWeights(weights: GraphObjectWeights | null) {
        if (!weights) {
            Object.values(this.all_objects).forEach((obj) => {
                obj.weight = 0;
            });
        } else {
            Object.keys(weights).forEach((obj_id) => {
                this.all_objects[obj_id].weight = weights![obj_id];
            });
        }
    }

    /**
     * Preprocesses and stores new relation weights belonging to the currently active inference display.
     * Also triggers creation of temporary synthetic relations by setting the synthetic_weights member.
     * If `weights` is an empty list, weights are cleared instead (and synthetic relations as well).
     *
     * For preprocessing, the average of each node's attention heads is computed.
     *
     * @param weights Dim 0: Convolution (GraphVQA has 5), Dim 1: Node, Dim 2: Attention Head
     */
    public setRelationWeights(weights: GraphRelationWeightsSteps | null) {
        // start by clearing old weights

        this.synthetic_weights = undefined;

        Object.values(this.all_relations).forEach((rel) => {
            rel.weights = [];
        });

        if (weights && weights.length > 0) {
            // we have new weights

            const _weights: {
                [type: number]: GraphRelationWeightsSteps;
            } = {};

            _weights[SceneGraphRelationType.REGULAR] = [];
            // _weights[SceneGraphRelationType.LOOPBACK] = [];
            _weights[SceneGraphRelationType.SYNTHETIC] = [];

            // summarize attention heads by taking the average
            weights.forEach((step, i) => {
                _weights[SceneGraphRelationType.REGULAR].push([]);
                // _weights[SceneGraphRelationType.LOOPBACK].push([]);
                _weights[SceneGraphRelationType.SYNTHETIC].push([]);

                step.forEach((entry) => {
                    const len = entry.weight.length;
                    entry.weight = [
                        entry.weight.reduce((previous, current) => {
                            return previous + current;
                        }, 0) / len,
                    ];

                    // treat loopbacks as regulars
                    if (entry.type == SceneGraphRelationType.LOOPBACK)
                        entry.type = SceneGraphRelationType.REGULAR;

                    _weights[entry.type][i].push(entry);
                });
            });

            // map weights to the (regular) relations that they belong to
            // this is not required for weights of synthetic relations, as for those, ...
            // ...we create new temporary relation objects instead (see synthetic_weights setter)
            _weights[SceneGraphRelationType.REGULAR][0].forEach((weight, i) => {
                const source = this.all_objects[weight.from];

                // find the first relation that matches src and target and does not have
                // a weight set already; this works around the issue of missing relation
                // ids for unambiguous communication between the model and the frontend
                // (relies on order preservation based on rank)
                const relations = Object.values(
                    source.outgoing_relations_dict
                ).sort((a, b) => a.rank - b.rank);
                for (let j = 0; j < relations.length; j++) {
                    if (
                        relations[j].to_obj_id == weight.to &&
                        relations[j].weights.length == 0
                    ) {
                        /*
                        const total = weight.weight.reduce(
                            (previous, current) => {
                                return previous + current;
                            },
                            0
                        );
                        */

                        // extract weight value from relation weight struct
                        // (we don't need source and target information anymore)
                        const relation_weight_in_steps =
                            _weights[SceneGraphRelationType.REGULAR].map(
                                (step) => step[i].weight[0]
                            ) || [];

                        relations[j].weights = relation_weight_in_steps;

                        // don't forget to break
                        // otherwise you set the first weight for every
                        // relation with the same source and target
                        break;
                    }
                }
            });

            // trigger creation of temporary synthetic relations
            this.synthetic_weights = _weights[SceneGraphRelationType.SYNTHETIC];
        }
    }

    /**
     * Changes visibility state of objects based on their current state.
     * @param from List of visibility states to change from; changes any state to `to` if null.
     * @param to Visibility state to change to
     */
    public changeObjectsVisibility(
        from: SceneGraphObjectVisibility[] | null,
        to: SceneGraphObjectVisibility
    ) {
        Object.values(this.all_objects).forEach((obj) => {
            if (!from || from.includes(obj.visibility)) obj.visibility = to;
        });
    }

    /**
     * Changes visibility state of relations based on their current state.
     * @param from List of visibility states to change from; changes any state to `to` if null.
     * @param to Visibility state to change to
     */
    public changeRelationsVisibility(
        from: SceneGraphRelationVisibility[] | null,
        to: SceneGraphRelationVisibility
    ) {
        Object.values(this.all_relations).forEach((rel) => {
            if (!from || from.includes(rel.visibility)) rel.visibility = to;
        });
    }

    public setObjectsVisibility(
        ids: string[],
        visibility: SceneGraphObjectVisibility
    ) {
        ids.forEach((id) => {
            this.all_objects[id].visibility = visibility;
        });
    }

    public setRelationsVisibility(
        ids: string[],
        visibility: SceneGraphRelationVisibility
    ) {
        ids.forEach((id) => {
            this.all_relations[id].visibility = visibility;
        });
    }

    public createNewObject(): SceneGraphObject {
        const new_base_weight = 1 / Object.values(this.all_objects).length + 1;

        Object.values(this.all_objects).forEach((obj) => {
            obj.base_weight = new_base_weight;
        });

        const obj: SceneGraphObject = new SceneGraphObject(
            this.generateRandomUnusedObjectID(),
            0,
            0,
            0,
            0,
            'new object',
            [],
            {},
            {},
            new_base_weight,
            0,
            environment.colors.graph_node_fill_primary,
            environment.colors.graph_node_fill_secondary
        );

        this.all_objects[obj.id] = obj;

        this.recomputeFilters();

        return obj;
    }

    public addOrOverwriteObject(object: SceneGraphObject) {
        this.all_objects[object.id] = object;
        this.recomputeFilters();
    }

    public deleteObjectAndRelations(object_id: string) {
        const obj = this.all_objects[object_id];
        if (!obj) return;

        const relations_to_remove: string[] = [];

        Object.values(obj.outgoing_relations_dict).forEach((rel) => {
            relations_to_remove.push(rel.id);
        });

        Object.values(obj.incoming_relations_dict).forEach((rel) => {
            relations_to_remove.push(rel.id);
        });

        relations_to_remove.forEach((rel_id) => {
            // no need to fix any ranks in the following since all incoming and
            // outgoing relations between the given object and its peers are being removed
            this.deleteRelation(rel_id, false);
        });

        delete this.all_objects[object_id];

        this.recomputeFilters();
    }

    public static nextRelationRank(
        outgoing_relations: SceneGraphRelation[],
        to_obj_id: string
    ): number {
        return outgoing_relations.filter((rel) => rel.to_obj_id == to_obj_id)
            .length;
    }

    public createNewRelation(
        from_obj: SceneGraphObject,
        to_obj: SceneGraphObject,
        fix_ranks = true,
        type = SceneGraphRelationType.REGULAR
    ): SceneGraphRelation {
        const rel: SceneGraphRelation = {
            id: this.generateRandomUnusedRelationID(),
            name: 'related to',
            from_obj_id: from_obj.id,
            to_obj_id: to_obj.id,
            visibility: SceneGraphRelationVisibility.VISIBLE,
            weights: [],
            rank: SceneGraph.nextRelationRank(
                Object.values(from_obj.outgoing_relations_dict),
                to_obj.id
            ),
            type: type,
        };

        from_obj.outgoing_relations_dict[rel.id] = rel;
        to_obj.incoming_relations_dict[rel.id] = rel;
        this.all_relations[rel.id] = rel;

        if (fix_ranks) {
            this.fixRelationRanksForNodes(from_obj.id, to_obj.id);
        }

        this.recomputeFilters();

        return rel;
    }

    public editRelation(relation: SceneGraphRelation, fix_ranks = true) {
        const from_obj = this.all_objects[relation.from_obj_id];
        if (from_obj) from_obj.outgoing_relations_dict[relation.id] = relation;

        const to_obj = this.all_objects[relation.to_obj_id];
        if (to_obj) to_obj.incoming_relations_dict[relation.id] = relation;

        this.all_relations[relation.id] = relation;

        if (fix_ranks) {
            this.fixRelationRanksForNodes(
                relation.from_obj_id,
                relation.to_obj_id
            );
        }

        this.recomputeFilters();
    }

    public deleteRelation(relation_id: string, fix_ranks = true) {
        const relation = this.all_relations[relation_id];
        if (!relation) return;

        const from_obj = this.all_objects[relation.from_obj_id];
        if (from_obj) {
            delete from_obj.outgoing_relations_dict[relation_id];
        }

        const to_obj = this.all_objects[relation.to_obj_id];
        if (to_obj) {
            delete to_obj.incoming_relations_dict[relation_id];
        }

        delete this.all_relations[relation_id];

        if (fix_ranks) {
            this.fixRelationRanksForNodes(
                relation.from_obj_id,
                relation.to_obj_id
            );
        }

        this.recomputeFilters();
    }

    private fixRelationRanksForNodes(
        source_obj_id: string,
        target_obj_id: string
    ) {
        const from_obj = this.all_objects[source_obj_id];

        if (from_obj) {
            const relations_ranked = Object.values(
                from_obj.outgoing_relations_dict
            )
                .filter((rel) => rel.to_obj_id == target_obj_id)
                .sort((a, b) => a.rank - b.rank);

            for (let i = 0; i < relations_ranked.length; i++) {
                relations_ranked[i].rank = i;
            }
        }
    }

    public static from(
        scene_graph_id: string,
        scene_graph_wrapped: SceneGraphRawWrapped
    ): SceneGraph {
        const scene_graph = scene_graph_wrapped.data;
        const objects: { [id: string]: SceneGraphObject } = {};
        const all_relations: { [id: string]: SceneGraphRelation } = {};
        const initial_weight = 1 / Object.values(scene_graph.objects).length;

        Object.keys(scene_graph.objects).forEach((obj_id) => {
            const obj = scene_graph.objects[obj_id];
            const obj_outgoing_relations_dict: {
                [id: string]: SceneGraphRelation;
            } = {};
            const obj_incoming_relations_dict: {
                [id: string]: SceneGraphRelation;
            } = {};

            obj.relations.forEach((rel_raw) => {
                const rel = {
                    id: _Crypto.randomUUID(),
                    name: rel_raw.name,
                    from_obj_id: obj_id,
                    to_obj_id: rel_raw.object,
                    visibility: SceneGraphRelationVisibility.VISIBLE,
                    weights: [],
                    rank: SceneGraph.nextRelationRank(
                        Object.values(obj_outgoing_relations_dict),
                        rel_raw.object
                    ),
                    type: SceneGraphRelationType.REGULAR,
                };

                all_relations[rel.id] = rel;
                obj_outgoing_relations_dict[rel.id] = rel;
            });

            objects[obj_id] = new SceneGraphObject(
                obj_id,
                obj.x,
                obj.y,
                obj.w,
                obj.h,
                obj.name,
                obj.attributes,
                obj_outgoing_relations_dict,
                obj_incoming_relations_dict,
                initial_weight,
                0,
                environment.colors.graph_node_fill_primary,
                environment.colors.graph_node_fill_secondary
            );
        });

        Object.keys(all_relations).forEach((rel_key) => {
            const rel = all_relations[rel_key];
            objects[rel.to_obj_id].incoming_relations_dict[rel_key] = rel;
        });

        return new SceneGraph(
            scene_graph_id,
            scene_graph_wrapped.split,
            scene_graph.height,
            scene_graph.width,
            objects,
            all_relations,
            scene_graph.location,
            scene_graph.weather
        );
    }
}

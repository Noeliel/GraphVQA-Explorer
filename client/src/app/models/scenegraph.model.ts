import { SceneGraph, SceneGraphRelationType } from '../entities/scenegraph';

export class SceneGraphRawWrapped {
    split: string;
    data: SceneGraphRaw;

    constructor(split: string, data: SceneGraphRaw) {
        this.split = split;
        this.data = data;
    }

    public static from(scene_graph: SceneGraph): SceneGraphRawWrapped {
        return new SceneGraphRawWrapped(
            scene_graph.split,
            SceneGraphRaw.from(scene_graph)
        );
    }
}

export interface SceneGraphRelationRaw {
    name: string;
    object: string;
}

export interface SceneGraphObjectRaw {
    h: number;
    w: number;
    x: number;
    y: number;
    name: string;
    attributes: string[];
    relations: SceneGraphRelationRaw[];
}

export class SceneGraphRaw {
    height: number;
    width: number;
    objects: { [obj_id: string]: SceneGraphObjectRaw };
    location?: string;
    weather?: string;

    constructor(
        height: number,
        width: number,
        objects: { [obj_id: string]: SceneGraphObjectRaw },
        location: string | undefined = undefined,
        weather: string | undefined = undefined
    ) {
        this.height = height;
        this.width = width;
        this.objects = objects;
        this.location = location;
        this.weather = weather;
    }

    public static from(scene_graph: SceneGraph): SceneGraphRaw {
        const objects: { [obj_id: string]: SceneGraphObjectRaw } = {};

        Object.values(scene_graph.all_objects).forEach((obj) => {
            const relations: SceneGraphRelationRaw[] = [];

            const outgoing = Object.values(obj.outgoing_relations_dict)
                .filter((rel) => rel.type == SceneGraphRelationType.REGULAR)
                .sort((a, b) => a.rank - b.rank);

            outgoing.forEach((rel) => {
                relations.push({
                    name: rel.name,
                    object: rel.to_obj_id,
                });
            });

            objects[obj.id.toString()] = {
                h: obj.h,
                w: obj.w,
                x: obj.x,
                y: obj.y,
                name: obj.name,
                attributes: obj.attributes,
                relations: relations,
            };
        });

        return new SceneGraphRaw(
            scene_graph.height,
            scene_graph.width,
            objects,
            scene_graph.location,
            scene_graph.weather
        );
    }
}

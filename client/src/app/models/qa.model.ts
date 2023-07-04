import { SceneGraphRelationType } from '../entities/scenegraph';

export type GraphObjectWeights = {
    [obj_id: string]: number;
};

export type GraphRelationWeights = GraphRelationWeight[];
export type GraphRelationWeightsSteps = GraphRelationWeights[];

export interface GraphRelationWeight {
    from: string;
    to: string;
    weight: number[];
    type: SceneGraphRelationType;
}

export interface QAPrediction {
    predictions: string[];
    prediction_scores: number[];
    object_weights: GraphObjectWeights;
    relation_weights: GraphRelationWeightsSteps;
}

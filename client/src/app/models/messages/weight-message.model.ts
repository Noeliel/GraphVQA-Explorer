import { GraphObjectWeights, GraphRelationWeightsSteps } from '../qa.model';

export enum MessageSubjectWeight {
    UPDATE = 'MessageSubjectWeight.UPDATE',
    STATUS = 'MessageSubjectWeight.STATUS',
}

export interface WeightUpdateMessage {
    object_weights: GraphObjectWeights | null;
    relation_weights: GraphRelationWeightsSteps | null;
}

export interface WeightStatusMessage {
    description: string;
}

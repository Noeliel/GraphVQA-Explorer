import {
    DisplayModeEventHooks,
    DisplayModeInputParameters,
} from 'src/app/entities/displaymode/interfaces/displaymode';

export enum MessageSubjectDisplayMode {
    UPDATE = 'MessageSubjectDisplayMode.UPDATE', // to request switching to the given mode
    STATUS = 'MessageSubjectDisplayMode.STATUS', // to inform that the given mode has been set
}

export enum DisplayModeMessageMode {
    GROUND_TRUTH = 'GroundTruthDisplayMode', // default display mode
    PREDICTION = 'PredictionDisplayMode', // prediction display mode
    BOUNDINGBOXPREVIEW = 'BoundingBoxPreviewDisplayMode', // previews for object bounding boxes while adding/editing objects
    RELATIONPREVIEW = 'RelationPreviewDisplayMode',
}

export interface DisplayModeUpdateMessage {
    mode: DisplayModeMessageMode | string;
    parameters: DisplayModeInputParameters | undefined;
    eventHooks: DisplayModeEventHooks | undefined;
}

export interface DisplayModeStatusMessage {
    mode: DisplayModeMessageMode | string;
}

export enum MessageSubjectUIEvent {
    REDRAW = 'MessageSubjectUIEvent.REDRAW',
    POPOUT = 'MessageSubjectUIEvent.POPOUT',
}

export interface UIEventRedrawMessage {
    description: string;
}

export enum UIEventPopoutType {
    OBJECTS = 0,
    RELATIONS = 1,
    NONE = 2,
}

export interface UIEventPopoutMessage {
    type: UIEventPopoutType;
    ids: string[];
}

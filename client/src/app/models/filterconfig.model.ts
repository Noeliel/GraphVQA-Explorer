export enum FilterType {
    OBJECTS = 'Objects',
    ATTRIBUTES = 'Attributes',
    RELATIONS = 'Relations',
}

export interface FilterConfig {
    type: FilterType;
    filters: string[];
    invert: boolean;
    full_match: boolean;
    include_relation_objects_out: boolean;
    include_relation_objects_inc: boolean;
}

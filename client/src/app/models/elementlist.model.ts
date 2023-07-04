// ELEMENT LIST

export enum ElementListElementType {
    OBJECT = 0,
    RELATION = 1,
    OTHER = 2,
}

export interface ElementListElement {
    id: string;
    name: string;
    description: string;
    type: ElementListElementType;
}

export type ElementListSections = {
    [Key in ElementListElementType as number]: ElementListElement[];
};

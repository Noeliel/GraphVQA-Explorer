import { FilterConfig } from "../filterconfig.model";

export enum MessageSubjectFilter {
    UPDATE = 'MessageSubjectFilter.UPDATE',
    STATUS = 'MessageSubjectFilter.STATUS',
}

export interface FilterUpdateMessage {
    new_config: FilterConfig | null;
}

export interface FilterStatusMessage {
    description: string;
}

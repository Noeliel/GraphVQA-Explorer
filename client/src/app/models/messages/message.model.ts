import {
    VisibilityMessage,
    MessageSubjectVisibility,
} from './visibility-message.model';
import {
    FilterStatusMessage,
    FilterUpdateMessage,
    MessageSubjectFilter,
} from './filter-message.model';
import {
    MessageSubjectUIEvent,
    UIEventRedrawMessage,
    UIEventPopoutMessage,
} from './ui-event-message.model';
import {
    MessageSubjectWeight,
    WeightStatusMessage,
    WeightUpdateMessage,
} from './weight-message.model';
import {
    MessageSubjectDisplayMode,
    DisplayModeUpdateMessage,
    DisplayModeStatusMessage,
} from './display-mode-message.model';

export type MessageSubject =
    | MessageSubjectVisibility
    | MessageSubjectFilter
    | MessageSubjectUIEvent
    | MessageSubjectWeight
    | MessageSubjectDisplayMode;
export type Message =
    | VisibilityMessage
    | FilterUpdateMessage
    | FilterStatusMessage
    | UIEventRedrawMessage
    | UIEventPopoutMessage
    | WeightUpdateMessage
    | WeightStatusMessage
    | DisplayModeUpdateMessage
    | DisplayModeStatusMessage;

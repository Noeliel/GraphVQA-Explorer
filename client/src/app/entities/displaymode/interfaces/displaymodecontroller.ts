import { MouseDragEvent } from 'src/app/models/mousedragevent.model';
import { Point2D } from 'src/app/models/point2d.model';
import { DisplayMode } from './displaymode';

export abstract class DisplayModeController {
    display_mode?: DisplayMode;
    background_visible = true;

    protected specialMouseEventSubscriptions: {
        [subscription_key: string]: {
            callback: (event: MouseDragEvent, point: Point2D) => void;
        };
    } = {};

    abstract handleDisplayModePreferencesChanged(): void;

    public registerForSpecialMouseEvents(
        subscription_key: string,
        callback: (event: MouseDragEvent, point: Point2D) => void
    ) {
        this.specialMouseEventSubscriptions[subscription_key] = {
            callback: callback,
        };
    }

    public unregisterFromSpecialMouseEvents(subscription_key: string) {
        delete this.specialMouseEventSubscriptions[subscription_key];
    }

    public toggleBackground() {
        this.background_visible = !this.background_visible;
        this.display_mode?.redraw();
    }
}

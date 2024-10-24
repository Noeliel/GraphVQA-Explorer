import { MouseDragEvent } from 'src/app/models/mousedragevent.model';
import { Point2D } from 'src/app/models/point2d.model';
import { DisplayMode } from './displaymode';

export abstract class DisplayModeController {
    display_mode?: DisplayMode;
    background_visible = true;
    animation_bar_visible = false;
    graph_visible = true;
    brightness = 100;
    grayscale = 0;
    fattening = 1;
    relfat = 1;
    strokecol = 'yellow';
    nohideHighlight = false;

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

    public toggleHideHighlight() {
        this.nohideHighlight = !this.nohideHighlight;

        this.display_mode?.redraw();
    }

    public toggleGraph() {
        this.graph_visible = !this.graph_visible;

        this.display_mode?.redraw();
    }

    public toggleGray() {
        this.grayscale = 100 - this.grayscale;
        this.display_mode?.redraw();
    }

    public incBright() {
        this.brightness += 10;
        this.brightness = Math.min(150, this.brightness);
        this.display_mode?.redraw();
    }

    public decBright() {
        this.brightness -= 10;
        this.brightness = Math.max(50, this.brightness);
        this.display_mode?.redraw();
    }

    public incStroke() {
        this.fattening *= 1.15;
        this.fattening = Math.min(4.0455577, this.fattening);
        this.relfat *= 1.2;
        this.relfat = Math.min(6.191736, this.relfat);
        this.display_mode?.redraw();
    }

    public decStroke() {
        this.fattening /= 1.15;
        this.fattening = Math.max(1, this.fattening);
        this.relfat /= 1.2;
        this.relfat = Math.max(1, this.relfat);
        this.display_mode?.redraw();
    }

    public switchCol() {
        if (this.strokecol == 'red') this.strokecol = 'green';
        else if (this.strokecol == 'yellow') this.strokecol = 'red';
        else if (this.strokecol == 'orange') this.strokecol = 'yellow';
        else if (this.strokecol == 'fuchsia') this.strokecol = 'orange';
        else if (this.strokecol == 'cyan') this.strokecol = 'fuchsia';
        else if (this.strokecol == 'green') this.strokecol = 'cyan';

        this.display_mode?.redraw();
    }

    public resetOptions() {
      this.background_visible = true;
      this.graph_visible = true;
      this.brightness = 100;
      this.grayscale = 0;
      this.fattening = 1;
      this.relfat = 1;
      this.strokecol = 'yellow';

      this.display_mode?.redraw();
    }

    public toggleAnimBar() {
      this.animation_bar_visible = !this.animation_bar_visible;

      this.display_mode?.redraw();
    }
}

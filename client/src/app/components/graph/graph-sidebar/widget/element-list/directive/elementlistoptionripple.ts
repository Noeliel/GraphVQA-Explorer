import { Platform } from '@angular/cdk/platform';
import { Directive, ElementRef, NgZone } from '@angular/core';
import { MatRipple } from '@angular/material/core';

@Directive({
    selector: '[elementListRipple]',
})
export class ElementListRipple extends MatRipple {
    public elRef: ElementRef<HTMLElement>;

    constructor(
        _elementRef: ElementRef<HTMLElement>,
        ngZone: NgZone,
        platform: Platform
    ) {
        super(_elementRef, ngZone, platform, {}, undefined);
        this.elRef = _elementRef;
    }
}

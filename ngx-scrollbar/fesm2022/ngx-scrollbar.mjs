import * as i0 from '@angular/core';
import { inject, ElementRef, Directive, signal, Injectable, InjectionToken, NgZone, input, booleanAttribute, numberAttribute, computed, output, afterRenderEffect, untracked, effect, PLATFORM_ID, Component, ChangeDetectionStrategy, viewChild, Renderer2, ApplicationRef, linkedSignal, contentChild, createComponent, Injector, NgModule, makeEnvironmentProviders } from '@angular/core';
import { tap, throttleTime, combineLatest, fromEvent, map, merge, startWith, switchMap, takeUntil, delay, EMPTY, takeWhile, from, of, interval, animationFrameScheduler } from 'rxjs';
import { Platform } from '@angular/cdk/platform';
import { Directionality } from '@angular/cdk/bidi';
import { SharedResizeObserver } from '@angular/cdk/observers/private';
import { toSignal } from '@angular/core/rxjs-interop';
import { SmoothScrollManager } from 'ngx-scrollbar/smooth-scroll';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { ContentObserver } from '@angular/cdk/observers';

class ScrollViewport {
    constructor() {
        this.nativeElement = inject((ElementRef)).nativeElement;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.1.1", ngImport: i0, type: ScrollViewport, deps: [], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "19.1.1", type: ScrollViewport, isStandalone: true, selector: "[scrollViewport]", ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.1.1", ngImport: i0, type: ScrollViewport, decorators: [{
            type: Directive,
            args: [{
                    standalone: true,
                    selector: '[scrollViewport]'
                }]
        }] });

function preventSelection(doc) {
    return tap(() => doc.onselectstart = () => false);
}
function enableSelection(doc) {
    return tap(() => doc.onselectstart = null);
}
function stopPropagation() {
    return tap((e) => {
        // Have to prevent default to avoid unexpected movement whe you grab object beneath scrollbar #476
        // https://github.com/MurhafSousli/ngx-scrollbar/issues/476
        e.preventDefault();
        e.stopPropagation();
    });
}
function getThrottledStream(stream, duration) {
    return stream.pipe(throttleTime(duration || 0, null, {
        leading: false,
        trailing: true
    }));
}
var ViewportClasses;
(function (ViewportClasses) {
    ViewportClasses["Viewport"] = "ng-scroll-viewport";
    ViewportClasses["Content"] = "ng-scroll-content";
    ViewportClasses["Spacer"] = "ng-scroll-spacer";
})(ViewportClasses || (ViewportClasses = {}));

/**
 * Class representing a viewport adapter.
 * Provides methods and properties to interact with a viewport and its content.
 */
class ViewportAdapter {
    constructor() {
        /*
         * A signal that indicates when viewport adapter is initialized
         */
        this.initialized = signal(false);
    }
    /** Viewport clientHeight */
    get offsetHeight() {
        return this.nativeElement.offsetHeight;
    }
    /** Viewport clientWidth */
    get offsetWidth() {
        return this.nativeElement.offsetWidth;
    }
    /** Viewport scrollTop */
    get scrollTop() {
        return this.nativeElement.scrollTop;
    }
    /** Viewport scrollLeft */
    get scrollLeft() {
        return this.nativeElement.scrollLeft;
    }
    /** Content height */
    get contentHeight() {
        return this.contentWrapperElement.offsetHeight;
    }
    /** Content width */
    get contentWidth() {
        return this.contentWrapperElement.offsetWidth;
    }
    /** The remaining vertical scrollable distance. */
    get scrollMaxX() {
        return this.contentWidth - this.offsetWidth;
    }
    /** The vertical remaining scrollable distance */
    get scrollMaxY() {
        return this.contentHeight - this.offsetHeight;
    }
    /**
     * Initialize viewport
     */
    init(viewportElement, contentElement, spacerElement) {
        // Add viewport class
        viewportElement.classList.add(ViewportClasses.Viewport);
        this.nativeElement = viewportElement;
        // Add content wrapper class
        contentElement.classList.add(ViewportClasses.Content);
        // When integrating the scrollbar with virtual scroll, the content wrapper will have fake size,
        // and a spacer element will have the real size
        // Therefore, if spaceElement is provided, it will be observed instead of the content wrapper
        if (spacerElement) {
            spacerElement.classList.add(ViewportClasses.Spacer);
            this.contentWrapperElement = spacerElement;
        }
        else {
            // If spacer is not provided, set it as the content wrapper
            this.contentWrapperElement = contentElement;
        }
        this.initialized.set(true);
    }
    reset() {
        this.nativeElement = null;
        this.contentWrapperElement = null;
        this.initialized.set(false);
    }
    /**
     * Scrolls the viewport vertically to the specified value.
     */
    scrollYTo(value) {
        this.nativeElement.scrollTop = value;
    }
    /**
     * Scrolls the viewport horizontally to the specified value.
     */
    scrollXTo(value) {
        this.nativeElement.scrollLeft = value;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.1.1", ngImport: i0, type: ViewportAdapter, deps: [], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.1.1", ngImport: i0, type: ViewportAdapter }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.1.1", ngImport: i0, type: ViewportAdapter, decorators: [{
            type: Injectable
        }] });

/**
 * Injection token that can be used to query for a `NgScrollbar`.
 * Used primarily to avoid circular imports.
 */
const NG_SCROLLBAR = new InjectionToken('NG_SCROLLBAR');

const defaultOptions = {
    trackClass: '',
    thumbClass: '',
    buttonClass: '',
    orientation: 'auto',
    appearance: 'native',
    visibility: 'native',
    position: 'native',
    trackScrollDuration: 50,
    sensorThrottleTime: 0,
    disableSensor: false,
    disableInteraction: false,
    buttons: false,
    hoverOffset: false
};
// This CDN link for a modified version of the polyfill to fix firefox bug https://github.com/MurhafSousli/ngx-scrollbar/issues/615
const defaultScrollTimelinePolyfill = 'https://cdn.statically.io/gist/MurhafSousli/c852b6a672069396953f06ddd4b64620/raw/ef55db72e2abb7bc002ed79f4ad4cf408bfdb72f/scroll-timeline-lite.js';

var ScrollbarUpdateReason;
(function (ScrollbarUpdateReason) {
    ScrollbarUpdateReason["AfterInit"] = "AfterInit";
    ScrollbarUpdateReason["Resized"] = "ResizeObserver";
})(ScrollbarUpdateReason || (ScrollbarUpdateReason = {}));
const NG_SCROLLBAR_OPTIONS = new InjectionToken('NG_SCROLLBAR_OPTIONS', {
    providedIn: 'root',
    factory: () => defaultOptions
});
const NG_SCROLLBAR_POLYFILL = new InjectionToken('NG_SCROLLBAR_POLYFILL', {
    providedIn: 'root',
    factory: () => defaultScrollTimelinePolyfill
});
function filterResizeEntries(entries, target) {
    return entries.filter((entry) => entry.target === target)[0]?.contentRect;
}

class NgScrollbarCore {
    constructor() {
        /** Global options */
        this.options = inject(NG_SCROLLBAR_OPTIONS);
        this.sharedResizeObserver = inject(SharedResizeObserver);
        this.zone = inject(NgZone);
        this.platform = inject(Platform);
        /** A flag that indicates if the platform is mobile */
        this.isMobile = this.platform.IOS || this.platform.ANDROID;
        this.dir = inject(Directionality);
        this.smoothScroll = inject(SmoothScrollManager);
        /** Viewport adapter instance */
        this.viewport = inject(ViewportAdapter, { self: true });
        this.nativeElement = inject((ElementRef)).nativeElement;
        /**
         * Indicates if the direction is 'ltr' or 'rtl'
         */
        this.direction = toSignal(this.dir.change, { initialValue: this.dir.value });
        /**
         * Indicates when scrollbar thumb is being dragged
         */
        this.dragging = signal('none');
        /**
         * Sets the supported scroll track of the viewport, there are 3 options:
         *
         * - `vertical` Use both vertical and horizontal scrollbar
         * - `horizontal` Use both vertical and horizontal scrollbar
         * - `auto` Use both vertical and horizontal scrollbar
         */
        this.orientation = input(this.options.orientation);
        /**
         * When to show the scrollbar, and there are 3 options:
         *
         * - `native` (default) Scrollbar will be visible when viewport is scrollable like with native scrollbar
         * - `hover` Scrollbars are hidden by default, only visible on scrolling or hovering
         * - `always` Scrollbars are always shown even if the viewport is not scrollable
         */
        this.visibility = input(this.options.visibility);
        /** Show scrollbar buttons */
        this.buttons = input(this.options.buttons, {
            transform: booleanAttribute
        });
        /** Disables scrollbar interaction like dragging thumb and jumping by track click */
        this.disableInteraction = input(this.options.disableInteraction, {
            transform: booleanAttribute
        });
        /** Whether ResizeObserver is disabled */
        this.disableSensor = input(this.options.disableSensor, {
            transform: booleanAttribute
        });
        /** Throttle interval for detecting changes via ResizeObserver */
        this.sensorThrottleTime = input(this.options.sensorThrottleTime, {
            transform: numberAttribute
        });
        /** A flag used to activate hover effect on the offset area around the scrollbar */
        this.hoverOffset = input(this.options.hoverOffset, {
            transform: booleanAttribute
        });
        /** Viewport dimension */
        this.viewportDimension = signal({ width: 0, height: 0 });
        /** Content dimension */
        this.contentDimension = signal({ width: 0, height: 0 });
        this.state = computed(() => {
            let verticalUsed = false;
            let horizontalUsed = false;
            let isVerticallyScrollable = false;
            let isHorizontallyScrollable = false;
            const orientation = this.orientation();
            const visibility = this.visibility();
            const viewportDimensions = this.viewportDimension();
            const contentDimensions = this.contentDimension();
            // Check if vertical scrollbar should be displayed
            if (orientation === 'auto' || orientation === 'vertical') {
                isVerticallyScrollable = contentDimensions.height > viewportDimensions.height;
                verticalUsed = visibility === 'visible' || isVerticallyScrollable;
            }
            // Check if horizontal scrollbar should be displayed
            if (orientation === 'auto' || orientation === 'horizontal') {
                isHorizontallyScrollable = contentDimensions.width > viewportDimensions.width;
                horizontalUsed = visibility === 'visible' || isHorizontallyScrollable;
            }
            return {
                verticalUsed,
                horizontalUsed,
                isVerticallyScrollable,
                isHorizontallyScrollable,
            };
        });
        this.isVerticallyScrollable = computed(() => this.state().isVerticallyScrollable);
        this.isHorizontallyScrollable = computed(() => this.state().isHorizontallyScrollable);
        this.verticalUsed = computed(() => this.state().verticalUsed);
        this.horizontalUsed = computed(() => this.state().horizontalUsed);
        /** Scroll duration when the scroll track is clicked */
        this.trackScrollDuration = input(this.options.trackScrollDuration, {
            transform: numberAttribute
        });
        /**
         *  Sets the appearance of the scrollbar, there are 2 options:
         *
         * - `native` (default) scrollbar space will be reserved just like with native scrollbar.
         * - `compact` scrollbar doesn't reserve any space, they are placed over the viewport.
         */
        this.appearance = input(this.options.appearance);
        /**
         * Sets the position of each scrollbar, there are 4 options:
         *
         * - `native` (Default) Use the default position like in native scrollbar.
         * - `invertY` Inverts vertical scrollbar position
         * - `invertX` Inverts Horizontal scrollbar position
         * - `invertAll` Inverts both scrollbar positions
         */
        this.position = input(this.options.position);
        /** A class forwarded to the scrollbar track element */
        this.trackClass = input(this.options.trackClass);
        /** A class forwarded to the scrollbar thumb element */
        this.thumbClass = input(this.options.thumbClass);
        /** A class forwarded to the scrollbar button element */
        this.buttonClass = input(this.options.thumbClass);
        /** Steam that emits when scrollbar is initialized */
        this.afterInit = output();
        /** Steam that emits when scrollbar is updated */
        this.afterUpdate = output();
        let resizeSub$;
        let hasInitialized;
        afterRenderEffect({
            earlyRead: (onCleanup) => {
                const disableSensor = this.disableSensor();
                const throttleDuration = this.sensorThrottleTime();
                const viewportInit = this.viewport.initialized();
                untracked(() => {
                    if (viewportInit) {
                        // If resize sensor is disabled, update manually the first time
                        if (disableSensor) {
                            requestAnimationFrame(() => this.update(ScrollbarUpdateReason.AfterInit));
                        }
                        else {
                            // Observe size changes for viewport and content wrapper
                            this.zone.runOutsideAngular(() => {
                                resizeSub$ = getThrottledStream(combineLatest([
                                    this.sharedResizeObserver.observe(this.viewport.nativeElement),
                                    this.sharedResizeObserver.observe(this.viewport.contentWrapperElement)
                                ]), throttleDuration).subscribe(() => {
                                    // After deep investigation, it appears that setting the dimension directly from the element properties
                                    // is much faster than to set them from resize callback values
                                    this.zone.run(() => {
                                        this.updateDimensions();
                                        if (hasInitialized) {
                                            this.afterUpdate.emit();
                                        }
                                        else {
                                            this.afterInit.emit();
                                        }
                                        hasInitialized = true;
                                    });
                                });
                            });
                        }
                    }
                    onCleanup(() => resizeSub$?.unsubscribe());
                });
            }
        });
    }
    /**
     * Manual update
     */
    update(reason) {
        this.updateDimensions();
        if (reason === ScrollbarUpdateReason.AfterInit) {
            this.afterInit.emit();
        }
        else {
            this.afterUpdate.emit();
        }
    }
    /**
     * Smooth scroll functions
     */
    scrollTo(options) {
        return this.smoothScroll.scrollTo(this.viewport.nativeElement, options);
    }
    /**
     * Scroll to element by reference or selector
     */
    scrollToElement(target, options) {
        return this.smoothScroll.scrollToElement(this.viewport.nativeElement, target, options);
    }
    updateDimensions() {
        this.viewportDimension.set({ width: this.viewport.offsetWidth, height: this.viewport.offsetHeight });
        this.contentDimension.set({ width: this.viewport.contentWidth, height: this.viewport.contentHeight });
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.1.1", ngImport: i0, type: NgScrollbarCore, deps: [], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "17.1.0", version: "19.1.1", type: NgScrollbarCore, isStandalone: true, inputs: { orientation: { classPropertyName: "orientation", publicName: "orientation", isSignal: true, isRequired: false, transformFunction: null }, visibility: { classPropertyName: "visibility", publicName: "visibility", isSignal: true, isRequired: false, transformFunction: null }, buttons: { classPropertyName: "buttons", publicName: "buttons", isSignal: true, isRequired: false, transformFunction: null }, disableInteraction: { classPropertyName: "disableInteraction", publicName: "disableInteraction", isSignal: true, isRequired: false, transformFunction: null }, disableSensor: { classPropertyName: "disableSensor", publicName: "disableSensor", isSignal: true, isRequired: false, transformFunction: null }, sensorThrottleTime: { classPropertyName: "sensorThrottleTime", publicName: "sensorThrottleTime", isSignal: true, isRequired: false, transformFunction: null }, hoverOffset: { classPropertyName: "hoverOffset", publicName: "hoverOffset", isSignal: true, isRequired: false, transformFunction: null }, trackScrollDuration: { classPropertyName: "trackScrollDuration", publicName: "trackScrollDuration", isSignal: true, isRequired: false, transformFunction: null }, appearance: { classPropertyName: "appearance", publicName: "appearance", isSignal: true, isRequired: false, transformFunction: null }, position: { classPropertyName: "position", publicName: "position", isSignal: true, isRequired: false, transformFunction: null }, trackClass: { classPropertyName: "trackClass", publicName: "trackClass", isSignal: true, isRequired: false, transformFunction: null }, thumbClass: { classPropertyName: "thumbClass", publicName: "thumbClass", isSignal: true, isRequired: false, transformFunction: null }, buttonClass: { classPropertyName: "buttonClass", publicName: "buttonClass", isSignal: true, isRequired: false, transformFunction: null } }, outputs: { afterInit: "afterInit", afterUpdate: "afterUpdate" }, host: { properties: { "class.ng-scrollbar": "true", "attr.verticalUsed": "verticalUsed()", "attr.horizontalUsed": "horizontalUsed()", "attr.isVerticallyScrollable": "isVerticallyScrollable()", "attr.isHorizontallyScrollable": "isHorizontallyScrollable()", "attr.mobile": "isMobile", "attr.dir": "direction()", "attr.position": "position()", "attr.dragging": "dragging()", "attr.appearance": "appearance()", "attr.visibility": "visibility()", "attr.orientation": "orientation()", "attr.disableInteraction": "disableInteraction()", "style.--content-height": "contentDimension().height", "style.--content-width": "contentDimension().width", "style.--viewport-height": "viewportDimension().height", "style.--viewport-width": "viewportDimension().width" } }, providers: [
            { provide: NG_SCROLLBAR, useExisting: NgScrollbarCore }
        ], ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.1.1", ngImport: i0, type: NgScrollbarCore, decorators: [{
            type: Directive,
            args: [{
                    host: {
                        '[class.ng-scrollbar]': 'true',
                        '[attr.verticalUsed]': 'verticalUsed()',
                        '[attr.horizontalUsed]': 'horizontalUsed()',
                        '[attr.isVerticallyScrollable]': 'isVerticallyScrollable()',
                        '[attr.isHorizontallyScrollable]': 'isHorizontallyScrollable()',
                        '[attr.mobile]': 'isMobile',
                        '[attr.dir]': 'direction()',
                        '[attr.position]': 'position()',
                        '[attr.dragging]': 'dragging()',
                        '[attr.appearance]': 'appearance()',
                        '[attr.visibility]': 'visibility()',
                        '[attr.orientation]': 'orientation()',
                        '[attr.disableInteraction]': 'disableInteraction()',
                        '[style.--content-height]': 'contentDimension().height',
                        '[style.--content-width]': 'contentDimension().width',
                        '[style.--viewport-height]': 'viewportDimension().height',
                        '[style.--viewport-width]': 'viewportDimension().width'
                    },
                    providers: [
                        { provide: NG_SCROLLBAR, useExisting: NgScrollbarCore }
                    ]
                }]
        }], ctorParameters: () => [] });

const SCROLLBAR_CONTROL = new InjectionToken('SCROLLBAR_CONTROL');
class ScrollbarAdapter {
    constructor() {
        this.trackSize = signal(0);
        // Host component reference
        this.cmp = inject(NG_SCROLLBAR);
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.1.1", ngImport: i0, type: ScrollbarAdapter, deps: [], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "19.1.1", type: ScrollbarAdapter, isStandalone: true, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.1.1", ngImport: i0, type: ScrollbarAdapter, decorators: [{
            type: Directive
        }] });

class PointerEventsAdapter {
    constructor() {
        // Reference to the NgScrollbar component
        this.cmp = inject(NG_SCROLLBAR);
        // Reference to the Scrollbar control component
        this.control = inject(SCROLLBAR_CONTROL);
        // Reference to the Document element
        this.document = inject(DOCUMENT);
        // Reference to angular zone
        this.zone = inject(NgZone);
        // The native element of the directive
        this.nativeElement = inject((ElementRef)).nativeElement;
        effect((onCleanup) => {
            const disableInteraction = this.cmp.disableInteraction();
            untracked(() => {
                if (!disableInteraction) {
                    this.zone.runOutsideAngular(() => {
                        this._pointerEventsSub = this.pointerEvents.subscribe();
                    });
                }
                onCleanup(() => this._pointerEventsSub?.unsubscribe());
            });
        });
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.1.1", ngImport: i0, type: PointerEventsAdapter, deps: [], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "19.1.1", type: PointerEventsAdapter, isStandalone: true, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.1.1", ngImport: i0, type: PointerEventsAdapter, decorators: [{
            type: Directive
        }], ctorParameters: () => [] });

class TrackAdapter extends PointerEventsAdapter {
    // Returns viewport client size
    get viewportSize() {
        return this.cmp.viewport[this.control.sizeProperty];
    }
    // Get track client rect
    get clientRect() {
        return this.nativeElement.getBoundingClientRect();
    }
    // Scrollbar track offset
    get offset() {
        return this.clientRect[this.control.rectOffsetProperty];
    }
    // Scrollbar track length
    get size() {
        // Noticed that clientHeight is evaluated before getClientRect.height,
        // causing a wrong track size when integrated in dropdown integration
        return this.nativeElement[this.control.sizeProperty];
    }
    // Observable for track dragging events
    get pointerEvents() {
        // Observable streams for pointer events
        const pointerDown$ = fromEvent(this.nativeElement, 'pointerdown').pipe(stopPropagation(), preventSelection(this.document));
        const pointerUp$ = fromEvent(this.document, 'pointerup', { passive: true }).pipe(enableSelection(this.document));
        const pointerEnter$ = fromEvent(this.nativeElement, 'pointerover', { passive: true }).pipe(
        // When mouse is out and enters again, must set the current position first
        tap((e) => this.currMousePosition = e[this.control.offsetProperty]), map(() => true));
        const pointerLeave$ = fromEvent(this.nativeElement, 'pointerout', { passive: true }).pipe(map(() => false));
        const pointerOver$ = merge(pointerEnter$, pointerLeave$).pipe(startWith(true));
        // Keep track of current mouse location while dragging
        const pointerMove$ = fromEvent(this.nativeElement, 'pointermove', { passive: true }).pipe(tap((e) => this.currMousePosition = e[this.control.offsetProperty]));
        return pointerDown$.pipe(switchMap((startEvent) => {
            // Track pointer location while dragging
            pointerMove$.pipe(takeUntil(pointerUp$)).subscribe();
            return this.onTrackFirstClick(startEvent).pipe(delay(200), switchMap(() => {
                // Otherwise, activate pointermove and pointerout events and switch to ongoing scroll calls
                return pointerOver$.pipe(switchMap((over) => {
                    const currDirection = this.getScrollDirection(this.currMousePosition);
                    const sameDirection = this.scrollDirection === currDirection;
                    // If mouse is out the track pause the scroll calls, otherwise keep going
                    return (over && sameDirection) ? this.onTrackOngoingMousedown() : EMPTY;
                }));
            }), takeUntil(pointerUp$));
        }));
    }
    constructor() {
        afterRenderEffect({
            earlyRead: () => {
                this.cmp.viewportDimension();
                this.cmp.contentDimension();
                untracked(() => {
                    this.control.trackSize.set(this.size);
                    if (!this.size) {
                        // In some rare cases size could be 0 due to first render, use animation frame to give the track element time to render
                        requestAnimationFrame(() => this.control.trackSize.set(this.size));
                    }
                });
            }
        });
        super();
    }
    /**
     *  Callback when mouse is first clicked on the track
     */
    onTrackFirstClick(e) {
        // Initialize variables and determine scroll direction
        this.currMousePosition = e[this.control.offsetProperty];
        this.scrollDirection = this.getScrollDirection(this.currMousePosition);
        this.scrollMax = this.control.viewportScrollMax;
        return this.scrollTo(this.nextStep());
    }
    nextStep() {
        // Check which direction should the scroll go (forward or backward)
        if (this.scrollDirection === 'forward') {
            // Scroll forward
            const scrollForwardIncrement = this.getScrollForwardStep();
            // Check if the incremental position is bigger than the scroll max
            if (scrollForwardIncrement >= this.scrollMax) {
                return this.scrollMax;
            }
            return scrollForwardIncrement;
        }
        // Scroll backward
        const scrollBackwardIncrement = this.getScrollBackwardStep();
        if (scrollBackwardIncrement <= 0) {
            return 0;
        }
        return scrollBackwardIncrement;
    }
    /**
     * Callback when mouse is still down on the track
     * Incrementally scrolls towards target position until reached
     */
    onTrackOngoingMousedown() {
        const position = this.nextStep();
        return this.scrollTo(position).pipe(takeWhile(() => !this.isReached(position)), switchMap(() => this.onTrackOngoingMousedown()));
    }
    /**
     * Returns a flag that determines whether the scroll from the given position is the final step or not
     */
    isReached(position) {
        if (this.scrollDirection === 'forward') {
            return position >= this.scrollMax;
        }
        return position <= 0;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.1.1", ngImport: i0, type: TrackAdapter, deps: [], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "19.1.1", type: TrackAdapter, isStandalone: true, usesInheritance: true, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.1.1", ngImport: i0, type: TrackAdapter, decorators: [{
            type: Directive
        }], ctorParameters: () => [] });

class TrackXDirective extends TrackAdapter {
    get contentSize() {
        return this.cmp.viewport.contentWidth;
    }
    constructor() {
        effect(() => {
            if (this.cmp.direction() === 'rtl') {
                this.getCurrPosition = () => {
                    const offset = this.contentSize - this.viewportSize - this.control.viewportScrollOffset;
                    return offset * this.size / this.contentSize;
                };
                this.getScrollDirection = (position) => {
                    return position < this.getCurrPosition() ? 'forward' : 'backward';
                };
            }
            else {
                this.getCurrPosition = () => {
                    return this.control.viewportScrollOffset * this.size / this.contentSize;
                };
                this.getScrollDirection = (position) => {
                    return position > this.getCurrPosition() ? 'forward' : 'backward';
                };
            }
        });
        super();
    }
    scrollTo(start) {
        return from(this.cmp.scrollTo({ start, duration: this.cmp.trackScrollDuration() }));
    }
    getScrollForwardStep() {
        return this.control.viewportScrollOffset + this.viewportSize;
    }
    getScrollBackwardStep() {
        return this.control.viewportScrollOffset - this.viewportSize;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.1.1", ngImport: i0, type: TrackXDirective, deps: [], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "19.1.1", type: TrackXDirective, isStandalone: true, selector: "[scrollbarTrackX]", providers: [{ provide: TrackAdapter, useExisting: TrackXDirective }], usesInheritance: true, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.1.1", ngImport: i0, type: TrackXDirective, decorators: [{
            type: Directive,
            args: [{
                    standalone: true,
                    selector: '[scrollbarTrackX]',
                    providers: [{ provide: TrackAdapter, useExisting: TrackXDirective }]
                }]
        }], ctorParameters: () => [] });
class TrackYDirective extends TrackAdapter {
    get contentSize() {
        return this.cmp.viewport.contentHeight;
    }
    getCurrPosition() {
        return this.control.viewportScrollOffset * this.size / this.contentSize;
    }
    getScrollDirection(position) {
        return position > this.getCurrPosition() ? 'forward' : 'backward';
    }
    scrollTo(top) {
        return from(this.cmp.scrollTo({ top, duration: this.cmp.trackScrollDuration() }));
    }
    getScrollForwardStep() {
        return this.control.viewportScrollOffset + this.viewportSize;
    }
    getScrollBackwardStep() {
        return this.control.viewportScrollOffset - this.viewportSize;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.1.1", ngImport: i0, type: TrackYDirective, deps: null, target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "19.1.1", type: TrackYDirective, isStandalone: true, selector: "[scrollbarTrackY]", providers: [{ provide: TrackAdapter, useExisting: TrackYDirective }], usesInheritance: true, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.1.1", ngImport: i0, type: TrackYDirective, decorators: [{
            type: Directive,
            args: [{
                    standalone: true,
                    selector: '[scrollbarTrackY]',
                    providers: [{ provide: TrackAdapter, useExisting: TrackYDirective }]
                }]
        }] });

class ScrollbarManager {
    constructor() {
        this.isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
        this._polyfillUrl = inject(NG_SCROLLBAR_POLYFILL);
        this.document = inject(DOCUMENT);
        this.window = this.document.defaultView;
        this.scrollTimelinePolyfill = signal(null);
        if (this.isBrowser && (!this.window['ScrollTimeline'] || !CSS.supports('animation-timeline', 'scroll()'))) {
            this.initPolyfill();
        }
    }
    async initPolyfill() {
        try {
            // Create a script element
            const script = this.document.createElement('script');
            script.src = this._polyfillUrl;
            // Wait for the script to load
            await new Promise((resolve, reject) => {
                script.onload = resolve;
                script.onerror = reject;
                this.document.head.appendChild(script);
            });
            // Once loaded, access and execute the function attached to the window object
            if (this.window['ScrollTimeline']) {
                this.scrollTimelinePolyfill.set(this.window['ScrollTimeline']);
            }
            else {
                console.error('[NgScrollbar]: ScrollTimeline is not attached to the window object.');
            }
        }
        catch (error) {
            console.error('[NgScrollbar]: Error loading ScrollTimeline script:', error);
        }
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.1.1", ngImport: i0, type: ScrollbarManager, deps: [], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.1.1", ngImport: i0, type: ScrollbarManager, providedIn: 'root' }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.1.1", ngImport: i0, type: ScrollbarManager, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: () => [] });

class ThumbAdapter extends PointerEventsAdapter {
    // Returns thumb size
    get size() {
        return this.nativeElement.getBoundingClientRect()[this.control.rectSizeProperty];
    }
    // The maximum space available for scrolling.
    get trackMax() {
        return this.track.size - this.size;
    }
    /**
     * Stream that emits the 'scrollTo' position when a scrollbar thumb element is dragged
     * This function is called by thumb drag event using viewport or scrollbar pointer events
     */
    get pointerEvents() {
        return fromEvent(this.nativeElement, 'pointerdown').pipe(stopPropagation(), preventSelection(this.document), switchMap((e) => {
            let startTrackMax;
            let startScrollMax;
            const dragStart = of(e).pipe(tap(() => {
                // Capture scrollMax and trackMax once
                startTrackMax = this.trackMax;
                startScrollMax = this.control.viewportScrollMax;
                this.setDragging(this.control.axis);
            }));
            const dragging = fromEvent(this.document, 'pointermove').pipe(stopPropagation());
            const dragEnd = fromEvent(this.document, 'pointerup', { capture: true }).pipe(stopPropagation(), enableSelection(this.document), tap(() => this.setDragging('none')));
            return dragStart.pipe(map((startEvent) => startEvent[this.control.offsetProperty]), switchMap((startOffset) => dragging.pipe(map((moveEvent) => moveEvent[this.control.clientProperty]), 
            // Calculate how far the pointer is from the top/left of the scrollbar (minus the dragOffset).
            map((moveClient) => moveClient - this.track.offset), map((trackRelativeOffset) => startScrollMax * (trackRelativeOffset - startOffset) / startTrackMax), tap((scrollPosition) => this.control.instantScrollTo(scrollPosition, startScrollMax)), takeUntil(dragEnd))));
        }));
    }
    constructor() {
        afterRenderEffect({
            earlyRead: () => {
                const script = this.manager.scrollTimelinePolyfill();
                untracked(() => {
                    if (script && !this._animation) {
                        this._animation = startPolyfill(script, this.nativeElement, this.cmp.viewport.nativeElement, this.control.axis);
                    }
                });
            }
        });
        super();
        this.manager = inject(ScrollbarManager);
        this.track = inject(TrackAdapter);
    }
    setDragging(value) {
        this.zone.run(() => this.cmp.dragging.set(value));
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.1.1", ngImport: i0, type: ThumbAdapter, deps: [], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "19.1.1", type: ThumbAdapter, isStandalone: true, usesInheritance: true, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.1.1", ngImport: i0, type: ThumbAdapter, decorators: [{
            type: Directive
        }], ctorParameters: () => [] });
function startPolyfill(ScrollTimeline, element, source, axis) {
    return element.animate({
        translate: [
            'var(--_scrollbar-thumb-transform-from)',
            'var(--_scrollbar-thumb-transform-to)'
        ]
    }, {
        fill: 'both',
        easing: 'linear',
        timeline: new ScrollTimeline({ source, axis })
    });
}

class ThumbXDirective extends ThumbAdapter {
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.1.1", ngImport: i0, type: ThumbXDirective, deps: null, target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "19.1.1", type: ThumbXDirective, isStandalone: true, selector: "[scrollbarThumbX]", providers: [{ provide: ThumbAdapter, useExisting: ThumbXDirective }], usesInheritance: true, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.1.1", ngImport: i0, type: ThumbXDirective, decorators: [{
            type: Directive,
            args: [{
                    standalone: true,
                    selector: '[scrollbarThumbX]',
                    providers: [{ provide: ThumbAdapter, useExisting: ThumbXDirective }]
                }]
        }] });
class ThumbYDirective extends ThumbAdapter {
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.1.1", ngImport: i0, type: ThumbYDirective, deps: null, target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "19.1.1", type: ThumbYDirective, isStandalone: true, selector: "[scrollbarThumbY]", providers: [{ provide: ThumbAdapter, useExisting: ThumbYDirective }], usesInheritance: true, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.1.1", ngImport: i0, type: ThumbYDirective, decorators: [{
            type: Directive,
            args: [{
                    standalone: true,
                    selector: '[scrollbarThumbY]',
                    providers: [{ provide: ThumbAdapter, useExisting: ThumbYDirective }]
                }]
        }] });

// canScroll function can work for y-axis and x-axis for both LTR and RTL directions
const canScrollFunc = {
    forward: (scrollOffset, scrollMax) => scrollOffset < scrollMax,
    backward: (scrollOffset) => scrollOffset > 0
};
const scrollStepFunc = {
    forward: (scrollBy, offset) => offset + scrollBy,
    backward: (scrollBy, offset) => offset - scrollBy
};
const horizontalScrollStepFunc = {
    rtl: {
        forward: (scrollBy, offset, scrollMax) => scrollMax - offset - scrollBy,
        backward: (scrollBy, offset, scrollMax) => scrollMax - offset + scrollBy
    },
    ltr: scrollStepFunc
};
class ScrollbarButton extends PointerEventsAdapter {
    get pointerEvents() {
        const pointerDown$ = fromEvent(this.nativeElement, 'pointerdown').pipe(stopPropagation(), preventSelection(this.document));
        const pointerUp$ = fromEvent(this.document, 'pointerup', { passive: true }).pipe(enableSelection(this.document));
        const pointerLeave$ = fromEvent(this.nativeElement, 'pointerleave', { passive: true });
        // Combine pointerup and pointerleave events into one stream
        const pointerUpOrLeave$ = merge(pointerUp$, pointerLeave$);
        return pointerDown$.pipe(switchMap(() => this.firstScrollStep().pipe(delay(this.afterFirstClickDelay), switchMap(() => this.onOngoingPointerdown()), takeUntil(pointerUpOrLeave$))));
    }
    constructor() {
        effect(() => {
            const scrollDirection = this.scrollDirection();
            const dir = this.cmp.direction();
            untracked(() => {
                // Get the canScroll function according to scroll direction (forward/backward)
                this.canScroll = canScrollFunc[scrollDirection];
                if (this.control.axis === 'x') {
                    // Get the nextStep function according to scroll direction (forward/backward) and layout direction (LTR/RTL)
                    this.nextStep = horizontalScrollStepFunc[dir][scrollDirection];
                }
                else {
                    // Get the nextStep function according to scroll direction (forward/backward)
                    this.nextStep = scrollStepFunc[scrollDirection];
                }
            });
        });
        super();
        this.scrollbarButton = input.required();
        this.scrollDirection = input.required();
        this.afterFirstClickDelay = 120;
        this.firstClickDuration = 100;
        this.scrollBy = 50;
        this.onGoingScrollBy = 12;
    }
    firstScrollStep() {
        const value = this.nextStep(this.scrollBy, this.control.viewportScrollOffset, this.control.viewportScrollMax);
        return this.control.scrollTo(value, this.firstClickDuration);
    }
    onGoingScrollStep() {
        const scrollMax = this.control.viewportScrollMax;
        const value = this.nextStep(this.onGoingScrollBy, this.control.viewportScrollOffset, scrollMax);
        this.control.instantScrollTo(value, scrollMax);
    }
    onOngoingPointerdown() {
        return interval(0, animationFrameScheduler).pipe(takeWhile(() => this.canScroll(this.control.viewportScrollOffset, this.control.viewportScrollMax)), tap(() => this.onGoingScrollStep()));
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.1.1", ngImport: i0, type: ScrollbarButton, deps: [], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.1.0", version: "19.1.1", type: ScrollbarButton, isStandalone: true, selector: "button[scrollbarButton]", inputs: { scrollbarButton: { classPropertyName: "scrollbarButton", publicName: "scrollbarButton", isSignal: true, isRequired: true, transformFunction: null }, scrollDirection: { classPropertyName: "scrollDirection", publicName: "scrollDirection", isSignal: true, isRequired: true, transformFunction: null } }, usesInheritance: true, ngImport: i0, template: "<div class=\"ng-scrollbar-button-icon\">\r\n  <svg viewBox=\"0 0 512 512\"\r\n       xmlns=\"http://www.w3.org/2000/svg\">\r\n    <path\r\n      d=\"M413.1,327.3l-1.8-2.1l-136-156.5c-4.6-5.3-11.5-8.6-19.2-8.6c-7.7,0-14.6,3.4-19.2,8.6L101,324.9l-2.3,2.6  C97,330,96,333,96,336.2c0,8.7,7.4,15.8,16.6,15.8v0h286.8v0c9.2,0,16.6-7.1,16.6-15.8C416,332.9,414.9,329.8,413.1,327.3z\"/>\r\n  </svg>\r\n</div>\r\n", styles: [":host{position:relative;border:none;margin:0;padding:0;border-radius:0;appearance:none;background-color:var(--INTERNAL-scrollbar-button-color)}:host svg{width:100%;height:100%;fill:var(--INTERNAL-scrollbar-button-fill)}:host:hover{background:var(--INTERNAL-scrollbar-button-hover-color)}:host:hover svg{fill:var(--INTERNAL-scrollbar-button-hover-fill)}:host:active{background:var(--INTERNAL-scrollbar-button-active-color)}:host:active svg{fill:var(--INTERNAL-scrollbar-button-active-fill)}:host[scrollbarButton=top],:host[scrollbarButton=start]{order:1}:host[scrollbarButton=bottom],:host[scrollbarButton=end]{order:3}:host[scrollbarButton=top],:host[scrollbarButton=bottom]{width:100%;height:var(--INTERNAL-scrollbar-button-size)}:host[scrollbarButton=start],:host[scrollbarButton=end]{width:var(--INTERNAL-scrollbar-button-size);height:100%}:host[scrollbarButton=bottom]{--_button-rotate: 180deg}:host[scrollbarButton=start]{--_button-rotate: -90deg}:host[scrollbarButton=start] .ng-scrollbar-button-icon{writing-mode:vertical-lr}:host[scrollbarButton=end]{--_button-rotate: 90deg}:host[scrollbarButton=end] .ng-scrollbar-button-icon{writing-mode:vertical-rl}.ng-scrollbar-button-icon{rotate:var(--_button-rotate);display:flex;place-content:center;place-items:center;width:100%;height:100%}\n"], changeDetection: i0.ChangeDetectionStrategy.OnPush }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.1.1", ngImport: i0, type: ScrollbarButton, decorators: [{
            type: Component,
            args: [{ selector: 'button[scrollbarButton]', changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"ng-scrollbar-button-icon\">\r\n  <svg viewBox=\"0 0 512 512\"\r\n       xmlns=\"http://www.w3.org/2000/svg\">\r\n    <path\r\n      d=\"M413.1,327.3l-1.8-2.1l-136-156.5c-4.6-5.3-11.5-8.6-19.2-8.6c-7.7,0-14.6,3.4-19.2,8.6L101,324.9l-2.3,2.6  C97,330,96,333,96,336.2c0,8.7,7.4,15.8,16.6,15.8v0h286.8v0c9.2,0,16.6-7.1,16.6-15.8C416,332.9,414.9,329.8,413.1,327.3z\"/>\r\n  </svg>\r\n</div>\r\n", styles: [":host{position:relative;border:none;margin:0;padding:0;border-radius:0;appearance:none;background-color:var(--INTERNAL-scrollbar-button-color)}:host svg{width:100%;height:100%;fill:var(--INTERNAL-scrollbar-button-fill)}:host:hover{background:var(--INTERNAL-scrollbar-button-hover-color)}:host:hover svg{fill:var(--INTERNAL-scrollbar-button-hover-fill)}:host:active{background:var(--INTERNAL-scrollbar-button-active-color)}:host:active svg{fill:var(--INTERNAL-scrollbar-button-active-fill)}:host[scrollbarButton=top],:host[scrollbarButton=start]{order:1}:host[scrollbarButton=bottom],:host[scrollbarButton=end]{order:3}:host[scrollbarButton=top],:host[scrollbarButton=bottom]{width:100%;height:var(--INTERNAL-scrollbar-button-size)}:host[scrollbarButton=start],:host[scrollbarButton=end]{width:var(--INTERNAL-scrollbar-button-size);height:100%}:host[scrollbarButton=bottom]{--_button-rotate: 180deg}:host[scrollbarButton=start]{--_button-rotate: -90deg}:host[scrollbarButton=start] .ng-scrollbar-button-icon{writing-mode:vertical-lr}:host[scrollbarButton=end]{--_button-rotate: 90deg}:host[scrollbarButton=end] .ng-scrollbar-button-icon{writing-mode:vertical-rl}.ng-scrollbar-button-icon{rotate:var(--_button-rotate);display:flex;place-content:center;place-items:center;width:100%;height:100%}\n"] }]
        }], ctorParameters: () => [] });

class ScrollbarY extends ScrollbarAdapter {
    constructor() {
        super(...arguments);
        this.rectOffsetProperty = 'top';
        this.rectSizeProperty = 'height';
        this.sizeProperty = 'offsetHeight';
        this.clientProperty = 'clientY';
        this.offsetProperty = 'offsetY';
        this.axis = 'y';
    }
    get viewportScrollMax() {
        return this.cmp.viewport.scrollMaxY;
    }
    get viewportScrollOffset() {
        return this.cmp.viewport.scrollTop;
    }
    scrollTo(top, duration) {
        return from(this.cmp.scrollTo({ top, duration }));
    }
    instantScrollTo(value) {
        this.cmp.viewport.scrollYTo(value);
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.1.1", ngImport: i0, type: ScrollbarY, deps: null, target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "19.1.1", type: ScrollbarY, isStandalone: true, selector: "scrollbar-y", host: { properties: { "style.--track-size": "trackSize()" } }, providers: [
            { provide: SCROLLBAR_CONTROL, useExisting: ScrollbarY }
        ], usesInheritance: true, ngImport: i0, template: `
    <div class="ng-scrollbar-sticky"
         [class.ng-scrollbar-hover]="cmp.hoverOffset()">
      <div class="ng-scrollbar-track-wrapper"
           [class.ng-scrollbar-hover]="!cmp.hoverOffset()">
        <div scrollbarTrackY class="ng-scrollbar-track {{ cmp.trackClass() }}">
          <div scrollbarThumbY class="ng-scrollbar-thumb {{ cmp.thumbClass() }}"></div>
        </div>
        @if (cmp.buttons()) {
          <button class="ng-scrollbar-button {{ cmp.buttonClass() }}"
                  scrollbarButton="top"
                  scrollDirection="backward"></button>
          <button class="ng-scrollbar-button {{ cmp.buttonClass() }}"
                  scrollbarButton="bottom"
                  scrollDirection="forward"></button>
        }
      </div>
    </div>
  `, isInline: true, styles: [":host{position:absolute;inset:0;pointer-events:none;min-width:calc(var(--viewport-width) * 1px);min-height:calc(var(--viewport-height) * 1px)}.ng-scrollbar-sticky{top:calc(var(--_scrollbar-wrapper-top) * 1px);left:calc(var(--_scrollbar-wrapper-left) * 1px);right:calc(var(--_scrollbar-wrapper-right) * 1px);height:calc(var(--_scrollbar-wrapper-height) * 1px);width:calc(var(--_scrollbar-wrapper-width) * 1px);position:sticky;z-index:100;opacity:var(--_scrollbar-hover-opacity);transition:var(--_scrollbar-opacity-transition);pointer-events:var(--_scrollbar-pointer-events)}.ng-scrollbar-track-wrapper{touch-action:none;-webkit-user-select:none;user-select:none;top:var(--_scrollbar-track-top);bottom:var(--_scrollbar-track-bottom);right:var(--_scrollbar-track-right);left:var(--_scrollbar-track-left);transition:var(--INTERNAL-scrollbar-track-wrapper-transition);position:absolute;overflow:hidden;display:flex;place-items:center}.ng-scrollbar-track{position:relative;width:100%;height:100%;background-color:var(--INTERNAL-scrollbar-track-color);border-radius:var(--INTERNAL-scrollbar-border-radius);cursor:default;z-index:1;order:2}.ng-scrollbar-thumb{box-sizing:border-box;position:absolute;transition:var(--INTERNAL-scrollbar-thumb-transition);border-radius:var(--INTERNAL-scrollbar-border-radius);height:var(--_thumb-height);width:var(--_thumb-width);animation-name:scrollbarThumbAnimation;animation-duration:1ms;animation-timing-function:linear}@keyframes scrollbarThumbAnimation{0%{translate:var(--_scrollbar-thumb-transform-from)}to{translate:var(--_scrollbar-thumb-transform-to)}}\n", ":host{--_scrollbar-wrapper-top: 0;--_scrollbar-wrapper-left: var(--_scrollbar-wrapper-y-left);--_scrollbar-wrapper-right: var(--_scrollbar-wrapper-y-right);--_scrollbar-wrapper-height: var(--viewport-height);--_scrollbar-wrapper-width: var(--_scrollbar-thickness);--_scrollbar-track-top: var(--_vertical-top);--_scrollbar-track-bottom: var(--_vertical-bottom);--_scrollbar-track-right: var(--_vertical-right);--_scrollbar-track-left: var(--_vertical-left);--thumb-size: max(calc(var(--viewport-height) * var(--track-size) / var(--content-height)), var(--INTERNAL-scrollbar-thumb-min-size));--_thumb-height: calc(var(--thumb-size) * 1px);--_thumb-width: 100%;--_scrollbar-y-thumb-transform-to-value: calc(var(--track-size) - var(--thumb-size));--_scrollbar-thumb-transform-from: 0 0;--_scrollbar-thumb-transform-to: 0 calc(var(--_scrollbar-y-thumb-transform-to-value) * 1px)}.ng-scrollbar-track-wrapper{width:var(--_track-y-thickness);flex-direction:column}.ng-scrollbar-hover:hover,.ng-scrollbar-hover:active{--_track-y-thickness: var(--_scrollbar-hover-thickness-px);--_thumb-y-color: var(--INTERNAL-scrollbar-thumb-hover-color)}.ng-scrollbar-thumb{animation-timeline:var(--_animation-timeline-y);min-height:calc(var(--INTERNAL-scrollbar-thumb-min-size) * 1px);display:var(--_vertical-thumb-display);background-color:var(--_thumb-y-color)}\n"], dependencies: [{ kind: "directive", type: TrackYDirective, selector: "[scrollbarTrackY]" }, { kind: "directive", type: ThumbYDirective, selector: "[scrollbarThumbY]" }, { kind: "component", type: ScrollbarButton, selector: "button[scrollbarButton]", inputs: ["scrollbarButton", "scrollDirection"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.1.1", ngImport: i0, type: ScrollbarY, decorators: [{
            type: Component,
            args: [{ selector: 'scrollbar-y', template: `
    <div class="ng-scrollbar-sticky"
         [class.ng-scrollbar-hover]="cmp.hoverOffset()">
      <div class="ng-scrollbar-track-wrapper"
           [class.ng-scrollbar-hover]="!cmp.hoverOffset()">
        <div scrollbarTrackY class="ng-scrollbar-track {{ cmp.trackClass() }}">
          <div scrollbarThumbY class="ng-scrollbar-thumb {{ cmp.thumbClass() }}"></div>
        </div>
        @if (cmp.buttons()) {
          <button class="ng-scrollbar-button {{ cmp.buttonClass() }}"
                  scrollbarButton="top"
                  scrollDirection="backward"></button>
          <button class="ng-scrollbar-button {{ cmp.buttonClass() }}"
                  scrollbarButton="bottom"
                  scrollDirection="forward"></button>
        }
      </div>
    </div>
  `, imports: [TrackYDirective, ThumbYDirective, ScrollbarButton], providers: [
                        { provide: SCROLLBAR_CONTROL, useExisting: ScrollbarY }
                    ], host: {
                        '[style.--track-size]': 'trackSize()'
                    }, changeDetection: ChangeDetectionStrategy.OnPush, styles: [":host{position:absolute;inset:0;pointer-events:none;min-width:calc(var(--viewport-width) * 1px);min-height:calc(var(--viewport-height) * 1px)}.ng-scrollbar-sticky{top:calc(var(--_scrollbar-wrapper-top) * 1px);left:calc(var(--_scrollbar-wrapper-left) * 1px);right:calc(var(--_scrollbar-wrapper-right) * 1px);height:calc(var(--_scrollbar-wrapper-height) * 1px);width:calc(var(--_scrollbar-wrapper-width) * 1px);position:sticky;z-index:100;opacity:var(--_scrollbar-hover-opacity);transition:var(--_scrollbar-opacity-transition);pointer-events:var(--_scrollbar-pointer-events)}.ng-scrollbar-track-wrapper{touch-action:none;-webkit-user-select:none;user-select:none;top:var(--_scrollbar-track-top);bottom:var(--_scrollbar-track-bottom);right:var(--_scrollbar-track-right);left:var(--_scrollbar-track-left);transition:var(--INTERNAL-scrollbar-track-wrapper-transition);position:absolute;overflow:hidden;display:flex;place-items:center}.ng-scrollbar-track{position:relative;width:100%;height:100%;background-color:var(--INTERNAL-scrollbar-track-color);border-radius:var(--INTERNAL-scrollbar-border-radius);cursor:default;z-index:1;order:2}.ng-scrollbar-thumb{box-sizing:border-box;position:absolute;transition:var(--INTERNAL-scrollbar-thumb-transition);border-radius:var(--INTERNAL-scrollbar-border-radius);height:var(--_thumb-height);width:var(--_thumb-width);animation-name:scrollbarThumbAnimation;animation-duration:1ms;animation-timing-function:linear}@keyframes scrollbarThumbAnimation{0%{translate:var(--_scrollbar-thumb-transform-from)}to{translate:var(--_scrollbar-thumb-transform-to)}}\n", ":host{--_scrollbar-wrapper-top: 0;--_scrollbar-wrapper-left: var(--_scrollbar-wrapper-y-left);--_scrollbar-wrapper-right: var(--_scrollbar-wrapper-y-right);--_scrollbar-wrapper-height: var(--viewport-height);--_scrollbar-wrapper-width: var(--_scrollbar-thickness);--_scrollbar-track-top: var(--_vertical-top);--_scrollbar-track-bottom: var(--_vertical-bottom);--_scrollbar-track-right: var(--_vertical-right);--_scrollbar-track-left: var(--_vertical-left);--thumb-size: max(calc(var(--viewport-height) * var(--track-size) / var(--content-height)), var(--INTERNAL-scrollbar-thumb-min-size));--_thumb-height: calc(var(--thumb-size) * 1px);--_thumb-width: 100%;--_scrollbar-y-thumb-transform-to-value: calc(var(--track-size) - var(--thumb-size));--_scrollbar-thumb-transform-from: 0 0;--_scrollbar-thumb-transform-to: 0 calc(var(--_scrollbar-y-thumb-transform-to-value) * 1px)}.ng-scrollbar-track-wrapper{width:var(--_track-y-thickness);flex-direction:column}.ng-scrollbar-hover:hover,.ng-scrollbar-hover:active{--_track-y-thickness: var(--_scrollbar-hover-thickness-px);--_thumb-y-color: var(--INTERNAL-scrollbar-thumb-hover-color)}.ng-scrollbar-thumb{animation-timeline:var(--_animation-timeline-y);min-height:calc(var(--INTERNAL-scrollbar-thumb-min-size) * 1px);display:var(--_vertical-thumb-display);background-color:var(--_thumb-y-color)}\n"] }]
        }] });
class ScrollbarX extends ScrollbarAdapter {
    get viewportScrollMax() {
        return this.cmp.viewport.scrollMaxX;
    }
    get viewportScrollOffset() {
        // Keep scrollLeft value positive for horizontal scrollbar
        return Math.abs(this.cmp.viewport.scrollLeft);
    }
    constructor() {
        effect(() => {
            if (this.cmp.direction() === 'rtl') {
                this.handlePosition = (position, scrollMax) => -(scrollMax - position);
            }
            else {
                this.handlePosition = (position) => position;
            }
        });
        super();
        this.manager = inject(ScrollbarManager);
        this.rectOffsetProperty = 'left';
        this.rectSizeProperty = 'width';
        this.sizeProperty = 'offsetWidth';
        this.clientProperty = 'clientX';
        this.offsetProperty = 'offsetX';
        this.axis = 'x';
    }
    scrollTo(left, duration) {
        return from(this.cmp.scrollTo({ left, duration }));
    }
    instantScrollTo(value, scrollMax) {
        this.cmp.viewport.scrollXTo(this.handlePosition(value, scrollMax));
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.1.1", ngImport: i0, type: ScrollbarX, deps: [], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "19.1.1", type: ScrollbarX, isStandalone: true, selector: "scrollbar-x", host: { properties: { "attr.dir": "cmp.direction()", "style.--track-size": "trackSize()" } }, providers: [
            { provide: SCROLLBAR_CONTROL, useExisting: ScrollbarX }
        ], usesInheritance: true, ngImport: i0, template: `
    <div class="ng-scrollbar-sticky"
         [class.ng-scrollbar-hover]="cmp.hoverOffset()">
      <div class="ng-scrollbar-track-wrapper"
           [class.ng-scrollbar-hover]="!cmp.hoverOffset()">
        <div scrollbarTrackX class="ng-scrollbar-track {{ cmp.trackClass() }}">
          <div scrollbarThumbX class="ng-scrollbar-thumb {{ cmp.thumbClass() }}"></div>
        </div>
        @if (cmp.buttons()) {
          <button class="ng-scrollbar-button {{ cmp.buttonClass() }}"
                  scrollbarButton="start"
                  scrollDirection="backward"></button>
          <button class="ng-scrollbar-button {{ cmp.buttonClass() }}"
                  scrollbarButton="end"
                  scrollDirection="forward"></button>
        }
      </div>
    </div>
  `, isInline: true, styles: [":host{position:absolute;inset:0;pointer-events:none;min-width:calc(var(--viewport-width) * 1px);min-height:calc(var(--viewport-height) * 1px)}.ng-scrollbar-sticky{top:calc(var(--_scrollbar-wrapper-top) * 1px);left:calc(var(--_scrollbar-wrapper-left) * 1px);right:calc(var(--_scrollbar-wrapper-right) * 1px);height:calc(var(--_scrollbar-wrapper-height) * 1px);width:calc(var(--_scrollbar-wrapper-width) * 1px);position:sticky;z-index:100;opacity:var(--_scrollbar-hover-opacity);transition:var(--_scrollbar-opacity-transition);pointer-events:var(--_scrollbar-pointer-events)}.ng-scrollbar-track-wrapper{touch-action:none;-webkit-user-select:none;user-select:none;top:var(--_scrollbar-track-top);bottom:var(--_scrollbar-track-bottom);right:var(--_scrollbar-track-right);left:var(--_scrollbar-track-left);transition:var(--INTERNAL-scrollbar-track-wrapper-transition);position:absolute;overflow:hidden;display:flex;place-items:center}.ng-scrollbar-track{position:relative;width:100%;height:100%;background-color:var(--INTERNAL-scrollbar-track-color);border-radius:var(--INTERNAL-scrollbar-border-radius);cursor:default;z-index:1;order:2}.ng-scrollbar-thumb{box-sizing:border-box;position:absolute;transition:var(--INTERNAL-scrollbar-thumb-transition);border-radius:var(--INTERNAL-scrollbar-border-radius);height:var(--_thumb-height);width:var(--_thumb-width);animation-name:scrollbarThumbAnimation;animation-duration:1ms;animation-timing-function:linear}@keyframes scrollbarThumbAnimation{0%{translate:var(--_scrollbar-thumb-transform-from)}to{translate:var(--_scrollbar-thumb-transform-to)}}\n", ":host{--_scrollbar-wrapper-top: var(--_scrollbar-wrapper-x-top);--_scrollbar-wrapper-left: 0;--_scrollbar-wrapper-right: 0;--_scrollbar-wrapper-height: var(--_scrollbar-thickness);--_scrollbar-wrapper-width: var(--viewport-width);--_scrollbar-track-top: var(--_horizontal-top);--_scrollbar-track-bottom: var(--_horizontal-bottom);--_scrollbar-track-right: var(--_horizontal-right);--_scrollbar-track-left: var(--_horizontal-left);--thumb-size: max(calc(var(--viewport-width) * var(--track-size) / var(--content-width)), var(--INTERNAL-scrollbar-thumb-min-size));--_thumb-height: 100%;--_thumb-width: calc(var(--thumb-size) * 1px);--_scrollbar-x-thumb-transform-to-value: calc(var(--track-size) - var(--thumb-size));--_scrollbar-thumb-transform-from: 0;--_scrollbar-thumb-transform-to: calc(var(--_scrollbar-x-thumb-transform-to-value) * 1px)}:host .ng-scrollbar-button[scrollbarButton=start]{_--button-rotate:90}:host .ng-scrollbar-button[scrollbarButton=end]{_--button-rotate:-90}:host[dir=rtl] .ng-scrollbar-thumb{animation-name:scrollbarThumbRTLAnimation;will-change:right;--_scrollbar-thumb-transform-to: calc(var(--_scrollbar-x-thumb-transform-to-value) * -1px)}:host[dir=rtl] .ng-scrollbar-button[scrollbarButton=start]{--_button-rotate: 90deg}:host[dir=rtl] .ng-scrollbar-button[scrollbarButton=end]{--_button-rotate: -90deg}.ng-scrollbar-track-wrapper{height:var(--_track-x-thickness);flex-direction:row}.ng-scrollbar-hover:hover,.ng-scrollbar-hover:active{--_track-x-thickness: var(--_scrollbar-hover-thickness-px);--_thumb-x-color: var(--INTERNAL-scrollbar-thumb-hover-color)}.ng-scrollbar-thumb{animation-timeline:var(--_animation-timeline-x);min-width:calc(var(--INTERNAL-scrollbar-thumb-min-size) * 1px);display:var(--_horizontal-thumb-display);background-color:var(--_thumb-x-color)}@keyframes scrollbarThumbRTLAnimation{0%{right:var(--_scrollbar-thumb-transform-from)}to{right:calc(var(--_scrollbar-thumb-transform-to) * -1)}}\n"], dependencies: [{ kind: "directive", type: TrackXDirective, selector: "[scrollbarTrackX]" }, { kind: "directive", type: ThumbXDirective, selector: "[scrollbarThumbX]" }, { kind: "component", type: ScrollbarButton, selector: "button[scrollbarButton]", inputs: ["scrollbarButton", "scrollDirection"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.1.1", ngImport: i0, type: ScrollbarX, decorators: [{
            type: Component,
            args: [{ selector: 'scrollbar-x', template: `
    <div class="ng-scrollbar-sticky"
         [class.ng-scrollbar-hover]="cmp.hoverOffset()">
      <div class="ng-scrollbar-track-wrapper"
           [class.ng-scrollbar-hover]="!cmp.hoverOffset()">
        <div scrollbarTrackX class="ng-scrollbar-track {{ cmp.trackClass() }}">
          <div scrollbarThumbX class="ng-scrollbar-thumb {{ cmp.thumbClass() }}"></div>
        </div>
        @if (cmp.buttons()) {
          <button class="ng-scrollbar-button {{ cmp.buttonClass() }}"
                  scrollbarButton="start"
                  scrollDirection="backward"></button>
          <button class="ng-scrollbar-button {{ cmp.buttonClass() }}"
                  scrollbarButton="end"
                  scrollDirection="forward"></button>
        }
      </div>
    </div>
  `, imports: [TrackXDirective, ThumbXDirective, ScrollbarButton], providers: [
                        { provide: SCROLLBAR_CONTROL, useExisting: ScrollbarX }
                    ], host: {
                        '[attr.dir]': 'cmp.direction()',
                        '[style.--track-size]': 'trackSize()'
                    }, changeDetection: ChangeDetectionStrategy.OnPush, styles: [":host{position:absolute;inset:0;pointer-events:none;min-width:calc(var(--viewport-width) * 1px);min-height:calc(var(--viewport-height) * 1px)}.ng-scrollbar-sticky{top:calc(var(--_scrollbar-wrapper-top) * 1px);left:calc(var(--_scrollbar-wrapper-left) * 1px);right:calc(var(--_scrollbar-wrapper-right) * 1px);height:calc(var(--_scrollbar-wrapper-height) * 1px);width:calc(var(--_scrollbar-wrapper-width) * 1px);position:sticky;z-index:100;opacity:var(--_scrollbar-hover-opacity);transition:var(--_scrollbar-opacity-transition);pointer-events:var(--_scrollbar-pointer-events)}.ng-scrollbar-track-wrapper{touch-action:none;-webkit-user-select:none;user-select:none;top:var(--_scrollbar-track-top);bottom:var(--_scrollbar-track-bottom);right:var(--_scrollbar-track-right);left:var(--_scrollbar-track-left);transition:var(--INTERNAL-scrollbar-track-wrapper-transition);position:absolute;overflow:hidden;display:flex;place-items:center}.ng-scrollbar-track{position:relative;width:100%;height:100%;background-color:var(--INTERNAL-scrollbar-track-color);border-radius:var(--INTERNAL-scrollbar-border-radius);cursor:default;z-index:1;order:2}.ng-scrollbar-thumb{box-sizing:border-box;position:absolute;transition:var(--INTERNAL-scrollbar-thumb-transition);border-radius:var(--INTERNAL-scrollbar-border-radius);height:var(--_thumb-height);width:var(--_thumb-width);animation-name:scrollbarThumbAnimation;animation-duration:1ms;animation-timing-function:linear}@keyframes scrollbarThumbAnimation{0%{translate:var(--_scrollbar-thumb-transform-from)}to{translate:var(--_scrollbar-thumb-transform-to)}}\n", ":host{--_scrollbar-wrapper-top: var(--_scrollbar-wrapper-x-top);--_scrollbar-wrapper-left: 0;--_scrollbar-wrapper-right: 0;--_scrollbar-wrapper-height: var(--_scrollbar-thickness);--_scrollbar-wrapper-width: var(--viewport-width);--_scrollbar-track-top: var(--_horizontal-top);--_scrollbar-track-bottom: var(--_horizontal-bottom);--_scrollbar-track-right: var(--_horizontal-right);--_scrollbar-track-left: var(--_horizontal-left);--thumb-size: max(calc(var(--viewport-width) * var(--track-size) / var(--content-width)), var(--INTERNAL-scrollbar-thumb-min-size));--_thumb-height: 100%;--_thumb-width: calc(var(--thumb-size) * 1px);--_scrollbar-x-thumb-transform-to-value: calc(var(--track-size) - var(--thumb-size));--_scrollbar-thumb-transform-from: 0;--_scrollbar-thumb-transform-to: calc(var(--_scrollbar-x-thumb-transform-to-value) * 1px)}:host .ng-scrollbar-button[scrollbarButton=start]{_--button-rotate:90}:host .ng-scrollbar-button[scrollbarButton=end]{_--button-rotate:-90}:host[dir=rtl] .ng-scrollbar-thumb{animation-name:scrollbarThumbRTLAnimation;will-change:right;--_scrollbar-thumb-transform-to: calc(var(--_scrollbar-x-thumb-transform-to-value) * -1px)}:host[dir=rtl] .ng-scrollbar-button[scrollbarButton=start]{--_button-rotate: 90deg}:host[dir=rtl] .ng-scrollbar-button[scrollbarButton=end]{--_button-rotate: -90deg}.ng-scrollbar-track-wrapper{height:var(--_track-x-thickness);flex-direction:row}.ng-scrollbar-hover:hover,.ng-scrollbar-hover:active{--_track-x-thickness: var(--_scrollbar-hover-thickness-px);--_thumb-x-color: var(--INTERNAL-scrollbar-thumb-hover-color)}.ng-scrollbar-thumb{animation-timeline:var(--_animation-timeline-x);min-width:calc(var(--INTERNAL-scrollbar-thumb-min-size) * 1px);display:var(--_horizontal-thumb-display);background-color:var(--_thumb-x-color)}@keyframes scrollbarThumbRTLAnimation{0%{right:var(--_scrollbar-thumb-transform-from)}to{right:calc(var(--_scrollbar-thumb-transform-to) * -1)}}\n"] }]
        }], ctorParameters: () => [] });

class Scrollbars {
    constructor() {
        this.cmp = inject(NG_SCROLLBAR);
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.1.1", ngImport: i0, type: Scrollbars, deps: [], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "19.1.1", type: Scrollbars, isStandalone: true, selector: "scrollbars", ngImport: i0, template: `
    @if (cmp.verticalUsed()) {
      <scrollbar-y/>
    }
    @if (cmp.horizontalUsed()) {
      <scrollbar-x/>
    }
  `, isInline: true, styles: [":host{display:contents}\n"], dependencies: [{ kind: "component", type: ScrollbarX, selector: "scrollbar-x" }, { kind: "component", type: ScrollbarY, selector: "scrollbar-y" }], changeDetection: i0.ChangeDetectionStrategy.OnPush }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.1.1", ngImport: i0, type: Scrollbars, decorators: [{
            type: Component,
            args: [{ selector: 'scrollbars', changeDetection: ChangeDetectionStrategy.OnPush, imports: [ScrollbarX, ScrollbarY], template: `
    @if (cmp.verticalUsed()) {
      <scrollbar-y/>
    }
    @if (cmp.horizontalUsed()) {
      <scrollbar-x/>
    }
  `, styles: [":host{display:contents}\n"] }]
        }] });

class NgScrollbar extends NgScrollbarCore {
    constructor() {
        effect(() => {
            const contentWrapper = this.contentWrapper().nativeElement;
            untracked(() => {
                this.viewport.init(this.nativeElement, contentWrapper);
            });
        });
        super();
        this.contentWrapper = viewChild.required('contentWrapper');
        this._scrollbars = viewChild.required(Scrollbars);
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.1.1", ngImport: i0, type: NgScrollbar, deps: [], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.2.0", version: "19.1.1", type: NgScrollbar, isStandalone: true, selector: "ng-scrollbar:not([externalViewport])", providers: [
            { provide: NG_SCROLLBAR, useExisting: NgScrollbar },
            ViewportAdapter
        ], viewQueries: [{ propertyName: "contentWrapper", first: true, predicate: ["contentWrapper"], descendants: true, isSignal: true }, { propertyName: "_scrollbars", first: true, predicate: Scrollbars, descendants: true, isSignal: true }], exportAs: ["ngScrollbar"], usesInheritance: true, ngImport: i0, template: `
    <div #contentWrapper>
      <ng-content/>
      <scrollbars/>
    </div>
  `, isInline: true, styles: [":host{display:block;position:relative;max-height:100%;max-width:100%;--INTERNAL-scrollbar-border-radius: var(--scrollbar-border-radius, 0px);--INTERNAL-scrollbar-thickness: var(--scrollbar-thickness, 5);--INTERNAL-scrollbar-offset: var(--scrollbar-offset, 0);--INTERNAL-scrollbar-track-wrapper-transition: var(--scrollbar-track-wrapper-transition, width 60ms linear, height 60ms linear);--INTERNAL-scrollbar-track-color: var(--scrollbar-track-color, transparent);--INTERNAL-scrollbar-thumb-color: var(--scrollbar-thumb-color, rgb(0 0 0 / 20%));--INTERNAL-scrollbar-thumb-hover-color: var(--scrollbar-thumb-hover-color, var(--INTERNAL-scrollbar-thumb-color));--INTERNAL-scrollbar-hover-thickness: var(--scrollbar-hover-thickness, var(--INTERNAL-scrollbar-thickness));--INTERNAL-scrollbar-thumb-transition: var(--scrollbar-thumb-transition, none);--INTERNAL-scrollbar-thumb-min-size: var(--scrollbar-thumb-min-size, 20);--INTERNAL-scrollbar-button-color: var(--scrollbar-button-color, var(--INTERNAL-scrollbar-thumb-color));--INTERNAL-scrollbar-button-hover-color: var(--scrollbar-button-hover-color, var(--INTERNAL-scrollbar-button-color));--INTERNAL-scrollbar-button-active-color: var(--scrollbar-button-active-color, var(--INTERNAL-scrollbar-button-hover-color));--INTERNAL-scrollbar-button-fill: var(--scrollbar-button-fill, white);--INTERNAL-scrollbar-button-hover-fill: var(--scrollbar-button-hover-fill, var(--INTERNAL-scrollbar-button-fill));--INTERNAL-scrollbar-button-active-fill: var(--scrollbar-button-active-fill, var(--INTERNAL-scrollbar-button-hover-fill));--INTERNAL-scrollbar-button-size: var(--scrollbar-button-size, 20px);--INTERNAL-scrollbar-hover-opacity-transition-enter-duration: var(--scrollbar-hover-opacity-transition-enter-duration, 0);--INTERNAL-scrollbar-hover-opacity-transition-leave-duration: var(--scrollbar-hover-opacity-transition-leave-duration, .4s);--INTERNAL-scrollbar-hover-opacity-transition-leave-delay: var(--scrollbar-hover-opacity-transition-leave-delay, 1s);--INTERNAL-scrollbar-overscroll-behavior: var(--scrollbar-overscroll-behavior, initial);--INTERNAL-scrollbar-mobile-overscroll-behavior: var(--scrollbar-mobile-overscroll-behavior, none);--_scrollbar-thickness: calc(var(--INTERNAL-scrollbar-thickness) + var(--INTERNAL-scrollbar-offset) * 2);--_scrollbar-pointer-events: auto;--_scrollbar-offset-px: calc(var(--INTERNAL-scrollbar-offset) * 1px);--_scrollbar-thickness-px: calc(var(--INTERNAL-scrollbar-thickness) * 1px);--_scrollbar-hover-thickness-px: calc(var(--INTERNAL-scrollbar-hover-thickness) * 1px);--_viewport-padding-top: 0;--_viewport-padding-bottom: 0;--_viewport-padding-left: 0;--_viewport-padding-right: 0;--_horizontal-thumb-display: block;--_vertical-thumb-display: block;--_viewport-overflow: auto;--_viewport-pointer-events: auto;--_thumb-x-color: var(--INTERNAL-scrollbar-thumb-color);--_thumb-y-color: var(--INTERNAL-scrollbar-thumb-color);--_track-y-thickness: var(--_scrollbar-thickness-px);--_track-x-thickness: var(--_scrollbar-thickness-px);--_viewport-overscroll-behavior: var(--INTERNAL-scrollbar-overscroll-behavior);--_scrollbar-content-width: fit-content}:host{--_spacer-width: var(--spacer-width);--_spacer-height: var(--spacer-height);--_vertical-top: var(--_scrollbar-offset-px);--_vertical-bottom: var(--_scrollbar-offset-px);--_horizontal-left: var(--_scrollbar-offset-px);--_horizontal-right: var(--_scrollbar-offset-px);--_horizontal-top: initial;--_horizontal-bottom: var(--_scrollbar-offset-px);--_scrollbar-wrapper-x-top: calc(var(--viewport-height) - var(--_scrollbar-thickness));--reached-offset: 1px;--reached-offset-top: var(--reached-offset);--reached-offset-bottom: var(--reached-offset);--reached-offset-start: var(--reached-offset);--reached-offset-end: var(--reached-offset);--dropped-offset: 1px;--dropped-offset-top: var(--dropped-offset);--dropped-offset-bottom: var(--dropped-offset);--dropped-offset-start: var(--dropped-offset);--dropped-offset-end: var(--dropped-offset);--_viewport_scroll-timeline: unset;--_animation-timeline-y: unset;--_scrollbar-y-thumb-transform-to-value: unset;--_scrollbar-x-thumb-transform-to-value: unset;--_scrollbar-thumb-transform-from: unset;--_scrollbar-thumb-transform-to: unset}:host.ng-scrollbar-external-viewport ::ng-deep .ng-scroll-viewport{min-height:100%;min-width:100%;height:100%;max-height:100%;max-width:100%}:host.ng-scroll-viewport,:host.ng-scrollbar-external-viewport ::ng-deep .ng-scroll-viewport{position:relative;overflow:var(--_viewport-overflow);scroll-timeline:var(--_viewport_scroll-timeline);box-sizing:border-box!important;-webkit-overflow-scrolling:touch;will-change:scroll-position;-webkit-user-select:var(--_viewport-user-select);user-select:var(--_viewport-user-select);overscroll-behavior:var(--_viewport-overscroll-behavior);pointer-events:var(--_viewport-pointer-events)}:host.ng-scroll-viewport>.ng-scroll-content,:host.ng-scrollbar-external-viewport ::ng-deep .ng-scroll-viewport>.ng-scroll-content{width:var(--_scrollbar-content-width);z-index:1;min-width:100%;min-height:100%;contain:content;padding:var(--_viewport-padding-top, 0) var(--_viewport-padding-right, 0) var(--_viewport-padding-bottom, 0) var(--_viewport-padding-left, 0)}:host[appearance=native]{--_spacer-width: calc(var(--spacer-width) + var(--_scrollbar-thickness));--_spacer-height: calc(var(--spacer-height) + var(--_scrollbar-thickness))}:host.ng-scroll-viewport>.ng-scroll-spacer,:host.ng-scrollbar-external-viewport ::ng-deep .ng-scroll-viewport>.ng-scroll-spacer{position:relative;width:calc(var(--_spacer-width) * 1px);height:calc(var(--_spacer-height) * 1px)}:host.ng-scroll-viewport,:host.ng-scrollbar-external-viewport ::ng-deep .ng-scroll-viewport{scrollbar-width:none!important}:host.ng-scroll-viewport::-webkit-scrollbar,:host.ng-scrollbar-external-viewport ::ng-deep .ng-scroll-viewport::-webkit-scrollbar{display:none!important}:host[position=invertX],:host[position=invertAll]{--_horizontal-top: var(--_scrollbar-offset-px);--_horizontal-bottom: initial;--_scrollbar-wrapper-x-top: 0}:host[dir=ltr]{--_scrollbar-wrapper-y-right: initial;--_vertical-right: var(--_scrollbar-offset-px);--_vertical-left: initial;--_scrollbar-wrapper-y-left: calc(var(--viewport-width) - var(--_scrollbar-thickness))}:host[dir=ltr][position=invertY],:host[dir=ltr][position=invertAll]{--_vertical-left: var(--_scrollbar-offset-px);--_vertical-right: initial;--_scrollbar-wrapper-y-left: 0}:host[dir=rtl]{--_scrollbar-wrapper-y-left: initial;--_vertical-left: var(--_scrollbar-offset-px);--_vertical-right: initial;--_scrollbar-wrapper-y-right: calc(var(--viewport-width) - var(--_scrollbar-thickness))}:host[dir=rtl][position=invertY],:host[dir=rtl][position=invertAll]{--_vertical-right: var(--_scrollbar-offset-px);--_vertical-left: initial;--_scrollbar-wrapper-y-right: 0}:host[verticalUsed=true][horizontalUsed=true]{--_scrollbar-thickness-margin: calc(var(--INTERNAL-scrollbar-thickness) + var(--INTERNAL-scrollbar-offset) * 3);--_scrollbar-thickness-margin-px: calc(var(--_scrollbar-thickness-margin) * 1px)}:host[horizontalUsed=true]{--_vertical-top: var(--_scrollbar-offset-px);--_vertical-bottom: var(--_scrollbar-thickness-margin-px)}:host[horizontalUsed=true][position=invertX],:host[horizontalUsed=true][position=invertAll]{--_vertical-top: var(--_scrollbar-thickness-margin-px);--_vertical-bottom: var(--_scrollbar-offset-px)}:host[verticalUsed=true][dir=ltr]{--_horizontal-left: var(--_scrollbar-offset-px);--_horizontal-right: var(--_scrollbar-thickness-margin-px)}:host[verticalUsed=true][dir=rtl]{--_horizontal-left: var(--_scrollbar-thickness-margin-px);--_horizontal-right: var(--_scrollbar-offset-px)}:host[verticalUsed=true][position=invertY][dir=ltr],:host[verticalUsed=true][position=invertAll][dir=ltr]{--_horizontal-left: var(--_scrollbar-thickness-margin-px);--_horizontal-right: var(--_scrollbar-offset-px)}:host[verticalUsed=true][position=invertY][dir=rtl],:host[verticalUsed=true][position=invertAll][dir=rtl]{--_horizontal-left: var(--_scrollbar-offset-px);--_horizontal-right: var(--_scrollbar-thickness-margin-px)}:host[appearance=native][verticalUsed=true][dir=ltr]{--_viewport-padding-left: 0;--_viewport-padding-right: calc(var(--_scrollbar-thickness) * 1px)}:host[appearance=native][verticalUsed=true][dir=rtl]{--_viewport-padding-left: calc(var(--_scrollbar-thickness) * 1px);--_viewport-padding-right: 0}:host[appearance=native][verticalUsed=true][position=invertY][dir=ltr],:host[appearance=native][verticalUsed=true][position=invertAll][dir=ltr]{--_viewport-padding-left: calc(var(--_scrollbar-thickness) * 1px);--_viewport-padding-right: 0}:host[appearance=native][verticalUsed=true][position=invertY][dir=rtl],:host[appearance=native][verticalUsed=true][position=invertAll][dir=rtl]{--_viewport-padding-left: 0;--_viewport-padding-right: calc(var(--_scrollbar-thickness) * 1px)}:host[appearance=native][horizontalUsed=true]{--_viewport-padding-top: 0;--_viewport-padding-bottom: calc(var(--_scrollbar-thickness) * 1px)}:host[appearance=native][horizontalUsed=true][position=invertX],:host[appearance=native][horizontalUsed=true][position=invertAll]{--_viewport-padding-top: calc(var(--_scrollbar-thickness) * 1px);--_viewport-padding-bottom: 0}:host[visibility=hover]{--_scrollbar-hover-opacity: 0;--_scrollbar-opacity-transition: opacity var(--INTERNAL-scrollbar-hover-opacity-transition-leave-duration) var(--INTERNAL-scrollbar-hover-opacity-transition-leave-delay)}:host[visibility=hover]:hover,:host[visibility=hover]:active,:host[visibility=hover]:focus{--_scrollbar-hover-opacity: 1;--_scrollbar-opacity-transition: opacity var(--INTERNAL-scrollbar-hover-opacity-transition-enter-duration)}:host[dir=ltr] ::ng-deep .scroll-reached-trigger-element[trigger=start],:host[dir=ltr] ::ng-deep .scroll-dropped-trigger-element[trigger=start]{left:0;right:unset}:host[dir=ltr] ::ng-deep .scroll-reached-trigger-element[trigger=end],:host[dir=ltr] ::ng-deep .scroll-dropped-trigger-element[trigger=end]{right:0;left:unset}:host[dir=rtl] ::ng-deep .scroll-reached-trigger-element[trigger=start],:host[dir=rtl] ::ng-deep .scroll-dropped-trigger-element[trigger=start]{right:0;left:unset}:host[dir=rtl] ::ng-deep .scroll-reached-trigger-element[trigger=end],:host[dir=rtl] ::ng-deep .scroll-dropped-trigger-element[trigger=end]{left:0;right:unset}:host ::ng-deep .ng-scroll-reached-wrapper,:host ::ng-deep .ng-scroll-dropped-wrapper,:host ::ng-deep .scroll-reached-trigger-element,:host ::ng-deep .scroll-dropped-trigger-element{position:absolute;-webkit-user-select:none;user-select:none;pointer-events:none;z-index:-9999}:host ::ng-deep .ng-scroll-reached-wrapper,:host ::ng-deep .ng-scroll-dropped-wrapper{visibility:hidden;inset:0;min-width:calc(var(--viewport-width) * 1px);min-height:calc(var(--viewport-height) * 1px)}:host ::ng-deep [isHorizontallyScrollable=false] .scroll-reached-trigger-element[trigger=end],:host ::ng-deep [isHorizontallyScrollable=false] .scroll-dropped-trigger-element[trigger=end]{display:none}:host ::ng-deep [isVerticallyScrollable=false] .scroll-reached-trigger-element[trigger=bottom],:host ::ng-deep [isVerticallyScrollable=false] .scroll-dropped-trigger-element[trigger=bottom]{display:none}:host ::ng-deep .scroll-reached-trigger-element{background:red}:host ::ng-deep .scroll-reached-trigger-element[trigger=top],:host ::ng-deep .scroll-reached-trigger-element[trigger=bottom]{left:0;right:0}:host ::ng-deep .scroll-reached-trigger-element[trigger=start],:host ::ng-deep .scroll-reached-trigger-element[trigger=end]{top:0;bottom:0}:host ::ng-deep .scroll-reached-trigger-element[trigger=top]{top:0;height:var(--reached-offset-top)}:host ::ng-deep .scroll-reached-trigger-element[trigger=bottom]{bottom:0;height:var(--reached-offset-bottom)}:host ::ng-deep .scroll-reached-trigger-element[trigger=start]{width:var(--reached-offset-start)}:host ::ng-deep .scroll-reached-trigger-element[trigger=end]{width:var(--reached-offset-end)}:host .scroll-dropped-trigger-element{background:#00f}:host .scroll-dropped-trigger-element[trigger=top],:host .scroll-dropped-trigger-element[trigger=bottom]{left:0;right:0}:host .scroll-dropped-trigger-element[trigger=start],:host .scroll-dropped-trigger-element[trigger=end]{top:0;bottom:0}:host .scroll-dropped-trigger-element[trigger=top]{top:0;height:var(--dropped-offset-top)}:host .scroll-dropped-trigger-element[trigger=bottom]{bottom:0;height:var(--dropped-offset-bottom)}:host .scroll-dropped-trigger-element[trigger=start]{width:var(--dropped-offset-start)}:host .scroll-dropped-trigger-element[trigger=end]{width:var(--dropped-offset-end)}:host[verticalUsed=true]{--_timeline-scope: --scrollerY;--_animation-timeline-y: --scrollerY;--_viewport_scroll-timeline: --scrollerY y}:host[horizontalUsed=true]{--_timeline-scope: --scrollerX;--_animation-timeline-x: --scrollerX;--_viewport_scroll-timeline: --scrollerX x}:host[verticalUsed=true][horizontalUsed=true]{--_timeline-scope: --scrollerX, --scrollerY;--_viewport_scroll-timeline: --scrollerX x, --scrollerY y}:host[orientation=vertical]{--_viewport-overflow: hidden auto;--_scrollbar-content-width: unset}:host[orientation=horizontal]{--_viewport-overflow: auto hidden}:host[disableInteraction=true]{--_viewport-pointer-events: none;--_scrollbar-pointer-events: none}:host[isVerticallyScrollable=false]{--_vertical-thumb-display: none}:host[isHorizontallyScrollable=false]{--_horizontal-thumb-display: none}:host[dragging=x],:host[dragging=y]{--_viewport-user-select: none}:host[dragging=x]{--_track-x-thickness: calc(var(--INTERNAL-scrollbar-hover-thickness) * 1px);--_thumb-x-color: var(var(--INTERNAL-scrollbar-thumb-min-size))}:host[dragging=y]{--_track-y-thickness: calc(var(--INTERNAL-scrollbar-hover-thickness) * 1px);--_thumb-y-color: var(var(--INTERNAL-scrollbar-thumb-min-size))}:host[mobile=true]{--_viewport-overscroll-behavior: var(--INTERNAL-scrollbar-mobile-overscroll-behavior)}\n"], dependencies: [{ kind: "component", type: Scrollbars, selector: "scrollbars" }], changeDetection: i0.ChangeDetectionStrategy.OnPush }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.1.1", ngImport: i0, type: NgScrollbar, decorators: [{
            type: Component,
            args: [{ selector: 'ng-scrollbar:not([externalViewport])', exportAs: 'ngScrollbar', imports: [Scrollbars], template: `
    <div #contentWrapper>
      <ng-content/>
      <scrollbars/>
    </div>
  `, changeDetection: ChangeDetectionStrategy.OnPush, providers: [
                        { provide: NG_SCROLLBAR, useExisting: NgScrollbar },
                        ViewportAdapter
                    ], styles: [":host{display:block;position:relative;max-height:100%;max-width:100%;--INTERNAL-scrollbar-border-radius: var(--scrollbar-border-radius, 0px);--INTERNAL-scrollbar-thickness: var(--scrollbar-thickness, 5);--INTERNAL-scrollbar-offset: var(--scrollbar-offset, 0);--INTERNAL-scrollbar-track-wrapper-transition: var(--scrollbar-track-wrapper-transition, width 60ms linear, height 60ms linear);--INTERNAL-scrollbar-track-color: var(--scrollbar-track-color, transparent);--INTERNAL-scrollbar-thumb-color: var(--scrollbar-thumb-color, rgb(0 0 0 / 20%));--INTERNAL-scrollbar-thumb-hover-color: var(--scrollbar-thumb-hover-color, var(--INTERNAL-scrollbar-thumb-color));--INTERNAL-scrollbar-hover-thickness: var(--scrollbar-hover-thickness, var(--INTERNAL-scrollbar-thickness));--INTERNAL-scrollbar-thumb-transition: var(--scrollbar-thumb-transition, none);--INTERNAL-scrollbar-thumb-min-size: var(--scrollbar-thumb-min-size, 20);--INTERNAL-scrollbar-button-color: var(--scrollbar-button-color, var(--INTERNAL-scrollbar-thumb-color));--INTERNAL-scrollbar-button-hover-color: var(--scrollbar-button-hover-color, var(--INTERNAL-scrollbar-button-color));--INTERNAL-scrollbar-button-active-color: var(--scrollbar-button-active-color, var(--INTERNAL-scrollbar-button-hover-color));--INTERNAL-scrollbar-button-fill: var(--scrollbar-button-fill, white);--INTERNAL-scrollbar-button-hover-fill: var(--scrollbar-button-hover-fill, var(--INTERNAL-scrollbar-button-fill));--INTERNAL-scrollbar-button-active-fill: var(--scrollbar-button-active-fill, var(--INTERNAL-scrollbar-button-hover-fill));--INTERNAL-scrollbar-button-size: var(--scrollbar-button-size, 20px);--INTERNAL-scrollbar-hover-opacity-transition-enter-duration: var(--scrollbar-hover-opacity-transition-enter-duration, 0);--INTERNAL-scrollbar-hover-opacity-transition-leave-duration: var(--scrollbar-hover-opacity-transition-leave-duration, .4s);--INTERNAL-scrollbar-hover-opacity-transition-leave-delay: var(--scrollbar-hover-opacity-transition-leave-delay, 1s);--INTERNAL-scrollbar-overscroll-behavior: var(--scrollbar-overscroll-behavior, initial);--INTERNAL-scrollbar-mobile-overscroll-behavior: var(--scrollbar-mobile-overscroll-behavior, none);--_scrollbar-thickness: calc(var(--INTERNAL-scrollbar-thickness) + var(--INTERNAL-scrollbar-offset) * 2);--_scrollbar-pointer-events: auto;--_scrollbar-offset-px: calc(var(--INTERNAL-scrollbar-offset) * 1px);--_scrollbar-thickness-px: calc(var(--INTERNAL-scrollbar-thickness) * 1px);--_scrollbar-hover-thickness-px: calc(var(--INTERNAL-scrollbar-hover-thickness) * 1px);--_viewport-padding-top: 0;--_viewport-padding-bottom: 0;--_viewport-padding-left: 0;--_viewport-padding-right: 0;--_horizontal-thumb-display: block;--_vertical-thumb-display: block;--_viewport-overflow: auto;--_viewport-pointer-events: auto;--_thumb-x-color: var(--INTERNAL-scrollbar-thumb-color);--_thumb-y-color: var(--INTERNAL-scrollbar-thumb-color);--_track-y-thickness: var(--_scrollbar-thickness-px);--_track-x-thickness: var(--_scrollbar-thickness-px);--_viewport-overscroll-behavior: var(--INTERNAL-scrollbar-overscroll-behavior);--_scrollbar-content-width: fit-content}:host{--_spacer-width: var(--spacer-width);--_spacer-height: var(--spacer-height);--_vertical-top: var(--_scrollbar-offset-px);--_vertical-bottom: var(--_scrollbar-offset-px);--_horizontal-left: var(--_scrollbar-offset-px);--_horizontal-right: var(--_scrollbar-offset-px);--_horizontal-top: initial;--_horizontal-bottom: var(--_scrollbar-offset-px);--_scrollbar-wrapper-x-top: calc(var(--viewport-height) - var(--_scrollbar-thickness));--reached-offset: 1px;--reached-offset-top: var(--reached-offset);--reached-offset-bottom: var(--reached-offset);--reached-offset-start: var(--reached-offset);--reached-offset-end: var(--reached-offset);--dropped-offset: 1px;--dropped-offset-top: var(--dropped-offset);--dropped-offset-bottom: var(--dropped-offset);--dropped-offset-start: var(--dropped-offset);--dropped-offset-end: var(--dropped-offset);--_viewport_scroll-timeline: unset;--_animation-timeline-y: unset;--_scrollbar-y-thumb-transform-to-value: unset;--_scrollbar-x-thumb-transform-to-value: unset;--_scrollbar-thumb-transform-from: unset;--_scrollbar-thumb-transform-to: unset}:host.ng-scrollbar-external-viewport ::ng-deep .ng-scroll-viewport{min-height:100%;min-width:100%;height:100%;max-height:100%;max-width:100%}:host.ng-scroll-viewport,:host.ng-scrollbar-external-viewport ::ng-deep .ng-scroll-viewport{position:relative;overflow:var(--_viewport-overflow);scroll-timeline:var(--_viewport_scroll-timeline);box-sizing:border-box!important;-webkit-overflow-scrolling:touch;will-change:scroll-position;-webkit-user-select:var(--_viewport-user-select);user-select:var(--_viewport-user-select);overscroll-behavior:var(--_viewport-overscroll-behavior);pointer-events:var(--_viewport-pointer-events)}:host.ng-scroll-viewport>.ng-scroll-content,:host.ng-scrollbar-external-viewport ::ng-deep .ng-scroll-viewport>.ng-scroll-content{width:var(--_scrollbar-content-width);z-index:1;min-width:100%;min-height:100%;contain:content;padding:var(--_viewport-padding-top, 0) var(--_viewport-padding-right, 0) var(--_viewport-padding-bottom, 0) var(--_viewport-padding-left, 0)}:host[appearance=native]{--_spacer-width: calc(var(--spacer-width) + var(--_scrollbar-thickness));--_spacer-height: calc(var(--spacer-height) + var(--_scrollbar-thickness))}:host.ng-scroll-viewport>.ng-scroll-spacer,:host.ng-scrollbar-external-viewport ::ng-deep .ng-scroll-viewport>.ng-scroll-spacer{position:relative;width:calc(var(--_spacer-width) * 1px);height:calc(var(--_spacer-height) * 1px)}:host.ng-scroll-viewport,:host.ng-scrollbar-external-viewport ::ng-deep .ng-scroll-viewport{scrollbar-width:none!important}:host.ng-scroll-viewport::-webkit-scrollbar,:host.ng-scrollbar-external-viewport ::ng-deep .ng-scroll-viewport::-webkit-scrollbar{display:none!important}:host[position=invertX],:host[position=invertAll]{--_horizontal-top: var(--_scrollbar-offset-px);--_horizontal-bottom: initial;--_scrollbar-wrapper-x-top: 0}:host[dir=ltr]{--_scrollbar-wrapper-y-right: initial;--_vertical-right: var(--_scrollbar-offset-px);--_vertical-left: initial;--_scrollbar-wrapper-y-left: calc(var(--viewport-width) - var(--_scrollbar-thickness))}:host[dir=ltr][position=invertY],:host[dir=ltr][position=invertAll]{--_vertical-left: var(--_scrollbar-offset-px);--_vertical-right: initial;--_scrollbar-wrapper-y-left: 0}:host[dir=rtl]{--_scrollbar-wrapper-y-left: initial;--_vertical-left: var(--_scrollbar-offset-px);--_vertical-right: initial;--_scrollbar-wrapper-y-right: calc(var(--viewport-width) - var(--_scrollbar-thickness))}:host[dir=rtl][position=invertY],:host[dir=rtl][position=invertAll]{--_vertical-right: var(--_scrollbar-offset-px);--_vertical-left: initial;--_scrollbar-wrapper-y-right: 0}:host[verticalUsed=true][horizontalUsed=true]{--_scrollbar-thickness-margin: calc(var(--INTERNAL-scrollbar-thickness) + var(--INTERNAL-scrollbar-offset) * 3);--_scrollbar-thickness-margin-px: calc(var(--_scrollbar-thickness-margin) * 1px)}:host[horizontalUsed=true]{--_vertical-top: var(--_scrollbar-offset-px);--_vertical-bottom: var(--_scrollbar-thickness-margin-px)}:host[horizontalUsed=true][position=invertX],:host[horizontalUsed=true][position=invertAll]{--_vertical-top: var(--_scrollbar-thickness-margin-px);--_vertical-bottom: var(--_scrollbar-offset-px)}:host[verticalUsed=true][dir=ltr]{--_horizontal-left: var(--_scrollbar-offset-px);--_horizontal-right: var(--_scrollbar-thickness-margin-px)}:host[verticalUsed=true][dir=rtl]{--_horizontal-left: var(--_scrollbar-thickness-margin-px);--_horizontal-right: var(--_scrollbar-offset-px)}:host[verticalUsed=true][position=invertY][dir=ltr],:host[verticalUsed=true][position=invertAll][dir=ltr]{--_horizontal-left: var(--_scrollbar-thickness-margin-px);--_horizontal-right: var(--_scrollbar-offset-px)}:host[verticalUsed=true][position=invertY][dir=rtl],:host[verticalUsed=true][position=invertAll][dir=rtl]{--_horizontal-left: var(--_scrollbar-offset-px);--_horizontal-right: var(--_scrollbar-thickness-margin-px)}:host[appearance=native][verticalUsed=true][dir=ltr]{--_viewport-padding-left: 0;--_viewport-padding-right: calc(var(--_scrollbar-thickness) * 1px)}:host[appearance=native][verticalUsed=true][dir=rtl]{--_viewport-padding-left: calc(var(--_scrollbar-thickness) * 1px);--_viewport-padding-right: 0}:host[appearance=native][verticalUsed=true][position=invertY][dir=ltr],:host[appearance=native][verticalUsed=true][position=invertAll][dir=ltr]{--_viewport-padding-left: calc(var(--_scrollbar-thickness) * 1px);--_viewport-padding-right: 0}:host[appearance=native][verticalUsed=true][position=invertY][dir=rtl],:host[appearance=native][verticalUsed=true][position=invertAll][dir=rtl]{--_viewport-padding-left: 0;--_viewport-padding-right: calc(var(--_scrollbar-thickness) * 1px)}:host[appearance=native][horizontalUsed=true]{--_viewport-padding-top: 0;--_viewport-padding-bottom: calc(var(--_scrollbar-thickness) * 1px)}:host[appearance=native][horizontalUsed=true][position=invertX],:host[appearance=native][horizontalUsed=true][position=invertAll]{--_viewport-padding-top: calc(var(--_scrollbar-thickness) * 1px);--_viewport-padding-bottom: 0}:host[visibility=hover]{--_scrollbar-hover-opacity: 0;--_scrollbar-opacity-transition: opacity var(--INTERNAL-scrollbar-hover-opacity-transition-leave-duration) var(--INTERNAL-scrollbar-hover-opacity-transition-leave-delay)}:host[visibility=hover]:hover,:host[visibility=hover]:active,:host[visibility=hover]:focus{--_scrollbar-hover-opacity: 1;--_scrollbar-opacity-transition: opacity var(--INTERNAL-scrollbar-hover-opacity-transition-enter-duration)}:host[dir=ltr] ::ng-deep .scroll-reached-trigger-element[trigger=start],:host[dir=ltr] ::ng-deep .scroll-dropped-trigger-element[trigger=start]{left:0;right:unset}:host[dir=ltr] ::ng-deep .scroll-reached-trigger-element[trigger=end],:host[dir=ltr] ::ng-deep .scroll-dropped-trigger-element[trigger=end]{right:0;left:unset}:host[dir=rtl] ::ng-deep .scroll-reached-trigger-element[trigger=start],:host[dir=rtl] ::ng-deep .scroll-dropped-trigger-element[trigger=start]{right:0;left:unset}:host[dir=rtl] ::ng-deep .scroll-reached-trigger-element[trigger=end],:host[dir=rtl] ::ng-deep .scroll-dropped-trigger-element[trigger=end]{left:0;right:unset}:host ::ng-deep .ng-scroll-reached-wrapper,:host ::ng-deep .ng-scroll-dropped-wrapper,:host ::ng-deep .scroll-reached-trigger-element,:host ::ng-deep .scroll-dropped-trigger-element{position:absolute;-webkit-user-select:none;user-select:none;pointer-events:none;z-index:-9999}:host ::ng-deep .ng-scroll-reached-wrapper,:host ::ng-deep .ng-scroll-dropped-wrapper{visibility:hidden;inset:0;min-width:calc(var(--viewport-width) * 1px);min-height:calc(var(--viewport-height) * 1px)}:host ::ng-deep [isHorizontallyScrollable=false] .scroll-reached-trigger-element[trigger=end],:host ::ng-deep [isHorizontallyScrollable=false] .scroll-dropped-trigger-element[trigger=end]{display:none}:host ::ng-deep [isVerticallyScrollable=false] .scroll-reached-trigger-element[trigger=bottom],:host ::ng-deep [isVerticallyScrollable=false] .scroll-dropped-trigger-element[trigger=bottom]{display:none}:host ::ng-deep .scroll-reached-trigger-element{background:red}:host ::ng-deep .scroll-reached-trigger-element[trigger=top],:host ::ng-deep .scroll-reached-trigger-element[trigger=bottom]{left:0;right:0}:host ::ng-deep .scroll-reached-trigger-element[trigger=start],:host ::ng-deep .scroll-reached-trigger-element[trigger=end]{top:0;bottom:0}:host ::ng-deep .scroll-reached-trigger-element[trigger=top]{top:0;height:var(--reached-offset-top)}:host ::ng-deep .scroll-reached-trigger-element[trigger=bottom]{bottom:0;height:var(--reached-offset-bottom)}:host ::ng-deep .scroll-reached-trigger-element[trigger=start]{width:var(--reached-offset-start)}:host ::ng-deep .scroll-reached-trigger-element[trigger=end]{width:var(--reached-offset-end)}:host .scroll-dropped-trigger-element{background:#00f}:host .scroll-dropped-trigger-element[trigger=top],:host .scroll-dropped-trigger-element[trigger=bottom]{left:0;right:0}:host .scroll-dropped-trigger-element[trigger=start],:host .scroll-dropped-trigger-element[trigger=end]{top:0;bottom:0}:host .scroll-dropped-trigger-element[trigger=top]{top:0;height:var(--dropped-offset-top)}:host .scroll-dropped-trigger-element[trigger=bottom]{bottom:0;height:var(--dropped-offset-bottom)}:host .scroll-dropped-trigger-element[trigger=start]{width:var(--dropped-offset-start)}:host .scroll-dropped-trigger-element[trigger=end]{width:var(--dropped-offset-end)}:host[verticalUsed=true]{--_timeline-scope: --scrollerY;--_animation-timeline-y: --scrollerY;--_viewport_scroll-timeline: --scrollerY y}:host[horizontalUsed=true]{--_timeline-scope: --scrollerX;--_animation-timeline-x: --scrollerX;--_viewport_scroll-timeline: --scrollerX x}:host[verticalUsed=true][horizontalUsed=true]{--_timeline-scope: --scrollerX, --scrollerY;--_viewport_scroll-timeline: --scrollerX x, --scrollerY y}:host[orientation=vertical]{--_viewport-overflow: hidden auto;--_scrollbar-content-width: unset}:host[orientation=horizontal]{--_viewport-overflow: auto hidden}:host[disableInteraction=true]{--_viewport-pointer-events: none;--_scrollbar-pointer-events: none}:host[isVerticallyScrollable=false]{--_vertical-thumb-display: none}:host[isHorizontallyScrollable=false]{--_horizontal-thumb-display: none}:host[dragging=x],:host[dragging=y]{--_viewport-user-select: none}:host[dragging=x]{--_track-x-thickness: calc(var(--INTERNAL-scrollbar-hover-thickness) * 1px);--_thumb-x-color: var(var(--INTERNAL-scrollbar-thumb-min-size))}:host[dragging=y]{--_track-y-thickness: calc(var(--INTERNAL-scrollbar-hover-thickness) * 1px);--_thumb-y-color: var(var(--INTERNAL-scrollbar-thumb-min-size))}:host[mobile=true]{--_viewport-overscroll-behavior: var(--INTERNAL-scrollbar-mobile-overscroll-behavior)}\n"] }]
        }], ctorParameters: () => [] });

class NgScrollbarExt extends NgScrollbarCore {
    constructor() {
        // Using `afterRenderEffect` would run twice, one when viewport directive is detected
        // and one when content wrapper is detected, therefore `effect` is better because it runs only once.
        effect(() => {
            const viewportElement = this.viewportElement();
            const contentWrapperElement = this.contentWrapperElement();
            const spacerElement = this.spacerElement();
            const viewportError = this.viewportError();
            const contentWrapperError = this.contentWrapperError();
            const spacerError = this.spacerError();
            untracked(() => {
                if (!this.skipInit) {
                    const error = viewportError || contentWrapperError || spacerError;
                    if (error) {
                        console.error(error);
                    }
                    else {
                        this.initialize(viewportElement, contentWrapperElement, spacerElement);
                    }
                }
            });
        });
        super();
        this.renderer = inject(Renderer2);
        this.appRef = inject(ApplicationRef);
        this._scrollbars = signal(null);
        /**
         * Selector used to query the viewport element.
         */
        this.externalViewport = input();
        /**
         * Selector used to query the content wrapper element.
         */
        this.externalContentWrapper = input();
        /**
         * Selector used to query the spacer element (virtual scroll integration).
         * In the case of integrating the scrollbar with a virtual scroll component,
         * a spacer element is typically created to match the real size of the content.
         * The scrollbar will use the size of this spacer element for calculations instead of the content wrapper size.
         */
        this.externalSpacer = input();
        this.viewportElement = linkedSignal({
            source: this.externalViewport,
            // If viewport selector was defined, query the element
            computation: (selector) => this.getElement(selector) || this.customViewport()?.nativeElement
        });
        this.viewportError = computed(() => {
            return !this.viewportElement()
                ? `[NgScrollbar]: Could not find the viewport element for the provided selector "${this.externalViewport()}"`
                : null;
        });
        this.contentWrapperElement = linkedSignal({
            source: this.externalContentWrapper,
            computation: (selector) => this.getElement(selector)
        });
        this.contentWrapperError = computed(() => {
            return !this.contentWrapperElement() && this.externalContentWrapper()
                ? `[NgScrollbar]: Content wrapper element not found for the provided selector "${this.externalContentWrapper()}"`
                : null;
        });
        this.spacerElement = linkedSignal({
            source: this.externalSpacer,
            computation: (selector) => this.getElement(selector)
        });
        this.spacerError = computed(() => {
            return !this.spacerElement() && this.externalSpacer()
                ? `[NgScrollbar]: Spacer element not found for the provided selector "${this.externalSpacer()}"`
                : null;
        });
        /**
         * Reference to the external viewport directive if used
         */
        this.customViewport = contentChild(ScrollViewport, { descendants: true });
    }
    ngOnDestroy() {
        if (this._scrollbarsRef) {
            this.appRef.detachView(this._scrollbarsRef.hostView);
            this._scrollbarsRef.destroy();
        }
    }
    initialize(viewportElement, contentWrapperElement, spacerElement) {
        if (this.skipInit) {
            // If initialized via async detection, then we should set the signals
            this.viewportElement.set(viewportElement);
            this.contentWrapperElement.set(contentWrapperElement);
            this.spacerElement.set(spacerElement);
        }
        // If no external spacer and no content wrapper are provided, create a content wrapper element
        if (!spacerElement && !contentWrapperElement) {
            contentWrapperElement = this.renderer.createElement('div');
            // Move all content of the viewport into the content wrapper
            const childNodes = Array.from(viewportElement.childNodes);
            childNodes.forEach((node) => this.renderer.appendChild(contentWrapperElement, node));
            // Append the content wrapper to the viewport
            this.renderer.appendChild(viewportElement, contentWrapperElement);
        }
        // Make sure content wrapper element is defined to proceed
        if (contentWrapperElement) {
            // Initialize viewport
            this.viewport.init(viewportElement, contentWrapperElement, spacerElement);
            // Attach scrollbars
            this._attachScrollbars();
        }
    }
    _attachScrollbars() {
        // Create the scrollbars component
        this._scrollbarsRef = createComponent(Scrollbars, {
            environmentInjector: this.appRef.injector,
            elementInjector: Injector.create({ providers: [{ provide: NG_SCROLLBAR, useValue: this }] })
        });
        // Attach scrollbar to the content wrapper
        this.renderer.appendChild(this.viewport.contentWrapperElement, this._scrollbarsRef.location.nativeElement);
        // Attach the host view of the component to the main change detection tree, so that its lifecycle hooks run.
        this.appRef.attachView(this._scrollbarsRef.hostView);
        // Set the scrollbars instance
        this._scrollbars.set(this._scrollbarsRef.instance);
    }
    getElement(selector) {
        return selector ? this.nativeElement.querySelector(selector) : null;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.1.1", ngImport: i0, type: NgScrollbarExt, deps: [], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.2.0", version: "19.1.1", type: NgScrollbarExt, isStandalone: true, selector: "ng-scrollbar[externalViewport]", inputs: { externalViewport: { classPropertyName: "externalViewport", publicName: "externalViewport", isSignal: true, isRequired: false, transformFunction: null }, externalContentWrapper: { classPropertyName: "externalContentWrapper", publicName: "externalContentWrapper", isSignal: true, isRequired: false, transformFunction: null }, externalSpacer: { classPropertyName: "externalSpacer", publicName: "externalSpacer", isSignal: true, isRequired: false, transformFunction: null } }, host: { attributes: { "ngSkipHydration": "true" }, properties: { "class.ng-scrollbar-external-viewport": "true" } }, providers: [
            { provide: NG_SCROLLBAR, useExisting: NgScrollbarExt },
            { provide: NgScrollbarCore, useExisting: NgScrollbar },
            ViewportAdapter
        ], queries: [{ propertyName: "customViewport", first: true, predicate: ScrollViewport, descendants: true, isSignal: true }], exportAs: ["ngScrollbar"], usesInheritance: true, ngImport: i0, template: '<ng-content/>', isInline: true, styles: [":host{display:block;position:relative;max-height:100%;max-width:100%;--INTERNAL-scrollbar-border-radius: var(--scrollbar-border-radius, 0px);--INTERNAL-scrollbar-thickness: var(--scrollbar-thickness, 5);--INTERNAL-scrollbar-offset: var(--scrollbar-offset, 0);--INTERNAL-scrollbar-track-wrapper-transition: var(--scrollbar-track-wrapper-transition, width 60ms linear, height 60ms linear);--INTERNAL-scrollbar-track-color: var(--scrollbar-track-color, transparent);--INTERNAL-scrollbar-thumb-color: var(--scrollbar-thumb-color, rgb(0 0 0 / 20%));--INTERNAL-scrollbar-thumb-hover-color: var(--scrollbar-thumb-hover-color, var(--INTERNAL-scrollbar-thumb-color));--INTERNAL-scrollbar-hover-thickness: var(--scrollbar-hover-thickness, var(--INTERNAL-scrollbar-thickness));--INTERNAL-scrollbar-thumb-transition: var(--scrollbar-thumb-transition, none);--INTERNAL-scrollbar-thumb-min-size: var(--scrollbar-thumb-min-size, 20);--INTERNAL-scrollbar-button-color: var(--scrollbar-button-color, var(--INTERNAL-scrollbar-thumb-color));--INTERNAL-scrollbar-button-hover-color: var(--scrollbar-button-hover-color, var(--INTERNAL-scrollbar-button-color));--INTERNAL-scrollbar-button-active-color: var(--scrollbar-button-active-color, var(--INTERNAL-scrollbar-button-hover-color));--INTERNAL-scrollbar-button-fill: var(--scrollbar-button-fill, white);--INTERNAL-scrollbar-button-hover-fill: var(--scrollbar-button-hover-fill, var(--INTERNAL-scrollbar-button-fill));--INTERNAL-scrollbar-button-active-fill: var(--scrollbar-button-active-fill, var(--INTERNAL-scrollbar-button-hover-fill));--INTERNAL-scrollbar-button-size: var(--scrollbar-button-size, 20px);--INTERNAL-scrollbar-hover-opacity-transition-enter-duration: var(--scrollbar-hover-opacity-transition-enter-duration, 0);--INTERNAL-scrollbar-hover-opacity-transition-leave-duration: var(--scrollbar-hover-opacity-transition-leave-duration, .4s);--INTERNAL-scrollbar-hover-opacity-transition-leave-delay: var(--scrollbar-hover-opacity-transition-leave-delay, 1s);--INTERNAL-scrollbar-overscroll-behavior: var(--scrollbar-overscroll-behavior, initial);--INTERNAL-scrollbar-mobile-overscroll-behavior: var(--scrollbar-mobile-overscroll-behavior, none);--_scrollbar-thickness: calc(var(--INTERNAL-scrollbar-thickness) + var(--INTERNAL-scrollbar-offset) * 2);--_scrollbar-pointer-events: auto;--_scrollbar-offset-px: calc(var(--INTERNAL-scrollbar-offset) * 1px);--_scrollbar-thickness-px: calc(var(--INTERNAL-scrollbar-thickness) * 1px);--_scrollbar-hover-thickness-px: calc(var(--INTERNAL-scrollbar-hover-thickness) * 1px);--_viewport-padding-top: 0;--_viewport-padding-bottom: 0;--_viewport-padding-left: 0;--_viewport-padding-right: 0;--_horizontal-thumb-display: block;--_vertical-thumb-display: block;--_viewport-overflow: auto;--_viewport-pointer-events: auto;--_thumb-x-color: var(--INTERNAL-scrollbar-thumb-color);--_thumb-y-color: var(--INTERNAL-scrollbar-thumb-color);--_track-y-thickness: var(--_scrollbar-thickness-px);--_track-x-thickness: var(--_scrollbar-thickness-px);--_viewport-overscroll-behavior: var(--INTERNAL-scrollbar-overscroll-behavior);--_scrollbar-content-width: fit-content}:host{--_spacer-width: var(--spacer-width);--_spacer-height: var(--spacer-height);--_vertical-top: var(--_scrollbar-offset-px);--_vertical-bottom: var(--_scrollbar-offset-px);--_horizontal-left: var(--_scrollbar-offset-px);--_horizontal-right: var(--_scrollbar-offset-px);--_horizontal-top: initial;--_horizontal-bottom: var(--_scrollbar-offset-px);--_scrollbar-wrapper-x-top: calc(var(--viewport-height) - var(--_scrollbar-thickness));--reached-offset: 1px;--reached-offset-top: var(--reached-offset);--reached-offset-bottom: var(--reached-offset);--reached-offset-start: var(--reached-offset);--reached-offset-end: var(--reached-offset);--dropped-offset: 1px;--dropped-offset-top: var(--dropped-offset);--dropped-offset-bottom: var(--dropped-offset);--dropped-offset-start: var(--dropped-offset);--dropped-offset-end: var(--dropped-offset);--_viewport_scroll-timeline: unset;--_animation-timeline-y: unset;--_scrollbar-y-thumb-transform-to-value: unset;--_scrollbar-x-thumb-transform-to-value: unset;--_scrollbar-thumb-transform-from: unset;--_scrollbar-thumb-transform-to: unset}:host.ng-scrollbar-external-viewport ::ng-deep .ng-scroll-viewport{min-height:100%;min-width:100%;height:100%;max-height:100%;max-width:100%}:host.ng-scroll-viewport,:host.ng-scrollbar-external-viewport ::ng-deep .ng-scroll-viewport{position:relative;overflow:var(--_viewport-overflow);scroll-timeline:var(--_viewport_scroll-timeline);box-sizing:border-box!important;-webkit-overflow-scrolling:touch;will-change:scroll-position;-webkit-user-select:var(--_viewport-user-select);user-select:var(--_viewport-user-select);overscroll-behavior:var(--_viewport-overscroll-behavior);pointer-events:var(--_viewport-pointer-events)}:host.ng-scroll-viewport>.ng-scroll-content,:host.ng-scrollbar-external-viewport ::ng-deep .ng-scroll-viewport>.ng-scroll-content{width:var(--_scrollbar-content-width);z-index:1;min-width:100%;min-height:100%;contain:content;padding:var(--_viewport-padding-top, 0) var(--_viewport-padding-right, 0) var(--_viewport-padding-bottom, 0) var(--_viewport-padding-left, 0)}:host[appearance=native]{--_spacer-width: calc(var(--spacer-width) + var(--_scrollbar-thickness));--_spacer-height: calc(var(--spacer-height) + var(--_scrollbar-thickness))}:host.ng-scroll-viewport>.ng-scroll-spacer,:host.ng-scrollbar-external-viewport ::ng-deep .ng-scroll-viewport>.ng-scroll-spacer{position:relative;width:calc(var(--_spacer-width) * 1px);height:calc(var(--_spacer-height) * 1px)}:host.ng-scroll-viewport,:host.ng-scrollbar-external-viewport ::ng-deep .ng-scroll-viewport{scrollbar-width:none!important}:host.ng-scroll-viewport::-webkit-scrollbar,:host.ng-scrollbar-external-viewport ::ng-deep .ng-scroll-viewport::-webkit-scrollbar{display:none!important}:host[position=invertX],:host[position=invertAll]{--_horizontal-top: var(--_scrollbar-offset-px);--_horizontal-bottom: initial;--_scrollbar-wrapper-x-top: 0}:host[dir=ltr]{--_scrollbar-wrapper-y-right: initial;--_vertical-right: var(--_scrollbar-offset-px);--_vertical-left: initial;--_scrollbar-wrapper-y-left: calc(var(--viewport-width) - var(--_scrollbar-thickness))}:host[dir=ltr][position=invertY],:host[dir=ltr][position=invertAll]{--_vertical-left: var(--_scrollbar-offset-px);--_vertical-right: initial;--_scrollbar-wrapper-y-left: 0}:host[dir=rtl]{--_scrollbar-wrapper-y-left: initial;--_vertical-left: var(--_scrollbar-offset-px);--_vertical-right: initial;--_scrollbar-wrapper-y-right: calc(var(--viewport-width) - var(--_scrollbar-thickness))}:host[dir=rtl][position=invertY],:host[dir=rtl][position=invertAll]{--_vertical-right: var(--_scrollbar-offset-px);--_vertical-left: initial;--_scrollbar-wrapper-y-right: 0}:host[verticalUsed=true][horizontalUsed=true]{--_scrollbar-thickness-margin: calc(var(--INTERNAL-scrollbar-thickness) + var(--INTERNAL-scrollbar-offset) * 3);--_scrollbar-thickness-margin-px: calc(var(--_scrollbar-thickness-margin) * 1px)}:host[horizontalUsed=true]{--_vertical-top: var(--_scrollbar-offset-px);--_vertical-bottom: var(--_scrollbar-thickness-margin-px)}:host[horizontalUsed=true][position=invertX],:host[horizontalUsed=true][position=invertAll]{--_vertical-top: var(--_scrollbar-thickness-margin-px);--_vertical-bottom: var(--_scrollbar-offset-px)}:host[verticalUsed=true][dir=ltr]{--_horizontal-left: var(--_scrollbar-offset-px);--_horizontal-right: var(--_scrollbar-thickness-margin-px)}:host[verticalUsed=true][dir=rtl]{--_horizontal-left: var(--_scrollbar-thickness-margin-px);--_horizontal-right: var(--_scrollbar-offset-px)}:host[verticalUsed=true][position=invertY][dir=ltr],:host[verticalUsed=true][position=invertAll][dir=ltr]{--_horizontal-left: var(--_scrollbar-thickness-margin-px);--_horizontal-right: var(--_scrollbar-offset-px)}:host[verticalUsed=true][position=invertY][dir=rtl],:host[verticalUsed=true][position=invertAll][dir=rtl]{--_horizontal-left: var(--_scrollbar-offset-px);--_horizontal-right: var(--_scrollbar-thickness-margin-px)}:host[appearance=native][verticalUsed=true][dir=ltr]{--_viewport-padding-left: 0;--_viewport-padding-right: calc(var(--_scrollbar-thickness) * 1px)}:host[appearance=native][verticalUsed=true][dir=rtl]{--_viewport-padding-left: calc(var(--_scrollbar-thickness) * 1px);--_viewport-padding-right: 0}:host[appearance=native][verticalUsed=true][position=invertY][dir=ltr],:host[appearance=native][verticalUsed=true][position=invertAll][dir=ltr]{--_viewport-padding-left: calc(var(--_scrollbar-thickness) * 1px);--_viewport-padding-right: 0}:host[appearance=native][verticalUsed=true][position=invertY][dir=rtl],:host[appearance=native][verticalUsed=true][position=invertAll][dir=rtl]{--_viewport-padding-left: 0;--_viewport-padding-right: calc(var(--_scrollbar-thickness) * 1px)}:host[appearance=native][horizontalUsed=true]{--_viewport-padding-top: 0;--_viewport-padding-bottom: calc(var(--_scrollbar-thickness) * 1px)}:host[appearance=native][horizontalUsed=true][position=invertX],:host[appearance=native][horizontalUsed=true][position=invertAll]{--_viewport-padding-top: calc(var(--_scrollbar-thickness) * 1px);--_viewport-padding-bottom: 0}:host[visibility=hover]{--_scrollbar-hover-opacity: 0;--_scrollbar-opacity-transition: opacity var(--INTERNAL-scrollbar-hover-opacity-transition-leave-duration) var(--INTERNAL-scrollbar-hover-opacity-transition-leave-delay)}:host[visibility=hover]:hover,:host[visibility=hover]:active,:host[visibility=hover]:focus{--_scrollbar-hover-opacity: 1;--_scrollbar-opacity-transition: opacity var(--INTERNAL-scrollbar-hover-opacity-transition-enter-duration)}:host[dir=ltr] ::ng-deep .scroll-reached-trigger-element[trigger=start],:host[dir=ltr] ::ng-deep .scroll-dropped-trigger-element[trigger=start]{left:0;right:unset}:host[dir=ltr] ::ng-deep .scroll-reached-trigger-element[trigger=end],:host[dir=ltr] ::ng-deep .scroll-dropped-trigger-element[trigger=end]{right:0;left:unset}:host[dir=rtl] ::ng-deep .scroll-reached-trigger-element[trigger=start],:host[dir=rtl] ::ng-deep .scroll-dropped-trigger-element[trigger=start]{right:0;left:unset}:host[dir=rtl] ::ng-deep .scroll-reached-trigger-element[trigger=end],:host[dir=rtl] ::ng-deep .scroll-dropped-trigger-element[trigger=end]{left:0;right:unset}:host ::ng-deep .ng-scroll-reached-wrapper,:host ::ng-deep .ng-scroll-dropped-wrapper,:host ::ng-deep .scroll-reached-trigger-element,:host ::ng-deep .scroll-dropped-trigger-element{position:absolute;-webkit-user-select:none;user-select:none;pointer-events:none;z-index:-9999}:host ::ng-deep .ng-scroll-reached-wrapper,:host ::ng-deep .ng-scroll-dropped-wrapper{visibility:hidden;inset:0;min-width:calc(var(--viewport-width) * 1px);min-height:calc(var(--viewport-height) * 1px)}:host ::ng-deep [isHorizontallyScrollable=false] .scroll-reached-trigger-element[trigger=end],:host ::ng-deep [isHorizontallyScrollable=false] .scroll-dropped-trigger-element[trigger=end]{display:none}:host ::ng-deep [isVerticallyScrollable=false] .scroll-reached-trigger-element[trigger=bottom],:host ::ng-deep [isVerticallyScrollable=false] .scroll-dropped-trigger-element[trigger=bottom]{display:none}:host ::ng-deep .scroll-reached-trigger-element{background:red}:host ::ng-deep .scroll-reached-trigger-element[trigger=top],:host ::ng-deep .scroll-reached-trigger-element[trigger=bottom]{left:0;right:0}:host ::ng-deep .scroll-reached-trigger-element[trigger=start],:host ::ng-deep .scroll-reached-trigger-element[trigger=end]{top:0;bottom:0}:host ::ng-deep .scroll-reached-trigger-element[trigger=top]{top:0;height:var(--reached-offset-top)}:host ::ng-deep .scroll-reached-trigger-element[trigger=bottom]{bottom:0;height:var(--reached-offset-bottom)}:host ::ng-deep .scroll-reached-trigger-element[trigger=start]{width:var(--reached-offset-start)}:host ::ng-deep .scroll-reached-trigger-element[trigger=end]{width:var(--reached-offset-end)}:host .scroll-dropped-trigger-element{background:#00f}:host .scroll-dropped-trigger-element[trigger=top],:host .scroll-dropped-trigger-element[trigger=bottom]{left:0;right:0}:host .scroll-dropped-trigger-element[trigger=start],:host .scroll-dropped-trigger-element[trigger=end]{top:0;bottom:0}:host .scroll-dropped-trigger-element[trigger=top]{top:0;height:var(--dropped-offset-top)}:host .scroll-dropped-trigger-element[trigger=bottom]{bottom:0;height:var(--dropped-offset-bottom)}:host .scroll-dropped-trigger-element[trigger=start]{width:var(--dropped-offset-start)}:host .scroll-dropped-trigger-element[trigger=end]{width:var(--dropped-offset-end)}:host[verticalUsed=true]{--_timeline-scope: --scrollerY;--_animation-timeline-y: --scrollerY;--_viewport_scroll-timeline: --scrollerY y}:host[horizontalUsed=true]{--_timeline-scope: --scrollerX;--_animation-timeline-x: --scrollerX;--_viewport_scroll-timeline: --scrollerX x}:host[verticalUsed=true][horizontalUsed=true]{--_timeline-scope: --scrollerX, --scrollerY;--_viewport_scroll-timeline: --scrollerX x, --scrollerY y}:host[orientation=vertical]{--_viewport-overflow: hidden auto;--_scrollbar-content-width: unset}:host[orientation=horizontal]{--_viewport-overflow: auto hidden}:host[disableInteraction=true]{--_viewport-pointer-events: none;--_scrollbar-pointer-events: none}:host[isVerticallyScrollable=false]{--_vertical-thumb-display: none}:host[isHorizontallyScrollable=false]{--_horizontal-thumb-display: none}:host[dragging=x],:host[dragging=y]{--_viewport-user-select: none}:host[dragging=x]{--_track-x-thickness: calc(var(--INTERNAL-scrollbar-hover-thickness) * 1px);--_thumb-x-color: var(var(--INTERNAL-scrollbar-thumb-min-size))}:host[dragging=y]{--_track-y-thickness: calc(var(--INTERNAL-scrollbar-hover-thickness) * 1px);--_thumb-y-color: var(var(--INTERNAL-scrollbar-thumb-min-size))}:host[mobile=true]{--_viewport-overscroll-behavior: var(--INTERNAL-scrollbar-mobile-overscroll-behavior)}\n"], changeDetection: i0.ChangeDetectionStrategy.OnPush }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.1.1", ngImport: i0, type: NgScrollbarExt, decorators: [{
            type: Component,
            args: [{ standalone: true, selector: 'ng-scrollbar[externalViewport]', exportAs: 'ngScrollbar', template: '<ng-content/>', changeDetection: ChangeDetectionStrategy.OnPush, host: {
                        // This component appends a content wrapper element to the viewport
                        // A hydration mismatch error will be thrown (NG0500) during DOM manipulation.
                        // To avoid this error, the 'ngSkipHydration' attribute is added to skip hydration.
                        ngSkipHydration: 'true',
                        '[class.ng-scrollbar-external-viewport]': 'true'
                    }, providers: [
                        { provide: NG_SCROLLBAR, useExisting: NgScrollbarExt },
                        { provide: NgScrollbarCore, useExisting: NgScrollbar },
                        ViewportAdapter
                    ], styles: [":host{display:block;position:relative;max-height:100%;max-width:100%;--INTERNAL-scrollbar-border-radius: var(--scrollbar-border-radius, 0px);--INTERNAL-scrollbar-thickness: var(--scrollbar-thickness, 5);--INTERNAL-scrollbar-offset: var(--scrollbar-offset, 0);--INTERNAL-scrollbar-track-wrapper-transition: var(--scrollbar-track-wrapper-transition, width 60ms linear, height 60ms linear);--INTERNAL-scrollbar-track-color: var(--scrollbar-track-color, transparent);--INTERNAL-scrollbar-thumb-color: var(--scrollbar-thumb-color, rgb(0 0 0 / 20%));--INTERNAL-scrollbar-thumb-hover-color: var(--scrollbar-thumb-hover-color, var(--INTERNAL-scrollbar-thumb-color));--INTERNAL-scrollbar-hover-thickness: var(--scrollbar-hover-thickness, var(--INTERNAL-scrollbar-thickness));--INTERNAL-scrollbar-thumb-transition: var(--scrollbar-thumb-transition, none);--INTERNAL-scrollbar-thumb-min-size: var(--scrollbar-thumb-min-size, 20);--INTERNAL-scrollbar-button-color: var(--scrollbar-button-color, var(--INTERNAL-scrollbar-thumb-color));--INTERNAL-scrollbar-button-hover-color: var(--scrollbar-button-hover-color, var(--INTERNAL-scrollbar-button-color));--INTERNAL-scrollbar-button-active-color: var(--scrollbar-button-active-color, var(--INTERNAL-scrollbar-button-hover-color));--INTERNAL-scrollbar-button-fill: var(--scrollbar-button-fill, white);--INTERNAL-scrollbar-button-hover-fill: var(--scrollbar-button-hover-fill, var(--INTERNAL-scrollbar-button-fill));--INTERNAL-scrollbar-button-active-fill: var(--scrollbar-button-active-fill, var(--INTERNAL-scrollbar-button-hover-fill));--INTERNAL-scrollbar-button-size: var(--scrollbar-button-size, 20px);--INTERNAL-scrollbar-hover-opacity-transition-enter-duration: var(--scrollbar-hover-opacity-transition-enter-duration, 0);--INTERNAL-scrollbar-hover-opacity-transition-leave-duration: var(--scrollbar-hover-opacity-transition-leave-duration, .4s);--INTERNAL-scrollbar-hover-opacity-transition-leave-delay: var(--scrollbar-hover-opacity-transition-leave-delay, 1s);--INTERNAL-scrollbar-overscroll-behavior: var(--scrollbar-overscroll-behavior, initial);--INTERNAL-scrollbar-mobile-overscroll-behavior: var(--scrollbar-mobile-overscroll-behavior, none);--_scrollbar-thickness: calc(var(--INTERNAL-scrollbar-thickness) + var(--INTERNAL-scrollbar-offset) * 2);--_scrollbar-pointer-events: auto;--_scrollbar-offset-px: calc(var(--INTERNAL-scrollbar-offset) * 1px);--_scrollbar-thickness-px: calc(var(--INTERNAL-scrollbar-thickness) * 1px);--_scrollbar-hover-thickness-px: calc(var(--INTERNAL-scrollbar-hover-thickness) * 1px);--_viewport-padding-top: 0;--_viewport-padding-bottom: 0;--_viewport-padding-left: 0;--_viewport-padding-right: 0;--_horizontal-thumb-display: block;--_vertical-thumb-display: block;--_viewport-overflow: auto;--_viewport-pointer-events: auto;--_thumb-x-color: var(--INTERNAL-scrollbar-thumb-color);--_thumb-y-color: var(--INTERNAL-scrollbar-thumb-color);--_track-y-thickness: var(--_scrollbar-thickness-px);--_track-x-thickness: var(--_scrollbar-thickness-px);--_viewport-overscroll-behavior: var(--INTERNAL-scrollbar-overscroll-behavior);--_scrollbar-content-width: fit-content}:host{--_spacer-width: var(--spacer-width);--_spacer-height: var(--spacer-height);--_vertical-top: var(--_scrollbar-offset-px);--_vertical-bottom: var(--_scrollbar-offset-px);--_horizontal-left: var(--_scrollbar-offset-px);--_horizontal-right: var(--_scrollbar-offset-px);--_horizontal-top: initial;--_horizontal-bottom: var(--_scrollbar-offset-px);--_scrollbar-wrapper-x-top: calc(var(--viewport-height) - var(--_scrollbar-thickness));--reached-offset: 1px;--reached-offset-top: var(--reached-offset);--reached-offset-bottom: var(--reached-offset);--reached-offset-start: var(--reached-offset);--reached-offset-end: var(--reached-offset);--dropped-offset: 1px;--dropped-offset-top: var(--dropped-offset);--dropped-offset-bottom: var(--dropped-offset);--dropped-offset-start: var(--dropped-offset);--dropped-offset-end: var(--dropped-offset);--_viewport_scroll-timeline: unset;--_animation-timeline-y: unset;--_scrollbar-y-thumb-transform-to-value: unset;--_scrollbar-x-thumb-transform-to-value: unset;--_scrollbar-thumb-transform-from: unset;--_scrollbar-thumb-transform-to: unset}:host.ng-scrollbar-external-viewport ::ng-deep .ng-scroll-viewport{min-height:100%;min-width:100%;height:100%;max-height:100%;max-width:100%}:host.ng-scroll-viewport,:host.ng-scrollbar-external-viewport ::ng-deep .ng-scroll-viewport{position:relative;overflow:var(--_viewport-overflow);scroll-timeline:var(--_viewport_scroll-timeline);box-sizing:border-box!important;-webkit-overflow-scrolling:touch;will-change:scroll-position;-webkit-user-select:var(--_viewport-user-select);user-select:var(--_viewport-user-select);overscroll-behavior:var(--_viewport-overscroll-behavior);pointer-events:var(--_viewport-pointer-events)}:host.ng-scroll-viewport>.ng-scroll-content,:host.ng-scrollbar-external-viewport ::ng-deep .ng-scroll-viewport>.ng-scroll-content{width:var(--_scrollbar-content-width);z-index:1;min-width:100%;min-height:100%;contain:content;padding:var(--_viewport-padding-top, 0) var(--_viewport-padding-right, 0) var(--_viewport-padding-bottom, 0) var(--_viewport-padding-left, 0)}:host[appearance=native]{--_spacer-width: calc(var(--spacer-width) + var(--_scrollbar-thickness));--_spacer-height: calc(var(--spacer-height) + var(--_scrollbar-thickness))}:host.ng-scroll-viewport>.ng-scroll-spacer,:host.ng-scrollbar-external-viewport ::ng-deep .ng-scroll-viewport>.ng-scroll-spacer{position:relative;width:calc(var(--_spacer-width) * 1px);height:calc(var(--_spacer-height) * 1px)}:host.ng-scroll-viewport,:host.ng-scrollbar-external-viewport ::ng-deep .ng-scroll-viewport{scrollbar-width:none!important}:host.ng-scroll-viewport::-webkit-scrollbar,:host.ng-scrollbar-external-viewport ::ng-deep .ng-scroll-viewport::-webkit-scrollbar{display:none!important}:host[position=invertX],:host[position=invertAll]{--_horizontal-top: var(--_scrollbar-offset-px);--_horizontal-bottom: initial;--_scrollbar-wrapper-x-top: 0}:host[dir=ltr]{--_scrollbar-wrapper-y-right: initial;--_vertical-right: var(--_scrollbar-offset-px);--_vertical-left: initial;--_scrollbar-wrapper-y-left: calc(var(--viewport-width) - var(--_scrollbar-thickness))}:host[dir=ltr][position=invertY],:host[dir=ltr][position=invertAll]{--_vertical-left: var(--_scrollbar-offset-px);--_vertical-right: initial;--_scrollbar-wrapper-y-left: 0}:host[dir=rtl]{--_scrollbar-wrapper-y-left: initial;--_vertical-left: var(--_scrollbar-offset-px);--_vertical-right: initial;--_scrollbar-wrapper-y-right: calc(var(--viewport-width) - var(--_scrollbar-thickness))}:host[dir=rtl][position=invertY],:host[dir=rtl][position=invertAll]{--_vertical-right: var(--_scrollbar-offset-px);--_vertical-left: initial;--_scrollbar-wrapper-y-right: 0}:host[verticalUsed=true][horizontalUsed=true]{--_scrollbar-thickness-margin: calc(var(--INTERNAL-scrollbar-thickness) + var(--INTERNAL-scrollbar-offset) * 3);--_scrollbar-thickness-margin-px: calc(var(--_scrollbar-thickness-margin) * 1px)}:host[horizontalUsed=true]{--_vertical-top: var(--_scrollbar-offset-px);--_vertical-bottom: var(--_scrollbar-thickness-margin-px)}:host[horizontalUsed=true][position=invertX],:host[horizontalUsed=true][position=invertAll]{--_vertical-top: var(--_scrollbar-thickness-margin-px);--_vertical-bottom: var(--_scrollbar-offset-px)}:host[verticalUsed=true][dir=ltr]{--_horizontal-left: var(--_scrollbar-offset-px);--_horizontal-right: var(--_scrollbar-thickness-margin-px)}:host[verticalUsed=true][dir=rtl]{--_horizontal-left: var(--_scrollbar-thickness-margin-px);--_horizontal-right: var(--_scrollbar-offset-px)}:host[verticalUsed=true][position=invertY][dir=ltr],:host[verticalUsed=true][position=invertAll][dir=ltr]{--_horizontal-left: var(--_scrollbar-thickness-margin-px);--_horizontal-right: var(--_scrollbar-offset-px)}:host[verticalUsed=true][position=invertY][dir=rtl],:host[verticalUsed=true][position=invertAll][dir=rtl]{--_horizontal-left: var(--_scrollbar-offset-px);--_horizontal-right: var(--_scrollbar-thickness-margin-px)}:host[appearance=native][verticalUsed=true][dir=ltr]{--_viewport-padding-left: 0;--_viewport-padding-right: calc(var(--_scrollbar-thickness) * 1px)}:host[appearance=native][verticalUsed=true][dir=rtl]{--_viewport-padding-left: calc(var(--_scrollbar-thickness) * 1px);--_viewport-padding-right: 0}:host[appearance=native][verticalUsed=true][position=invertY][dir=ltr],:host[appearance=native][verticalUsed=true][position=invertAll][dir=ltr]{--_viewport-padding-left: calc(var(--_scrollbar-thickness) * 1px);--_viewport-padding-right: 0}:host[appearance=native][verticalUsed=true][position=invertY][dir=rtl],:host[appearance=native][verticalUsed=true][position=invertAll][dir=rtl]{--_viewport-padding-left: 0;--_viewport-padding-right: calc(var(--_scrollbar-thickness) * 1px)}:host[appearance=native][horizontalUsed=true]{--_viewport-padding-top: 0;--_viewport-padding-bottom: calc(var(--_scrollbar-thickness) * 1px)}:host[appearance=native][horizontalUsed=true][position=invertX],:host[appearance=native][horizontalUsed=true][position=invertAll]{--_viewport-padding-top: calc(var(--_scrollbar-thickness) * 1px);--_viewport-padding-bottom: 0}:host[visibility=hover]{--_scrollbar-hover-opacity: 0;--_scrollbar-opacity-transition: opacity var(--INTERNAL-scrollbar-hover-opacity-transition-leave-duration) var(--INTERNAL-scrollbar-hover-opacity-transition-leave-delay)}:host[visibility=hover]:hover,:host[visibility=hover]:active,:host[visibility=hover]:focus{--_scrollbar-hover-opacity: 1;--_scrollbar-opacity-transition: opacity var(--INTERNAL-scrollbar-hover-opacity-transition-enter-duration)}:host[dir=ltr] ::ng-deep .scroll-reached-trigger-element[trigger=start],:host[dir=ltr] ::ng-deep .scroll-dropped-trigger-element[trigger=start]{left:0;right:unset}:host[dir=ltr] ::ng-deep .scroll-reached-trigger-element[trigger=end],:host[dir=ltr] ::ng-deep .scroll-dropped-trigger-element[trigger=end]{right:0;left:unset}:host[dir=rtl] ::ng-deep .scroll-reached-trigger-element[trigger=start],:host[dir=rtl] ::ng-deep .scroll-dropped-trigger-element[trigger=start]{right:0;left:unset}:host[dir=rtl] ::ng-deep .scroll-reached-trigger-element[trigger=end],:host[dir=rtl] ::ng-deep .scroll-dropped-trigger-element[trigger=end]{left:0;right:unset}:host ::ng-deep .ng-scroll-reached-wrapper,:host ::ng-deep .ng-scroll-dropped-wrapper,:host ::ng-deep .scroll-reached-trigger-element,:host ::ng-deep .scroll-dropped-trigger-element{position:absolute;-webkit-user-select:none;user-select:none;pointer-events:none;z-index:-9999}:host ::ng-deep .ng-scroll-reached-wrapper,:host ::ng-deep .ng-scroll-dropped-wrapper{visibility:hidden;inset:0;min-width:calc(var(--viewport-width) * 1px);min-height:calc(var(--viewport-height) * 1px)}:host ::ng-deep [isHorizontallyScrollable=false] .scroll-reached-trigger-element[trigger=end],:host ::ng-deep [isHorizontallyScrollable=false] .scroll-dropped-trigger-element[trigger=end]{display:none}:host ::ng-deep [isVerticallyScrollable=false] .scroll-reached-trigger-element[trigger=bottom],:host ::ng-deep [isVerticallyScrollable=false] .scroll-dropped-trigger-element[trigger=bottom]{display:none}:host ::ng-deep .scroll-reached-trigger-element{background:red}:host ::ng-deep .scroll-reached-trigger-element[trigger=top],:host ::ng-deep .scroll-reached-trigger-element[trigger=bottom]{left:0;right:0}:host ::ng-deep .scroll-reached-trigger-element[trigger=start],:host ::ng-deep .scroll-reached-trigger-element[trigger=end]{top:0;bottom:0}:host ::ng-deep .scroll-reached-trigger-element[trigger=top]{top:0;height:var(--reached-offset-top)}:host ::ng-deep .scroll-reached-trigger-element[trigger=bottom]{bottom:0;height:var(--reached-offset-bottom)}:host ::ng-deep .scroll-reached-trigger-element[trigger=start]{width:var(--reached-offset-start)}:host ::ng-deep .scroll-reached-trigger-element[trigger=end]{width:var(--reached-offset-end)}:host .scroll-dropped-trigger-element{background:#00f}:host .scroll-dropped-trigger-element[trigger=top],:host .scroll-dropped-trigger-element[trigger=bottom]{left:0;right:0}:host .scroll-dropped-trigger-element[trigger=start],:host .scroll-dropped-trigger-element[trigger=end]{top:0;bottom:0}:host .scroll-dropped-trigger-element[trigger=top]{top:0;height:var(--dropped-offset-top)}:host .scroll-dropped-trigger-element[trigger=bottom]{bottom:0;height:var(--dropped-offset-bottom)}:host .scroll-dropped-trigger-element[trigger=start]{width:var(--dropped-offset-start)}:host .scroll-dropped-trigger-element[trigger=end]{width:var(--dropped-offset-end)}:host[verticalUsed=true]{--_timeline-scope: --scrollerY;--_animation-timeline-y: --scrollerY;--_viewport_scroll-timeline: --scrollerY y}:host[horizontalUsed=true]{--_timeline-scope: --scrollerX;--_animation-timeline-x: --scrollerX;--_viewport_scroll-timeline: --scrollerX x}:host[verticalUsed=true][horizontalUsed=true]{--_timeline-scope: --scrollerX, --scrollerY;--_viewport_scroll-timeline: --scrollerX x, --scrollerY y}:host[orientation=vertical]{--_viewport-overflow: hidden auto;--_scrollbar-content-width: unset}:host[orientation=horizontal]{--_viewport-overflow: auto hidden}:host[disableInteraction=true]{--_viewport-pointer-events: none;--_scrollbar-pointer-events: none}:host[isVerticallyScrollable=false]{--_vertical-thumb-display: none}:host[isHorizontallyScrollable=false]{--_horizontal-thumb-display: none}:host[dragging=x],:host[dragging=y]{--_viewport-user-select: none}:host[dragging=x]{--_track-x-thickness: calc(var(--INTERNAL-scrollbar-hover-thickness) * 1px);--_thumb-x-color: var(var(--INTERNAL-scrollbar-thumb-min-size))}:host[dragging=y]{--_track-y-thickness: calc(var(--INTERNAL-scrollbar-hover-thickness) * 1px);--_thumb-y-color: var(var(--INTERNAL-scrollbar-thumb-min-size))}:host[mobile=true]{--_viewport-overscroll-behavior: var(--INTERNAL-scrollbar-mobile-overscroll-behavior)}\n"] }]
        }], ctorParameters: () => [] });

class AsyncDetection {
    constructor() {
        this.scrollbar = inject(NgScrollbarExt, { self: true });
        this.zone = inject(NgZone);
        this.contentObserver = inject(ContentObserver);
        this.asyncDetection = input();
        this.scrollbar.skipInit = true;
        let sub$;
        effect((onCleanup) => {
            const init = this.scrollbar.viewport.initialized();
            const externalViewport = this.scrollbar.externalViewport();
            const externalContentWrapper = this.scrollbar.externalContentWrapper();
            const externalSpacer = this.scrollbar.externalSpacer();
            const asyncDetection = this.asyncDetection();
            untracked(() => {
                let viewportElement;
                let contentWrapperElement;
                this.zone.runOutsideAngular(() => {
                    // The content observer should not be throttled using the same function we use for ResizeObserver,
                    // It should detect the content change asap to attach the scrollbar
                    sub$ = this.contentObserver.observe(this.scrollbar.nativeElement).pipe(throttleTime(100, null, {
                        leading: true,
                        trailing: true
                    })).subscribe(() => {
                        // Search for external viewport
                        viewportElement = this.scrollbar.nativeElement.querySelector(externalViewport);
                        // Search for external content wrapper
                        contentWrapperElement = this.scrollbar.nativeElement.querySelector(externalContentWrapper);
                        this.zone.run(() => {
                            if (!init && viewportElement && contentWrapperElement) {
                                // If an external spacer selector is provided, search for it
                                let spacerElement;
                                if (externalSpacer) {
                                    spacerElement = this.scrollbar.nativeElement.querySelector(externalSpacer);
                                }
                                this.scrollbar.initialize(viewportElement, contentWrapperElement, spacerElement);
                            }
                            else if (!viewportElement || !contentWrapperElement) {
                                this.scrollbar.viewport.reset();
                            }
                        });
                        if (asyncDetection !== 'auto') {
                            sub$.unsubscribe();
                        }
                    });
                });
                onCleanup(() => sub$?.unsubscribe());
            });
        });
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.1.1", ngImport: i0, type: AsyncDetection, deps: [], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "17.1.0", version: "19.1.1", type: AsyncDetection, isStandalone: true, selector: "ng-scrollbar[externalViewport][asyncDetection]", inputs: { asyncDetection: { classPropertyName: "asyncDetection", publicName: "asyncDetection", isSignal: true, isRequired: false, transformFunction: null } }, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.1.1", ngImport: i0, type: AsyncDetection, decorators: [{
            type: Directive,
            args: [{
                    standalone: true,
                    selector: 'ng-scrollbar[externalViewport][asyncDetection]'
                }]
        }], ctorParameters: () => [] });

class SyncSpacer {
    constructor() {
        this.sharedResizeObserver = inject(SharedResizeObserver);
        this.scrollbar = inject(NgScrollbarExt, { self: true });
        this.zone = inject(NgZone);
        /**
         * A signal used to sync spacer dimension when content dimension changes
         */
        this.spacerDimension = signal({});
        let sub$;
        effect((onCleanup) => {
            const spacerElement = this.scrollbar.spacerElement();
            const contentWrapperElement = this.scrollbar.contentWrapperElement();
            const throttleDuration = this.scrollbar.sensorThrottleTime();
            const disableSensor = this.scrollbar.disableSensor();
            untracked(() => {
                if (!disableSensor && contentWrapperElement && spacerElement) {
                    // Sync spacer dimension with content wrapper dimensions to allow both scrollbars to be displayed
                    this.zone.runOutsideAngular(() => {
                        sub$ = getThrottledStream(this.sharedResizeObserver.observe(contentWrapperElement), throttleDuration).pipe(map((entries) => filterResizeEntries(entries, contentWrapperElement))).subscribe(() => {
                            this.zone.run(() => {
                                // Use animation frame to avoid "ResizeObserver loop completed with undelivered notifications." error
                                requestAnimationFrame(() => {
                                    this.spacerDimension.set({
                                        width: contentWrapperElement.offsetWidth,
                                        height: contentWrapperElement.offsetHeight
                                    });
                                });
                            });
                        });
                    });
                }
                onCleanup(() => sub$?.unsubscribe());
            });
        });
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.1.1", ngImport: i0, type: SyncSpacer, deps: [], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "19.1.1", type: SyncSpacer, isStandalone: true, selector: "ng-scrollbar[externalViewport][syncSpacer]", host: { properties: { "style.--spacer-width": "spacerDimension().width", "style.--spacer-height": "spacerDimension().height" } }, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.1.1", ngImport: i0, type: SyncSpacer, decorators: [{
            type: Directive,
            args: [{
                    standalone: true,
                    selector: 'ng-scrollbar[externalViewport][syncSpacer]',
                    host: {
                        '[style.--spacer-width]': 'spacerDimension().width',
                        '[style.--spacer-height]': 'spacerDimension().height'
                    }
                }]
        }], ctorParameters: () => [] });

class NgScrollbarModule {
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.1.1", ngImport: i0, type: NgScrollbarModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule }); }
    static { this.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "19.1.1", ngImport: i0, type: NgScrollbarModule, imports: [NgScrollbar,
            ScrollViewport,
            NgScrollbarExt,
            AsyncDetection,
            SyncSpacer], exports: [NgScrollbar,
            ScrollViewport,
            NgScrollbarExt,
            AsyncDetection,
            SyncSpacer] }); }
    static { this.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "19.1.1", ngImport: i0, type: NgScrollbarModule }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.1.1", ngImport: i0, type: NgScrollbarModule, decorators: [{
            type: NgModule,
            args: [{
                    imports: [
                        NgScrollbar,
                        ScrollViewport,
                        NgScrollbarExt,
                        AsyncDetection,
                        SyncSpacer
                    ],
                    exports: [
                        NgScrollbar,
                        ScrollViewport,
                        NgScrollbarExt,
                        AsyncDetection,
                        SyncSpacer
                    ]
                }]
        }] });
function provideScrollbarOptions(options) {
    return [
        {
            provide: NG_SCROLLBAR_OPTIONS,
            useValue: { ...defaultOptions, ...options }
        }
    ];
}
function provideScrollbarPolyfill(url) {
    return makeEnvironmentProviders([
        {
            provide: NG_SCROLLBAR_POLYFILL,
            useValue: url
        }
    ]);
}

/**
 * Generated bundle index. Do not edit.
 */

export { AsyncDetection, NG_SCROLLBAR, NG_SCROLLBAR_OPTIONS, NG_SCROLLBAR_POLYFILL, NgScrollbar, NgScrollbarExt, NgScrollbarModule, ScrollViewport, ScrollbarUpdateReason, SyncSpacer, filterResizeEntries, provideScrollbarOptions, provideScrollbarPolyfill };
//# sourceMappingURL=ngx-scrollbar.mjs.map

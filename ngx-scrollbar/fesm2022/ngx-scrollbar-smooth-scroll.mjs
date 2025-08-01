import * as i0 from '@angular/core';
import { InjectionToken, inject, NgZone, Injectable, ElementRef, Directive } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { coerceElement } from '@angular/cdk/coercion';
import { Subject, Observable, takeWhile, switchMap, merge, fromEvent, take, takeUntil, finalize } from 'rxjs';

/**
 * https://github.com/gre/bezier-easing
 * BezierEasing - use bezier curve for transition easing function
 * by Gaëtan Renaudeau 2014 - 2015 – MIT License
 */
// These values are established by empiricism with tests (tradeoff: performance VS precision)
const NEWTON_ITERATIONS = 4;
const NEWTON_MIN_SLOPE = 0.001;
const SUBDIVISION_PRECISION = 0.0000001;
const SUBDIVISION_MAX_ITERATIONS = 10;
const kSplineTableSize = 11;
const kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);
const float32ArraySupported = typeof Float32Array === 'function';
function A(aA1, aA2) {
    return 1.0 - 3.0 * aA2 + 3.0 * aA1;
}
function B(aA1, aA2) {
    return 3.0 * aA2 - 6.0 * aA1;
}
function C(aA1) {
    return 3.0 * aA1;
}
// Returns x(t) given t, x1, and x2, or y(t) given t, y1, and y2.
function calcBezier(aT, aA1, aA2) {
    return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT;
}
// Returns dx/dt given t, x1, and x2, or dy/dt given t, y1, and y2.
function getSlope(aT, aA1, aA2) {
    return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1);
}
function binarySubdivide(aX, aA, aB, mX1, mX2) {
    let currentX, currentT, i = 0;
    do {
        currentT = aA + (aB - aA) / 2.0;
        currentX = calcBezier(currentT, mX1, mX2) - aX;
        if (currentX > 0.0) {
            aB = currentT;
        }
        else {
            aA = currentT;
        }
    } while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i < SUBDIVISION_MAX_ITERATIONS);
    return currentT;
}
function newtonRaphsonIterate(aX, aGuessT, mX1, mX2) {
    for (let i = 0; i < NEWTON_ITERATIONS; ++i) {
        const currentSlope = getSlope(aGuessT, mX1, mX2);
        if (currentSlope === 0.0) {
            return aGuessT;
        }
        const currentX = calcBezier(aGuessT, mX1, mX2) - aX;
        aGuessT -= currentX / currentSlope;
    }
    return aGuessT;
}
function LinearEasing(x) {
    return x;
}
function bezier(mX1, mY1, mX2, mY2) {
    if (!(0 <= mX1 && mX1 <= 1 && 0 <= mX2 && mX2 <= 1)) {
        throw new Error('bezier x values must be in [0, 1] range');
    }
    if (mX1 === mY1 && mX2 === mY2) {
        return LinearEasing;
    }
    // Precompute samples table
    const sampleValues = float32ArraySupported ? new Float32Array(kSplineTableSize) : new Array(kSplineTableSize);
    for (let i = 0; i < kSplineTableSize; ++i) {
        sampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
    }
    function getTForX(aX) {
        let intervalStart = 0.0;
        let currentSample = 1;
        const lastSample = kSplineTableSize - 1;
        for (; currentSample !== lastSample && sampleValues[currentSample] <= aX; ++currentSample) {
            intervalStart += kSampleStepSize;
        }
        --currentSample;
        // Interpolate to provide an initial guess for t
        const dist = (aX - sampleValues[currentSample]) / (sampleValues[currentSample + 1] - sampleValues[currentSample]);
        const guessForT = intervalStart + dist * kSampleStepSize;
        const initialSlope = getSlope(guessForT, mX1, mX2);
        if (initialSlope >= NEWTON_MIN_SLOPE) {
            return newtonRaphsonIterate(aX, guessForT, mX1, mX2);
        }
        else if (initialSlope === 0.0) {
            return guessForT;
        }
        else {
            return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize, mX1, mX2);
        }
    }
    return function BezierEasing(x) {
        // Because JavaScript number are imprecise, we should guarantee the extremes are right.
        if (x === 0) {
            return 0;
        }
        if (x === 1) {
            return 1;
        }
        return calcBezier(getTForX(x), mY1, mY2);
    };
}

const defaultSmoothScrollOptions = {
    duration: 468,
    easing: {
        x1: 0.42,
        y1: 0,
        x2: 0.58,
        y2: 1
    }
};

const SMOOTH_SCROLL_OPTIONS = new InjectionToken('SMOOTH_SCROLL_OPTIONS', {
    providedIn: 'root',
    factory: () => defaultSmoothScrollOptions
});
function provideSmoothScrollOptions(options) {
    return [
        {
            provide: SMOOTH_SCROLL_OPTIONS,
            useValue: { ...defaultSmoothScrollOptions, ...options }
        }
    ];
}

class SmoothScrollManager {
    constructor() {
        this.document = inject(DOCUMENT);
        this.zone = inject(NgZone);
        // Default options
        this._defaultOptions = inject(SMOOTH_SCROLL_OPTIONS);
        // Keeps track of the ongoing SmoothScroll functions, so they can be handled in case of duplication.
        // Each scrolled element gets a destroyer stream which gets deleted immediately after it completes.
        // Purpose: If user called a scroll function again on the same element before the scrolls completes,
        // it cancels the ongoing scroll and starts a new one
        this.onGoingScrolls = new Map();
    }
    /**
     * Timing method
     */
    get now() {
        return this.document.defaultView.performance?.now?.bind(this.document.defaultView.performance) || Date.now;
    }
    /**
     * changes scroll position inside an element
     */
    scrollElement(el, x, y) {
        el.scrollLeft = x;
        el.scrollTop = y;
    }
    /**
     * Handles a given parameter of type HTMLElement, ElementRef or selector
     */
    getElement(el, parent) {
        if (typeof el === 'string') {
            return (parent || this.document).querySelector(el);
        }
        return coerceElement(el);
    }
    /**
     * Initializes a destroyer stream, re-initializes it if the element is already being scrolled
     */
    getScrollDestroyerRef(el) {
        if (this.onGoingScrolls.has(el)) {
            this.onGoingScrolls.get(el).next();
        }
        return this.onGoingScrolls.set(el, new Subject()).get(el);
    }
    /**
     * A function called recursively that, given a context, steps through scrolling
     */
    step(context) {
        return new Observable((subscriber) => {
            let elapsed = (this.now() - context.startTime) / context.duration;
            // avoid elapsed times higher than one
            elapsed = elapsed > 1 ? 1 : elapsed;
            // apply easing to elapsed time
            const value = context.easing(elapsed);
            context.currentX = context.startX + (context.x - context.startX) * value;
            context.currentY = context.startY + (context.y - context.startY) * value;
            this.scrollElement(context.scrollable, context.currentX, context.currentY);
            // Proceed to the step
            requestAnimationFrame(() => {
                subscriber.next();
                subscriber.complete();
            });
        });
    }
    /**
     * Checks if smooth scroll has reached, cleans up the smooth scroll stream
     */
    isReached(context, destroyed) {
        if (context.currentX === context.x && context.currentY === context.y) {
            // IMPORTANT: Destroy the stream when scroll is reached ASAP!
            destroyed.next();
            return true;
        }
        return false;
    }
    /**
     * Scroll recursively until coordinates are reached
     * @param context
     * @param destroyed
     */
    scrolling(context, destroyed) {
        return this.step(context).pipe(
        // Continue while target coordinates hasn't reached yet
        takeWhile(() => !this.isReached(context, destroyed)), switchMap(() => this.scrolling(context, destroyed)));
    }
    /**
     * Deletes the destroyer function, runs if the smooth scroll has finished or interrupted
     */
    onScrollReached(el, resolve, destroyed) {
        destroyed.complete();
        this.onGoingScrolls.delete(el);
        this.zone.run(() => resolve());
    }
    /**
     * Terminates an ongoing smooth scroll
     */
    interrupted(el, destroyed) {
        return merge(fromEvent(el, 'wheel', { passive: true, capture: true }), fromEvent(el, 'touchmove', { passive: true, capture: true }), destroyed).pipe(take(1));
    }
    applyScrollToOptions(el, options) {
        if (!options.duration) {
            this.scrollElement(el, options.left, options.top);
            return Promise.resolve();
        }
        return new Promise((resolve) => {
            this.zone.runOutsideAngular(() => {
                // Initialize a destroyer stream, reinitialize it if the element is already being scrolled
                const destroyed = this.getScrollDestroyerRef(el);
                const context = {
                    scrollable: el,
                    startTime: this.now(),
                    startX: el.scrollLeft,
                    startY: el.scrollTop,
                    x: options.left == null ? el.scrollLeft : ~~options.left,
                    y: options.top == null ? el.scrollTop : ~~options.top,
                    duration: options.duration,
                    easing: bezier(options.easing.x1, options.easing.y1, options.easing.x2, options.easing.y2)
                };
                this.scrolling(context, destroyed).pipe(
                // Continue until interrupted by another scroll (new smooth scroll / wheel / touchmove)
                takeUntil(this.interrupted(el, destroyed)), 
                // Once finished, clean up the destroyer stream and resolve the promise
                finalize(() => this.onScrollReached(el, resolve, destroyed))).subscribe();
            });
        });
    }
    /**
     * Scrolls to the specified offsets. This is a normalized version of the browser's native scrollTo
     * method, since browsers are not consistent about what scrollLeft means in RTL. For this method
     * left and right always refer to the left and right side of the scrolling container irrespective
     * of the layout direction. start and end refer to left and right in an LTR context and vice-versa
     * in an RTL context.
     * @param scrollable element
     * @param customOptions specified the offsets to scroll to.
     */
    scrollTo(scrollable, customOptions) {
        const el = this.getElement(scrollable);
        const isRtl = getComputedStyle(el).direction === 'rtl';
        const options = {
            ...this._defaultOptions,
            ...customOptions,
            ...{
                // Rewrite start & end offsets as right or left offsets.
                left: customOptions.left == null ? (isRtl ? customOptions.end : customOptions.start) : customOptions.left,
                right: customOptions.right == null ? (isRtl ? customOptions.start : customOptions.end) : customOptions.right
            }
        };
        // Rewrite the bottom offset as a top offset.
        if (options.bottom != null) {
            options.top = el.scrollHeight - el.clientHeight - options.bottom;
        }
        // Rewrite the right offset as a left offset.
        if (isRtl) {
            if (options.left != null) {
                options.right = el.scrollWidth - el.clientWidth - options.left;
            }
            options.left = options.right ? -options.right : options.right;
        }
        else {
            if (options.right != null) {
                options.left = el.scrollWidth - el.clientWidth - options.right;
            }
        }
        return this.applyScrollToOptions(el, options);
    }
    /**
     * Scroll to element by reference or selector
     */
    scrollToElement(scrollable, target, customOptions = {}) {
        const scrollableEl = this.getElement(scrollable);
        const targetEl = this.getElement(target, scrollableEl);
        const isRtl = getComputedStyle(scrollableEl).direction === 'rtl';
        if (!targetEl || !scrollableEl) {
            return Promise.resolve();
        }
        const scrollableRect = scrollableEl.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();
        const options = {
            ...this._defaultOptions,
            ...customOptions,
            ...{
                top: targetRect.top + scrollableEl.scrollTop - scrollableRect.top + (customOptions.top || 0),
                // Rewrite start & end offsets as right or left offsets.
                left: customOptions.left == null ? (isRtl ? customOptions.end : customOptions.start) : customOptions.left,
                right: customOptions.right == null ? (isRtl ? customOptions.start : customOptions.end) : customOptions.right
            }
        };
        if (customOptions.center) {
            // Calculate the center of the container
            const containerCenterX = scrollableRect.left + scrollableRect.width / 2;
            const containerCenterY = scrollableRect.top + scrollableRect.height / 2;
            // Calculate the target's position relative to the container
            const targetCenterX = targetRect.left + targetRect.width / 2;
            const targetCenterY = targetRect.top + targetRect.height / 2;
            // Calculate the scroll position to center the target element in the container
            options.left = targetCenterX - containerCenterX + scrollableEl.scrollLeft;
            options.top = targetCenterY - containerCenterY + scrollableEl.scrollTop;
            return this.applyScrollToOptions(scrollableEl, options);
        }
        if (options.bottom != null) {
            const bottomEdge = scrollableRect.height - targetRect.height;
            options.top = targetRect.top + scrollableEl.scrollTop - scrollableRect.top - bottomEdge + (customOptions.bottom || 0);
        }
        // Rewrite the right offset as a left offset.
        if (isRtl) {
            options.left = targetRect.left - scrollableRect.left + scrollableEl.scrollLeft + (options.left || 0);
            if (options.right != null) {
                options.left = targetRect.right - scrollableRect.left + scrollableEl.scrollLeft - scrollableRect.width + (options.right || 0);
            }
        }
        else {
            options.left = targetRect.left - scrollableRect.left + scrollableEl.scrollLeft + (options.left || 0);
            if (options.right != null) {
                options.left = targetRect.right - scrollableRect.left + scrollableEl.scrollLeft - scrollableRect.width + (options.right || 0);
            }
        }
        const computedOptions = {
            top: options.top,
            left: options.left,
            easing: options.easing,
            duration: options.duration
        };
        return this.applyScrollToOptions(scrollableEl, computedOptions);
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.1.1", ngImport: i0, type: SmoothScrollManager, deps: [], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.1.1", ngImport: i0, type: SmoothScrollManager, providedIn: 'root' }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.1.1", ngImport: i0, type: SmoothScrollManager, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root'
                }]
        }] });

class SmoothScroll {
    constructor() {
        this.smoothScroll = inject(SmoothScrollManager);
        this.element = inject((ElementRef));
    }
    scrollTo(options) {
        return this.smoothScroll.scrollTo(this.element, options);
    }
    scrollToElement(target, options) {
        return this.smoothScroll.scrollToElement(this.element, target, options);
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.1.1", ngImport: i0, type: SmoothScroll, deps: [], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "19.1.1", type: SmoothScroll, isStandalone: true, selector: "[smoothScroll]", exportAs: ["smoothScroll"], ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.1.1", ngImport: i0, type: SmoothScroll, decorators: [{
            type: Directive,
            args: [{
                    standalone: true,
                    selector: '[smoothScroll]',
                    exportAs: 'smoothScroll'
                }]
        }] });

/**
 * Generated bundle index. Do not edit.
 */

export { SMOOTH_SCROLL_OPTIONS, SmoothScroll, SmoothScrollManager, provideSmoothScrollOptions };
//# sourceMappingURL=ngx-scrollbar-smooth-scroll.mjs.map

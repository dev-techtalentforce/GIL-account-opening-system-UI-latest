import { ElementRef, InjectionToken, Provider } from '@angular/core';
import { _XAxis, _YAxis } from '@angular/cdk/scrolling';
export declare const SMOOTH_SCROLL_OPTIONS: InjectionToken<SmoothScrollOptions>;
export declare function provideSmoothScrollOptions(options: SmoothScrollOptions): Provider[];
/**
 * Interface for an element that can be scrolled smoothly.
 */
export type SmoothScrollElement = Element | ElementRef<Element> | string;
/**
 * Interface for options provided for smooth scrolling.
 */
export type SmoothScrollToOptions = Partial<Pick<_XAxis, keyof _XAxis> & Pick<_YAxis, keyof _YAxis>> & SmoothScrollOptions;
/**
 * Interface for options provided for smooth scrolling to an element.
 */
export type SmoothScrollToElementOptions = SmoothScrollToOptions & {
    center?: boolean;
};
export interface SmoothScrollStep {
    scrollable: Element;
    startTime: number;
    startX: number;
    startY: number;
    x: number;
    y: number;
    duration: number;
    easing: (k: number) => number;
    currentX?: number;
    currentY?: number;
}
export interface SmoothScrollOptions {
    duration?: number;
    easing?: BezierEasingOptions;
}
export interface BezierEasingOptions {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

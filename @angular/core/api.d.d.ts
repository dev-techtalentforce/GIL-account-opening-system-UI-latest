/**
 * @license Angular v20.1.0
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */

import { OutputRef, OutputRefSubscription, DestroyRef, Signal, WritableSignal, ValueEqualityFn, Injector } from './chrome_dev_tools_performance.d.js';

/**
 * An `OutputEmitterRef` is created by the `output()` function and can be
 * used to emit values to consumers of your directive or component.
 *
 * Consumers of your directive/component can bind to the output and
 * subscribe to changes via the bound event syntax. For example:
 *
 * ```html
 * <my-comp (valueChange)="processNewValue($event)" />
 * ```
 *
 * @publicAPI
 */
declare class OutputEmitterRef<T> implements OutputRef<T> {
    private destroyed;
    private listeners;
    private errorHandler;
    constructor();
    subscribe(callback: (value: T) => void): OutputRefSubscription;
    /** Emits a new value to the output. */
    emit(value: T): void;
}
/** Gets the owning `DestroyRef` for the given output. */
declare function getOutputDestroyRef(ref: OutputRef<unknown>): DestroyRef | undefined;

/**
 * Options for declaring an output.
 *
 * @publicApi 19.0
 */
interface OutputOptions {
    alias?: string;
}
/**
 * The `output` function allows declaration of Angular outputs in
 * directives and components.
 *
 * You can use outputs to emit values to parent directives and component.
 * Parents can subscribe to changes via:
 *
 * - template event bindings. For example, `(myOutput)="doSomething($event)"`
 * - programmatic subscription by using `OutputRef#subscribe`.
 *
 * @usageNotes
 *
 * To use `output()`, import the function from `@angular/core`.
 *
 * ```ts
 * import {output} from '@angular/core';
 * ```
 *
 * Inside your component, introduce a new class member and initialize
 * it with a call to `output`.
 *
 * ```ts
 * @Directive({
 *   ...
 * })
 * export class MyDir {
 *   nameChange = output<string>();    // OutputEmitterRef<string>
 *   onClick    = output();            // OutputEmitterRef<void>
 * }
 * ```
 *
 * You can emit values to consumers of your directive, by using
 * the `emit` method from `OutputEmitterRef`.
 *
 * ```ts
 * updateName(newName: string): void {
 *   this.nameChange.emit(newName);
 * }
 * ```
 * @initializerApiFunction {"showTypesInSignaturePreview": true}
 * @publicApi 19.0
 */
declare function output<T = void>(opts?: OutputOptions): OutputEmitterRef<T>;

/**
 * String value capturing the status of a `Resource`.
 *
 * Possible statuses are:
 *
 * `idle` - The resource has no valid request and will not perform any loading. `value()` will be
 * `undefined`.
 *
 * `loading` - The resource is currently loading a new value as a result of a change in its reactive
 * dependencies. `value()` will be `undefined`.
 *
 * `reloading` - The resource is currently reloading a fresh value for the same reactive
 * dependencies. `value()` will continue to return the previously fetched value during the reloading
 * operation.
 *
 * `error` - Loading failed with an error. `value()` will be `undefined`.
 *
 * `resolved` - Loading has completed and the resource has the value returned from the loader.
 *
 * `local` - The resource's value was set locally via `.set()` or `.update()`.
 *
 * @experimental
 */
type ResourceStatus = 'idle' | 'error' | 'loading' | 'reloading' | 'resolved' | 'local';
/**
 * A Resource is an asynchronous dependency (for example, the results of an API call) that is
 * managed and delivered through signals.
 *
 * The usual way of creating a `Resource` is through the `resource` function, but various other APIs
 * may present `Resource` instances to describe their own concepts.
 *
 * @experimental
 */
interface Resource<T> {
    /**
     * The current value of the `Resource`, or throws an error if the resource is in an error state.
     */
    readonly value: Signal<T>;
    /**
     * The current status of the `Resource`, which describes what the resource is currently doing and
     * what can be expected of its `value`.
     */
    readonly status: Signal<ResourceStatus>;
    /**
     * When in the `error` state, this returns the last known error from the `Resource`.
     */
    readonly error: Signal<Error | undefined>;
    /**
     * Whether this resource is loading a new value (or reloading the existing one).
     */
    readonly isLoading: Signal<boolean>;
    /**
     * Whether this resource has a valid current value.
     *
     * This function is reactive.
     */
    hasValue(): this is Resource<Exclude<T, undefined>>;
}
/**
 * A `Resource` with a mutable value.
 *
 * Overwriting the value of a resource sets it to the 'local' state.
 *
 * @experimental
 */
interface WritableResource<T> extends Resource<T> {
    readonly value: WritableSignal<T>;
    hasValue(): this is WritableResource<Exclude<T, undefined>>;
    /**
     * Convenience wrapper for `value.set`.
     */
    set(value: T): void;
    /**
     * Convenience wrapper for `value.update`.
     */
    update(updater: (value: T) => T): void;
    asReadonly(): Resource<T>;
    /**
     * Instructs the resource to re-load any asynchronous dependency it may have.
     *
     * Note that the resource will not enter its reloading state until the actual backend request is
     * made.
     *
     * @returns true if a reload was initiated, false if a reload was unnecessary or unsupported
     */
    reload(): boolean;
}
/**
 * A `WritableResource` created through the `resource` function.
 *
 * @experimental
 */
interface ResourceRef<T> extends WritableResource<T> {
    hasValue(): this is ResourceRef<Exclude<T, undefined>>;
    /**
     * Manually destroy the resource, which cancels pending requests and returns it to `idle` state.
     */
    destroy(): void;
}
/**
 * Parameter to a `ResourceLoader` which gives the request and other options for the current loading
 * operation.
 *
 * @experimental
 */
interface ResourceLoaderParams<R> {
    params: NoInfer<Exclude<R, undefined>>;
    abortSignal: AbortSignal;
    previous: {
        status: ResourceStatus;
    };
}
/**
 * Loading function for a `Resource`.
 *
 * @experimental
 */
type ResourceLoader<T, R> = (param: ResourceLoaderParams<R>) => PromiseLike<T>;
/**
 * Streaming loader for a `Resource`.
 *
 * @experimental
 */
type ResourceStreamingLoader<T, R> = (param: ResourceLoaderParams<R>) => PromiseLike<Signal<ResourceStreamItem<T>>>;
/**
 * Options to the `resource` function, for creating a resource.
 *
 * @experimental
 */
interface BaseResourceOptions<T, R> {
    /**
     * A reactive function which determines the request to be made. Whenever the request changes, the
     * loader will be triggered to fetch a new value for the resource.
     *
     * If a request function isn't provided, the loader won't rerun unless the resource is reloaded.
     */
    params?: () => R;
    /**
     * The value which will be returned from the resource when a server value is unavailable, such as
     * when the resource is still loading.
     */
    defaultValue?: NoInfer<T>;
    /**
     * Equality function used to compare the return value of the loader.
     */
    equal?: ValueEqualityFn<T>;
    /**
     * Overrides the `Injector` used by `resource`.
     */
    injector?: Injector;
}
/**
 * Options to the `resource` function, for creating a resource.
 *
 * @experimental
 */
interface PromiseResourceOptions<T, R> extends BaseResourceOptions<T, R> {
    /**
     * Loading function which returns a `Promise` of the resource's value for a given request.
     */
    loader: ResourceLoader<T, R>;
    /**
     * Cannot specify `stream` and `loader` at the same time.
     */
    stream?: never;
}
/**
 * Options to the `resource` function, for creating a resource.
 *
 * @experimental
 */
interface StreamingResourceOptions<T, R> extends BaseResourceOptions<T, R> {
    /**
     * Loading function which returns a `Promise` of a signal of the resource's value for a given
     * request, which can change over time as new values are received from a stream.
     */
    stream: ResourceStreamingLoader<T, R>;
    /**
     * Cannot specify `stream` and `loader` at the same time.
     */
    loader?: never;
}
/**
 * @experimental
 */
type ResourceOptions<T, R> = PromiseResourceOptions<T, R> | StreamingResourceOptions<T, R>;
/**
 * @experimental
 */
type ResourceStreamItem<T> = {
    value: T;
} | {
    error: Error;
};

export { OutputEmitterRef, getOutputDestroyRef, output };
export type { BaseResourceOptions, OutputOptions, PromiseResourceOptions, Resource, ResourceLoader, ResourceLoaderParams, ResourceOptions, ResourceRef, ResourceStatus, ResourceStreamItem, ResourceStreamingLoader, StreamingResourceOptions, WritableResource };

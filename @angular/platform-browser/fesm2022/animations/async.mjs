/**
 * @license Angular v20.1.0
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */

import { DOCUMENT } from '@angular/common';
import * as i0 from '@angular/core';
import { inject, Injector, ɵRuntimeError as _RuntimeError, ɵChangeDetectionScheduler as _ChangeDetectionScheduler, Injectable, InjectionToken, ɵperformanceMarkFeature as _performanceMarkFeature, makeEnvironmentProviders, RendererFactory2, NgZone, ANIMATION_MODULE_TYPE } from '@angular/core';
import { DomRendererFactory2 } from '../dom_renderer.mjs';

const ANIMATION_PREFIX = '@';
class AsyncAnimationRendererFactory {
    doc;
    delegate;
    zone;
    animationType;
    moduleImpl;
    _rendererFactoryPromise = null;
    scheduler = null;
    injector = inject(Injector);
    loadingSchedulerFn = inject(ɵASYNC_ANIMATION_LOADING_SCHEDULER_FN, {
        optional: true,
    });
    _engine;
    /**
     *
     * @param moduleImpl allows to provide a mock implmentation (or will load the animation module)
     */
    constructor(doc, delegate, zone, animationType, moduleImpl) {
        this.doc = doc;
        this.delegate = delegate;
        this.zone = zone;
        this.animationType = animationType;
        this.moduleImpl = moduleImpl;
    }
    /** @docs-private */
    ngOnDestroy() {
        // When the root view is removed, the renderer defers the actual work to the
        // `TransitionAnimationEngine` to do this, and the `TransitionAnimationEngine` doesn't actually
        // remove the DOM node, but just calls `markElementAsRemoved()`. The actual DOM node is not
        // removed until `TransitionAnimationEngine` "flushes".
        // Note: we already flush on destroy within the `InjectableAnimationEngine`. The injectable
        // engine is not provided when async animations are used.
        this._engine?.flush();
    }
    /**
     * @internal
     */
    loadImpl() {
        // Note on the `.then(m => m)` part below: Closure compiler optimizations in g3 require
        // `.then` to be present for a dynamic import (or an import should be `await`ed) to detect
        // the set of imported symbols.
        const loadFn = () => this.moduleImpl ?? import('@angular/animations/browser').then((m) => m);
        let moduleImplPromise;
        if (this.loadingSchedulerFn) {
            moduleImplPromise = this.loadingSchedulerFn(loadFn);
        }
        else {
            moduleImplPromise = loadFn();
        }
        return moduleImplPromise
            .catch((e) => {
            throw new _RuntimeError(5300 /* RuntimeErrorCode.ANIMATION_RENDERER_ASYNC_LOADING_FAILURE */, (typeof ngDevMode === 'undefined' || ngDevMode) &&
                'Async loading for animations package was ' +
                    'enabled, but loading failed. Angular falls back to using regular rendering. ' +
                    "No animations will be displayed and their styles won't be applied.");
        })
            .then(({ ɵcreateEngine, ɵAnimationRendererFactory }) => {
            // We can't create the renderer yet because we might need the hostElement and the type
            // Both are provided in createRenderer().
            this._engine = ɵcreateEngine(this.animationType, this.doc);
            const rendererFactory = new ɵAnimationRendererFactory(this.delegate, this._engine, this.zone);
            this.delegate = rendererFactory;
            return rendererFactory;
        });
    }
    /**
     * This method is delegating the renderer creation to the factories.
     * It uses default factory while the animation factory isn't loaded
     * and will rely on the animation factory once it is loaded.
     *
     * Calling this method will trigger as side effect the loading of the animation module
     * if the renderered component uses animations.
     */
    createRenderer(hostElement, rendererType) {
        const renderer = this.delegate.createRenderer(hostElement, rendererType);
        if (renderer.ɵtype === 0 /* AnimationRendererType.Regular */) {
            // The factory is already loaded, this is an animation renderer
            return renderer;
        }
        // We need to prevent the DomRenderer to throw an error because of synthetic properties
        if (typeof renderer.throwOnSyntheticProps === 'boolean') {
            renderer.throwOnSyntheticProps = false;
        }
        // Using a dynamic renderer to switch the renderer implementation once the module is loaded.
        const dynamicRenderer = new DynamicDelegationRenderer(renderer);
        // Kick off the module loading if the component uses animations but the module hasn't been
        // loaded yet.
        if (rendererType?.data?.['animation'] && !this._rendererFactoryPromise) {
            this._rendererFactoryPromise = this.loadImpl();
        }
        this._rendererFactoryPromise
            ?.then((animationRendererFactory) => {
            const animationRenderer = animationRendererFactory.createRenderer(hostElement, rendererType);
            dynamicRenderer.use(animationRenderer);
            this.scheduler ??= this.injector.get(_ChangeDetectionScheduler, null, { optional: true });
            this.scheduler?.notify(10 /* NotificationSource.AsyncAnimationsLoaded */);
        })
            .catch((e) => {
            // Permanently use regular renderer when loading fails.
            dynamicRenderer.use(renderer);
        });
        return dynamicRenderer;
    }
    begin() {
        this.delegate.begin?.();
    }
    end() {
        this.delegate.end?.();
    }
    whenRenderingDone() {
        return this.delegate.whenRenderingDone?.() ?? Promise.resolve();
    }
    /**
     * Used during HMR to clear any cached data about a component.
     * @param componentId ID of the component that is being replaced.
     */
    componentReplaced(componentId) {
        // Flush the engine since the renderer destruction waits for animations to be done.
        this._engine?.flush();
        this.delegate.componentReplaced?.(componentId);
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.1.0", ngImport: i0, type: AsyncAnimationRendererFactory, deps: "invalid", target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "20.1.0", ngImport: i0, type: AsyncAnimationRendererFactory });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.1.0", ngImport: i0, type: AsyncAnimationRendererFactory, decorators: [{
            type: Injectable
        }], ctorParameters: () => [{ type: Document }, { type: i0.RendererFactory2 }, { type: i0.NgZone }, { type: undefined }, { type: Promise }] });
/**
 * The class allows to dynamicly switch between different renderer implementations
 * by changing the delegate renderer.
 */
class DynamicDelegationRenderer {
    delegate;
    // List of callbacks that need to be replayed on the animation renderer once its loaded
    replay = [];
    ɵtype = 1 /* AnimationRendererType.Delegated */;
    constructor(delegate) {
        this.delegate = delegate;
    }
    use(impl) {
        this.delegate = impl;
        if (this.replay !== null) {
            // Replay queued actions using the animation renderer to apply
            // all events and properties collected while loading was in progress.
            for (const fn of this.replay) {
                fn(impl);
            }
            // Set to `null` to indicate that the queue was processed
            // and we no longer need to collect events and properties.
            this.replay = null;
        }
    }
    get data() {
        return this.delegate.data;
    }
    destroy() {
        this.replay = null;
        this.delegate.destroy();
    }
    createElement(name, namespace) {
        return this.delegate.createElement(name, namespace);
    }
    createComment(value) {
        return this.delegate.createComment(value);
    }
    createText(value) {
        return this.delegate.createText(value);
    }
    get destroyNode() {
        return this.delegate.destroyNode;
    }
    appendChild(parent, newChild) {
        this.delegate.appendChild(parent, newChild);
    }
    insertBefore(parent, newChild, refChild, isMove) {
        this.delegate.insertBefore(parent, newChild, refChild, isMove);
    }
    removeChild(parent, oldChild, isHostElement) {
        this.delegate.removeChild(parent, oldChild, isHostElement);
    }
    selectRootElement(selectorOrNode, preserveContent) {
        return this.delegate.selectRootElement(selectorOrNode, preserveContent);
    }
    parentNode(node) {
        return this.delegate.parentNode(node);
    }
    nextSibling(node) {
        return this.delegate.nextSibling(node);
    }
    setAttribute(el, name, value, namespace) {
        this.delegate.setAttribute(el, name, value, namespace);
    }
    removeAttribute(el, name, namespace) {
        this.delegate.removeAttribute(el, name, namespace);
    }
    addClass(el, name) {
        this.delegate.addClass(el, name);
    }
    removeClass(el, name) {
        this.delegate.removeClass(el, name);
    }
    setStyle(el, style, value, flags) {
        this.delegate.setStyle(el, style, value, flags);
    }
    removeStyle(el, style, flags) {
        this.delegate.removeStyle(el, style, flags);
    }
    setProperty(el, name, value) {
        // We need to keep track of animation properties set on default renderer
        // So we can also set them also on the animation renderer
        if (this.shouldReplay(name)) {
            this.replay.push((renderer) => renderer.setProperty(el, name, value));
        }
        this.delegate.setProperty(el, name, value);
    }
    setValue(node, value) {
        this.delegate.setValue(node, value);
    }
    listen(target, eventName, callback, options) {
        // We need to keep track of animation events registred by the default renderer
        // So we can also register them against the animation renderer
        if (this.shouldReplay(eventName)) {
            this.replay.push((renderer) => renderer.listen(target, eventName, callback, options));
        }
        return this.delegate.listen(target, eventName, callback, options);
    }
    shouldReplay(propOrEventName) {
        //`null` indicates that we no longer need to collect events and properties
        return this.replay !== null && propOrEventName.startsWith(ANIMATION_PREFIX);
    }
}
/**
 * Provides a custom scheduler function for the async loading of the animation package.
 *
 * Private token for investigation purposes
 */
const ɵASYNC_ANIMATION_LOADING_SCHEDULER_FN = new InjectionToken(ngDevMode ? 'async_animation_loading_scheduler_fn' : '');

/**
 * Returns the set of dependency-injection providers
 * to enable animations in an application. See [animations guide](guide/animations)
 * to learn more about animations in Angular.
 *
 * When you use this function instead of the eager `provideAnimations()`, animations won't be
 * rendered until the renderer is loaded.
 *
 * @usageNotes
 *
 * The function is useful when you want to enable animations in an application
 * bootstrapped using the `bootstrapApplication` function. In this scenario there
 * is no need to import the `BrowserAnimationsModule` NgModule at all, just add
 * providers returned by this function to the `providers` list as show below.
 *
 * ```ts
 * bootstrapApplication(RootComponent, {
 *   providers: [
 *     provideAnimationsAsync()
 *   ]
 * });
 * ```
 *
 * @param type pass `'noop'` as argument to disable animations.
 *
 * @publicApi
 */
function provideAnimationsAsync(type = 'animations') {
    _performanceMarkFeature('NgAsyncAnimations');
    // Animations don't work on the server so we switch them over to no-op automatically.
    if (typeof ngServerMode !== 'undefined' && ngServerMode) {
        type = 'noop';
    }
    return makeEnvironmentProviders([
        {
            provide: RendererFactory2,
            useFactory: (doc, renderer, zone) => {
                return new AsyncAnimationRendererFactory(doc, renderer, zone, type);
            },
            deps: [DOCUMENT, DomRendererFactory2, NgZone],
        },
        {
            provide: ANIMATION_MODULE_TYPE,
            useValue: type === 'noop' ? 'NoopAnimations' : 'BrowserAnimations',
        },
    ]);
}

export { provideAnimationsAsync, ɵASYNC_ANIMATION_LOADING_SCHEDULER_FN, AsyncAnimationRendererFactory as ɵAsyncAnimationRendererFactory };
//# sourceMappingURL=async.mjs.map

'use strict';
/**
 * @license Angular v<unknown>
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
function patchMediaQuery(Zone) {
    Zone.__load_patch('mediaQuery', (global, Zone, api) => {
        function patchAddListener(proto) {
            api.patchMethod(proto, 'addListener', (delegate) => (self, args) => {
                const callback = args.length > 0 ? args[0] : null;
                if (typeof callback === 'function') {
                    const wrapperedCallback = Zone.current.wrap(callback, 'MediaQuery');
                    callback[api.symbol('mediaQueryCallback')] = wrapperedCallback;
                    return delegate.call(self, wrapperedCallback);
                }
                else {
                    return delegate.apply(self, args);
                }
            });
        }
        function patchRemoveListener(proto) {
            api.patchMethod(proto, 'removeListener', (delegate) => (self, args) => {
                const callback = args.length > 0 ? args[0] : null;
                if (typeof callback === 'function') {
                    const wrapperedCallback = callback[api.symbol('mediaQueryCallback')];
                    if (wrapperedCallback) {
                        return delegate.call(self, wrapperedCallback);
                    }
                    else {
                        return delegate.apply(self, args);
                    }
                }
                else {
                    return delegate.apply(self, args);
                }
            });
        }
        if (global['MediaQueryList']) {
            const proto = global['MediaQueryList'].prototype;
            patchAddListener(proto);
            patchRemoveListener(proto);
        }
        else if (global['matchMedia']) {
            api.patchMethod(global, 'matchMedia', (delegate) => (self, args) => {
                const mql = delegate.apply(self, args);
                if (mql) {
                    // try to patch MediaQueryList.prototype
                    const proto = Object.getPrototypeOf(mql);
                    if (proto && proto['addListener']) {
                        // try to patch proto, don't need to worry about patch
                        // multiple times, because, api.patchEventTarget will check it
                        patchAddListener(proto);
                        patchRemoveListener(proto);
                        patchAddListener(mql);
                        patchRemoveListener(mql);
                    }
                    else if (mql['addListener']) {
                        // proto not exists, or proto has no addListener method
                        // try to patch mql instance
                        patchAddListener(mql);
                        patchRemoveListener(mql);
                    }
                }
                return mql;
            });
        }
    });
}

patchMediaQuery(Zone);

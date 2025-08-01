'use strict';
/**
 * @license Angular v<unknown>
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
(function (factory) {
    typeof define === 'function' && define.amd ? define(factory) :
        factory();
})((function () {
    'use strict';
    function patchMediaQuery(Zone) {
        Zone.__load_patch('mediaQuery', function (global, Zone, api) {
            function patchAddListener(proto) {
                api.patchMethod(proto, 'addListener', function (delegate) { return function (self, args) {
                    var callback = args.length > 0 ? args[0] : null;
                    if (typeof callback === 'function') {
                        var wrapperedCallback = Zone.current.wrap(callback, 'MediaQuery');
                        callback[api.symbol('mediaQueryCallback')] = wrapperedCallback;
                        return delegate.call(self, wrapperedCallback);
                    }
                    else {
                        return delegate.apply(self, args);
                    }
                }; });
            }
            function patchRemoveListener(proto) {
                api.patchMethod(proto, 'removeListener', function (delegate) { return function (self, args) {
                    var callback = args.length > 0 ? args[0] : null;
                    if (typeof callback === 'function') {
                        var wrapperedCallback = callback[api.symbol('mediaQueryCallback')];
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
                }; });
            }
            if (global['MediaQueryList']) {
                var proto = global['MediaQueryList'].prototype;
                patchAddListener(proto);
                patchRemoveListener(proto);
            }
            else if (global['matchMedia']) {
                api.patchMethod(global, 'matchMedia', function (delegate) { return function (self, args) {
                    var mql = delegate.apply(self, args);
                    if (mql) {
                        // try to patch MediaQueryList.prototype
                        var proto = Object.getPrototypeOf(mql);
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
                }; });
            }
        });
    }
    patchMediaQuery(Zone);
}));

'use strict';
/**
 * @license Angular v<unknown>
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
function patchJsonp(Zone) {
    Zone.__load_patch('jsonp', (global, Zone, api) => {
        // because jsonp is not a standard api, there are a lot of
        // implementations, so zone.js just provide a helper util to
        // patch the jsonp send and onSuccess/onError callback
        // the options is an object which contains
        // - jsonp, the jsonp object which hold the send function
        // - sendFuncName, the name of the send function
        // - successFuncName, success func name
        // - failedFuncName, failed func name
        Zone[Zone.__symbol__('jsonp')] = function patchJsonp(options) {
            if (!options || !options.jsonp || !options.sendFuncName) {
                return;
            }
            const noop = function () { };
            [options.successFuncName, options.failedFuncName].forEach((methodName) => {
                if (!methodName) {
                    return;
                }
                const oriFunc = global[methodName];
                if (oriFunc) {
                    api.patchMethod(global, methodName, (delegate) => (self, args) => {
                        const task = global[api.symbol('jsonTask')];
                        if (task) {
                            task.callback = delegate;
                            return task.invoke.apply(self, args);
                        }
                        else {
                            return delegate.apply(self, args);
                        }
                    });
                }
                else {
                    Object.defineProperty(global, methodName, {
                        configurable: true,
                        enumerable: true,
                        get: function () {
                            return function () {
                                const task = global[api.symbol('jsonpTask')];
                                const delegate = global[api.symbol(`jsonp${methodName}callback`)];
                                if (task) {
                                    if (delegate) {
                                        task.callback = delegate;
                                    }
                                    global[api.symbol('jsonpTask')] = undefined;
                                    return task.invoke.apply(this, arguments);
                                }
                                else {
                                    if (delegate) {
                                        return delegate.apply(this, arguments);
                                    }
                                }
                                return null;
                            };
                        },
                        set: function (callback) {
                            this[api.symbol(`jsonp${methodName}callback`)] = callback;
                        },
                    });
                }
            });
            api.patchMethod(options.jsonp, options.sendFuncName, (delegate) => (self, args) => {
                global[api.symbol('jsonpTask')] = Zone.current.scheduleMacroTask('jsonp', noop, {}, (task) => {
                    return delegate.apply(self, args);
                }, noop);
            });
        };
    });
}

patchJsonp(Zone);

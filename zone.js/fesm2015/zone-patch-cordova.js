'use strict';
/**
 * @license Angular v<unknown>
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
function patchCordova(Zone) {
    Zone.__load_patch('cordova', (global, Zone, api) => {
        if (global.cordova) {
            const SUCCESS_SOURCE = 'cordova.exec.success';
            const ERROR_SOURCE = 'cordova.exec.error';
            const FUNCTION = 'function';
            const nativeExec = api.patchMethod(global.cordova, 'exec', () => function (self, args) {
                if (args.length > 0 && typeof args[0] === FUNCTION) {
                    args[0] = Zone.current.wrap(args[0], SUCCESS_SOURCE);
                }
                if (args.length > 1 && typeof args[1] === FUNCTION) {
                    args[1] = Zone.current.wrap(args[1], ERROR_SOURCE);
                }
                return nativeExec.apply(self, args);
            });
        }
    });
    Zone.__load_patch('cordova.FileReader', (global, Zone) => {
        if (global.cordova && typeof global['FileReader'] !== 'undefined') {
            document.addEventListener('deviceReady', () => {
                const FileReader = global['FileReader'];
                ['abort', 'error', 'load', 'loadstart', 'loadend', 'progress'].forEach((prop) => {
                    const eventNameSymbol = Zone.__symbol__('ON_PROPERTY' + prop);
                    Object.defineProperty(FileReader.prototype, eventNameSymbol, {
                        configurable: true,
                        get: function () {
                            return this._realReader && this._realReader[eventNameSymbol];
                        },
                    });
                });
            });
        }
    });
}

patchCordova(Zone);

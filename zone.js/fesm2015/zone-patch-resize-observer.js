'use strict';
/**
 * @license Angular v<unknown>
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
function patchResizeObserver(Zone) {
    Zone.__load_patch('ResizeObserver', (global, Zone, api) => {
        const ResizeObserver = global['ResizeObserver'];
        if (!ResizeObserver) {
            return;
        }
        const resizeObserverSymbol = api.symbol('ResizeObserver');
        api.patchMethod(global, 'ResizeObserver', (delegate) => (self, args) => {
            const callback = args.length > 0 ? args[0] : null;
            if (callback) {
                args[0] = function (entries, observer) {
                    const zones = {};
                    const currZone = Zone.current;
                    for (let entry of entries) {
                        let zone = entry.target[resizeObserverSymbol];
                        if (!zone) {
                            zone = currZone;
                        }
                        let zoneEntriesInfo = zones[zone.name];
                        if (!zoneEntriesInfo) {
                            zones[zone.name] = zoneEntriesInfo = { entries: [], zone: zone };
                        }
                        zoneEntriesInfo.entries.push(entry);
                    }
                    Object.keys(zones).forEach((zoneName) => {
                        const zoneEntriesInfo = zones[zoneName];
                        if (zoneEntriesInfo.zone !== Zone.current) {
                            zoneEntriesInfo.zone.run(callback, this, [zoneEntriesInfo.entries, observer], 'ResizeObserver');
                        }
                        else {
                            callback.call(this, zoneEntriesInfo.entries, observer);
                        }
                    });
                };
            }
            return args.length > 0 ? new ResizeObserver(args[0]) : new ResizeObserver();
        });
        api.patchMethod(ResizeObserver.prototype, 'observe', (delegate) => (self, args) => {
            const target = args.length > 0 ? args[0] : null;
            if (!target) {
                return delegate.apply(self, args);
            }
            let targets = self[resizeObserverSymbol];
            if (!targets) {
                targets = self[resizeObserverSymbol] = [];
            }
            targets.push(target);
            target[resizeObserverSymbol] = Zone.current;
            return delegate.apply(self, args);
        });
        api.patchMethod(ResizeObserver.prototype, 'unobserve', (delegate) => (self, args) => {
            const target = args.length > 0 ? args[0] : null;
            if (!target) {
                return delegate.apply(self, args);
            }
            let targets = self[resizeObserverSymbol];
            if (targets) {
                for (let i = 0; i < targets.length; i++) {
                    if (targets[i] === target) {
                        targets.splice(i, 1);
                        break;
                    }
                }
            }
            target[resizeObserverSymbol] = undefined;
            return delegate.apply(self, args);
        });
        api.patchMethod(ResizeObserver.prototype, 'disconnect', (delegate) => (self, args) => {
            const targets = self[resizeObserverSymbol];
            if (targets) {
                targets.forEach((target) => {
                    target[resizeObserverSymbol] = undefined;
                });
                self[resizeObserverSymbol] = undefined;
            }
            return delegate.apply(self, args);
        });
    });
}

patchResizeObserver(Zone);

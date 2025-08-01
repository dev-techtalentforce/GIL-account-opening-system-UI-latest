'use strict';
/**
 * @license Angular v<unknown>
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
/**
 * @fileoverview
 * @suppress {globalThis,undefinedVars}
 */
function patchError(Zone) {
    Zone.__load_patch('Error', (global, Zone, api) => {
        /*
         * This code patches Error so that:
         *   - It ignores un-needed stack frames.
         *   - It Shows the associated Zone for reach frame.
         */
        const zoneJsInternalStackFramesSymbol = api.symbol('zoneJsInternalStackFrames');
        const NativeError = (global[api.symbol('Error')] = global['Error']);
        // Store the frames which should be removed from the stack frames
        const zoneJsInternalStackFrames = {};
        // We must find the frame where Error was created, otherwise we assume we don't understand stack
        let zoneAwareFrame1;
        let zoneAwareFrame2;
        let zoneAwareFrame1WithoutNew;
        let zoneAwareFrame2WithoutNew;
        let zoneAwareFrame3WithoutNew;
        global['Error'] = ZoneAwareError;
        const stackRewrite = 'stackRewrite';
        const zoneJsInternalStackFramesPolicy = global['__Zone_Error_BlacklistedStackFrames_policy'] ||
            global['__Zone_Error_ZoneJsInternalStackFrames_policy'] ||
            'default';
        function buildZoneFrameNames(zoneFrame) {
            let zoneFrameName = { zoneName: zoneFrame.zone.name };
            let result = zoneFrameName;
            while (zoneFrame.parent) {
                zoneFrame = zoneFrame.parent;
                const parentZoneFrameName = { zoneName: zoneFrame.zone.name };
                zoneFrameName.parent = parentZoneFrameName;
                zoneFrameName = parentZoneFrameName;
            }
            return result;
        }
        function buildZoneAwareStackFrames(originalStack, zoneFrame, isZoneFrame = true) {
            let frames = originalStack.split('\n');
            let i = 0;
            // Find the first frame
            while (!(frames[i] === zoneAwareFrame1 ||
                frames[i] === zoneAwareFrame2 ||
                frames[i] === zoneAwareFrame1WithoutNew ||
                frames[i] === zoneAwareFrame2WithoutNew ||
                frames[i] === zoneAwareFrame3WithoutNew) &&
                i < frames.length) {
                i++;
            }
            for (; i < frames.length && zoneFrame; i++) {
                let frame = frames[i];
                if (frame.trim()) {
                    switch (zoneJsInternalStackFrames[frame]) {
                        case 0 /* FrameType.zoneJsInternal */:
                            frames.splice(i, 1);
                            i--;
                            break;
                        case 1 /* FrameType.transition */:
                            if (zoneFrame.parent) {
                                // This is the special frame where zone changed. Print and process it accordingly
                                zoneFrame = zoneFrame.parent;
                            }
                            else {
                                zoneFrame = null;
                            }
                            frames.splice(i, 1);
                            i--;
                            break;
                        default:
                            frames[i] += isZoneFrame
                                ? ` [${zoneFrame.zone.name}]`
                                : ` [${zoneFrame.zoneName}]`;
                    }
                }
            }
            return frames.join('\n');
        }
        /**
         * This is ZoneAwareError which processes the stack frame and cleans up extra frames as well as
         * adds zone information to it.
         */
        function ZoneAwareError() {
            // We always have to return native error otherwise the browser console will not work.
            let error = NativeError.apply(this, arguments);
            // Save original stack trace
            const originalStack = (error['originalStack'] = error.stack);
            // Process the stack trace and rewrite the frames.
            if (ZoneAwareError[stackRewrite] && originalStack) {
                let zoneFrame = api.currentZoneFrame();
                if (zoneJsInternalStackFramesPolicy === 'lazy') {
                    // don't handle stack trace now
                    error[api.symbol('zoneFrameNames')] = buildZoneFrameNames(zoneFrame);
                }
                else if (zoneJsInternalStackFramesPolicy === 'default') {
                    try {
                        error.stack = error.zoneAwareStack = buildZoneAwareStackFrames(originalStack, zoneFrame);
                    }
                    catch (e) {
                        // ignore as some browsers don't allow overriding of stack
                    }
                }
            }
            if (this instanceof NativeError && this.constructor != NativeError) {
                // We got called with a `new` operator AND we are subclass of ZoneAwareError
                // in that case we have to copy all of our properties to `this`.
                Object.keys(error)
                    .concat('stack', 'message', 'cause')
                    .forEach((key) => {
                    const value = error[key];
                    if (value !== undefined) {
                        try {
                            this[key] = value;
                        }
                        catch (e) {
                            // ignore the assignment in case it is a setter and it throws.
                        }
                    }
                });
                return this;
            }
            return error;
        }
        // Copy the prototype so that instanceof operator works as expected
        ZoneAwareError.prototype = NativeError.prototype;
        ZoneAwareError[zoneJsInternalStackFramesSymbol] = zoneJsInternalStackFrames;
        ZoneAwareError[stackRewrite] = false;
        const zoneAwareStackSymbol = api.symbol('zoneAwareStack');
        // try to define zoneAwareStack property when zoneJsInternal frames policy is delay
        if (zoneJsInternalStackFramesPolicy === 'lazy') {
            Object.defineProperty(ZoneAwareError.prototype, 'zoneAwareStack', {
                configurable: true,
                enumerable: true,
                get: function () {
                    if (!this[zoneAwareStackSymbol]) {
                        this[zoneAwareStackSymbol] = buildZoneAwareStackFrames(this.originalStack, this[api.symbol('zoneFrameNames')], false);
                    }
                    return this[zoneAwareStackSymbol];
                },
                set: function (newStack) {
                    this.originalStack = newStack;
                    this[zoneAwareStackSymbol] = buildZoneAwareStackFrames(this.originalStack, this[api.symbol('zoneFrameNames')], false);
                },
            });
        }
        // those properties need special handling
        const specialPropertyNames = ['stackTraceLimit', 'captureStackTrace', 'prepareStackTrace'];
        // those properties of NativeError should be set to ZoneAwareError
        const nativeErrorProperties = Object.keys(NativeError);
        if (nativeErrorProperties) {
            nativeErrorProperties.forEach((prop) => {
                if (specialPropertyNames.filter((sp) => sp === prop).length === 0) {
                    Object.defineProperty(ZoneAwareError, prop, {
                        get: function () {
                            return NativeError[prop];
                        },
                        set: function (value) {
                            NativeError[prop] = value;
                        },
                    });
                }
            });
        }
        if (NativeError.hasOwnProperty('stackTraceLimit')) {
            // Extend default stack limit as we will be removing few frames.
            NativeError.stackTraceLimit = Math.max(NativeError.stackTraceLimit, 15);
            // make sure that ZoneAwareError has the same property which forwards to NativeError.
            Object.defineProperty(ZoneAwareError, 'stackTraceLimit', {
                get: function () {
                    return NativeError.stackTraceLimit;
                },
                set: function (value) {
                    return (NativeError.stackTraceLimit = value);
                },
            });
        }
        if (NativeError.hasOwnProperty('captureStackTrace')) {
            Object.defineProperty(ZoneAwareError, 'captureStackTrace', {
                // add named function here because we need to remove this
                // stack frame when prepareStackTrace below
                value: function zoneCaptureStackTrace(targetObject, constructorOpt) {
                    NativeError.captureStackTrace(targetObject, constructorOpt);
                },
            });
        }
        const ZONE_CAPTURESTACKTRACE = 'zoneCaptureStackTrace';
        Object.defineProperty(ZoneAwareError, 'prepareStackTrace', {
            get: function () {
                return NativeError.prepareStackTrace;
            },
            set: function (value) {
                if (!value || typeof value !== 'function') {
                    return (NativeError.prepareStackTrace = value);
                }
                return (NativeError.prepareStackTrace = function (error, structuredStackTrace) {
                    // remove additional stack information from ZoneAwareError.captureStackTrace
                    if (structuredStackTrace) {
                        for (let i = 0; i < structuredStackTrace.length; i++) {
                            const st = structuredStackTrace[i];
                            // remove the first function which name is zoneCaptureStackTrace
                            if (st.getFunctionName() === ZONE_CAPTURESTACKTRACE) {
                                structuredStackTrace.splice(i, 1);
                                break;
                            }
                        }
                    }
                    return value.call(this, error, structuredStackTrace);
                });
            },
        });
        if (zoneJsInternalStackFramesPolicy === 'disable') {
            // don't need to run detectZone to populate zoneJs internal stack frames
            return;
        }
        // Now we need to populate the `zoneJsInternalStackFrames` as well as find the
        // run/runGuarded/runTask frames. This is done by creating a detect zone and then threading
        // the execution through all of the above methods so that we can look at the stack trace and
        // find the frames of interest.
        let detectZone = Zone.current.fork({
            name: 'detect',
            onHandleError: function (parentZD, current, target, error) {
                if (error.originalStack && Error === ZoneAwareError) {
                    let frames = error.originalStack.split(/\n/);
                    let runFrame = false, runGuardedFrame = false, runTaskFrame = false;
                    while (frames.length) {
                        let frame = frames.shift();
                        // On safari it is possible to have stack frame with no line number.
                        // This check makes sure that we don't filter frames on name only (must have
                        // line number or exact equals to `ZoneAwareError`)
                        if (/:\d+:\d+/.test(frame) || frame === 'ZoneAwareError') {
                            // Get rid of the path so that we don't accidentally find function name in path.
                            // In chrome the separator is `(` and `@` in FF and safari
                            // Chrome: at Zone.run (zone.js:100)
                            // Chrome: at Zone.run (http://localhost:9876/base/build/lib/zone.js:100:24)
                            // FireFox: Zone.prototype.run@http://localhost:9876/base/build/lib/zone.js:101:24
                            // Safari: run@http://localhost:9876/base/build/lib/zone.js:101:24
                            let fnName = frame.split('(')[0].split('@')[0];
                            let frameType = 1 /* FrameType.transition */;
                            if (fnName.indexOf('ZoneAwareError') !== -1) {
                                if (fnName.indexOf('new ZoneAwareError') !== -1) {
                                    zoneAwareFrame1 = frame;
                                    zoneAwareFrame2 = frame.replace('new ZoneAwareError', 'new Error.ZoneAwareError');
                                }
                                else {
                                    zoneAwareFrame1WithoutNew = frame;
                                    zoneAwareFrame2WithoutNew = frame.replace('Error.', '');
                                    if (frame.indexOf('Error.ZoneAwareError') === -1) {
                                        zoneAwareFrame3WithoutNew = frame.replace('ZoneAwareError', 'Error.ZoneAwareError');
                                    }
                                }
                                zoneJsInternalStackFrames[zoneAwareFrame2] = 0 /* FrameType.zoneJsInternal */;
                            }
                            if (fnName.indexOf('runGuarded') !== -1) {
                                runGuardedFrame = true;
                            }
                            else if (fnName.indexOf('runTask') !== -1) {
                                runTaskFrame = true;
                            }
                            else if (fnName.indexOf('run') !== -1) {
                                runFrame = true;
                            }
                            else {
                                frameType = 0 /* FrameType.zoneJsInternal */;
                            }
                            zoneJsInternalStackFrames[frame] = frameType;
                            // Once we find all of the frames we can stop looking.
                            if (runFrame && runGuardedFrame && runTaskFrame) {
                                ZoneAwareError[stackRewrite] = true;
                                break;
                            }
                        }
                    }
                }
                return false;
            },
        });
        // carefully constructor a stack frame which contains all of the frames of interest which
        // need to be detected and marked as an internal zoneJs frame.
        const childDetectZone = detectZone.fork({
            name: 'child',
            onScheduleTask: function (delegate, curr, target, task) {
                return delegate.scheduleTask(target, task);
            },
            onInvokeTask: function (delegate, curr, target, task, applyThis, applyArgs) {
                return delegate.invokeTask(target, task, applyThis, applyArgs);
            },
            onCancelTask: function (delegate, curr, target, task) {
                return delegate.cancelTask(target, task);
            },
            onInvoke: function (delegate, curr, target, callback, applyThis, applyArgs, source) {
                return delegate.invoke(target, callback, applyThis, applyArgs, source);
            },
        });
        // we need to detect all zone related frames, it will
        // exceed default stackTraceLimit, so we set it to
        // larger number here, and restore it after detect finish.
        // We cast through any so we don't need to depend on nodejs typings.
        const originalStackTraceLimit = Error.stackTraceLimit;
        Error.stackTraceLimit = 100;
        // we schedule event/micro/macro task, and invoke them
        // when onSchedule, so we can get all stack traces for
        // all kinds of tasks with one error thrown.
        childDetectZone.run(() => {
            childDetectZone.runGuarded(() => {
                const fakeTransitionTo = () => { };
                childDetectZone.scheduleEventTask(zoneJsInternalStackFramesSymbol, () => {
                    childDetectZone.scheduleMacroTask(zoneJsInternalStackFramesSymbol, () => {
                        childDetectZone.scheduleMicroTask(zoneJsInternalStackFramesSymbol, () => {
                            throw new Error();
                        }, undefined, (t) => {
                            t._transitionTo = fakeTransitionTo;
                            t.invoke();
                        });
                        childDetectZone.scheduleMicroTask(zoneJsInternalStackFramesSymbol, () => {
                            throw Error();
                        }, undefined, (t) => {
                            t._transitionTo = fakeTransitionTo;
                            t.invoke();
                        });
                    }, undefined, (t) => {
                        t._transitionTo = fakeTransitionTo;
                        t.invoke();
                    }, () => { });
                }, undefined, (t) => {
                    t._transitionTo = fakeTransitionTo;
                    t.invoke();
                }, () => { });
            });
        });
        Error.stackTraceLimit = originalStackTraceLimit;
    });
}

patchError(Zone);

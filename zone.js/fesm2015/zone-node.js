'use strict';
/**
 * @license Angular v<unknown>
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
const global = globalThis;
// __Zone_symbol_prefix global can be used to override the default zone
// symbol prefix with a custom one if needed.
function __symbol__(name) {
    const symbolPrefix = global['__Zone_symbol_prefix'] || '__zone_symbol__';
    return symbolPrefix + name;
}
function initZone() {
    const performance = global['performance'];
    function mark(name) {
        performance && performance['mark'] && performance['mark'](name);
    }
    function performanceMeasure(name, label) {
        performance && performance['measure'] && performance['measure'](name, label);
    }
    mark('Zone');
    class ZoneImpl {
        static __symbol__ = __symbol__;
        static assertZonePatched() {
            if (global['Promise'] !== patches['ZoneAwarePromise']) {
                throw new Error('Zone.js has detected that ZoneAwarePromise `(window|global).Promise` ' +
                    'has been overwritten.\n' +
                    'Most likely cause is that a Promise polyfill has been loaded ' +
                    'after Zone.js (Polyfilling Promise api is not necessary when zone.js is loaded. ' +
                    'If you must load one, do so before loading zone.js.)');
            }
        }
        static get root() {
            let zone = ZoneImpl.current;
            while (zone.parent) {
                zone = zone.parent;
            }
            return zone;
        }
        static get current() {
            return _currentZoneFrame.zone;
        }
        static get currentTask() {
            return _currentTask;
        }
        static __load_patch(name, fn, ignoreDuplicate = false) {
            if (patches.hasOwnProperty(name)) {
                // `checkDuplicate` option is defined from global variable
                // so it works for all modules.
                // `ignoreDuplicate` can work for the specified module
                const checkDuplicate = global[__symbol__('forceDuplicateZoneCheck')] === true;
                if (!ignoreDuplicate && checkDuplicate) {
                    throw Error('Already loaded patch: ' + name);
                }
            }
            else if (!global['__Zone_disable_' + name]) {
                const perfName = 'Zone:' + name;
                mark(perfName);
                patches[name] = fn(global, ZoneImpl, _api);
                performanceMeasure(perfName, perfName);
            }
        }
        get parent() {
            return this._parent;
        }
        get name() {
            return this._name;
        }
        _parent;
        _name;
        _properties;
        _zoneDelegate;
        constructor(parent, zoneSpec) {
            this._parent = parent;
            this._name = zoneSpec ? zoneSpec.name || 'unnamed' : '<root>';
            this._properties = (zoneSpec && zoneSpec.properties) || {};
            this._zoneDelegate = new _ZoneDelegate(this, this._parent && this._parent._zoneDelegate, zoneSpec);
        }
        get(key) {
            const zone = this.getZoneWith(key);
            if (zone)
                return zone._properties[key];
        }
        getZoneWith(key) {
            let current = this;
            while (current) {
                if (current._properties.hasOwnProperty(key)) {
                    return current;
                }
                current = current._parent;
            }
            return null;
        }
        fork(zoneSpec) {
            if (!zoneSpec)
                throw new Error('ZoneSpec required!');
            return this._zoneDelegate.fork(this, zoneSpec);
        }
        wrap(callback, source) {
            if (typeof callback !== 'function') {
                throw new Error('Expecting function got: ' + callback);
            }
            const _callback = this._zoneDelegate.intercept(this, callback, source);
            const zone = this;
            return function () {
                return zone.runGuarded(_callback, this, arguments, source);
            };
        }
        run(callback, applyThis, applyArgs, source) {
            _currentZoneFrame = { parent: _currentZoneFrame, zone: this };
            try {
                return this._zoneDelegate.invoke(this, callback, applyThis, applyArgs, source);
            }
            finally {
                _currentZoneFrame = _currentZoneFrame.parent;
            }
        }
        runGuarded(callback, applyThis = null, applyArgs, source) {
            _currentZoneFrame = { parent: _currentZoneFrame, zone: this };
            try {
                try {
                    return this._zoneDelegate.invoke(this, callback, applyThis, applyArgs, source);
                }
                catch (error) {
                    if (this._zoneDelegate.handleError(this, error)) {
                        throw error;
                    }
                }
            }
            finally {
                _currentZoneFrame = _currentZoneFrame.parent;
            }
        }
        runTask(task, applyThis, applyArgs) {
            if (task.zone != this) {
                throw new Error('A task can only be run in the zone of creation! (Creation: ' +
                    (task.zone || NO_ZONE).name +
                    '; Execution: ' +
                    this.name +
                    ')');
            }
            const zoneTask = task;
            // https://github.com/angular/zone.js/issues/778, sometimes eventTask
            // will run in notScheduled(canceled) state, we should not try to
            // run such kind of task but just return
            const { type, data: { isPeriodic = false, isRefreshable = false } = {} } = task;
            if (task.state === notScheduled && (type === eventTask || type === macroTask)) {
                return;
            }
            const reEntryGuard = task.state != running;
            reEntryGuard && zoneTask._transitionTo(running, scheduled);
            const previousTask = _currentTask;
            _currentTask = zoneTask;
            _currentZoneFrame = { parent: _currentZoneFrame, zone: this };
            try {
                if (type == macroTask && task.data && !isPeriodic && !isRefreshable) {
                    task.cancelFn = undefined;
                }
                try {
                    return this._zoneDelegate.invokeTask(this, zoneTask, applyThis, applyArgs);
                }
                catch (error) {
                    if (this._zoneDelegate.handleError(this, error)) {
                        throw error;
                    }
                }
            }
            finally {
                // if the task's state is notScheduled or unknown, then it has already been cancelled
                // we should not reset the state to scheduled
                const state = task.state;
                if (state !== notScheduled && state !== unknown) {
                    if (type == eventTask || isPeriodic || (isRefreshable && state === scheduling)) {
                        reEntryGuard && zoneTask._transitionTo(scheduled, running, scheduling);
                    }
                    else {
                        const zoneDelegates = zoneTask._zoneDelegates;
                        this._updateTaskCount(zoneTask, -1);
                        reEntryGuard && zoneTask._transitionTo(notScheduled, running, notScheduled);
                        if (isRefreshable) {
                            zoneTask._zoneDelegates = zoneDelegates;
                        }
                    }
                }
                _currentZoneFrame = _currentZoneFrame.parent;
                _currentTask = previousTask;
            }
        }
        scheduleTask(task) {
            if (task.zone && task.zone !== this) {
                // check if the task was rescheduled, the newZone
                // should not be the children of the original zone
                let newZone = this;
                while (newZone) {
                    if (newZone === task.zone) {
                        throw Error(`can not reschedule task to ${this.name} which is descendants of the original zone ${task.zone.name}`);
                    }
                    newZone = newZone.parent;
                }
            }
            task._transitionTo(scheduling, notScheduled);
            const zoneDelegates = [];
            task._zoneDelegates = zoneDelegates;
            task._zone = this;
            try {
                task = this._zoneDelegate.scheduleTask(this, task);
            }
            catch (err) {
                // should set task's state to unknown when scheduleTask throw error
                // because the err may from reschedule, so the fromState maybe notScheduled
                task._transitionTo(unknown, scheduling, notScheduled);
                // TODO: @JiaLiPassion, should we check the result from handleError?
                this._zoneDelegate.handleError(this, err);
                throw err;
            }
            if (task._zoneDelegates === zoneDelegates) {
                // we have to check because internally the delegate can reschedule the task.
                this._updateTaskCount(task, 1);
            }
            if (task.state == scheduling) {
                task._transitionTo(scheduled, scheduling);
            }
            return task;
        }
        scheduleMicroTask(source, callback, data, customSchedule) {
            return this.scheduleTask(new ZoneTask(microTask, source, callback, data, customSchedule, undefined));
        }
        scheduleMacroTask(source, callback, data, customSchedule, customCancel) {
            return this.scheduleTask(new ZoneTask(macroTask, source, callback, data, customSchedule, customCancel));
        }
        scheduleEventTask(source, callback, data, customSchedule, customCancel) {
            return this.scheduleTask(new ZoneTask(eventTask, source, callback, data, customSchedule, customCancel));
        }
        cancelTask(task) {
            if (task.zone != this)
                throw new Error('A task can only be cancelled in the zone of creation! (Creation: ' +
                    (task.zone || NO_ZONE).name +
                    '; Execution: ' +
                    this.name +
                    ')');
            if (task.state !== scheduled && task.state !== running) {
                return;
            }
            task._transitionTo(canceling, scheduled, running);
            try {
                this._zoneDelegate.cancelTask(this, task);
            }
            catch (err) {
                // if error occurs when cancelTask, transit the state to unknown
                task._transitionTo(unknown, canceling);
                this._zoneDelegate.handleError(this, err);
                throw err;
            }
            this._updateTaskCount(task, -1);
            task._transitionTo(notScheduled, canceling);
            task.runCount = -1;
            return task;
        }
        _updateTaskCount(task, count) {
            const zoneDelegates = task._zoneDelegates;
            if (count == -1) {
                task._zoneDelegates = null;
            }
            for (let i = 0; i < zoneDelegates.length; i++) {
                zoneDelegates[i]._updateTaskCount(task.type, count);
            }
        }
    }
    const DELEGATE_ZS = {
        name: '',
        onHasTask: (delegate, _, target, hasTaskState) => delegate.hasTask(target, hasTaskState),
        onScheduleTask: (delegate, _, target, task) => delegate.scheduleTask(target, task),
        onInvokeTask: (delegate, _, target, task, applyThis, applyArgs) => delegate.invokeTask(target, task, applyThis, applyArgs),
        onCancelTask: (delegate, _, target, task) => delegate.cancelTask(target, task),
    };
    class _ZoneDelegate {
        get zone() {
            return this._zone;
        }
        _zone;
        _taskCounts = {
            'microTask': 0,
            'macroTask': 0,
            'eventTask': 0,
        };
        _parentDelegate;
        _forkDlgt;
        _forkZS;
        _forkCurrZone;
        _interceptDlgt;
        _interceptZS;
        _interceptCurrZone;
        _invokeDlgt;
        _invokeZS;
        _invokeCurrZone;
        _handleErrorDlgt;
        _handleErrorZS;
        _handleErrorCurrZone;
        _scheduleTaskDlgt;
        _scheduleTaskZS;
        _scheduleTaskCurrZone;
        _invokeTaskDlgt;
        _invokeTaskZS;
        _invokeTaskCurrZone;
        _cancelTaskDlgt;
        _cancelTaskZS;
        _cancelTaskCurrZone;
        _hasTaskDlgt;
        _hasTaskDlgtOwner;
        _hasTaskZS;
        _hasTaskCurrZone;
        constructor(zone, parentDelegate, zoneSpec) {
            this._zone = zone;
            this._parentDelegate = parentDelegate;
            this._forkZS = zoneSpec && (zoneSpec && zoneSpec.onFork ? zoneSpec : parentDelegate._forkZS);
            this._forkDlgt = zoneSpec && (zoneSpec.onFork ? parentDelegate : parentDelegate._forkDlgt);
            this._forkCurrZone =
                zoneSpec && (zoneSpec.onFork ? this._zone : parentDelegate._forkCurrZone);
            this._interceptZS =
                zoneSpec && (zoneSpec.onIntercept ? zoneSpec : parentDelegate._interceptZS);
            this._interceptDlgt =
                zoneSpec && (zoneSpec.onIntercept ? parentDelegate : parentDelegate._interceptDlgt);
            this._interceptCurrZone =
                zoneSpec && (zoneSpec.onIntercept ? this._zone : parentDelegate._interceptCurrZone);
            this._invokeZS = zoneSpec && (zoneSpec.onInvoke ? zoneSpec : parentDelegate._invokeZS);
            this._invokeDlgt =
                zoneSpec && (zoneSpec.onInvoke ? parentDelegate : parentDelegate._invokeDlgt);
            this._invokeCurrZone =
                zoneSpec && (zoneSpec.onInvoke ? this._zone : parentDelegate._invokeCurrZone);
            this._handleErrorZS =
                zoneSpec && (zoneSpec.onHandleError ? zoneSpec : parentDelegate._handleErrorZS);
            this._handleErrorDlgt =
                zoneSpec && (zoneSpec.onHandleError ? parentDelegate : parentDelegate._handleErrorDlgt);
            this._handleErrorCurrZone =
                zoneSpec && (zoneSpec.onHandleError ? this._zone : parentDelegate._handleErrorCurrZone);
            this._scheduleTaskZS =
                zoneSpec && (zoneSpec.onScheduleTask ? zoneSpec : parentDelegate._scheduleTaskZS);
            this._scheduleTaskDlgt =
                zoneSpec && (zoneSpec.onScheduleTask ? parentDelegate : parentDelegate._scheduleTaskDlgt);
            this._scheduleTaskCurrZone =
                zoneSpec && (zoneSpec.onScheduleTask ? this._zone : parentDelegate._scheduleTaskCurrZone);
            this._invokeTaskZS =
                zoneSpec && (zoneSpec.onInvokeTask ? zoneSpec : parentDelegate._invokeTaskZS);
            this._invokeTaskDlgt =
                zoneSpec && (zoneSpec.onInvokeTask ? parentDelegate : parentDelegate._invokeTaskDlgt);
            this._invokeTaskCurrZone =
                zoneSpec && (zoneSpec.onInvokeTask ? this._zone : parentDelegate._invokeTaskCurrZone);
            this._cancelTaskZS =
                zoneSpec && (zoneSpec.onCancelTask ? zoneSpec : parentDelegate._cancelTaskZS);
            this._cancelTaskDlgt =
                zoneSpec && (zoneSpec.onCancelTask ? parentDelegate : parentDelegate._cancelTaskDlgt);
            this._cancelTaskCurrZone =
                zoneSpec && (zoneSpec.onCancelTask ? this._zone : parentDelegate._cancelTaskCurrZone);
            this._hasTaskZS = null;
            this._hasTaskDlgt = null;
            this._hasTaskDlgtOwner = null;
            this._hasTaskCurrZone = null;
            const zoneSpecHasTask = zoneSpec && zoneSpec.onHasTask;
            const parentHasTask = parentDelegate && parentDelegate._hasTaskZS;
            if (zoneSpecHasTask || parentHasTask) {
                // If we need to report hasTask, than this ZS needs to do ref counting on tasks. In such
                // a case all task related interceptors must go through this ZD. We can't short circuit it.
                this._hasTaskZS = zoneSpecHasTask ? zoneSpec : DELEGATE_ZS;
                this._hasTaskDlgt = parentDelegate;
                this._hasTaskDlgtOwner = this;
                this._hasTaskCurrZone = this._zone;
                if (!zoneSpec.onScheduleTask) {
                    this._scheduleTaskZS = DELEGATE_ZS;
                    this._scheduleTaskDlgt = parentDelegate;
                    this._scheduleTaskCurrZone = this._zone;
                }
                if (!zoneSpec.onInvokeTask) {
                    this._invokeTaskZS = DELEGATE_ZS;
                    this._invokeTaskDlgt = parentDelegate;
                    this._invokeTaskCurrZone = this._zone;
                }
                if (!zoneSpec.onCancelTask) {
                    this._cancelTaskZS = DELEGATE_ZS;
                    this._cancelTaskDlgt = parentDelegate;
                    this._cancelTaskCurrZone = this._zone;
                }
            }
        }
        fork(targetZone, zoneSpec) {
            return this._forkZS
                ? this._forkZS.onFork(this._forkDlgt, this.zone, targetZone, zoneSpec)
                : new ZoneImpl(targetZone, zoneSpec);
        }
        intercept(targetZone, callback, source) {
            return this._interceptZS
                ? this._interceptZS.onIntercept(this._interceptDlgt, this._interceptCurrZone, targetZone, callback, source)
                : callback;
        }
        invoke(targetZone, callback, applyThis, applyArgs, source) {
            return this._invokeZS
                ? this._invokeZS.onInvoke(this._invokeDlgt, this._invokeCurrZone, targetZone, callback, applyThis, applyArgs, source)
                : callback.apply(applyThis, applyArgs);
        }
        handleError(targetZone, error) {
            return this._handleErrorZS
                ? this._handleErrorZS.onHandleError(this._handleErrorDlgt, this._handleErrorCurrZone, targetZone, error)
                : true;
        }
        scheduleTask(targetZone, task) {
            let returnTask = task;
            if (this._scheduleTaskZS) {
                if (this._hasTaskZS) {
                    returnTask._zoneDelegates.push(this._hasTaskDlgtOwner);
                }
                returnTask = this._scheduleTaskZS.onScheduleTask(this._scheduleTaskDlgt, this._scheduleTaskCurrZone, targetZone, task);
                if (!returnTask)
                    returnTask = task;
            }
            else {
                if (task.scheduleFn) {
                    task.scheduleFn(task);
                }
                else if (task.type == microTask) {
                    scheduleMicroTask(task);
                }
                else {
                    throw new Error('Task is missing scheduleFn.');
                }
            }
            return returnTask;
        }
        invokeTask(targetZone, task, applyThis, applyArgs) {
            return this._invokeTaskZS
                ? this._invokeTaskZS.onInvokeTask(this._invokeTaskDlgt, this._invokeTaskCurrZone, targetZone, task, applyThis, applyArgs)
                : task.callback.apply(applyThis, applyArgs);
        }
        cancelTask(targetZone, task) {
            let value;
            if (this._cancelTaskZS) {
                value = this._cancelTaskZS.onCancelTask(this._cancelTaskDlgt, this._cancelTaskCurrZone, targetZone, task);
            }
            else {
                if (!task.cancelFn) {
                    throw Error('Task is not cancelable');
                }
                value = task.cancelFn(task);
            }
            return value;
        }
        hasTask(targetZone, isEmpty) {
            // hasTask should not throw error so other ZoneDelegate
            // can still trigger hasTask callback
            try {
                this._hasTaskZS &&
                    this._hasTaskZS.onHasTask(this._hasTaskDlgt, this._hasTaskCurrZone, targetZone, isEmpty);
            }
            catch (err) {
                this.handleError(targetZone, err);
            }
        }
        _updateTaskCount(type, count) {
            const counts = this._taskCounts;
            const prev = counts[type];
            const next = (counts[type] = prev + count);
            if (next < 0) {
                throw new Error('More tasks executed then were scheduled.');
            }
            if (prev == 0 || next == 0) {
                const isEmpty = {
                    microTask: counts['microTask'] > 0,
                    macroTask: counts['macroTask'] > 0,
                    eventTask: counts['eventTask'] > 0,
                    change: type,
                };
                this.hasTask(this._zone, isEmpty);
            }
        }
    }
    class ZoneTask {
        type;
        source;
        invoke;
        callback;
        data;
        scheduleFn;
        cancelFn;
        _zone = null;
        runCount = 0;
        _zoneDelegates = null;
        _state = 'notScheduled';
        constructor(type, source, callback, options, scheduleFn, cancelFn) {
            this.type = type;
            this.source = source;
            this.data = options;
            this.scheduleFn = scheduleFn;
            this.cancelFn = cancelFn;
            if (!callback) {
                throw new Error('callback is not defined');
            }
            this.callback = callback;
            const self = this;
            // TODO: @JiaLiPassion options should have interface
            if (type === eventTask && options && options.useG) {
                this.invoke = ZoneTask.invokeTask;
            }
            else {
                this.invoke = function () {
                    return ZoneTask.invokeTask.call(global, self, this, arguments);
                };
            }
        }
        static invokeTask(task, target, args) {
            if (!task) {
                task = this;
            }
            _numberOfNestedTaskFrames++;
            try {
                task.runCount++;
                return task.zone.runTask(task, target, args);
            }
            finally {
                if (_numberOfNestedTaskFrames == 1) {
                    drainMicroTaskQueue();
                }
                _numberOfNestedTaskFrames--;
            }
        }
        get zone() {
            return this._zone;
        }
        get state() {
            return this._state;
        }
        cancelScheduleRequest() {
            this._transitionTo(notScheduled, scheduling);
        }
        _transitionTo(toState, fromState1, fromState2) {
            if (this._state === fromState1 || this._state === fromState2) {
                this._state = toState;
                if (toState == notScheduled) {
                    this._zoneDelegates = null;
                }
            }
            else {
                throw new Error(`${this.type} '${this.source}': can not transition to '${toState}', expecting state '${fromState1}'${fromState2 ? " or '" + fromState2 + "'" : ''}, was '${this._state}'.`);
            }
        }
        toString() {
            if (this.data && typeof this.data.handleId !== 'undefined') {
                return this.data.handleId.toString();
            }
            else {
                return Object.prototype.toString.call(this);
            }
        }
        // add toJSON method to prevent cyclic error when
        // call JSON.stringify(zoneTask)
        toJSON() {
            return {
                type: this.type,
                state: this.state,
                source: this.source,
                zone: this.zone.name,
                runCount: this.runCount,
            };
        }
    }
    //////////////////////////////////////////////////////
    //////////////////////////////////////////////////////
    ///  MICROTASK QUEUE
    //////////////////////////////////////////////////////
    //////////////////////////////////////////////////////
    const symbolSetTimeout = __symbol__('setTimeout');
    const symbolPromise = __symbol__('Promise');
    const symbolThen = __symbol__('then');
    let _microTaskQueue = [];
    let _isDrainingMicrotaskQueue = false;
    let nativeMicroTaskQueuePromise;
    function nativeScheduleMicroTask(func) {
        if (!nativeMicroTaskQueuePromise) {
            if (global[symbolPromise]) {
                nativeMicroTaskQueuePromise = global[symbolPromise].resolve(0);
            }
        }
        if (nativeMicroTaskQueuePromise) {
            let nativeThen = nativeMicroTaskQueuePromise[symbolThen];
            if (!nativeThen) {
                // native Promise is not patchable, we need to use `then` directly
                // issue 1078
                nativeThen = nativeMicroTaskQueuePromise['then'];
            }
            nativeThen.call(nativeMicroTaskQueuePromise, func);
        }
        else {
            global[symbolSetTimeout](func, 0);
        }
    }
    function scheduleMicroTask(task) {
        // if we are not running in any task, and there has not been anything scheduled
        // we must bootstrap the initial task creation by manually scheduling the drain
        if (_numberOfNestedTaskFrames === 0 && _microTaskQueue.length === 0) {
            // We are not running in Task, so we need to kickstart the microtask queue.
            nativeScheduleMicroTask(drainMicroTaskQueue);
        }
        task && _microTaskQueue.push(task);
    }
    function drainMicroTaskQueue() {
        if (!_isDrainingMicrotaskQueue) {
            _isDrainingMicrotaskQueue = true;
            while (_microTaskQueue.length) {
                const queue = _microTaskQueue;
                _microTaskQueue = [];
                for (let i = 0; i < queue.length; i++) {
                    const task = queue[i];
                    try {
                        task.zone.runTask(task, null, null);
                    }
                    catch (error) {
                        _api.onUnhandledError(error);
                    }
                }
            }
            _api.microtaskDrainDone();
            _isDrainingMicrotaskQueue = false;
        }
    }
    //////////////////////////////////////////////////////
    //////////////////////////////////////////////////////
    ///  BOOTSTRAP
    //////////////////////////////////////////////////////
    //////////////////////////////////////////////////////
    const NO_ZONE = { name: 'NO ZONE' };
    const notScheduled = 'notScheduled', scheduling = 'scheduling', scheduled = 'scheduled', running = 'running', canceling = 'canceling', unknown = 'unknown';
    const microTask = 'microTask', macroTask = 'macroTask', eventTask = 'eventTask';
    const patches = {};
    const _api = {
        symbol: __symbol__,
        currentZoneFrame: () => _currentZoneFrame,
        onUnhandledError: noop,
        microtaskDrainDone: noop,
        scheduleMicroTask: scheduleMicroTask,
        showUncaughtError: () => !ZoneImpl[__symbol__('ignoreConsoleErrorUncaughtError')],
        patchEventTarget: () => [],
        patchOnProperties: noop,
        patchMethod: () => noop,
        bindArguments: () => [],
        patchThen: () => noop,
        patchMacroTask: () => noop,
        patchEventPrototype: () => noop,
        isIEOrEdge: () => false,
        getGlobalObjects: () => undefined,
        ObjectDefineProperty: () => noop,
        ObjectGetOwnPropertyDescriptor: () => undefined,
        ObjectCreate: () => undefined,
        ArraySlice: () => [],
        patchClass: () => noop,
        wrapWithCurrentZone: () => noop,
        filterProperties: () => [],
        attachOriginToPatched: () => noop,
        _redefineProperty: () => noop,
        patchCallbacks: () => noop,
        nativeScheduleMicroTask: nativeScheduleMicroTask,
    };
    let _currentZoneFrame = { parent: null, zone: new ZoneImpl(null, null) };
    let _currentTask = null;
    let _numberOfNestedTaskFrames = 0;
    function noop() { }
    performanceMeasure('Zone', 'Zone');
    return ZoneImpl;
}

/**
 * Suppress closure compiler errors about unknown 'Zone' variable
 * @fileoverview
 * @suppress {undefinedVars,globalThis,missingRequire}
 */
/// <reference types="node"/>
// issue #989, to reduce bundle size, use short name
/** Object.getOwnPropertyDescriptor */
const ObjectGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
/** Object.defineProperty */
const ObjectDefineProperty = Object.defineProperty;
/** Object.getPrototypeOf */
const ObjectGetPrototypeOf = Object.getPrototypeOf;
/** Array.prototype.slice */
const ArraySlice = Array.prototype.slice;
/** addEventListener string const */
const ADD_EVENT_LISTENER_STR = 'addEventListener';
/** removeEventListener string const */
const REMOVE_EVENT_LISTENER_STR = 'removeEventListener';
/** true string const */
const TRUE_STR = 'true';
/** false string const */
const FALSE_STR = 'false';
/** Zone symbol prefix string const. */
const ZONE_SYMBOL_PREFIX = __symbol__('');
function wrapWithCurrentZone(callback, source) {
    return Zone.current.wrap(callback, source);
}
function scheduleMacroTaskWithCurrentZone(source, callback, data, customSchedule, customCancel) {
    return Zone.current.scheduleMacroTask(source, callback, data, customSchedule, customCancel);
}
const zoneSymbol = __symbol__;
const isWindowExists = typeof window !== 'undefined';
const internalWindow = isWindowExists ? window : undefined;
const _global = (isWindowExists && internalWindow) || globalThis;
const REMOVE_ATTRIBUTE = 'removeAttribute';
function bindArguments(args, source) {
    for (let i = args.length - 1; i >= 0; i--) {
        if (typeof args[i] === 'function') {
            args[i] = wrapWithCurrentZone(args[i], source + '_' + i);
        }
    }
    return args;
}
function isPropertyWritable(propertyDesc) {
    if (!propertyDesc) {
        return true;
    }
    if (propertyDesc.writable === false) {
        return false;
    }
    return !(typeof propertyDesc.get === 'function' && typeof propertyDesc.set === 'undefined');
}
const isWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
// Make sure to access `process` through `_global` so that WebPack does not accidentally browserify
// this code.
const isNode = !('nw' in _global) &&
    typeof _global.process !== 'undefined' &&
    _global.process.toString() === '[object process]';
const isBrowser = !isNode && !isWebWorker && !!(isWindowExists && internalWindow['HTMLElement']);
// we are in electron of nw, so we are both browser and nodejs
// Make sure to access `process` through `_global` so that WebPack does not accidentally browserify
// this code.
const isMix = typeof _global.process !== 'undefined' &&
    _global.process.toString() === '[object process]' &&
    !isWebWorker &&
    !!(isWindowExists && internalWindow['HTMLElement']);
const zoneSymbolEventNames$1 = {};
const enableBeforeunloadSymbol = zoneSymbol('enable_beforeunload');
const wrapFn = function (event) {
    // https://github.com/angular/zone.js/issues/911, in IE, sometimes
    // event will be undefined, so we need to use window.event
    event = event || _global.event;
    if (!event) {
        return;
    }
    let eventNameSymbol = zoneSymbolEventNames$1[event.type];
    if (!eventNameSymbol) {
        eventNameSymbol = zoneSymbolEventNames$1[event.type] = zoneSymbol('ON_PROPERTY' + event.type);
    }
    const target = this || event.target || _global;
    const listener = target[eventNameSymbol];
    let result;
    if (isBrowser && target === internalWindow && event.type === 'error') {
        // window.onerror have different signature
        // https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onerror#window.onerror
        // and onerror callback will prevent default when callback return true
        const errorEvent = event;
        result =
            listener &&
                listener.call(this, errorEvent.message, errorEvent.filename, errorEvent.lineno, errorEvent.colno, errorEvent.error);
        if (result === true) {
            event.preventDefault();
        }
    }
    else {
        result = listener && listener.apply(this, arguments);
        if (
        // https://github.com/angular/angular/issues/47579
        // https://www.w3.org/TR/2011/WD-html5-20110525/history.html#beforeunloadevent
        // This is the only specific case we should check for. The spec defines that the
        // `returnValue` attribute represents the message to show the user. When the event
        // is created, this attribute must be set to the empty string.
        event.type === 'beforeunload' &&
            // To prevent any breaking changes resulting from this change, given that
            // it was already causing a significant number of failures in G3, we have hidden
            // that behavior behind a global configuration flag. Consumers can enable this
            // flag explicitly if they want the `beforeunload` event to be handled as defined
            // in the specification.
            _global[enableBeforeunloadSymbol] &&
            // The IDL event definition is `attribute DOMString returnValue`, so we check whether
            // `typeof result` is a string.
            typeof result === 'string') {
            event.returnValue = result;
        }
        else if (result != undefined && !result) {
            event.preventDefault();
        }
    }
    return result;
};
function patchProperty(obj, prop, prototype) {
    let desc = ObjectGetOwnPropertyDescriptor(obj, prop);
    if (!desc && prototype) {
        // when patch window object, use prototype to check prop exist or not
        const prototypeDesc = ObjectGetOwnPropertyDescriptor(prototype, prop);
        if (prototypeDesc) {
            desc = { enumerable: true, configurable: true };
        }
    }
    // if the descriptor not exists or is not configurable
    // just return
    if (!desc || !desc.configurable) {
        return;
    }
    const onPropPatchedSymbol = zoneSymbol('on' + prop + 'patched');
    if (obj.hasOwnProperty(onPropPatchedSymbol) && obj[onPropPatchedSymbol]) {
        return;
    }
    // A property descriptor cannot have getter/setter and be writable
    // deleting the writable and value properties avoids this error:
    //
    // TypeError: property descriptors must not specify a value or be writable when a
    // getter or setter has been specified
    delete desc.writable;
    delete desc.value;
    const originalDescGet = desc.get;
    const originalDescSet = desc.set;
    // slice(2) cuz 'onclick' -> 'click', etc
    const eventName = prop.slice(2);
    let eventNameSymbol = zoneSymbolEventNames$1[eventName];
    if (!eventNameSymbol) {
        eventNameSymbol = zoneSymbolEventNames$1[eventName] = zoneSymbol('ON_PROPERTY' + eventName);
    }
    desc.set = function (newValue) {
        // In some versions of Windows, the `this` context may be undefined
        // in on-property callbacks.
        // To handle this edge case, we check if `this` is falsy and
        // fallback to `_global` if needed.
        let target = this;
        if (!target && obj === _global) {
            target = _global;
        }
        if (!target) {
            return;
        }
        const previousValue = target[eventNameSymbol];
        if (typeof previousValue === 'function') {
            target.removeEventListener(eventName, wrapFn);
        }
        // https://github.com/angular/zone.js/issues/978
        // If an inline handler (like `onload`) was defined before zone.js was loaded,
        // call the original descriptor's setter to clean it up.
        originalDescSet?.call(target, null);
        target[eventNameSymbol] = newValue;
        if (typeof newValue === 'function') {
            target.addEventListener(eventName, wrapFn, false);
        }
    };
    // The getter would return undefined for unassigned properties but the default value of an
    // unassigned property is null
    desc.get = function () {
        // in some of windows's onproperty callback, this is undefined
        // so we need to check it
        let target = this;
        if (!target && obj === _global) {
            target = _global;
        }
        if (!target) {
            return null;
        }
        const listener = target[eventNameSymbol];
        if (listener) {
            return listener;
        }
        else if (originalDescGet) {
            // result will be null when use inline event attribute,
            // such as <button onclick="func();">OK</button>
            // because the onclick function is internal raw uncompiled handler
            // the onclick will be evaluated when first time event was triggered or
            // the property is accessed, https://github.com/angular/zone.js/issues/525
            // so we should use original native get to retrieve the handler
            let value = originalDescGet.call(this);
            if (value) {
                desc.set.call(this, value);
                if (typeof target[REMOVE_ATTRIBUTE] === 'function') {
                    target.removeAttribute(prop);
                }
                return value;
            }
        }
        return null;
    };
    ObjectDefineProperty(obj, prop, desc);
    obj[onPropPatchedSymbol] = true;
}
function patchOnProperties(obj, properties, prototype) {
    if (properties) {
        for (let i = 0; i < properties.length; i++) {
            patchProperty(obj, 'on' + properties[i], prototype);
        }
    }
    else {
        const onProperties = [];
        for (const prop in obj) {
            if (prop.slice(0, 2) == 'on') {
                onProperties.push(prop);
            }
        }
        for (let j = 0; j < onProperties.length; j++) {
            patchProperty(obj, onProperties[j], prototype);
        }
    }
}
function copySymbolProperties(src, dest) {
    if (typeof Object.getOwnPropertySymbols !== 'function') {
        return;
    }
    const symbols = Object.getOwnPropertySymbols(src);
    symbols.forEach((symbol) => {
        const desc = Object.getOwnPropertyDescriptor(src, symbol);
        Object.defineProperty(dest, symbol, {
            get: function () {
                return src[symbol];
            },
            set: function (value) {
                if (desc && (!desc.writable || typeof desc.set !== 'function')) {
                    // if src[symbol] is not writable or not have a setter, just return
                    return;
                }
                src[symbol] = value;
            },
            enumerable: desc ? desc.enumerable : true,
            configurable: desc ? desc.configurable : true,
        });
    });
}
let shouldCopySymbolProperties = false;
function setShouldCopySymbolProperties(flag) {
    shouldCopySymbolProperties = flag;
}
function patchMethod(target, name, patchFn) {
    let proto = target;
    while (proto && !proto.hasOwnProperty(name)) {
        proto = ObjectGetPrototypeOf(proto);
    }
    if (!proto && target[name]) {
        // somehow we did not find it, but we can see it. This happens on IE for Window properties.
        proto = target;
    }
    const delegateName = zoneSymbol(name);
    let delegate = null;
    if (proto && (!(delegate = proto[delegateName]) || !proto.hasOwnProperty(delegateName))) {
        delegate = proto[delegateName] = proto[name];
        // check whether proto[name] is writable
        // some property is readonly in safari, such as HtmlCanvasElement.prototype.toBlob
        const desc = proto && ObjectGetOwnPropertyDescriptor(proto, name);
        if (isPropertyWritable(desc)) {
            const patchDelegate = patchFn(delegate, delegateName, name);
            proto[name] = function () {
                return patchDelegate(this, arguments);
            };
            attachOriginToPatched(proto[name], delegate);
            if (shouldCopySymbolProperties) {
                copySymbolProperties(delegate, proto[name]);
            }
        }
    }
    return delegate;
}
// TODO: @JiaLiPassion, support cancel task later if necessary
function patchMacroTask(obj, funcName, metaCreator) {
    let setNative = null;
    function scheduleTask(task) {
        const data = task.data;
        data.args[data.cbIdx] = function () {
            task.invoke.apply(this, arguments);
        };
        setNative.apply(data.target, data.args);
        return task;
    }
    setNative = patchMethod(obj, funcName, (delegate) => function (self, args) {
        const meta = metaCreator(self, args);
        if (meta.cbIdx >= 0 && typeof args[meta.cbIdx] === 'function') {
            return scheduleMacroTaskWithCurrentZone(meta.name, args[meta.cbIdx], meta, scheduleTask);
        }
        else {
            // cause an error by calling it directly.
            return delegate.apply(self, args);
        }
    });
}
function patchMicroTask(obj, funcName, metaCreator) {
    let setNative = null;
    function scheduleTask(task) {
        const data = task.data;
        data.args[data.cbIdx] = function () {
            task.invoke.apply(this, arguments);
        };
        setNative.apply(data.target, data.args);
        return task;
    }
    setNative = patchMethod(obj, funcName, (delegate) => function (self, args) {
        const meta = metaCreator(self, args);
        if (meta.cbIdx >= 0 && typeof args[meta.cbIdx] === 'function') {
            return Zone.current.scheduleMicroTask(meta.name, args[meta.cbIdx], meta, scheduleTask);
        }
        else {
            // cause an error by calling it directly.
            return delegate.apply(self, args);
        }
    });
}
function attachOriginToPatched(patched, original) {
    patched[zoneSymbol('OriginalDelegate')] = original;
}
function isFunction(value) {
    return typeof value === 'function';
}
function isNumber(value) {
    return typeof value === 'number';
}

function patchPromise(Zone) {
    Zone.__load_patch('ZoneAwarePromise', (global, Zone, api) => {
        const ObjectGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
        const ObjectDefineProperty = Object.defineProperty;
        function readableObjectToString(obj) {
            if (obj && obj.toString === Object.prototype.toString) {
                const className = obj.constructor && obj.constructor.name;
                return (className ? className : '') + ': ' + JSON.stringify(obj);
            }
            return obj ? obj.toString() : Object.prototype.toString.call(obj);
        }
        const __symbol__ = api.symbol;
        const _uncaughtPromiseErrors = [];
        const isDisableWrappingUncaughtPromiseRejection = global[__symbol__('DISABLE_WRAPPING_UNCAUGHT_PROMISE_REJECTION')] !== false;
        const symbolPromise = __symbol__('Promise');
        const symbolThen = __symbol__('then');
        const creationTrace = '__creationTrace__';
        api.onUnhandledError = (e) => {
            if (api.showUncaughtError()) {
                const rejection = e && e.rejection;
                if (rejection) {
                    console.error('Unhandled Promise rejection:', rejection instanceof Error ? rejection.message : rejection, '; Zone:', e.zone.name, '; Task:', e.task && e.task.source, '; Value:', rejection, rejection instanceof Error ? rejection.stack : undefined);
                }
                else {
                    console.error(e);
                }
            }
        };
        api.microtaskDrainDone = () => {
            while (_uncaughtPromiseErrors.length) {
                const uncaughtPromiseError = _uncaughtPromiseErrors.shift();
                try {
                    uncaughtPromiseError.zone.runGuarded(() => {
                        if (uncaughtPromiseError.throwOriginal) {
                            throw uncaughtPromiseError.rejection;
                        }
                        throw uncaughtPromiseError;
                    });
                }
                catch (error) {
                    handleUnhandledRejection(error);
                }
            }
        };
        const UNHANDLED_PROMISE_REJECTION_HANDLER_SYMBOL = __symbol__('unhandledPromiseRejectionHandler');
        function handleUnhandledRejection(e) {
            api.onUnhandledError(e);
            try {
                const handler = Zone[UNHANDLED_PROMISE_REJECTION_HANDLER_SYMBOL];
                if (typeof handler === 'function') {
                    handler.call(this, e);
                }
            }
            catch (err) { }
        }
        function isThenable(value) {
            return value && typeof value.then === 'function';
        }
        function forwardResolution(value) {
            return value;
        }
        function forwardRejection(rejection) {
            return ZoneAwarePromise.reject(rejection);
        }
        const symbolState = __symbol__('state');
        const symbolValue = __symbol__('value');
        const symbolFinally = __symbol__('finally');
        const symbolParentPromiseValue = __symbol__('parentPromiseValue');
        const symbolParentPromiseState = __symbol__('parentPromiseState');
        const source = 'Promise.then';
        const UNRESOLVED = null;
        const RESOLVED = true;
        const REJECTED = false;
        const REJECTED_NO_CATCH = 0;
        function makeResolver(promise, state) {
            return (v) => {
                try {
                    resolvePromise(promise, state, v);
                }
                catch (err) {
                    resolvePromise(promise, false, err);
                }
                // Do not return value or you will break the Promise spec.
            };
        }
        const once = function () {
            let wasCalled = false;
            return function wrapper(wrappedFunction) {
                return function () {
                    if (wasCalled) {
                        return;
                    }
                    wasCalled = true;
                    wrappedFunction.apply(null, arguments);
                };
            };
        };
        const TYPE_ERROR = 'Promise resolved with itself';
        const CURRENT_TASK_TRACE_SYMBOL = __symbol__('currentTaskTrace');
        // Promise Resolution
        function resolvePromise(promise, state, value) {
            const onceWrapper = once();
            if (promise === value) {
                throw new TypeError(TYPE_ERROR);
            }
            if (promise[symbolState] === UNRESOLVED) {
                // should only get value.then once based on promise spec.
                let then = null;
                try {
                    if (typeof value === 'object' || typeof value === 'function') {
                        then = value && value.then;
                    }
                }
                catch (err) {
                    onceWrapper(() => {
                        resolvePromise(promise, false, err);
                    })();
                    return promise;
                }
                // if (value instanceof ZoneAwarePromise) {
                if (state !== REJECTED &&
                    value instanceof ZoneAwarePromise &&
                    value.hasOwnProperty(symbolState) &&
                    value.hasOwnProperty(symbolValue) &&
                    value[symbolState] !== UNRESOLVED) {
                    clearRejectedNoCatch(value);
                    resolvePromise(promise, value[symbolState], value[symbolValue]);
                }
                else if (state !== REJECTED && typeof then === 'function') {
                    try {
                        then.call(value, onceWrapper(makeResolver(promise, state)), onceWrapper(makeResolver(promise, false)));
                    }
                    catch (err) {
                        onceWrapper(() => {
                            resolvePromise(promise, false, err);
                        })();
                    }
                }
                else {
                    promise[symbolState] = state;
                    const queue = promise[symbolValue];
                    promise[symbolValue] = value;
                    if (promise[symbolFinally] === symbolFinally) {
                        // the promise is generated by Promise.prototype.finally
                        if (state === RESOLVED) {
                            // the state is resolved, should ignore the value
                            // and use parent promise value
                            promise[symbolState] = promise[symbolParentPromiseState];
                            promise[symbolValue] = promise[symbolParentPromiseValue];
                        }
                    }
                    // record task information in value when error occurs, so we can
                    // do some additional work such as render longStackTrace
                    if (state === REJECTED && value instanceof Error) {
                        // check if longStackTraceZone is here
                        const trace = Zone.currentTask &&
                            Zone.currentTask.data &&
                            Zone.currentTask.data[creationTrace];
                        if (trace) {
                            // only keep the long stack trace into error when in longStackTraceZone
                            ObjectDefineProperty(value, CURRENT_TASK_TRACE_SYMBOL, {
                                configurable: true,
                                enumerable: false,
                                writable: true,
                                value: trace,
                            });
                        }
                    }
                    for (let i = 0; i < queue.length;) {
                        scheduleResolveOrReject(promise, queue[i++], queue[i++], queue[i++], queue[i++]);
                    }
                    if (queue.length == 0 && state == REJECTED) {
                        promise[symbolState] = REJECTED_NO_CATCH;
                        let uncaughtPromiseError = value;
                        try {
                            // Here we throws a new Error to print more readable error log
                            // and if the value is not an error, zone.js builds an `Error`
                            // Object here to attach the stack information.
                            throw new Error('Uncaught (in promise): ' +
                                readableObjectToString(value) +
                                (value && value.stack ? '\n' + value.stack : ''));
                        }
                        catch (err) {
                            uncaughtPromiseError = err;
                        }
                        if (isDisableWrappingUncaughtPromiseRejection) {
                            // If disable wrapping uncaught promise reject
                            // use the value instead of wrapping it.
                            uncaughtPromiseError.throwOriginal = true;
                        }
                        uncaughtPromiseError.rejection = value;
                        uncaughtPromiseError.promise = promise;
                        uncaughtPromiseError.zone = Zone.current;
                        uncaughtPromiseError.task = Zone.currentTask;
                        _uncaughtPromiseErrors.push(uncaughtPromiseError);
                        api.scheduleMicroTask(); // to make sure that it is running
                    }
                }
            }
            // Resolving an already resolved promise is a noop.
            return promise;
        }
        const REJECTION_HANDLED_HANDLER = __symbol__('rejectionHandledHandler');
        function clearRejectedNoCatch(promise) {
            if (promise[symbolState] === REJECTED_NO_CATCH) {
                // if the promise is rejected no catch status
                // and queue.length > 0, means there is a error handler
                // here to handle the rejected promise, we should trigger
                // windows.rejectionhandled eventHandler or nodejs rejectionHandled
                // eventHandler
                try {
                    const handler = Zone[REJECTION_HANDLED_HANDLER];
                    if (handler && typeof handler === 'function') {
                        handler.call(this, { rejection: promise[symbolValue], promise: promise });
                    }
                }
                catch (err) { }
                promise[symbolState] = REJECTED;
                for (let i = 0; i < _uncaughtPromiseErrors.length; i++) {
                    if (promise === _uncaughtPromiseErrors[i].promise) {
                        _uncaughtPromiseErrors.splice(i, 1);
                    }
                }
            }
        }
        function scheduleResolveOrReject(promise, zone, chainPromise, onFulfilled, onRejected) {
            clearRejectedNoCatch(promise);
            const promiseState = promise[symbolState];
            const delegate = promiseState
                ? typeof onFulfilled === 'function'
                    ? onFulfilled
                    : forwardResolution
                : typeof onRejected === 'function'
                    ? onRejected
                    : forwardRejection;
            zone.scheduleMicroTask(source, () => {
                try {
                    const parentPromiseValue = promise[symbolValue];
                    const isFinallyPromise = !!chainPromise && symbolFinally === chainPromise[symbolFinally];
                    if (isFinallyPromise) {
                        // if the promise is generated from finally call, keep parent promise's state and value
                        chainPromise[symbolParentPromiseValue] = parentPromiseValue;
                        chainPromise[symbolParentPromiseState] = promiseState;
                    }
                    // should not pass value to finally callback
                    const value = zone.run(delegate, undefined, isFinallyPromise && delegate !== forwardRejection && delegate !== forwardResolution
                        ? []
                        : [parentPromiseValue]);
                    resolvePromise(chainPromise, true, value);
                }
                catch (error) {
                    // if error occurs, should always return this error
                    resolvePromise(chainPromise, false, error);
                }
            }, chainPromise);
        }
        const ZONE_AWARE_PROMISE_TO_STRING = 'function ZoneAwarePromise() { [native code] }';
        const noop = function () { };
        const AggregateError = global.AggregateError;
        class ZoneAwarePromise {
            static toString() {
                return ZONE_AWARE_PROMISE_TO_STRING;
            }
            static resolve(value) {
                if (value instanceof ZoneAwarePromise) {
                    return value;
                }
                return resolvePromise(new this(null), RESOLVED, value);
            }
            static reject(error) {
                return resolvePromise(new this(null), REJECTED, error);
            }
            static withResolvers() {
                const result = {};
                result.promise = new ZoneAwarePromise((res, rej) => {
                    result.resolve = res;
                    result.reject = rej;
                });
                return result;
            }
            static any(values) {
                if (!values || typeof values[Symbol.iterator] !== 'function') {
                    return Promise.reject(new AggregateError([], 'All promises were rejected'));
                }
                const promises = [];
                let count = 0;
                try {
                    for (let v of values) {
                        count++;
                        promises.push(ZoneAwarePromise.resolve(v));
                    }
                }
                catch (err) {
                    return Promise.reject(new AggregateError([], 'All promises were rejected'));
                }
                if (count === 0) {
                    return Promise.reject(new AggregateError([], 'All promises were rejected'));
                }
                let finished = false;
                const errors = [];
                return new ZoneAwarePromise((resolve, reject) => {
                    for (let i = 0; i < promises.length; i++) {
                        promises[i].then((v) => {
                            if (finished) {
                                return;
                            }
                            finished = true;
                            resolve(v);
                        }, (err) => {
                            errors.push(err);
                            count--;
                            if (count === 0) {
                                finished = true;
                                reject(new AggregateError(errors, 'All promises were rejected'));
                            }
                        });
                    }
                });
            }
            static race(values) {
                let resolve;
                let reject;
                let promise = new this((res, rej) => {
                    resolve = res;
                    reject = rej;
                });
                function onResolve(value) {
                    resolve(value);
                }
                function onReject(error) {
                    reject(error);
                }
                for (let value of values) {
                    if (!isThenable(value)) {
                        value = this.resolve(value);
                    }
                    value.then(onResolve, onReject);
                }
                return promise;
            }
            static all(values) {
                return ZoneAwarePromise.allWithCallback(values);
            }
            static allSettled(values) {
                const P = this && this.prototype instanceof ZoneAwarePromise ? this : ZoneAwarePromise;
                return P.allWithCallback(values, {
                    thenCallback: (value) => ({ status: 'fulfilled', value }),
                    errorCallback: (err) => ({ status: 'rejected', reason: err }),
                });
            }
            static allWithCallback(values, callback) {
                let resolve;
                let reject;
                let promise = new this((res, rej) => {
                    resolve = res;
                    reject = rej;
                });
                // Start at 2 to prevent prematurely resolving if .then is called immediately.
                let unresolvedCount = 2;
                let valueIndex = 0;
                const resolvedValues = [];
                for (let value of values) {
                    if (!isThenable(value)) {
                        value = this.resolve(value);
                    }
                    const curValueIndex = valueIndex;
                    try {
                        value.then((value) => {
                            resolvedValues[curValueIndex] = callback ? callback.thenCallback(value) : value;
                            unresolvedCount--;
                            if (unresolvedCount === 0) {
                                resolve(resolvedValues);
                            }
                        }, (err) => {
                            if (!callback) {
                                reject(err);
                            }
                            else {
                                resolvedValues[curValueIndex] = callback.errorCallback(err);
                                unresolvedCount--;
                                if (unresolvedCount === 0) {
                                    resolve(resolvedValues);
                                }
                            }
                        });
                    }
                    catch (thenErr) {
                        reject(thenErr);
                    }
                    unresolvedCount++;
                    valueIndex++;
                }
                // Make the unresolvedCount zero-based again.
                unresolvedCount -= 2;
                if (unresolvedCount === 0) {
                    resolve(resolvedValues);
                }
                return promise;
            }
            constructor(executor) {
                const promise = this;
                if (!(promise instanceof ZoneAwarePromise)) {
                    throw new Error('Must be an instanceof Promise.');
                }
                promise[symbolState] = UNRESOLVED;
                promise[symbolValue] = []; // queue;
                try {
                    const onceWrapper = once();
                    executor &&
                        executor(onceWrapper(makeResolver(promise, RESOLVED)), onceWrapper(makeResolver(promise, REJECTED)));
                }
                catch (error) {
                    resolvePromise(promise, false, error);
                }
            }
            get [Symbol.toStringTag]() {
                return 'Promise';
            }
            get [Symbol.species]() {
                return ZoneAwarePromise;
            }
            then(onFulfilled, onRejected) {
                // We must read `Symbol.species` safely because `this` may be anything. For instance, `this`
                // may be an object without a prototype (created through `Object.create(null)`); thus
                // `this.constructor` will be undefined. One of the use cases is SystemJS creating
                // prototype-less objects (modules) via `Object.create(null)`. The SystemJS creates an empty
                // object and copies promise properties into that object (within the `getOrCreateLoad`
                // function). The zone.js then checks if the resolved value has the `then` method and
                // invokes it with the `value` context. Otherwise, this will throw an error: `TypeError:
                // Cannot read properties of undefined (reading 'Symbol(Symbol.species)')`.
                let C = this.constructor?.[Symbol.species];
                if (!C || typeof C !== 'function') {
                    C = this.constructor || ZoneAwarePromise;
                }
                const chainPromise = new C(noop);
                const zone = Zone.current;
                if (this[symbolState] == UNRESOLVED) {
                    this[symbolValue].push(zone, chainPromise, onFulfilled, onRejected);
                }
                else {
                    scheduleResolveOrReject(this, zone, chainPromise, onFulfilled, onRejected);
                }
                return chainPromise;
            }
            catch(onRejected) {
                return this.then(null, onRejected);
            }
            finally(onFinally) {
                // See comment on the call to `then` about why thee `Symbol.species` is safely accessed.
                let C = this.constructor?.[Symbol.species];
                if (!C || typeof C !== 'function') {
                    C = ZoneAwarePromise;
                }
                const chainPromise = new C(noop);
                chainPromise[symbolFinally] = symbolFinally;
                const zone = Zone.current;
                if (this[symbolState] == UNRESOLVED) {
                    this[symbolValue].push(zone, chainPromise, onFinally, onFinally);
                }
                else {
                    scheduleResolveOrReject(this, zone, chainPromise, onFinally, onFinally);
                }
                return chainPromise;
            }
        }
        // Protect against aggressive optimizers dropping seemingly unused properties.
        // E.g. Closure Compiler in advanced mode.
        ZoneAwarePromise['resolve'] = ZoneAwarePromise.resolve;
        ZoneAwarePromise['reject'] = ZoneAwarePromise.reject;
        ZoneAwarePromise['race'] = ZoneAwarePromise.race;
        ZoneAwarePromise['all'] = ZoneAwarePromise.all;
        const NativePromise = (global[symbolPromise] = global['Promise']);
        global['Promise'] = ZoneAwarePromise;
        const symbolThenPatched = __symbol__('thenPatched');
        function patchThen(Ctor) {
            const proto = Ctor.prototype;
            const prop = ObjectGetOwnPropertyDescriptor(proto, 'then');
            if (prop && (prop.writable === false || !prop.configurable)) {
                // check Ctor.prototype.then propertyDescriptor is writable or not
                // in meteor env, writable is false, we should ignore such case
                return;
            }
            const originalThen = proto.then;
            // Keep a reference to the original method.
            proto[symbolThen] = originalThen;
            Ctor.prototype.then = function (onResolve, onReject) {
                const wrapped = new ZoneAwarePromise((resolve, reject) => {
                    originalThen.call(this, resolve, reject);
                });
                return wrapped.then(onResolve, onReject);
            };
            Ctor[symbolThenPatched] = true;
        }
        api.patchThen = patchThen;
        function zoneify(fn) {
            return function (self, args) {
                let resultPromise = fn.apply(self, args);
                if (resultPromise instanceof ZoneAwarePromise) {
                    return resultPromise;
                }
                let ctor = resultPromise.constructor;
                if (!ctor[symbolThenPatched]) {
                    patchThen(ctor);
                }
                return resultPromise;
            };
        }
        if (NativePromise) {
            patchThen(NativePromise);
            patchMethod(global, 'fetch', (delegate) => zoneify(delegate));
        }
        // This is not part of public API, but it is useful for tests, so we expose it.
        Promise[Zone.__symbol__('uncaughtPromiseErrors')] = _uncaughtPromiseErrors;
        return ZoneAwarePromise;
    });
}

function patchToString(Zone) {
    // override Function.prototype.toString to make zone.js patched function
    // look like native function
    Zone.__load_patch('toString', (global) => {
        // patch Func.prototype.toString to let them look like native
        const originalFunctionToString = Function.prototype.toString;
        const ORIGINAL_DELEGATE_SYMBOL = zoneSymbol('OriginalDelegate');
        const PROMISE_SYMBOL = zoneSymbol('Promise');
        const ERROR_SYMBOL = zoneSymbol('Error');
        const newFunctionToString = function toString() {
            if (typeof this === 'function') {
                const originalDelegate = this[ORIGINAL_DELEGATE_SYMBOL];
                if (originalDelegate) {
                    if (typeof originalDelegate === 'function') {
                        return originalFunctionToString.call(originalDelegate);
                    }
                    else {
                        return Object.prototype.toString.call(originalDelegate);
                    }
                }
                if (this === Promise) {
                    const nativePromise = global[PROMISE_SYMBOL];
                    if (nativePromise) {
                        return originalFunctionToString.call(nativePromise);
                    }
                }
                if (this === Error) {
                    const nativeError = global[ERROR_SYMBOL];
                    if (nativeError) {
                        return originalFunctionToString.call(nativeError);
                    }
                }
            }
            return originalFunctionToString.call(this);
        };
        newFunctionToString[ORIGINAL_DELEGATE_SYMBOL] = originalFunctionToString;
        Function.prototype.toString = newFunctionToString;
        // patch Object.prototype.toString to let them look like native
        const originalObjectToString = Object.prototype.toString;
        const PROMISE_OBJECT_TO_STRING = '[object Promise]';
        Object.prototype.toString = function () {
            if (typeof Promise === 'function' && this instanceof Promise) {
                return PROMISE_OBJECT_TO_STRING;
            }
            return originalObjectToString.call(this);
        };
    });
}

function loadZone() {
    // if global['Zone'] already exists (maybe zone.js was already loaded or
    // some other lib also registered a global object named Zone), we may need
    // to throw an error, but sometimes user may not want this error.
    // For example,
    // we have two web pages, page1 includes zone.js, page2 doesn't.
    // and the 1st time user load page1 and page2, everything work fine,
    // but when user load page2 again, error occurs because global['Zone'] already exists.
    // so we add a flag to let user choose whether to throw this error or not.
    // By default, if existing Zone is from zone.js, we will not throw the error.
    const global = globalThis;
    const checkDuplicate = global[__symbol__('forceDuplicateZoneCheck')] === true;
    if (global['Zone'] && (checkDuplicate || typeof global['Zone'].__symbol__ !== 'function')) {
        throw new Error('Zone already loaded.');
    }
    // Initialize global `Zone` constant.
    global['Zone'] ??= initZone();
    return global['Zone'];
}

/**
 * @fileoverview
 * @suppress {missingRequire}
 */
// an identifier to tell ZoneTask do not create a new invoke closure
const OPTIMIZED_ZONE_EVENT_TASK_DATA = {
    useG: true,
};
const zoneSymbolEventNames = {};
const globalSources = {};
const EVENT_NAME_SYMBOL_REGX = new RegExp('^' + ZONE_SYMBOL_PREFIX + '(\\w+)(true|false)$');
const IMMEDIATE_PROPAGATION_SYMBOL = zoneSymbol('propagationStopped');
function prepareEventNames(eventName, eventNameToString) {
    const falseEventName = (eventNameToString ? eventNameToString(eventName) : eventName) + FALSE_STR;
    const trueEventName = (eventNameToString ? eventNameToString(eventName) : eventName) + TRUE_STR;
    const symbol = ZONE_SYMBOL_PREFIX + falseEventName;
    const symbolCapture = ZONE_SYMBOL_PREFIX + trueEventName;
    zoneSymbolEventNames[eventName] = {};
    zoneSymbolEventNames[eventName][FALSE_STR] = symbol;
    zoneSymbolEventNames[eventName][TRUE_STR] = symbolCapture;
}
function patchEventTarget(_global, api, apis, patchOptions) {
    const ADD_EVENT_LISTENER = (patchOptions && patchOptions.add) || ADD_EVENT_LISTENER_STR;
    const REMOVE_EVENT_LISTENER = (patchOptions && patchOptions.rm) || REMOVE_EVENT_LISTENER_STR;
    const LISTENERS_EVENT_LISTENER = (patchOptions && patchOptions.listeners) || 'eventListeners';
    const REMOVE_ALL_LISTENERS_EVENT_LISTENER = (patchOptions && patchOptions.rmAll) || 'removeAllListeners';
    const zoneSymbolAddEventListener = zoneSymbol(ADD_EVENT_LISTENER);
    const ADD_EVENT_LISTENER_SOURCE = '.' + ADD_EVENT_LISTENER + ':';
    const PREPEND_EVENT_LISTENER = 'prependListener';
    const PREPEND_EVENT_LISTENER_SOURCE = '.' + PREPEND_EVENT_LISTENER + ':';
    const invokeTask = function (task, target, event) {
        // for better performance, check isRemoved which is set
        // by removeEventListener
        if (task.isRemoved) {
            return;
        }
        const delegate = task.callback;
        if (typeof delegate === 'object' && delegate.handleEvent) {
            // create the bind version of handleEvent when invoke
            task.callback = (event) => delegate.handleEvent(event);
            task.originalDelegate = delegate;
        }
        // invoke static task.invoke
        // need to try/catch error here, otherwise, the error in one event listener
        // will break the executions of the other event listeners. Also error will
        // not remove the event listener when `once` options is true.
        let error;
        try {
            task.invoke(task, target, [event]);
        }
        catch (err) {
            error = err;
        }
        const options = task.options;
        if (options && typeof options === 'object' && options.once) {
            // if options.once is true, after invoke once remove listener here
            // only browser need to do this, nodejs eventEmitter will cal removeListener
            // inside EventEmitter.once
            const delegate = task.originalDelegate ? task.originalDelegate : task.callback;
            target[REMOVE_EVENT_LISTENER].call(target, event.type, delegate, options);
        }
        return error;
    };
    function globalCallback(context, event, isCapture) {
        // https://github.com/angular/zone.js/issues/911, in IE, sometimes
        // event will be undefined, so we need to use window.event
        event = event || _global.event;
        if (!event) {
            return;
        }
        // event.target is needed for Samsung TV and SourceBuffer
        // || global is needed https://github.com/angular/zone.js/issues/190
        const target = context || event.target || _global;
        const tasks = target[zoneSymbolEventNames[event.type][isCapture ? TRUE_STR : FALSE_STR]];
        if (tasks) {
            const errors = [];
            // invoke all tasks which attached to current target with given event.type and capture = false
            // for performance concern, if task.length === 1, just invoke
            if (tasks.length === 1) {
                const err = invokeTask(tasks[0], target, event);
                err && errors.push(err);
            }
            else {
                // https://github.com/angular/zone.js/issues/836
                // copy the tasks array before invoke, to avoid
                // the callback will remove itself or other listener
                const copyTasks = tasks.slice();
                for (let i = 0; i < copyTasks.length; i++) {
                    if (event && event[IMMEDIATE_PROPAGATION_SYMBOL] === true) {
                        break;
                    }
                    const err = invokeTask(copyTasks[i], target, event);
                    err && errors.push(err);
                }
            }
            // Since there is only one error, we don't need to schedule microTask
            // to throw the error.
            if (errors.length === 1) {
                throw errors[0];
            }
            else {
                for (let i = 0; i < errors.length; i++) {
                    const err = errors[i];
                    api.nativeScheduleMicroTask(() => {
                        throw err;
                    });
                }
            }
        }
    }
    // global shared zoneAwareCallback to handle all event callback with capture = false
    const globalZoneAwareCallback = function (event) {
        return globalCallback(this, event, false);
    };
    // global shared zoneAwareCallback to handle all event callback with capture = true
    const globalZoneAwareCaptureCallback = function (event) {
        return globalCallback(this, event, true);
    };
    function patchEventTargetMethods(obj, patchOptions) {
        if (!obj) {
            return false;
        }
        let useGlobalCallback = true;
        if (patchOptions && patchOptions.useG !== undefined) {
            useGlobalCallback = patchOptions.useG;
        }
        const validateHandler = patchOptions && patchOptions.vh;
        let checkDuplicate = true;
        if (patchOptions && patchOptions.chkDup !== undefined) {
            checkDuplicate = patchOptions.chkDup;
        }
        let returnTarget = false;
        if (patchOptions && patchOptions.rt !== undefined) {
            returnTarget = patchOptions.rt;
        }
        let proto = obj;
        while (proto && !proto.hasOwnProperty(ADD_EVENT_LISTENER)) {
            proto = ObjectGetPrototypeOf(proto);
        }
        if (!proto && obj[ADD_EVENT_LISTENER]) {
            // somehow we did not find it, but we can see it. This happens on IE for Window properties.
            proto = obj;
        }
        if (!proto) {
            return false;
        }
        if (proto[zoneSymbolAddEventListener]) {
            return false;
        }
        const eventNameToString = patchOptions && patchOptions.eventNameToString;
        // We use a shared global `taskData` to pass data for `scheduleEventTask`,
        // eliminating the need to create a new object solely for passing data.
        // WARNING: This object has a static lifetime, meaning it is not created
        // each time `addEventListener` is called. It is instantiated only once
        // and captured by reference inside the `addEventListener` and
        // `removeEventListener` functions. Do not add any new properties to this
        // object, as doing so would necessitate maintaining the information
        // between `addEventListener` calls.
        const taskData = {};
        const nativeAddEventListener = (proto[zoneSymbolAddEventListener] = proto[ADD_EVENT_LISTENER]);
        const nativeRemoveEventListener = (proto[zoneSymbol(REMOVE_EVENT_LISTENER)] =
            proto[REMOVE_EVENT_LISTENER]);
        const nativeListeners = (proto[zoneSymbol(LISTENERS_EVENT_LISTENER)] =
            proto[LISTENERS_EVENT_LISTENER]);
        const nativeRemoveAllListeners = (proto[zoneSymbol(REMOVE_ALL_LISTENERS_EVENT_LISTENER)] =
            proto[REMOVE_ALL_LISTENERS_EVENT_LISTENER]);
        let nativePrependEventListener;
        if (patchOptions && patchOptions.prepend) {
            nativePrependEventListener = proto[zoneSymbol(patchOptions.prepend)] =
                proto[patchOptions.prepend];
        }
        /**
         * This util function will build an option object with passive option
         * to handle all possible input from the user.
         */
        function buildEventListenerOptions(options, passive) {
            if (!passive) {
                return options;
            }
            if (typeof options === 'boolean') {
                return { capture: options, passive: true };
            }
            if (!options) {
                return { passive: true };
            }
            if (typeof options === 'object' && options.passive !== false) {
                return { ...options, passive: true };
            }
            return options;
        }
        const customScheduleGlobal = function (task) {
            // if there is already a task for the eventName + capture,
            // just return, because we use the shared globalZoneAwareCallback here.
            if (taskData.isExisting) {
                return;
            }
            return nativeAddEventListener.call(taskData.target, taskData.eventName, taskData.capture ? globalZoneAwareCaptureCallback : globalZoneAwareCallback, taskData.options);
        };
        /**
         * In the context of events and listeners, this function will be
         * called at the end by `cancelTask`, which, in turn, calls `task.cancelFn`.
         * Cancelling a task is primarily used to remove event listeners from
         * the task target.
         */
        const customCancelGlobal = function (task) {
            // if task is not marked as isRemoved, this call is directly
            // from Zone.prototype.cancelTask, we should remove the task
            // from tasksList of target first
            if (!task.isRemoved) {
                const symbolEventNames = zoneSymbolEventNames[task.eventName];
                let symbolEventName;
                if (symbolEventNames) {
                    symbolEventName = symbolEventNames[task.capture ? TRUE_STR : FALSE_STR];
                }
                const existingTasks = symbolEventName && task.target[symbolEventName];
                if (existingTasks) {
                    for (let i = 0; i < existingTasks.length; i++) {
                        const existingTask = existingTasks[i];
                        if (existingTask === task) {
                            existingTasks.splice(i, 1);
                            // set isRemoved to data for faster invokeTask check
                            task.isRemoved = true;
                            if (task.removeAbortListener) {
                                task.removeAbortListener();
                                task.removeAbortListener = null;
                            }
                            if (existingTasks.length === 0) {
                                // all tasks for the eventName + capture have gone,
                                // remove globalZoneAwareCallback and remove the task cache from target
                                task.allRemoved = true;
                                task.target[symbolEventName] = null;
                            }
                            break;
                        }
                    }
                }
            }
            // if all tasks for the eventName + capture have gone,
            // we will really remove the global event callback,
            // if not, return
            if (!task.allRemoved) {
                return;
            }
            return nativeRemoveEventListener.call(task.target, task.eventName, task.capture ? globalZoneAwareCaptureCallback : globalZoneAwareCallback, task.options);
        };
        const customScheduleNonGlobal = function (task) {
            return nativeAddEventListener.call(taskData.target, taskData.eventName, task.invoke, taskData.options);
        };
        const customSchedulePrepend = function (task) {
            return nativePrependEventListener.call(taskData.target, taskData.eventName, task.invoke, taskData.options);
        };
        const customCancelNonGlobal = function (task) {
            return nativeRemoveEventListener.call(task.target, task.eventName, task.invoke, task.options);
        };
        const customSchedule = useGlobalCallback ? customScheduleGlobal : customScheduleNonGlobal;
        const customCancel = useGlobalCallback ? customCancelGlobal : customCancelNonGlobal;
        const compareTaskCallbackVsDelegate = function (task, delegate) {
            const typeOfDelegate = typeof delegate;
            return ((typeOfDelegate === 'function' && task.callback === delegate) ||
                (typeOfDelegate === 'object' && task.originalDelegate === delegate));
        };
        const compare = patchOptions?.diff || compareTaskCallbackVsDelegate;
        const unpatchedEvents = Zone[zoneSymbol('UNPATCHED_EVENTS')];
        const passiveEvents = _global[zoneSymbol('PASSIVE_EVENTS')];
        function copyEventListenerOptions(options) {
            if (typeof options === 'object' && options !== null) {
                // We need to destructure the target `options` object since it may
                // be frozen or sealed (possibly provided implicitly by a third-party
                // library), or its properties may be readonly.
                const newOptions = { ...options };
                // The `signal` option was recently introduced, which caused regressions in
                // third-party scenarios where `AbortController` was directly provided to
                // `addEventListener` as options. For instance, in cases like
                // `document.addEventListener('keydown', callback, abortControllerInstance)`,
                // which is valid because `AbortController` includes a `signal` getter, spreading
                // `{...options}` wouldn't copy the `signal`. Additionally, using `Object.create`
                // isn't feasible since `AbortController` is a built-in object type, and attempting
                // to create a new object directly with it as the prototype might result in
                // unexpected behavior.
                if (options.signal) {
                    newOptions.signal = options.signal;
                }
                return newOptions;
            }
            return options;
        }
        const makeAddListener = function (nativeListener, addSource, customScheduleFn, customCancelFn, returnTarget = false, prepend = false) {
            return function () {
                const target = this || _global;
                let eventName = arguments[0];
                if (patchOptions && patchOptions.transferEventName) {
                    eventName = patchOptions.transferEventName(eventName);
                }
                let delegate = arguments[1];
                if (!delegate) {
                    return nativeListener.apply(this, arguments);
                }
                if (isNode && eventName === 'uncaughtException') {
                    // don't patch uncaughtException of nodejs to prevent endless loop
                    return nativeListener.apply(this, arguments);
                }
                // To improve `addEventListener` performance, we will create the callback
                // for the task later when the task is invoked.
                let isEventListenerObject = false;
                if (typeof delegate !== 'function') {
                    // This checks whether the provided listener argument is an object with
                    // a `handleEvent` method (since we can call `addEventListener` with a
                    // function `event => ...` or with an object `{ handleEvent: event => ... }`).
                    if (!delegate.handleEvent) {
                        return nativeListener.apply(this, arguments);
                    }
                    isEventListenerObject = true;
                }
                if (validateHandler && !validateHandler(nativeListener, delegate, target, arguments)) {
                    return;
                }
                const passive = !!passiveEvents && passiveEvents.indexOf(eventName) !== -1;
                const options = copyEventListenerOptions(buildEventListenerOptions(arguments[2], passive));
                const signal = options?.signal;
                if (signal?.aborted) {
                    // the signal is an aborted one, just return without attaching the event listener.
                    return;
                }
                if (unpatchedEvents) {
                    // check unpatched list
                    for (let i = 0; i < unpatchedEvents.length; i++) {
                        if (eventName === unpatchedEvents[i]) {
                            if (passive) {
                                return nativeListener.call(target, eventName, delegate, options);
                            }
                            else {
                                return nativeListener.apply(this, arguments);
                            }
                        }
                    }
                }
                const capture = !options ? false : typeof options === 'boolean' ? true : options.capture;
                const once = options && typeof options === 'object' ? options.once : false;
                const zone = Zone.current;
                let symbolEventNames = zoneSymbolEventNames[eventName];
                if (!symbolEventNames) {
                    prepareEventNames(eventName, eventNameToString);
                    symbolEventNames = zoneSymbolEventNames[eventName];
                }
                const symbolEventName = symbolEventNames[capture ? TRUE_STR : FALSE_STR];
                let existingTasks = target[symbolEventName];
                let isExisting = false;
                if (existingTasks) {
                    // already have task registered
                    isExisting = true;
                    if (checkDuplicate) {
                        for (let i = 0; i < existingTasks.length; i++) {
                            if (compare(existingTasks[i], delegate)) {
                                // same callback, same capture, same event name, just return
                                return;
                            }
                        }
                    }
                }
                else {
                    existingTasks = target[symbolEventName] = [];
                }
                let source;
                const constructorName = target.constructor['name'];
                const targetSource = globalSources[constructorName];
                if (targetSource) {
                    source = targetSource[eventName];
                }
                if (!source) {
                    source =
                        constructorName +
                            addSource +
                            (eventNameToString ? eventNameToString(eventName) : eventName);
                }
                // In the code below, `options` should no longer be reassigned; instead, it
                // should only be mutated. This is because we pass that object to the native
                // `addEventListener`.
                // It's generally recommended to use the same object reference for options.
                // This ensures consistency and avoids potential issues.
                taskData.options = options;
                if (once) {
                    // When using `addEventListener` with the `once` option, we don't pass
                    // the `once` option directly to the native `addEventListener` method.
                    // Instead, we keep the `once` setting and handle it ourselves.
                    taskData.options.once = false;
                }
                taskData.target = target;
                taskData.capture = capture;
                taskData.eventName = eventName;
                taskData.isExisting = isExisting;
                const data = useGlobalCallback ? OPTIMIZED_ZONE_EVENT_TASK_DATA : undefined;
                // keep taskData into data to allow onScheduleEventTask to access the task information
                if (data) {
                    data.taskData = taskData;
                }
                if (signal) {
                    // When using `addEventListener` with the `signal` option, we don't pass
                    // the `signal` option directly to the native `addEventListener` method.
                    // Instead, we keep the `signal` setting and handle it ourselves.
                    taskData.options.signal = undefined;
                }
                // The `scheduleEventTask` function will ultimately call `customScheduleGlobal`,
                // which in turn calls the native `addEventListener`. This is why `taskData.options`
                // is updated before scheduling the task, as `customScheduleGlobal` uses
                // `taskData.options` to pass it to the native `addEventListener`.
                const task = zone.scheduleEventTask(source, delegate, data, customScheduleFn, customCancelFn);
                if (signal) {
                    // after task is scheduled, we need to store the signal back to task.options
                    taskData.options.signal = signal;
                    // Wrapping `task` in a weak reference would not prevent memory leaks. Weak references are
                    // primarily used for preventing strong references cycles. `onAbort` is always reachable
                    // as it's an event listener, so its closure retains a strong reference to the `task`.
                    const onAbort = () => task.zone.cancelTask(task);
                    nativeListener.call(signal, 'abort', onAbort, { once: true });
                    // We need to remove the `abort` listener when the event listener is going to be removed,
                    // as it creates a closure that captures `task`. This closure retains a reference to the
                    // `task` object even after it goes out of scope, preventing `task` from being garbage
                    // collected.
                    task.removeAbortListener = () => signal.removeEventListener('abort', onAbort);
                }
                // should clear taskData.target to avoid memory leak
                // issue, https://github.com/angular/angular/issues/20442
                taskData.target = null;
                // need to clear up taskData because it is a global object
                if (data) {
                    data.taskData = null;
                }
                // have to save those information to task in case
                // application may call task.zone.cancelTask() directly
                if (once) {
                    taskData.options.once = true;
                }
                if (typeof task.options !== 'boolean') {
                    // We should save the options on the task (if it's an object) because
                    // we'll be using `task.options` later when removing the event listener
                    // and passing it back to `removeEventListener`.
                    task.options = options;
                }
                task.target = target;
                task.capture = capture;
                task.eventName = eventName;
                if (isEventListenerObject) {
                    // save original delegate for compare to check duplicate
                    task.originalDelegate = delegate;
                }
                if (!prepend) {
                    existingTasks.push(task);
                }
                else {
                    existingTasks.unshift(task);
                }
                if (returnTarget) {
                    return target;
                }
            };
        };
        proto[ADD_EVENT_LISTENER] = makeAddListener(nativeAddEventListener, ADD_EVENT_LISTENER_SOURCE, customSchedule, customCancel, returnTarget);
        if (nativePrependEventListener) {
            proto[PREPEND_EVENT_LISTENER] = makeAddListener(nativePrependEventListener, PREPEND_EVENT_LISTENER_SOURCE, customSchedulePrepend, customCancel, returnTarget, true);
        }
        proto[REMOVE_EVENT_LISTENER] = function () {
            const target = this || _global;
            let eventName = arguments[0];
            if (patchOptions && patchOptions.transferEventName) {
                eventName = patchOptions.transferEventName(eventName);
            }
            const options = arguments[2];
            const capture = !options ? false : typeof options === 'boolean' ? true : options.capture;
            const delegate = arguments[1];
            if (!delegate) {
                return nativeRemoveEventListener.apply(this, arguments);
            }
            if (validateHandler &&
                !validateHandler(nativeRemoveEventListener, delegate, target, arguments)) {
                return;
            }
            const symbolEventNames = zoneSymbolEventNames[eventName];
            let symbolEventName;
            if (symbolEventNames) {
                symbolEventName = symbolEventNames[capture ? TRUE_STR : FALSE_STR];
            }
            const existingTasks = symbolEventName && target[symbolEventName];
            // `existingTasks` may not exist if the `addEventListener` was called before
            // it was patched by zone.js. Please refer to the attached issue for
            // clarification, particularly after the `if` condition, before calling
            // the native `removeEventListener`.
            if (existingTasks) {
                for (let i = 0; i < existingTasks.length; i++) {
                    const existingTask = existingTasks[i];
                    if (compare(existingTask, delegate)) {
                        existingTasks.splice(i, 1);
                        // set isRemoved to data for faster invokeTask check
                        existingTask.isRemoved = true;
                        if (existingTasks.length === 0) {
                            // all tasks for the eventName + capture have gone,
                            // remove globalZoneAwareCallback and remove the task cache from target
                            existingTask.allRemoved = true;
                            target[symbolEventName] = null;
                            // in the target, we have an event listener which is added by on_property
                            // such as target.onclick = function() {}, so we need to clear this internal
                            // property too if all delegates with capture=false were removed
                            // https:// github.com/angular/angular/issues/31643
                            // https://github.com/angular/angular/issues/54581
                            if (!capture && typeof eventName === 'string') {
                                const onPropertySymbol = ZONE_SYMBOL_PREFIX + 'ON_PROPERTY' + eventName;
                                target[onPropertySymbol] = null;
                            }
                        }
                        // In all other conditions, when `addEventListener` is called after being
                        // patched by zone.js, we would always find an event task on the `EventTarget`.
                        // This will trigger `cancelFn` on the `existingTask`, leading to `customCancelGlobal`,
                        // which ultimately removes an event listener and cleans up the abort listener
                        // (if an `AbortSignal` was provided when scheduling a task).
                        existingTask.zone.cancelTask(existingTask);
                        if (returnTarget) {
                            return target;
                        }
                        return;
                    }
                }
            }
            // https://github.com/angular/zone.js/issues/930
            // We may encounter a situation where the `addEventListener` was
            // called on the event target before zone.js is loaded, resulting
            // in no task being stored on the event target due to its invocation
            // of the native implementation. In this scenario, we simply need to
            // invoke the native `removeEventListener`.
            return nativeRemoveEventListener.apply(this, arguments);
        };
        proto[LISTENERS_EVENT_LISTENER] = function () {
            const target = this || _global;
            let eventName = arguments[0];
            if (patchOptions && patchOptions.transferEventName) {
                eventName = patchOptions.transferEventName(eventName);
            }
            const listeners = [];
            const tasks = findEventTasks(target, eventNameToString ? eventNameToString(eventName) : eventName);
            for (let i = 0; i < tasks.length; i++) {
                const task = tasks[i];
                let delegate = task.originalDelegate ? task.originalDelegate : task.callback;
                listeners.push(delegate);
            }
            return listeners;
        };
        proto[REMOVE_ALL_LISTENERS_EVENT_LISTENER] = function () {
            const target = this || _global;
            let eventName = arguments[0];
            if (!eventName) {
                const keys = Object.keys(target);
                for (let i = 0; i < keys.length; i++) {
                    const prop = keys[i];
                    const match = EVENT_NAME_SYMBOL_REGX.exec(prop);
                    let evtName = match && match[1];
                    // in nodejs EventEmitter, removeListener event is
                    // used for monitoring the removeListener call,
                    // so just keep removeListener eventListener until
                    // all other eventListeners are removed
                    if (evtName && evtName !== 'removeListener') {
                        this[REMOVE_ALL_LISTENERS_EVENT_LISTENER].call(this, evtName);
                    }
                }
                // remove removeListener listener finally
                this[REMOVE_ALL_LISTENERS_EVENT_LISTENER].call(this, 'removeListener');
            }
            else {
                if (patchOptions && patchOptions.transferEventName) {
                    eventName = patchOptions.transferEventName(eventName);
                }
                const symbolEventNames = zoneSymbolEventNames[eventName];
                if (symbolEventNames) {
                    const symbolEventName = symbolEventNames[FALSE_STR];
                    const symbolCaptureEventName = symbolEventNames[TRUE_STR];
                    const tasks = target[symbolEventName];
                    const captureTasks = target[symbolCaptureEventName];
                    if (tasks) {
                        const removeTasks = tasks.slice();
                        for (let i = 0; i < removeTasks.length; i++) {
                            const task = removeTasks[i];
                            let delegate = task.originalDelegate ? task.originalDelegate : task.callback;
                            this[REMOVE_EVENT_LISTENER].call(this, eventName, delegate, task.options);
                        }
                    }
                    if (captureTasks) {
                        const removeTasks = captureTasks.slice();
                        for (let i = 0; i < removeTasks.length; i++) {
                            const task = removeTasks[i];
                            let delegate = task.originalDelegate ? task.originalDelegate : task.callback;
                            this[REMOVE_EVENT_LISTENER].call(this, eventName, delegate, task.options);
                        }
                    }
                }
            }
            if (returnTarget) {
                return this;
            }
        };
        // for native toString patch
        attachOriginToPatched(proto[ADD_EVENT_LISTENER], nativeAddEventListener);
        attachOriginToPatched(proto[REMOVE_EVENT_LISTENER], nativeRemoveEventListener);
        if (nativeRemoveAllListeners) {
            attachOriginToPatched(proto[REMOVE_ALL_LISTENERS_EVENT_LISTENER], nativeRemoveAllListeners);
        }
        if (nativeListeners) {
            attachOriginToPatched(proto[LISTENERS_EVENT_LISTENER], nativeListeners);
        }
        return true;
    }
    let results = [];
    for (let i = 0; i < apis.length; i++) {
        results[i] = patchEventTargetMethods(apis[i], patchOptions);
    }
    return results;
}
function findEventTasks(target, eventName) {
    if (!eventName) {
        const foundTasks = [];
        for (let prop in target) {
            const match = EVENT_NAME_SYMBOL_REGX.exec(prop);
            let evtName = match && match[1];
            if (evtName && (!eventName || evtName === eventName)) {
                const tasks = target[prop];
                if (tasks) {
                    for (let i = 0; i < tasks.length; i++) {
                        foundTasks.push(tasks[i]);
                    }
                }
            }
        }
        return foundTasks;
    }
    let symbolEventName = zoneSymbolEventNames[eventName];
    if (!symbolEventName) {
        prepareEventNames(eventName);
        symbolEventName = zoneSymbolEventNames[eventName];
    }
    const captureFalseTasks = target[symbolEventName[FALSE_STR]];
    const captureTrueTasks = target[symbolEventName[TRUE_STR]];
    if (!captureFalseTasks) {
        return captureTrueTasks ? captureTrueTasks.slice() : [];
    }
    else {
        return captureTrueTasks
            ? captureFalseTasks.concat(captureTrueTasks)
            : captureFalseTasks.slice();
    }
}

/**
 * @fileoverview
 * @suppress {missingRequire}
 */
function patchQueueMicrotask(global, api) {
    api.patchMethod(global, 'queueMicrotask', (delegate) => {
        return function (self, args) {
            Zone.current.scheduleMicroTask('queueMicrotask', args[0]);
        };
    });
}

/**
 * @fileoverview
 * @suppress {missingRequire}
 */
const taskSymbol = zoneSymbol('zoneTask');
function patchTimer(window, setName, cancelName, nameSuffix) {
    let setNative = null;
    let clearNative = null;
    setName += nameSuffix;
    cancelName += nameSuffix;
    const tasksByHandleId = {};
    function scheduleTask(task) {
        const data = task.data;
        data.args[0] = function () {
            return task.invoke.apply(this, arguments);
        };
        const handleOrId = setNative.apply(window, data.args);
        // Whlist on Node.js when get can the ID by using `[Symbol.toPrimitive]()` we do
        // to this so that we do not cause potentally leaks when using `setTimeout`
        // since this can be periodic when using `.refresh`.
        if (isNumber(handleOrId)) {
            data.handleId = handleOrId;
        }
        else {
            data.handle = handleOrId;
            // On Node.js a timeout and interval can be restarted over and over again by using the `.refresh` method.
            data.isRefreshable = isFunction(handleOrId.refresh);
        }
        return task;
    }
    function clearTask(task) {
        const { handle, handleId } = task.data;
        return clearNative.call(window, handle ?? handleId);
    }
    setNative = patchMethod(window, setName, (delegate) => function (self, args) {
        if (isFunction(args[0])) {
            const options = {
                isRefreshable: false,
                isPeriodic: nameSuffix === 'Interval',
                delay: nameSuffix === 'Timeout' || nameSuffix === 'Interval' ? args[1] || 0 : undefined,
                args: args,
            };
            const callback = args[0];
            args[0] = function timer() {
                try {
                    return callback.apply(this, arguments);
                }
                finally {
                    // issue-934, task will be cancelled
                    // even it is a periodic task such as
                    // setInterval
                    // https://github.com/angular/angular/issues/40387
                    // Cleanup tasksByHandleId should be handled before scheduleTask
                    // Since some zoneSpec may intercept and doesn't trigger
                    // scheduleFn(scheduleTask) provided here.
                    const { handle, handleId, isPeriodic, isRefreshable } = options;
                    if (!isPeriodic && !isRefreshable) {
                        if (handleId) {
                            // in non-nodejs env, we remove timerId
                            // from local cache
                            delete tasksByHandleId[handleId];
                        }
                        else if (handle) {
                            // Node returns complex objects as handleIds
                            // we remove task reference from timer object
                            handle[taskSymbol] = null;
                        }
                    }
                }
            };
            const task = scheduleMacroTaskWithCurrentZone(setName, args[0], options, scheduleTask, clearTask);
            if (!task) {
                return task;
            }
            // Node.js must additionally support the ref and unref functions.
            const { handleId, handle, isRefreshable, isPeriodic } = task.data;
            if (handleId) {
                // for non nodejs env, we save handleId: task
                // mapping in local cache for clearTimeout
                tasksByHandleId[handleId] = task;
            }
            else if (handle) {
                // for nodejs env, we save task
                // reference in timerId Object for clearTimeout
                handle[taskSymbol] = task;
                if (isRefreshable && !isPeriodic) {
                    const originalRefresh = handle.refresh;
                    handle.refresh = function () {
                        const { zone, state } = task;
                        if (state === 'notScheduled') {
                            task._state = 'scheduled';
                            zone._updateTaskCount(task, 1);
                        }
                        else if (state === 'running') {
                            task._state = 'scheduling';
                        }
                        return originalRefresh.call(this);
                    };
                }
            }
            return handle ?? handleId ?? task;
        }
        else {
            // cause an error by calling it directly.
            return delegate.apply(window, args);
        }
    });
    clearNative = patchMethod(window, cancelName, (delegate) => function (self, args) {
        const id = args[0];
        let task;
        if (isNumber(id)) {
            // non nodejs env.
            task = tasksByHandleId[id];
            delete tasksByHandleId[id];
        }
        else {
            // nodejs env ?? other environments.
            task = id?.[taskSymbol];
            if (task) {
                id[taskSymbol] = null;
            }
            else {
                task = id;
            }
        }
        if (task?.type) {
            if (task.cancelFn) {
                // Do not cancel already canceled functions
                task.zone.cancelTask(task);
            }
        }
        else {
            // cause an error by calling it directly.
            delegate.apply(window, args);
        }
    });
}

function patchEvents(Zone) {
    Zone.__load_patch('EventEmitter', (global, Zone, api) => {
        // For EventEmitter
        const EE_ADD_LISTENER = 'addListener';
        const EE_PREPEND_LISTENER = 'prependListener';
        const EE_REMOVE_LISTENER = 'removeListener';
        const EE_REMOVE_ALL_LISTENER = 'removeAllListeners';
        const EE_LISTENERS = 'listeners';
        const EE_ON = 'on';
        const EE_OFF = 'off';
        const compareTaskCallbackVsDelegate = function (task, delegate) {
            // same callback, same capture, same event name, just return
            return task.callback === delegate || task.callback.listener === delegate;
        };
        const eventNameToString = function (eventName) {
            if (typeof eventName === 'string') {
                return eventName;
            }
            if (!eventName) {
                return '';
            }
            return eventName.toString().replace('(', '_').replace(')', '_');
        };
        function patchEventEmitterMethods(obj) {
            const result = patchEventTarget(global, api, [obj], {
                useG: false,
                add: EE_ADD_LISTENER,
                rm: EE_REMOVE_LISTENER,
                prepend: EE_PREPEND_LISTENER,
                rmAll: EE_REMOVE_ALL_LISTENER,
                listeners: EE_LISTENERS,
                chkDup: false,
                rt: true,
                diff: compareTaskCallbackVsDelegate,
                eventNameToString: eventNameToString,
            });
            if (result && result[0]) {
                obj[EE_ON] = obj[EE_ADD_LISTENER];
                obj[EE_OFF] = obj[EE_REMOVE_LISTENER];
            }
        }
        // EventEmitter
        let events;
        try {
            events = require('events');
        }
        catch (err) { }
        if (events && events.EventEmitter) {
            patchEventEmitterMethods(events.EventEmitter.prototype);
        }
    });
}

function patchFs(Zone) {
    Zone.__load_patch('fs', (global, Zone, api) => {
        let fs;
        try {
            fs = require('fs');
        }
        catch (err) { }
        if (!fs)
            return;
        // watch, watchFile, unwatchFile has been patched
        // because EventEmitter has been patched
        const TO_PATCH_MACROTASK_METHODS = [
            'access',
            'appendFile',
            'chmod',
            'chown',
            'close',
            'exists',
            'fchmod',
            'fchown',
            'fdatasync',
            'fstat',
            'fsync',
            'ftruncate',
            'futimes',
            'lchmod',
            'lchown',
            'lutimes',
            'link',
            'lstat',
            'mkdir',
            'mkdtemp',
            'open',
            'opendir',
            'read',
            'readdir',
            'readFile',
            'readlink',
            'realpath',
            'rename',
            'rmdir',
            'stat',
            'symlink',
            'truncate',
            'unlink',
            'utimes',
            'write',
            'writeFile',
            'writev',
        ];
        TO_PATCH_MACROTASK_METHODS.filter((name) => !!fs[name] && typeof fs[name] === 'function').forEach((name) => {
            patchMacroTask(fs, name, (self, args) => {
                return {
                    name: 'fs.' + name,
                    args: args,
                    cbIdx: args.length > 0 ? args.length - 1 : -1,
                    target: self,
                };
            });
        });
        const realpathOriginalDelegate = fs.realpath?.[api.symbol('OriginalDelegate')];
        // This is the only specific method that should be additionally patched because the previous
        // `patchMacroTask` has overridden the `realpath` function and its `native` property.
        if (realpathOriginalDelegate?.native) {
            fs.realpath.native = realpathOriginalDelegate.native;
            patchMacroTask(fs.realpath, 'native', (self, args) => ({
                args,
                target: self,
                cbIdx: args.length > 0 ? args.length - 1 : -1,
                name: 'fs.realpath.native',
            }));
        }
    });
}

function patchNodeUtil(Zone) {
    Zone.__load_patch('node_util', (global, Zone, api) => {
        api.patchOnProperties = patchOnProperties;
        api.patchMethod = patchMethod;
        api.bindArguments = bindArguments;
        api.patchMacroTask = patchMacroTask;
        setShouldCopySymbolProperties(true);
    });
}

const set = 'set';
const clear = 'clear';
function patchNode(Zone) {
    patchNodeUtil(Zone);
    patchEvents(Zone);
    patchFs(Zone);
    Zone.__load_patch('node_timers', (global, Zone) => {
        // Timers
        let globalUseTimeoutFromTimer = false;
        try {
            const timers = require('timers');
            let globalEqualTimersTimeout = global.setTimeout === timers.setTimeout;
            if (!globalEqualTimersTimeout && !isMix) {
                // 1. if isMix, then we are in mix environment such as Electron
                // we should only patch timers.setTimeout because global.setTimeout
                // have been patched
                // 2. if global.setTimeout not equal timers.setTimeout, check
                // whether global.setTimeout use timers.setTimeout or not
                const originSetTimeout = timers.setTimeout;
                timers.setTimeout = function () {
                    globalUseTimeoutFromTimer = true;
                    return originSetTimeout.apply(this, arguments);
                };
                const detectTimeout = global.setTimeout(() => { }, 100);
                clearTimeout(detectTimeout);
                timers.setTimeout = originSetTimeout;
            }
            patchTimer(timers, set, clear, 'Timeout');
            patchTimer(timers, set, clear, 'Interval');
            patchTimer(timers, set, clear, 'Immediate');
        }
        catch (error) {
            // timers module not exists, for example, when we using nativeScript
            // timers is not available
        }
        if (isMix) {
            // if we are in mix environment, such as Electron,
            // the global.setTimeout has already been patched,
            // so we just patch timers.setTimeout
            return;
        }
        if (!globalUseTimeoutFromTimer) {
            // 1. global setTimeout equals timers setTimeout
            // 2. or global don't use timers setTimeout(maybe some other library patch setTimeout)
            // 3. or load timers module error happens, we should patch global setTimeout
            patchTimer(global, set, clear, 'Timeout');
            patchTimer(global, set, clear, 'Interval');
            patchTimer(global, set, clear, 'Immediate');
        }
        else {
            // global use timers setTimeout, but not equals
            // this happens when use nodejs v0.10.x, global setTimeout will
            // use a lazy load version of timers setTimeout
            // we should not double patch timer's setTimeout
            // so we only store the __symbol__ for consistency
            global[Zone.__symbol__('setTimeout')] = global.setTimeout;
            global[Zone.__symbol__('setInterval')] = global.setInterval;
            global[Zone.__symbol__('setImmediate')] = global.setImmediate;
        }
    });
    // patch process related methods
    Zone.__load_patch('nextTick', () => {
        // patch nextTick as microTask
        patchMicroTask(process, 'nextTick', (self, args) => {
            return {
                name: 'process.nextTick',
                args: args,
                cbIdx: args.length > 0 && typeof args[0] === 'function' ? 0 : -1,
                target: process,
            };
        });
    });
    Zone.__load_patch('handleUnhandledPromiseRejection', (global, Zone, api) => {
        Zone[api.symbol('unhandledPromiseRejectionHandler')] =
            findProcessPromiseRejectionHandler('unhandledRejection');
        Zone[api.symbol('rejectionHandledHandler')] =
            findProcessPromiseRejectionHandler('rejectionHandled');
        // handle unhandled promise rejection
        function findProcessPromiseRejectionHandler(evtName) {
            return function (e) {
                const eventTasks = findEventTasks(process, evtName);
                eventTasks.forEach((eventTask) => {
                    // process has added unhandledrejection event listener
                    // trigger the event listener
                    if (evtName === 'unhandledRejection') {
                        eventTask.invoke(e.rejection, e.promise);
                    }
                    else if (evtName === 'rejectionHandled') {
                        eventTask.invoke(e.promise);
                    }
                });
            };
        }
    });
    // Crypto
    Zone.__load_patch('crypto', () => {
        let crypto;
        try {
            crypto = require('crypto');
        }
        catch (err) { }
        // use the generic patchMacroTask to patch crypto
        if (crypto) {
            const methodNames = ['randomBytes', 'pbkdf2'];
            methodNames.forEach((name) => {
                patchMacroTask(crypto, name, (self, args) => {
                    return {
                        name: 'crypto.' + name,
                        args: args,
                        cbIdx: args.length > 0 && typeof args[args.length - 1] === 'function' ? args.length - 1 : -1,
                        target: crypto,
                    };
                });
            });
        }
    });
    Zone.__load_patch('console', (global, Zone) => {
        const consoleMethods = [
            'dir',
            'log',
            'info',
            'error',
            'warn',
            'assert',
            'debug',
            'timeEnd',
            'trace',
        ];
        consoleMethods.forEach((m) => {
            const originalMethod = (console[Zone.__symbol__(m)] = console[m]);
            if (originalMethod) {
                console[m] = function () {
                    const args = ArraySlice.call(arguments);
                    if (Zone.current === Zone.root) {
                        return originalMethod.apply(this, args);
                    }
                    else {
                        return Zone.root.run(originalMethod, this, args);
                    }
                };
            }
        });
    });
    Zone.__load_patch('queueMicrotask', (global, Zone, api) => {
        patchQueueMicrotask(global, api);
    });
}

function rollupMain() {
    const Zone = loadZone();
    patchNode(Zone); // Node needs to come first.
    patchPromise(Zone);
    patchToString(Zone);
    return Zone;
}

rollupMain();

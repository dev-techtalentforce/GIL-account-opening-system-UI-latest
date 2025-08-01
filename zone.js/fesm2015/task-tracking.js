'use strict';
/**
 * @license Angular v<unknown>
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
/**
 * A `TaskTrackingZoneSpec` allows one to track all outstanding Tasks.
 *
 * This is useful in tests. For example to see which tasks are preventing a test from completing
 * or an automated way of releasing all of the event listeners at the end of the test.
 */
class TaskTrackingZoneSpec {
    name = 'TaskTrackingZone';
    microTasks = [];
    macroTasks = [];
    eventTasks = [];
    properties = { 'TaskTrackingZone': this };
    static get() {
        return Zone.current.get('TaskTrackingZone');
    }
    getTasksFor(type) {
        switch (type) {
            case 'microTask':
                return this.microTasks;
            case 'macroTask':
                return this.macroTasks;
            case 'eventTask':
                return this.eventTasks;
        }
        throw new Error('Unknown task format: ' + type);
    }
    onScheduleTask(parentZoneDelegate, currentZone, targetZone, task) {
        task['creationLocation'] = new Error(`Task '${task.type}' from '${task.source}'.`);
        const tasks = this.getTasksFor(task.type);
        tasks.push(task);
        return parentZoneDelegate.scheduleTask(targetZone, task);
    }
    onCancelTask(parentZoneDelegate, currentZone, targetZone, task) {
        const tasks = this.getTasksFor(task.type);
        for (let i = 0; i < tasks.length; i++) {
            if (tasks[i] == task) {
                tasks.splice(i, 1);
                break;
            }
        }
        return parentZoneDelegate.cancelTask(targetZone, task);
    }
    onInvokeTask(parentZoneDelegate, currentZone, targetZone, task, applyThis, applyArgs) {
        if (task.type === 'eventTask' || task.data?.isPeriodic)
            return parentZoneDelegate.invokeTask(targetZone, task, applyThis, applyArgs);
        const tasks = this.getTasksFor(task.type);
        for (let i = 0; i < tasks.length; i++) {
            if (tasks[i] == task) {
                tasks.splice(i, 1);
                break;
            }
        }
        return parentZoneDelegate.invokeTask(targetZone, task, applyThis, applyArgs);
    }
    clearEvents() {
        while (this.eventTasks.length) {
            Zone.current.cancelTask(this.eventTasks[0]);
        }
    }
}
function patchTaskTracking(Zone) {
    // Export the class so that new instances can be created with proper
    // constructor params.
    Zone['TaskTrackingZoneSpec'] = TaskTrackingZoneSpec;
}

patchTaskTracking(Zone);

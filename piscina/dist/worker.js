"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const node_worker_threads_1 = require("node:worker_threads");
const node_url_1 = require("node:url");
const node_perf_hooks_1 = require("node:perf_hooks");
const symbols_1 = require("./symbols");
const common_1 = require("./common");
common_1.commonState.isWorkerThread = true;
common_1.commonState.workerData = node_worker_threads_1.workerData;
/* c8 ignore next*/
function noop() { }
const handlerCache = new Map();
let useAtomics = process.env.PISCINA_DISABLE_ATOMICS !== '1';
let useAsyncAtomics = process.env.PISCINA_ENABLE_ASYNC_ATOMICS === '1';
// Get `import(x)` as a function that isn't transpiled to `require(x)` by
// TypeScript for dual ESM/CJS support.
// Load this lazily, so that there is no warning about the ESM loader being
// experimental (on Node v12.x) until we actually try to use it.
let importESMCached;
function getImportESM() {
    if (importESMCached === undefined) {
        // eslint-disable-next-line no-new-func
        importESMCached = new Function('specifier', 'return import(specifier)');
    }
    return importESMCached;
}
// Look up the handler function that we call when a task is posted.
// This is either going to be "the" export from a file, or the default export.
async function getHandler(filename, name) {
    let handler = handlerCache.get(`${filename}/${name}`);
    if (handler != null) {
        return handler;
    }
    try {
        // With our current set of TypeScript options, this is transpiled to
        // `require(filename)`.
        handler = await Promise.resolve(`${filename}`).then(s => __importStar(require(s)));
        if (typeof handler !== 'function') {
            handler = await (handler[name]);
        }
    }
    catch { }
    if (typeof handler !== 'function') {
        handler = await getImportESM()((0, node_url_1.pathToFileURL)(filename).href);
        if (typeof handler !== 'function') {
            handler = await (handler[name]);
        }
    }
    if (typeof handler !== 'function') {
        return null;
    }
    // Limit the handler cache size. This should not usually be an issue and is
    // only provided for pathological cases.
    /* c8 ignore next */
    if (handlerCache.size > 1000) {
        const [[key]] = handlerCache;
        handlerCache.delete(key);
    }
    handlerCache.set(`${filename}/${name}`, handler);
    return handler;
}
// We should only receive this message once, when the Worker starts. It gives
// us the MessagePort used for receiving tasks, a SharedArrayBuffer for fast
// communication using Atomics, and the name of the default filename for tasks
// (so we can pre-load and cache the handler).
node_worker_threads_1.parentPort.on('message', async (message) => {
    var _a;
    const { port, sharedBuffer, filename, name, niceIncrement } = message;
    if (niceIncrement !== 0) {
        (_a = (await Promise.resolve().then(() => __importStar(require('@napi-rs/nice'))).catch(noop))) === null || _a === void 0 ? void 0 : _a.nice(niceIncrement);
    }
    try {
        if (filename != null) {
            await getHandler(filename, name);
        }
        const readyMessage = { [common_1.READY]: true };
        useAtomics = useAtomics !== false && message.atomics !== 'disabled';
        useAsyncAtomics = useAtomics !== false && (useAsyncAtomics || message.atomics === 'async');
        node_worker_threads_1.parentPort.postMessage(readyMessage);
        port.on('message', onMessage.bind(null, port, sharedBuffer));
        if (useAtomics) {
            const res = atomicsWaitLoop(port, sharedBuffer);
            if ((res === null || res === void 0 ? void 0 : res.then) != null)
                await res;
        }
    }
    catch (error) {
        throwInNextTick(error);
    }
});
let currentTasks = 0;
let lastSeenRequestCount = 0;
function atomicsWaitLoop(port, sharedBuffer) {
    // This function is entered either after receiving the startup message, or
    // when we are done with a task. In those situations, the *only* thing we
    // expect to happen next is a 'message' on `port`.
    // That call would come with the overhead of a C++ → JS boundary crossing,
    // including async tracking. So, instead, if there is no task currently
    // running, we wait for a signal from the parent thread using Atomics.wait(),
    // and read the message from the port instead of generating an event,
    // in order to avoid that overhead.
    // The one catch is that this stops asynchronous operations that are still
    // running from proceeding. Generally, tasks should not spawn asynchronous
    // operations without waiting for them to finish, though.
    if (useAsyncAtomics === true) {
        // @ts-expect-error - for some reason not supported by TS
        const { async, value } = Atomics.waitAsync(sharedBuffer, symbols_1.kRequestCountField, lastSeenRequestCount);
        // We do not check for result
        /* c8 ignore start */
        return async === true && value.then(() => {
            lastSeenRequestCount = Atomics.load(sharedBuffer, symbols_1.kRequestCountField);
            // We have to read messages *after* updating lastSeenRequestCount in order
            // to avoid race conditions.
            let entry;
            while ((entry = (0, node_worker_threads_1.receiveMessageOnPort)(port)) !== undefined) {
                onMessage(port, sharedBuffer, entry.message);
            }
        });
        /* c8 ignore stop */
    }
    while (currentTasks === 0) {
        // Check whether there are new messages by testing whether the current
        // number of requests posted by the parent thread matches the number of
        // requests received.
        // We do not check for result
        Atomics.wait(sharedBuffer, symbols_1.kRequestCountField, lastSeenRequestCount);
        lastSeenRequestCount = Atomics.load(sharedBuffer, symbols_1.kRequestCountField);
        // We have to read messages *after* updating lastSeenRequestCount in order
        // to avoid race conditions.
        let entry;
        while ((entry = (0, node_worker_threads_1.receiveMessageOnPort)(port)) !== undefined) {
            onMessage(port, sharedBuffer, entry.message);
        }
    }
}
async function onMessage(port, sharedBuffer, message) {
    currentTasks++;
    const { taskId, task, filename, name } = message;
    let response;
    let transferList = [];
    const start = message.histogramEnabled === 1 ? node_perf_hooks_1.performance.now() : null;
    try {
        const handler = await getHandler(filename, name);
        if (handler === null) {
            throw new Error(`No handler function exported from ${filename}`);
        }
        let result = await handler(task);
        if ((0, common_1.isMovable)(result)) {
            transferList = transferList.concat(result[symbols_1.kTransferable]);
            result = result[symbols_1.kValue];
        }
        response = {
            taskId,
            result,
            error: null,
            time: start == null ? null : Math.round(node_perf_hooks_1.performance.now() - start)
        };
        if (useAtomics && !useAsyncAtomics) {
            // If the task used e.g. console.log(), wait for the stream to drain
            // before potentially entering the `Atomics.wait()` loop, and before
            // returning the result so that messages will always be printed even
            // if the process would otherwise be ready to exit.
            if (process.stdout.writableLength > 0) {
                await new Promise((resolve) => process.stdout.write('', resolve));
            }
            if (process.stderr.writableLength > 0) {
                await new Promise((resolve) => process.stderr.write('', resolve));
            }
        }
    }
    catch (error) {
        response = {
            taskId,
            result: null,
            // It may be worth taking a look at the error cloning algorithm we
            // use in Node.js core here, it's quite a bit more flexible
            error: error,
            time: start == null ? null : Math.round(node_perf_hooks_1.performance.now() - start)
        };
    }
    currentTasks--;
    try {
        // Post the response to the parent thread, and let it know that we have
        // an additional message available. If possible, use Atomics.wait()
        // to wait for the next message.
        port.postMessage(response, transferList);
        Atomics.add(sharedBuffer, symbols_1.kResponseCountField, 1);
        if (useAtomics) {
            const res = atomicsWaitLoop(port, sharedBuffer);
            if ((res === null || res === void 0 ? void 0 : res.then) != null)
                await res;
        }
    }
    catch (error) {
        throwInNextTick(error);
    }
}
function throwInNextTick(error) {
    queueMicrotask(() => { throw error; });
}
//# sourceMappingURL=worker.js.map
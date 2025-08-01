import { randomUUID } from "node:crypto";
import { JSONRPCMessageSchema } from "../types.js";
import getRawBody from "raw-body";
import contentType from "content-type";
import { URL } from 'url';
const MAXIMUM_MESSAGE_SIZE = "4mb";
/**
 * Server transport for SSE: this will send messages over an SSE connection and receive messages from HTTP POST requests.
 *
 * This transport is only available in Node.js environments.
 */
export class SSEServerTransport {
    /**
     * Creates a new SSE server transport, which will direct the client to POST messages to the relative or absolute URL identified by `_endpoint`.
     */
    constructor(_endpoint, res, options) {
        this._endpoint = _endpoint;
        this.res = res;
        this._sessionId = randomUUID();
        this._options = options || { enableDnsRebindingProtection: false };
    }
    /**
     * Validates request headers for DNS rebinding protection.
     * @returns Error message if validation fails, undefined if validation passes.
     */
    validateRequestHeaders(req) {
        // Skip validation if protection is not enabled
        if (!this._options.enableDnsRebindingProtection) {
            return undefined;
        }
        // Validate Host header if allowedHosts is configured
        if (this._options.allowedHosts && this._options.allowedHosts.length > 0) {
            const hostHeader = req.headers.host;
            if (!hostHeader || !this._options.allowedHosts.includes(hostHeader)) {
                return `Invalid Host header: ${hostHeader}`;
            }
        }
        // Validate Origin header if allowedOrigins is configured
        if (this._options.allowedOrigins && this._options.allowedOrigins.length > 0) {
            const originHeader = req.headers.origin;
            if (!originHeader || !this._options.allowedOrigins.includes(originHeader)) {
                return `Invalid Origin header: ${originHeader}`;
            }
        }
        return undefined;
    }
    /**
     * Handles the initial SSE connection request.
     *
     * This should be called when a GET request is made to establish the SSE stream.
     */
    async start() {
        if (this._sseResponse) {
            throw new Error("SSEServerTransport already started! If using Server class, note that connect() calls start() automatically.");
        }
        this.res.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
        });
        // Send the endpoint event
        // Use a dummy base URL because this._endpoint is relative.
        // This allows using URL/URLSearchParams for robust parameter handling.
        const dummyBase = 'http://localhost'; // Any valid base works
        const endpointUrl = new URL(this._endpoint, dummyBase);
        endpointUrl.searchParams.set('sessionId', this._sessionId);
        // Reconstruct the relative URL string (pathname + search + hash)
        const relativeUrlWithSession = endpointUrl.pathname + endpointUrl.search + endpointUrl.hash;
        this.res.write(`event: endpoint\ndata: ${relativeUrlWithSession}\n\n`);
        this._sseResponse = this.res;
        this.res.on("close", () => {
            var _a;
            this._sseResponse = undefined;
            (_a = this.onclose) === null || _a === void 0 ? void 0 : _a.call(this);
        });
    }
    /**
     * Handles incoming POST messages.
     *
     * This should be called when a POST request is made to send a message to the server.
     */
    async handlePostMessage(req, res, parsedBody) {
        var _a, _b, _c, _d;
        if (!this._sseResponse) {
            const message = "SSE connection not established";
            res.writeHead(500).end(message);
            throw new Error(message);
        }
        // Validate request headers for DNS rebinding protection
        const validationError = this.validateRequestHeaders(req);
        if (validationError) {
            res.writeHead(403).end(validationError);
            (_a = this.onerror) === null || _a === void 0 ? void 0 : _a.call(this, new Error(validationError));
            return;
        }
        const authInfo = req.auth;
        const requestInfo = { headers: req.headers };
        let body;
        try {
            const ct = contentType.parse((_b = req.headers["content-type"]) !== null && _b !== void 0 ? _b : "");
            if (ct.type !== "application/json") {
                throw new Error(`Unsupported content-type: ${ct.type}`);
            }
            body = parsedBody !== null && parsedBody !== void 0 ? parsedBody : await getRawBody(req, {
                limit: MAXIMUM_MESSAGE_SIZE,
                encoding: (_c = ct.parameters.charset) !== null && _c !== void 0 ? _c : "utf-8",
            });
        }
        catch (error) {
            res.writeHead(400).end(String(error));
            (_d = this.onerror) === null || _d === void 0 ? void 0 : _d.call(this, error);
            return;
        }
        try {
            await this.handleMessage(typeof body === 'string' ? JSON.parse(body) : body, { requestInfo, authInfo });
        }
        catch (_e) {
            res.writeHead(400).end(`Invalid message: ${body}`);
            return;
        }
        res.writeHead(202).end("Accepted");
    }
    /**
     * Handle a client message, regardless of how it arrived. This can be used to inform the server of messages that arrive via a means different than HTTP POST.
     */
    async handleMessage(message, extra) {
        var _a, _b;
        let parsedMessage;
        try {
            parsedMessage = JSONRPCMessageSchema.parse(message);
        }
        catch (error) {
            (_a = this.onerror) === null || _a === void 0 ? void 0 : _a.call(this, error);
            throw error;
        }
        (_b = this.onmessage) === null || _b === void 0 ? void 0 : _b.call(this, parsedMessage, extra);
    }
    async close() {
        var _a, _b;
        (_a = this._sseResponse) === null || _a === void 0 ? void 0 : _a.end();
        this._sseResponse = undefined;
        (_b = this.onclose) === null || _b === void 0 ? void 0 : _b.call(this);
    }
    async send(message) {
        if (!this._sseResponse) {
            throw new Error("Not connected");
        }
        this._sseResponse.write(`event: message\ndata: ${JSON.stringify(message)}\n\n`);
    }
    /**
     * Returns the session ID for this transport.
     *
     * This can be used to route incoming POST requests.
     */
    get sessionId() {
        return this._sessionId;
    }
}
//# sourceMappingURL=sse.js.map
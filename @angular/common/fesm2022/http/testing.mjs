/**
 * @license Angular v20.1.0
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */

import * as i0 from '@angular/core';
import { Injectable, NgModule } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpHeaders, HttpResponse, HttpErrorResponse, HttpStatusCode, HttpEventType, HttpBackend, REQUESTS_CONTRIBUTE_TO_STABILITY, HttpClientModule } from '../module.mjs';
import 'rxjs/operators';
import '../xhr.mjs';

/**
 * Controller to be injected into tests, that allows for mocking and flushing
 * of requests.
 *
 * @publicApi
 */
class HttpTestingController {
}

/**
 * A mock requests that was received and is ready to be answered.
 *
 * This interface allows access to the underlying `HttpRequest`, and allows
 * responding with `HttpEvent`s or `HttpErrorResponse`s.
 *
 * @publicApi
 */
class TestRequest {
    request;
    observer;
    /**
     * Whether the request was cancelled after it was sent.
     */
    get cancelled() {
        return this._cancelled;
    }
    /**
     * @internal set by `HttpClientTestingBackend`
     */
    _cancelled = false;
    constructor(request, observer) {
        this.request = request;
        this.observer = observer;
    }
    /**
     * Resolve the request by returning a body plus additional HTTP information (such as response
     * headers) if provided.
     * If the request specifies an expected body type, the body is converted into the requested type.
     * Otherwise, the body is converted to `JSON` by default.
     *
     * Both successful and unsuccessful responses can be delivered via `flush()`.
     */
    flush(body, opts = {}) {
        if (this.cancelled) {
            throw new Error(`Cannot flush a cancelled request.`);
        }
        const url = this.request.urlWithParams;
        const headers = opts.headers instanceof HttpHeaders ? opts.headers : new HttpHeaders(opts.headers);
        body = _maybeConvertBody(this.request.responseType, body);
        let statusText = opts.statusText;
        let status = opts.status !== undefined ? opts.status : HttpStatusCode.Ok;
        if (opts.status === undefined) {
            if (body === null) {
                status = HttpStatusCode.NoContent;
                statusText ||= 'No Content';
            }
            else {
                statusText ||= 'OK';
            }
        }
        if (statusText === undefined) {
            throw new Error('statusText is required when setting a custom status.');
        }
        if (status >= 200 && status < 300) {
            this.observer.next(new HttpResponse({ body, headers, status, statusText, url }));
            this.observer.complete();
        }
        else {
            this.observer.error(new HttpErrorResponse({ error: body, headers, status, statusText, url }));
        }
    }
    error(error, opts = {}) {
        if (this.cancelled) {
            throw new Error(`Cannot return an error for a cancelled request.`);
        }
        const headers = opts.headers instanceof HttpHeaders ? opts.headers : new HttpHeaders(opts.headers);
        this.observer.error(new HttpErrorResponse({
            error,
            headers,
            status: opts.status || 0,
            statusText: opts.statusText || '',
            url: this.request.urlWithParams,
        }));
    }
    /**
     * Deliver an arbitrary `HttpEvent` (such as a progress event) on the response stream for this
     * request.
     */
    event(event) {
        if (this.cancelled) {
            throw new Error(`Cannot send events to a cancelled request.`);
        }
        this.observer.next(event);
    }
}
/**
 * Helper function to convert a response body to an ArrayBuffer.
 */
function _toArrayBufferBody(body) {
    if (typeof ArrayBuffer === 'undefined') {
        throw new Error('ArrayBuffer responses are not supported on this platform.');
    }
    if (body instanceof ArrayBuffer) {
        return body;
    }
    throw new Error('Automatic conversion to ArrayBuffer is not supported for response type.');
}
/**
 * Helper function to convert a response body to a Blob.
 */
function _toBlob(body) {
    if (typeof Blob === 'undefined') {
        throw new Error('Blob responses are not supported on this platform.');
    }
    if (body instanceof Blob) {
        return body;
    }
    if (ArrayBuffer && body instanceof ArrayBuffer) {
        return new Blob([body]);
    }
    throw new Error('Automatic conversion to Blob is not supported for response type.');
}
/**
 * Helper function to convert a response body to JSON data.
 */
function _toJsonBody(body, format = 'JSON') {
    if (typeof ArrayBuffer !== 'undefined' && body instanceof ArrayBuffer) {
        throw new Error(`Automatic conversion to ${format} is not supported for ArrayBuffers.`);
    }
    if (typeof Blob !== 'undefined' && body instanceof Blob) {
        throw new Error(`Automatic conversion to ${format} is not supported for Blobs.`);
    }
    if (typeof body === 'string' ||
        typeof body === 'number' ||
        typeof body === 'object' ||
        typeof body === 'boolean' ||
        Array.isArray(body)) {
        return body;
    }
    throw new Error(`Automatic conversion to ${format} is not supported for response type.`);
}
/**
 * Helper function to convert a response body to a string.
 */
function _toTextBody(body) {
    if (typeof body === 'string') {
        return body;
    }
    if (typeof ArrayBuffer !== 'undefined' && body instanceof ArrayBuffer) {
        throw new Error('Automatic conversion to text is not supported for ArrayBuffers.');
    }
    if (typeof Blob !== 'undefined' && body instanceof Blob) {
        throw new Error('Automatic conversion to text is not supported for Blobs.');
    }
    return JSON.stringify(_toJsonBody(body, 'text'));
}
/**
 * Convert a response body to the requested type.
 */
function _maybeConvertBody(responseType, body) {
    if (body === null) {
        return null;
    }
    switch (responseType) {
        case 'arraybuffer':
            return _toArrayBufferBody(body);
        case 'blob':
            return _toBlob(body);
        case 'json':
            return _toJsonBody(body);
        case 'text':
            return _toTextBody(body);
        default:
            throw new Error(`Unsupported responseType: ${responseType}`);
    }
}

/**
 * A testing backend for `HttpClient` which both acts as an `HttpBackend`
 * and as the `HttpTestingController`.
 *
 * `HttpClientTestingBackend` works by keeping a list of all open requests.
 * As requests come in, they're added to the list. Users can assert that specific
 * requests were made and then flush them. In the end, a verify() method asserts
 * that no unexpected requests were made.
 *
 *
 */
class HttpClientTestingBackend {
    /**
     * List of pending requests which have not yet been expected.
     */
    open = [];
    /**
     * Used when checking if we need to throw the NOT_USING_FETCH_BACKEND_IN_SSR error
     */
    isTestingBackend = true;
    /**
     * Handle an incoming request by queueing it in the list of open requests.
     */
    handle(req) {
        return new Observable((observer) => {
            const testReq = new TestRequest(req, observer);
            this.open.push(testReq);
            observer.next({ type: HttpEventType.Sent });
            return () => {
                testReq._cancelled = true;
            };
        });
    }
    /**
     * Helper function to search for requests in the list of open requests.
     */
    _match(match) {
        if (typeof match === 'string') {
            return this.open.filter((testReq) => testReq.request.urlWithParams === match);
        }
        else if (typeof match === 'function') {
            return this.open.filter((testReq) => match(testReq.request));
        }
        else {
            return this.open.filter((testReq) => (!match.method || testReq.request.method === match.method.toUpperCase()) &&
                (!match.url || testReq.request.urlWithParams === match.url));
        }
    }
    /**
     * Search for requests in the list of open requests, and return all that match
     * without asserting anything about the number of matches.
     */
    match(match) {
        const results = this._match(match);
        results.forEach((result) => {
            const index = this.open.indexOf(result);
            if (index !== -1) {
                this.open.splice(index, 1);
            }
        });
        return results;
    }
    /**
     * Expect that a single outstanding request matches the given matcher, and return
     * it.
     *
     * Requests returned through this API will no longer be in the list of open requests,
     * and thus will not match twice.
     */
    expectOne(match, description) {
        description ||= this.descriptionFromMatcher(match);
        const matches = this.match(match);
        if (matches.length > 1) {
            throw new Error(`Expected one matching request for criteria "${description}", found ${matches.length} requests.`);
        }
        if (matches.length === 0) {
            let message = `Expected one matching request for criteria "${description}", found none.`;
            if (this.open.length > 0) {
                // Show the methods and URLs of open requests in the error, for convenience.
                const requests = this.open.map(describeRequest).join(', ');
                message += ` Requests received are: ${requests}.`;
            }
            throw new Error(message);
        }
        return matches[0];
    }
    /**
     * Expect that no outstanding requests match the given matcher, and throw an error
     * if any do.
     */
    expectNone(match, description) {
        description ||= this.descriptionFromMatcher(match);
        const matches = this.match(match);
        if (matches.length > 0) {
            throw new Error(`Expected zero matching requests for criteria "${description}", found ${matches.length}.`);
        }
    }
    /**
     * Validate that there are no outstanding requests.
     */
    verify(opts = {}) {
        let open = this.open;
        // It's possible that some requests may be cancelled, and this is expected.
        // The user can ask to ignore open requests which have been cancelled.
        if (opts.ignoreCancelled) {
            open = open.filter((testReq) => !testReq.cancelled);
        }
        if (open.length > 0) {
            // Show the methods and URLs of open requests in the error, for convenience.
            const requests = open.map(describeRequest).join(', ');
            throw new Error(`Expected no open requests, found ${open.length}: ${requests}`);
        }
    }
    descriptionFromMatcher(matcher) {
        if (typeof matcher === 'string') {
            return `Match URL: ${matcher}`;
        }
        else if (typeof matcher === 'object') {
            const method = matcher.method || '(any)';
            const url = matcher.url || '(any)';
            return `Match method: ${method}, URL: ${url}`;
        }
        else {
            return `Match by function: ${matcher.name}`;
        }
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.1.0", ngImport: i0, type: HttpClientTestingBackend, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "20.1.0", ngImport: i0, type: HttpClientTestingBackend });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.1.0", ngImport: i0, type: HttpClientTestingBackend, decorators: [{
            type: Injectable
        }] });
function describeRequest(testRequest) {
    const url = testRequest.request.urlWithParams;
    const method = testRequest.request.method;
    return `${method} ${url}`;
}

function provideHttpClientTesting() {
    return [
        HttpClientTestingBackend,
        { provide: HttpBackend, useExisting: HttpClientTestingBackend },
        { provide: HttpTestingController, useExisting: HttpClientTestingBackend },
        { provide: REQUESTS_CONTRIBUTE_TO_STABILITY, useValue: false },
    ];
}

/**
 * Configures `HttpClientTestingBackend` as the `HttpBackend` used by `HttpClient`.
 *
 * Inject `HttpTestingController` to expect and flush requests in your tests.
 *
 * @publicApi
 *
 * @deprecated Add `provideHttpClientTesting()` to your providers instead.
 */
class HttpClientTestingModule {
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.1.0", ngImport: i0, type: HttpClientTestingModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
    static ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "20.1.0", ngImport: i0, type: HttpClientTestingModule, imports: [HttpClientModule] });
    static ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "20.1.0", ngImport: i0, type: HttpClientTestingModule, providers: [provideHttpClientTesting()], imports: [HttpClientModule] });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.1.0", ngImport: i0, type: HttpClientTestingModule, decorators: [{
            type: NgModule,
            args: [{
                    imports: [HttpClientModule],
                    providers: [provideHttpClientTesting()],
                }]
        }] });

export { HttpClientTestingModule, HttpTestingController, TestRequest, provideHttpClientTesting };
//# sourceMappingURL=testing.mjs.map

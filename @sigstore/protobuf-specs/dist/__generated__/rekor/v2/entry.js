"use strict";
// Code generated by protoc-gen-ts_proto. DO NOT EDIT.
// versions:
//   protoc-gen-ts_proto  v2.7.0
//   protoc               v6.30.2
// source: rekor/v2/entry.proto
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateEntryRequest = exports.Spec = exports.Entry = void 0;
/* eslint-disable */
const dsse_1 = require("./dsse");
const hashedrekord_1 = require("./hashedrekord");
exports.Entry = {
    fromJSON(object) {
        return {
            kind: isSet(object.kind) ? globalThis.String(object.kind) : "",
            apiVersion: isSet(object.apiVersion) ? globalThis.String(object.apiVersion) : "",
            spec: isSet(object.spec) ? exports.Spec.fromJSON(object.spec) : undefined,
        };
    },
    toJSON(message) {
        const obj = {};
        if (message.kind !== "") {
            obj.kind = message.kind;
        }
        if (message.apiVersion !== "") {
            obj.apiVersion = message.apiVersion;
        }
        if (message.spec !== undefined) {
            obj.spec = exports.Spec.toJSON(message.spec);
        }
        return obj;
    },
};
exports.Spec = {
    fromJSON(object) {
        return {
            spec: isSet(object.hashedRekordV002)
                ? { $case: "hashedRekordV002", hashedRekordV002: hashedrekord_1.HashedRekordLogEntryV002.fromJSON(object.hashedRekordV002) }
                : isSet(object.dsseV002)
                    ? { $case: "dsseV002", dsseV002: dsse_1.DSSELogEntryV002.fromJSON(object.dsseV002) }
                    : undefined,
        };
    },
    toJSON(message) {
        const obj = {};
        if (message.spec?.$case === "hashedRekordV002") {
            obj.hashedRekordV002 = hashedrekord_1.HashedRekordLogEntryV002.toJSON(message.spec.hashedRekordV002);
        }
        else if (message.spec?.$case === "dsseV002") {
            obj.dsseV002 = dsse_1.DSSELogEntryV002.toJSON(message.spec.dsseV002);
        }
        return obj;
    },
};
exports.CreateEntryRequest = {
    fromJSON(object) {
        return {
            spec: isSet(object.hashedRekordRequestV002)
                ? {
                    $case: "hashedRekordRequestV002",
                    hashedRekordRequestV002: hashedrekord_1.HashedRekordRequestV002.fromJSON(object.hashedRekordRequestV002),
                }
                : isSet(object.dsseRequestV002)
                    ? { $case: "dsseRequestV002", dsseRequestV002: dsse_1.DSSERequestV002.fromJSON(object.dsseRequestV002) }
                    : undefined,
        };
    },
    toJSON(message) {
        const obj = {};
        if (message.spec?.$case === "hashedRekordRequestV002") {
            obj.hashedRekordRequestV002 = hashedrekord_1.HashedRekordRequestV002.toJSON(message.spec.hashedRekordRequestV002);
        }
        else if (message.spec?.$case === "dsseRequestV002") {
            obj.dsseRequestV002 = dsse_1.DSSERequestV002.toJSON(message.spec.dsseRequestV002);
        }
        return obj;
    },
};
function isSet(value) {
    return value !== null && value !== undefined;
}

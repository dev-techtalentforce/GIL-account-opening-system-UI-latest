"use strict";
// Code generated by protoc-gen-ts_proto. DO NOT EDIT.
// versions:
//   protoc-gen-ts_proto  v2.7.0
//   protoc               v6.30.2
// source: rekor/v2/verifier.proto
Object.defineProperty(exports, "__esModule", { value: true });
exports.Signature = exports.Verifier = exports.PublicKey = void 0;
/* eslint-disable */
const sigstore_common_1 = require("../../sigstore_common");
exports.PublicKey = {
    fromJSON(object) {
        return { rawBytes: isSet(object.rawBytes) ? Buffer.from(bytesFromBase64(object.rawBytes)) : Buffer.alloc(0) };
    },
    toJSON(message) {
        const obj = {};
        if (message.rawBytes.length !== 0) {
            obj.rawBytes = base64FromBytes(message.rawBytes);
        }
        return obj;
    },
};
exports.Verifier = {
    fromJSON(object) {
        return {
            verifier: isSet(object.publicKey)
                ? { $case: "publicKey", publicKey: exports.PublicKey.fromJSON(object.publicKey) }
                : isSet(object.x509Certificate)
                    ? { $case: "x509Certificate", x509Certificate: sigstore_common_1.X509Certificate.fromJSON(object.x509Certificate) }
                    : undefined,
            keyDetails: isSet(object.keyDetails) ? (0, sigstore_common_1.publicKeyDetailsFromJSON)(object.keyDetails) : 0,
        };
    },
    toJSON(message) {
        const obj = {};
        if (message.verifier?.$case === "publicKey") {
            obj.publicKey = exports.PublicKey.toJSON(message.verifier.publicKey);
        }
        else if (message.verifier?.$case === "x509Certificate") {
            obj.x509Certificate = sigstore_common_1.X509Certificate.toJSON(message.verifier.x509Certificate);
        }
        if (message.keyDetails !== 0) {
            obj.keyDetails = (0, sigstore_common_1.publicKeyDetailsToJSON)(message.keyDetails);
        }
        return obj;
    },
};
exports.Signature = {
    fromJSON(object) {
        return {
            content: isSet(object.content) ? Buffer.from(bytesFromBase64(object.content)) : Buffer.alloc(0),
            verifier: isSet(object.verifier) ? exports.Verifier.fromJSON(object.verifier) : undefined,
        };
    },
    toJSON(message) {
        const obj = {};
        if (message.content.length !== 0) {
            obj.content = base64FromBytes(message.content);
        }
        if (message.verifier !== undefined) {
            obj.verifier = exports.Verifier.toJSON(message.verifier);
        }
        return obj;
    },
};
function bytesFromBase64(b64) {
    return Uint8Array.from(globalThis.Buffer.from(b64, "base64"));
}
function base64FromBytes(arr) {
    return globalThis.Buffer.from(arr).toString("base64");
}
function isSet(value) {
    return value !== null && value !== undefined;
}

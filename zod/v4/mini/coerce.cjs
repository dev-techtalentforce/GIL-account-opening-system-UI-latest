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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.string = string;
exports.number = number;
exports.boolean = boolean;
exports.bigint = bigint;
exports.date = date;
const core = __importStar(require("../core/index.cjs"));
const schemas = __importStar(require("./schemas.cjs"));
function string(params) {
    return core._coercedString(schemas.ZodMiniString, params);
}
function number(params) {
    return core._coercedNumber(schemas.ZodMiniNumber, params);
}
function boolean(params) {
    return core._coercedBoolean(schemas.ZodMiniBoolean, params);
}
function bigint(params) {
    return core._coercedBigint(schemas.ZodMiniBigInt, params);
}
function date(params) {
    return core._coercedDate(schemas.ZodMiniDate, params);
}

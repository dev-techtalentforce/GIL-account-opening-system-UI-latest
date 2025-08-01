/**
 * @license Angular v20.1.0
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */

import * as i0 from '@angular/core';
import { Injectable } from '@angular/core';
import { validateStyleProperty, containsElement, getParentElement, invokeQuery, dashCaseToCamelCase, invalidCssUnitValue, invalidExpression, invalidTransitionAlias, visitDslNode, invalidTrigger, invalidDefinition, extractStyleParams, invalidState, invalidStyleValue, SUBSTITUTION_EXPR_START, invalidParallelAnimation, validateStyleParams, invalidKeyframes, invalidOffset, keyframeOffsetsOutOfOrder, keyframesMissingOffsets, getOrSetDefaultValue, invalidStagger, resolveTiming, NG_TRIGGER_SELECTOR, NG_ANIMATING_SELECTOR, normalizeAnimationEntry, resolveTimingValue, interpolateParams, invalidQuery, registerFailed, normalizeKeyframes, LEAVE_CLASSNAME, ENTER_CLASSNAME, missingOrDestroyedAnimation, createAnimationFailed, optimizeGroupPlayer, missingPlayer, listenOnPlayer, makeAnimationEvent, triggerTransitionsFailed, eraseStyles, setStyles, transitionFailed, missingTrigger, missingEvent, unsupportedTriggerEvent, NG_TRIGGER_CLASSNAME, unregisteredTrigger, NG_ANIMATING_CLASSNAME, triggerBuildFailed, parseTimelineCommand, computeStyle, camelCaseToDashCase, validateWebAnimatableStyleProperty, allowPreviousPlayerStylesMerge, normalizeKeyframes$1, balancePreviousStylesIntoKeyframes, validationFailed, normalizeStyles, buildingFailed } from './util.mjs';
import { NoopAnimationPlayer, AnimationMetadataType, style, AUTO_STYLE, ɵPRE_STYLE as _PRE_STYLE, AnimationGroupPlayer } from './private_export.mjs';

/**
 * @publicApi
 *
 * `AnimationDriver` implentation for Noop animations
 */
class NoopAnimationDriver {
    /**
     * @returns Whether `prop` is a valid CSS property
     */
    validateStyleProperty(prop) {
        return validateStyleProperty(prop);
    }
    /**
     *
     * @returns Whether elm1 contains elm2.
     */
    containsElement(elm1, elm2) {
        return containsElement(elm1, elm2);
    }
    /**
     * @returns Rhe parent of the given element or `null` if the element is the `document`
     */
    getParentElement(element) {
        return getParentElement(element);
    }
    /**
     * @returns The result of the query selector on the element. The array will contain up to 1 item
     *     if `multi` is  `false`.
     */
    query(element, selector, multi) {
        return invokeQuery(element, selector, multi);
    }
    /**
     * @returns The `defaultValue` or empty string
     */
    computeStyle(element, prop, defaultValue) {
        return defaultValue || '';
    }
    /**
     * @returns An `NoopAnimationPlayer`
     */
    animate(element, keyframes, duration, delay, easing, previousPlayers = [], scrubberAccessRequested) {
        return new NoopAnimationPlayer(duration, delay);
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.1.0", ngImport: i0, type: NoopAnimationDriver, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "20.1.0", ngImport: i0, type: NoopAnimationDriver });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.1.0", ngImport: i0, type: NoopAnimationDriver, decorators: [{
            type: Injectable
        }] });
/**
 * @publicApi
 */
class AnimationDriver {
    /**
     * @deprecated Use the NoopAnimationDriver class.
     */
    static NOOP = new NoopAnimationDriver();
}

class AnimationStyleNormalizer {
}
class NoopAnimationStyleNormalizer {
    normalizePropertyName(propertyName, errors) {
        return propertyName;
    }
    normalizeStyleValue(userProvidedProperty, normalizedProperty, value, errors) {
        return value;
    }
}

const DIMENSIONAL_PROP_SET = new Set([
    'width',
    'height',
    'minWidth',
    'minHeight',
    'maxWidth',
    'maxHeight',
    'left',
    'top',
    'bottom',
    'right',
    'fontSize',
    'outlineWidth',
    'outlineOffset',
    'paddingTop',
    'paddingLeft',
    'paddingBottom',
    'paddingRight',
    'marginTop',
    'marginLeft',
    'marginBottom',
    'marginRight',
    'borderRadius',
    'borderWidth',
    'borderTopWidth',
    'borderLeftWidth',
    'borderRightWidth',
    'borderBottomWidth',
    'textIndent',
    'perspective',
]);
class WebAnimationsStyleNormalizer extends AnimationStyleNormalizer {
    normalizePropertyName(propertyName, errors) {
        return dashCaseToCamelCase(propertyName);
    }
    normalizeStyleValue(userProvidedProperty, normalizedProperty, value, errors) {
        let unit = '';
        const strVal = value.toString().trim();
        if (DIMENSIONAL_PROP_SET.has(normalizedProperty) && value !== 0 && value !== '0') {
            if (typeof value === 'number') {
                unit = 'px';
            }
            else {
                const valAndSuffixMatch = value.match(/^[+-]?[\d\.]+([a-z]*)$/);
                if (valAndSuffixMatch && valAndSuffixMatch[1].length == 0) {
                    errors.push(invalidCssUnitValue(userProvidedProperty, value));
                }
            }
        }
        return strVal + unit;
    }
}

function createListOfWarnings(warnings) {
    const LINE_START = '\n - ';
    return `${LINE_START}${warnings
        .filter(Boolean)
        .map((warning) => warning)
        .join(LINE_START)}`;
}
function warnValidation(warnings) {
    console.warn(`animation validation warnings:${createListOfWarnings(warnings)}`);
}
function warnTriggerBuild(name, warnings) {
    console.warn(`The animation trigger "${name}" has built with the following warnings:${createListOfWarnings(warnings)}`);
}
function warnRegister(warnings) {
    console.warn(`Animation built with the following warnings:${createListOfWarnings(warnings)}`);
}
function pushUnrecognizedPropertiesWarning(warnings, props) {
    if (props.length) {
        warnings.push(`The following provided properties are not recognized: ${props.join(', ')}`);
    }
}

const ANY_STATE = '*';
function parseTransitionExpr(transitionValue, errors) {
    const expressions = [];
    if (typeof transitionValue == 'string') {
        transitionValue
            .split(/\s*,\s*/)
            .forEach((str) => parseInnerTransitionStr(str, expressions, errors));
    }
    else {
        expressions.push(transitionValue);
    }
    return expressions;
}
function parseInnerTransitionStr(eventStr, expressions, errors) {
    if (eventStr[0] == ':') {
        const result = parseAnimationAlias(eventStr, errors);
        if (typeof result == 'function') {
            expressions.push(result);
            return;
        }
        eventStr = result;
    }
    const match = eventStr.match(/^(\*|[-\w]+)\s*(<?[=-]>)\s*(\*|[-\w]+)$/);
    if (match == null || match.length < 4) {
        errors.push(invalidExpression(eventStr));
        return expressions;
    }
    const fromState = match[1];
    const separator = match[2];
    const toState = match[3];
    expressions.push(makeLambdaFromStates(fromState, toState));
    const isFullAnyStateExpr = fromState == ANY_STATE && toState == ANY_STATE;
    if (separator[0] == '<' && !isFullAnyStateExpr) {
        expressions.push(makeLambdaFromStates(toState, fromState));
    }
    return;
}
function parseAnimationAlias(alias, errors) {
    switch (alias) {
        case ':enter':
            return 'void => *';
        case ':leave':
            return '* => void';
        case ':increment':
            return (fromState, toState) => parseFloat(toState) > parseFloat(fromState);
        case ':decrement':
            return (fromState, toState) => parseFloat(toState) < parseFloat(fromState);
        default:
            errors.push(invalidTransitionAlias(alias));
            return '* => *';
    }
}
// DO NOT REFACTOR ... keep the follow set instantiations
// with the values intact (closure compiler for some reason
// removes follow-up lines that add the values outside of
// the constructor...
const TRUE_BOOLEAN_VALUES = new Set(['true', '1']);
const FALSE_BOOLEAN_VALUES = new Set(['false', '0']);
function makeLambdaFromStates(lhs, rhs) {
    const LHS_MATCH_BOOLEAN = TRUE_BOOLEAN_VALUES.has(lhs) || FALSE_BOOLEAN_VALUES.has(lhs);
    const RHS_MATCH_BOOLEAN = TRUE_BOOLEAN_VALUES.has(rhs) || FALSE_BOOLEAN_VALUES.has(rhs);
    return (fromState, toState) => {
        let lhsMatch = lhs == ANY_STATE || lhs == fromState;
        let rhsMatch = rhs == ANY_STATE || rhs == toState;
        if (!lhsMatch && LHS_MATCH_BOOLEAN && typeof fromState === 'boolean') {
            lhsMatch = fromState ? TRUE_BOOLEAN_VALUES.has(lhs) : FALSE_BOOLEAN_VALUES.has(lhs);
        }
        if (!rhsMatch && RHS_MATCH_BOOLEAN && typeof toState === 'boolean') {
            rhsMatch = toState ? TRUE_BOOLEAN_VALUES.has(rhs) : FALSE_BOOLEAN_VALUES.has(rhs);
        }
        return lhsMatch && rhsMatch;
    };
}

const SELF_TOKEN = ':self';
const SELF_TOKEN_REGEX = /* @__PURE__ */ new RegExp(`s*${SELF_TOKEN}s*,?`, 'g');
/*
 * [Validation]
 * The visitor code below will traverse the animation AST generated by the animation verb functions
 * (the output is a tree of objects) and attempt to perform a series of validations on the data. The
 * following corner-cases will be validated:
 *
 * 1. Overlap of animations
 * Given that a CSS property cannot be animated in more than one place at the same time, it's
 * important that this behavior is detected and validated. The way in which this occurs is that
 * each time a style property is examined, a string-map containing the property will be updated with
 * the start and end times for when the property is used within an animation step.
 *
 * If there are two or more parallel animations that are currently running (these are invoked by the
 * group()) on the same element then the validator will throw an error. Since the start/end timing
 * values are collected for each property then if the current animation step is animating the same
 * property and its timing values fall anywhere into the window of time that the property is
 * currently being animated within then this is what causes an error.
 *
 * 2. Timing values
 * The validator will validate to see if a timing value of `duration delay easing` or
 * `durationNumber` is valid or not.
 *
 * (note that upon validation the code below will replace the timing data with an object containing
 * {duration,delay,easing}.
 *
 * 3. Offset Validation
 * Each of the style() calls are allowed to have an offset value when placed inside of keyframes().
 * Offsets within keyframes() are considered valid when:
 *
 *   - No offsets are used at all
 *   - Each style() entry contains an offset value
 *   - Each offset is between 0 and 1
 *   - Each offset is greater to or equal than the previous one
 *
 * Otherwise an error will be thrown.
 */
function buildAnimationAst(driver, metadata, errors, warnings) {
    return new AnimationAstBuilderVisitor(driver).build(metadata, errors, warnings);
}
const ROOT_SELECTOR = '';
class AnimationAstBuilderVisitor {
    _driver;
    constructor(_driver) {
        this._driver = _driver;
    }
    build(metadata, errors, warnings) {
        const context = new AnimationAstBuilderContext(errors);
        this._resetContextStyleTimingState(context);
        const ast = (visitDslNode(this, normalizeAnimationEntry(metadata), context));
        if (typeof ngDevMode === 'undefined' || ngDevMode) {
            if (context.unsupportedCSSPropertiesFound.size) {
                pushUnrecognizedPropertiesWarning(warnings, [
                    ...context.unsupportedCSSPropertiesFound.keys(),
                ]);
            }
        }
        return ast;
    }
    _resetContextStyleTimingState(context) {
        context.currentQuerySelector = ROOT_SELECTOR;
        context.collectedStyles = new Map();
        context.collectedStyles.set(ROOT_SELECTOR, new Map());
        context.currentTime = 0;
    }
    visitTrigger(metadata, context) {
        let queryCount = (context.queryCount = 0);
        let depCount = (context.depCount = 0);
        const states = [];
        const transitions = [];
        if (metadata.name.charAt(0) == '@') {
            context.errors.push(invalidTrigger());
        }
        metadata.definitions.forEach((def) => {
            this._resetContextStyleTimingState(context);
            if (def.type == AnimationMetadataType.State) {
                const stateDef = def;
                const name = stateDef.name;
                name
                    .toString()
                    .split(/\s*,\s*/)
                    .forEach((n) => {
                    stateDef.name = n;
                    states.push(this.visitState(stateDef, context));
                });
                stateDef.name = name;
            }
            else if (def.type == AnimationMetadataType.Transition) {
                const transition = this.visitTransition(def, context);
                queryCount += transition.queryCount;
                depCount += transition.depCount;
                transitions.push(transition);
            }
            else {
                context.errors.push(invalidDefinition());
            }
        });
        return {
            type: AnimationMetadataType.Trigger,
            name: metadata.name,
            states,
            transitions,
            queryCount,
            depCount,
            options: null,
        };
    }
    visitState(metadata, context) {
        const styleAst = this.visitStyle(metadata.styles, context);
        const astParams = (metadata.options && metadata.options.params) || null;
        if (styleAst.containsDynamicStyles) {
            const missingSubs = new Set();
            const params = astParams || {};
            styleAst.styles.forEach((style) => {
                if (style instanceof Map) {
                    style.forEach((value) => {
                        extractStyleParams(value).forEach((sub) => {
                            if (!params.hasOwnProperty(sub)) {
                                missingSubs.add(sub);
                            }
                        });
                    });
                }
            });
            if (missingSubs.size) {
                context.errors.push(invalidState(metadata.name, [...missingSubs.values()]));
            }
        }
        return {
            type: AnimationMetadataType.State,
            name: metadata.name,
            style: styleAst,
            options: astParams ? { params: astParams } : null,
        };
    }
    visitTransition(metadata, context) {
        context.queryCount = 0;
        context.depCount = 0;
        const animation = visitDslNode(this, normalizeAnimationEntry(metadata.animation), context);
        const matchers = parseTransitionExpr(metadata.expr, context.errors);
        return {
            type: AnimationMetadataType.Transition,
            matchers,
            animation,
            queryCount: context.queryCount,
            depCount: context.depCount,
            options: normalizeAnimationOptions(metadata.options),
        };
    }
    visitSequence(metadata, context) {
        return {
            type: AnimationMetadataType.Sequence,
            steps: metadata.steps.map((s) => visitDslNode(this, s, context)),
            options: normalizeAnimationOptions(metadata.options),
        };
    }
    visitGroup(metadata, context) {
        const currentTime = context.currentTime;
        let furthestTime = 0;
        const steps = metadata.steps.map((step) => {
            context.currentTime = currentTime;
            const innerAst = visitDslNode(this, step, context);
            furthestTime = Math.max(furthestTime, context.currentTime);
            return innerAst;
        });
        context.currentTime = furthestTime;
        return {
            type: AnimationMetadataType.Group,
            steps,
            options: normalizeAnimationOptions(metadata.options),
        };
    }
    visitAnimate(metadata, context) {
        const timingAst = constructTimingAst(metadata.timings, context.errors);
        context.currentAnimateTimings = timingAst;
        let styleAst;
        let styleMetadata = metadata.styles
            ? metadata.styles
            : style({});
        if (styleMetadata.type == AnimationMetadataType.Keyframes) {
            styleAst = this.visitKeyframes(styleMetadata, context);
        }
        else {
            let styleMetadata = metadata.styles;
            let isEmpty = false;
            if (!styleMetadata) {
                isEmpty = true;
                const newStyleData = {};
                if (timingAst.easing) {
                    newStyleData['easing'] = timingAst.easing;
                }
                styleMetadata = style(newStyleData);
            }
            context.currentTime += timingAst.duration + timingAst.delay;
            const _styleAst = this.visitStyle(styleMetadata, context);
            _styleAst.isEmptyStep = isEmpty;
            styleAst = _styleAst;
        }
        context.currentAnimateTimings = null;
        return {
            type: AnimationMetadataType.Animate,
            timings: timingAst,
            style: styleAst,
            options: null,
        };
    }
    visitStyle(metadata, context) {
        const ast = this._makeStyleAst(metadata, context);
        this._validateStyleAst(ast, context);
        return ast;
    }
    _makeStyleAst(metadata, context) {
        const styles = [];
        const metadataStyles = Array.isArray(metadata.styles) ? metadata.styles : [metadata.styles];
        for (let styleTuple of metadataStyles) {
            if (typeof styleTuple === 'string') {
                if (styleTuple === AUTO_STYLE) {
                    styles.push(styleTuple);
                }
                else {
                    context.errors.push(invalidStyleValue(styleTuple));
                }
            }
            else {
                styles.push(new Map(Object.entries(styleTuple)));
            }
        }
        let containsDynamicStyles = false;
        let collectedEasing = null;
        styles.forEach((styleData) => {
            if (styleData instanceof Map) {
                if (styleData.has('easing')) {
                    collectedEasing = styleData.get('easing');
                    styleData.delete('easing');
                }
                if (!containsDynamicStyles) {
                    for (let value of styleData.values()) {
                        if (value.toString().indexOf(SUBSTITUTION_EXPR_START) >= 0) {
                            containsDynamicStyles = true;
                            break;
                        }
                    }
                }
            }
        });
        return {
            type: AnimationMetadataType.Style,
            styles,
            easing: collectedEasing,
            offset: metadata.offset,
            containsDynamicStyles,
            options: null,
        };
    }
    _validateStyleAst(ast, context) {
        const timings = context.currentAnimateTimings;
        let endTime = context.currentTime;
        let startTime = context.currentTime;
        if (timings && startTime > 0) {
            startTime -= timings.duration + timings.delay;
        }
        ast.styles.forEach((tuple) => {
            if (typeof tuple === 'string')
                return;
            tuple.forEach((value, prop) => {
                if (typeof ngDevMode === 'undefined' || ngDevMode) {
                    if (!this._driver.validateStyleProperty(prop)) {
                        tuple.delete(prop);
                        context.unsupportedCSSPropertiesFound.add(prop);
                        return;
                    }
                }
                // This is guaranteed to have a defined Map at this querySelector location making it
                // safe to add the assertion here. It is set as a default empty map in prior methods.
                const collectedStyles = context.collectedStyles.get(context.currentQuerySelector);
                const collectedEntry = collectedStyles.get(prop);
                let updateCollectedStyle = true;
                if (collectedEntry) {
                    if (startTime != endTime &&
                        startTime >= collectedEntry.startTime &&
                        endTime <= collectedEntry.endTime) {
                        context.errors.push(invalidParallelAnimation(prop, collectedEntry.startTime, collectedEntry.endTime, startTime, endTime));
                        updateCollectedStyle = false;
                    }
                    // we always choose the smaller start time value since we
                    // want to have a record of the entire animation window where
                    // the style property is being animated in between
                    startTime = collectedEntry.startTime;
                }
                if (updateCollectedStyle) {
                    collectedStyles.set(prop, { startTime, endTime });
                }
                if (context.options) {
                    validateStyleParams(value, context.options, context.errors);
                }
            });
        });
    }
    visitKeyframes(metadata, context) {
        const ast = { type: AnimationMetadataType.Keyframes, styles: [], options: null };
        if (!context.currentAnimateTimings) {
            context.errors.push(invalidKeyframes());
            return ast;
        }
        const MAX_KEYFRAME_OFFSET = 1;
        let totalKeyframesWithOffsets = 0;
        const offsets = [];
        let offsetsOutOfOrder = false;
        let keyframesOutOfRange = false;
        let previousOffset = 0;
        const keyframes = metadata.steps.map((styles) => {
            const style = this._makeStyleAst(styles, context);
            let offsetVal = style.offset != null ? style.offset : consumeOffset(style.styles);
            let offset = 0;
            if (offsetVal != null) {
                totalKeyframesWithOffsets++;
                offset = style.offset = offsetVal;
            }
            keyframesOutOfRange = keyframesOutOfRange || offset < 0 || offset > 1;
            offsetsOutOfOrder = offsetsOutOfOrder || offset < previousOffset;
            previousOffset = offset;
            offsets.push(offset);
            return style;
        });
        if (keyframesOutOfRange) {
            context.errors.push(invalidOffset());
        }
        if (offsetsOutOfOrder) {
            context.errors.push(keyframeOffsetsOutOfOrder());
        }
        const length = metadata.steps.length;
        let generatedOffset = 0;
        if (totalKeyframesWithOffsets > 0 && totalKeyframesWithOffsets < length) {
            context.errors.push(keyframesMissingOffsets());
        }
        else if (totalKeyframesWithOffsets == 0) {
            generatedOffset = MAX_KEYFRAME_OFFSET / (length - 1);
        }
        const limit = length - 1;
        const currentTime = context.currentTime;
        const currentAnimateTimings = context.currentAnimateTimings;
        const animateDuration = currentAnimateTimings.duration;
        keyframes.forEach((kf, i) => {
            const offset = generatedOffset > 0 ? (i == limit ? 1 : generatedOffset * i) : offsets[i];
            const durationUpToThisFrame = offset * animateDuration;
            context.currentTime = currentTime + currentAnimateTimings.delay + durationUpToThisFrame;
            currentAnimateTimings.duration = durationUpToThisFrame;
            this._validateStyleAst(kf, context);
            kf.offset = offset;
            ast.styles.push(kf);
        });
        return ast;
    }
    visitReference(metadata, context) {
        return {
            type: AnimationMetadataType.Reference,
            animation: visitDslNode(this, normalizeAnimationEntry(metadata.animation), context),
            options: normalizeAnimationOptions(metadata.options),
        };
    }
    visitAnimateChild(metadata, context) {
        context.depCount++;
        return {
            type: AnimationMetadataType.AnimateChild,
            options: normalizeAnimationOptions(metadata.options),
        };
    }
    visitAnimateRef(metadata, context) {
        return {
            type: AnimationMetadataType.AnimateRef,
            animation: this.visitReference(metadata.animation, context),
            options: normalizeAnimationOptions(metadata.options),
        };
    }
    visitQuery(metadata, context) {
        const parentSelector = context.currentQuerySelector;
        const options = (metadata.options || {});
        context.queryCount++;
        context.currentQuery = metadata;
        const [selector, includeSelf] = normalizeSelector(metadata.selector);
        context.currentQuerySelector = parentSelector.length
            ? parentSelector + ' ' + selector
            : selector;
        getOrSetDefaultValue(context.collectedStyles, context.currentQuerySelector, new Map());
        const animation = visitDslNode(this, normalizeAnimationEntry(metadata.animation), context);
        context.currentQuery = null;
        context.currentQuerySelector = parentSelector;
        return {
            type: AnimationMetadataType.Query,
            selector,
            limit: options.limit || 0,
            optional: !!options.optional,
            includeSelf,
            animation,
            originalSelector: metadata.selector,
            options: normalizeAnimationOptions(metadata.options),
        };
    }
    visitStagger(metadata, context) {
        if (!context.currentQuery) {
            context.errors.push(invalidStagger());
        }
        const timings = metadata.timings === 'full'
            ? { duration: 0, delay: 0, easing: 'full' }
            : resolveTiming(metadata.timings, context.errors, true);
        return {
            type: AnimationMetadataType.Stagger,
            animation: visitDslNode(this, normalizeAnimationEntry(metadata.animation), context),
            timings,
            options: null,
        };
    }
}
function normalizeSelector(selector) {
    const hasAmpersand = selector.split(/\s*,\s*/).find((token) => token == SELF_TOKEN)
        ? true
        : false;
    if (hasAmpersand) {
        selector = selector.replace(SELF_TOKEN_REGEX, '');
    }
    // Note: the :enter and :leave aren't normalized here since those
    // selectors are filled in at runtime during timeline building
    selector = selector
        .replace(/@\*/g, NG_TRIGGER_SELECTOR)
        .replace(/@\w+/g, (match) => NG_TRIGGER_SELECTOR + '-' + match.slice(1))
        .replace(/:animating/g, NG_ANIMATING_SELECTOR);
    return [selector, hasAmpersand];
}
function normalizeParams(obj) {
    return obj ? { ...obj } : null;
}
class AnimationAstBuilderContext {
    errors;
    queryCount = 0;
    depCount = 0;
    currentTransition = null;
    currentQuery = null;
    currentQuerySelector = null;
    currentAnimateTimings = null;
    currentTime = 0;
    collectedStyles = new Map();
    options = null;
    unsupportedCSSPropertiesFound = new Set();
    constructor(errors) {
        this.errors = errors;
    }
}
function consumeOffset(styles) {
    if (typeof styles == 'string')
        return null;
    let offset = null;
    if (Array.isArray(styles)) {
        styles.forEach((styleTuple) => {
            if (styleTuple instanceof Map && styleTuple.has('offset')) {
                const obj = styleTuple;
                offset = parseFloat(obj.get('offset'));
                obj.delete('offset');
            }
        });
    }
    else if (styles instanceof Map && styles.has('offset')) {
        const obj = styles;
        offset = parseFloat(obj.get('offset'));
        obj.delete('offset');
    }
    return offset;
}
function constructTimingAst(value, errors) {
    if (value.hasOwnProperty('duration')) {
        return value;
    }
    if (typeof value == 'number') {
        const duration = resolveTiming(value, errors).duration;
        return makeTimingAst(duration, 0, '');
    }
    const strValue = value;
    const isDynamic = strValue.split(/\s+/).some((v) => v.charAt(0) == '{' && v.charAt(1) == '{');
    if (isDynamic) {
        const ast = makeTimingAst(0, 0, '');
        ast.dynamic = true;
        ast.strValue = strValue;
        return ast;
    }
    const timings = resolveTiming(strValue, errors);
    return makeTimingAst(timings.duration, timings.delay, timings.easing);
}
function normalizeAnimationOptions(options) {
    if (options) {
        options = { ...options };
        if (options['params']) {
            options['params'] = normalizeParams(options['params']);
        }
    }
    else {
        options = {};
    }
    return options;
}
function makeTimingAst(duration, delay, easing) {
    return { duration, delay, easing };
}

function createTimelineInstruction(element, keyframes, preStyleProps, postStyleProps, duration, delay, easing = null, subTimeline = false) {
    return {
        type: 1 /* AnimationTransitionInstructionType.TimelineAnimation */,
        element,
        keyframes,
        preStyleProps,
        postStyleProps,
        duration,
        delay,
        totalTime: duration + delay,
        easing,
        subTimeline,
    };
}

class ElementInstructionMap {
    _map = new Map();
    get(element) {
        return this._map.get(element) || [];
    }
    append(element, instructions) {
        let existingInstructions = this._map.get(element);
        if (!existingInstructions) {
            this._map.set(element, (existingInstructions = []));
        }
        existingInstructions.push(...instructions);
    }
    has(element) {
        return this._map.has(element);
    }
    clear() {
        this._map.clear();
    }
}

const ONE_FRAME_IN_MILLISECONDS = 1;
const ENTER_TOKEN = ':enter';
const ENTER_TOKEN_REGEX = /* @__PURE__ */ new RegExp(ENTER_TOKEN, 'g');
const LEAVE_TOKEN = ':leave';
const LEAVE_TOKEN_REGEX = /* @__PURE__ */ new RegExp(LEAVE_TOKEN, 'g');
/*
 * The code within this file aims to generate web-animations-compatible keyframes from Angular's
 * animation DSL code.
 *
 * The code below will be converted from:
 *
 * ```ts
 * sequence([
 *   style({ opacity: 0 }),
 *   animate(1000, style({ opacity: 0 }))
 * ])
 * ```
 *
 * To:
 * ```ts
 * keyframes = [{ opacity: 0, offset: 0 }, { opacity: 1, offset: 1 }]
 * duration = 1000
 * delay = 0
 * easing = ''
 * ```
 *
 * For this operation to cover the combination of animation verbs (style, animate, group, etc...) a
 * combination of AST traversal and merge-sort-like algorithms are used.
 *
 * [AST Traversal]
 * Each of the animation verbs, when executed, will return an string-map object representing what
 * type of action it is (style, animate, group, etc...) and the data associated with it. This means
 * that when functional composition mix of these functions is evaluated (like in the example above)
 * then it will end up producing a tree of objects representing the animation itself.
 *
 * When this animation object tree is processed by the visitor code below it will visit each of the
 * verb statements within the visitor. And during each visit it will build the context of the
 * animation keyframes by interacting with the `TimelineBuilder`.
 *
 * [TimelineBuilder]
 * This class is responsible for tracking the styles and building a series of keyframe objects for a
 * timeline between a start and end time. The builder starts off with an initial timeline and each
 * time the AST comes across a `group()`, `keyframes()` or a combination of the two within a
 * `sequence()` then it will generate a sub timeline for each step as well as a new one after
 * they are complete.
 *
 * As the AST is traversed, the timing state on each of the timelines will be incremented. If a sub
 * timeline was created (based on one of the cases above) then the parent timeline will attempt to
 * merge the styles used within the sub timelines into itself (only with group() this will happen).
 * This happens with a merge operation (much like how the merge works in mergeSort) and it will only
 * copy the most recently used styles from the sub timelines into the parent timeline. This ensures
 * that if the styles are used later on in another phase of the animation then they will be the most
 * up-to-date values.
 *
 * [How Missing Styles Are Updated]
 * Each timeline has a `backFill` property which is responsible for filling in new styles into
 * already processed keyframes if a new style shows up later within the animation sequence.
 *
 * ```ts
 * sequence([
 *   style({ width: 0 }),
 *   animate(1000, style({ width: 100 })),
 *   animate(1000, style({ width: 200 })),
 *   animate(1000, style({ width: 300 }))
 *   animate(1000, style({ width: 400, height: 400 })) // notice how `height` doesn't exist anywhere
 * else
 * ])
 * ```
 *
 * What is happening here is that the `height` value is added later in the sequence, but is missing
 * from all previous animation steps. Therefore when a keyframe is created it would also be missing
 * from all previous keyframes up until where it is first used. For the timeline keyframe generation
 * to properly fill in the style it will place the previous value (the value from the parent
 * timeline) or a default value of `*` into the backFill map.
 *
 * When a sub-timeline is created it will have its own backFill property. This is done so that
 * styles present within the sub-timeline do not accidentally seep into the previous/future timeline
 * keyframes
 *
 * [Validation]
 * The code in this file is not responsible for validation. That functionality happens with within
 * the `AnimationValidatorVisitor` code.
 */
function buildAnimationTimelines(driver, rootElement, ast, enterClassName, leaveClassName, startingStyles = new Map(), finalStyles = new Map(), options, subInstructions, errors = []) {
    return new AnimationTimelineBuilderVisitor().buildKeyframes(driver, rootElement, ast, enterClassName, leaveClassName, startingStyles, finalStyles, options, subInstructions, errors);
}
class AnimationTimelineBuilderVisitor {
    buildKeyframes(driver, rootElement, ast, enterClassName, leaveClassName, startingStyles, finalStyles, options, subInstructions, errors = []) {
        subInstructions = subInstructions || new ElementInstructionMap();
        const context = new AnimationTimelineContext(driver, rootElement, subInstructions, enterClassName, leaveClassName, errors, []);
        context.options = options;
        const delay = options.delay ? resolveTimingValue(options.delay) : 0;
        context.currentTimeline.delayNextStep(delay);
        context.currentTimeline.setStyles([startingStyles], null, context.errors, options);
        visitDslNode(this, ast, context);
        // this checks to see if an actual animation happened
        const timelines = context.timelines.filter((timeline) => timeline.containsAnimation());
        // note: we just want to apply the final styles for the rootElement, so we do not
        //       just apply the styles to the last timeline but the last timeline which
        //       element is the root one (basically `*`-styles are replaced with the actual
        //       state style values only for the root element)
        if (timelines.length && finalStyles.size) {
            let lastRootTimeline;
            for (let i = timelines.length - 1; i >= 0; i--) {
                const timeline = timelines[i];
                if (timeline.element === rootElement) {
                    lastRootTimeline = timeline;
                    break;
                }
            }
            if (lastRootTimeline && !lastRootTimeline.allowOnlyTimelineStyles()) {
                lastRootTimeline.setStyles([finalStyles], null, context.errors, options);
            }
        }
        return timelines.length
            ? timelines.map((timeline) => timeline.buildKeyframes())
            : [createTimelineInstruction(rootElement, [], [], [], 0, delay, '', false)];
    }
    visitTrigger(ast, context) {
        // these values are not visited in this AST
    }
    visitState(ast, context) {
        // these values are not visited in this AST
    }
    visitTransition(ast, context) {
        // these values are not visited in this AST
    }
    visitAnimateChild(ast, context) {
        const elementInstructions = context.subInstructions.get(context.element);
        if (elementInstructions) {
            const innerContext = context.createSubContext(ast.options);
            const startTime = context.currentTimeline.currentTime;
            const endTime = this._visitSubInstructions(elementInstructions, innerContext, innerContext.options);
            if (startTime != endTime) {
                // we do this on the upper context because we created a sub context for
                // the sub child animations
                context.transformIntoNewTimeline(endTime);
            }
        }
        context.previousNode = ast;
    }
    visitAnimateRef(ast, context) {
        const innerContext = context.createSubContext(ast.options);
        innerContext.transformIntoNewTimeline();
        this._applyAnimationRefDelays([ast.options, ast.animation.options], context, innerContext);
        this.visitReference(ast.animation, innerContext);
        context.transformIntoNewTimeline(innerContext.currentTimeline.currentTime);
        context.previousNode = ast;
    }
    _applyAnimationRefDelays(animationsRefsOptions, context, innerContext) {
        for (const animationRefOptions of animationsRefsOptions) {
            const animationDelay = animationRefOptions?.delay;
            if (animationDelay) {
                const animationDelayValue = typeof animationDelay === 'number'
                    ? animationDelay
                    : resolveTimingValue(interpolateParams(animationDelay, animationRefOptions?.params ?? {}, context.errors));
                innerContext.delayNextStep(animationDelayValue);
            }
        }
    }
    _visitSubInstructions(instructions, context, options) {
        const startTime = context.currentTimeline.currentTime;
        let furthestTime = startTime;
        // this is a special-case for when a user wants to skip a sub
        // animation from being fired entirely.
        const duration = options.duration != null ? resolveTimingValue(options.duration) : null;
        const delay = options.delay != null ? resolveTimingValue(options.delay) : null;
        if (duration !== 0) {
            instructions.forEach((instruction) => {
                const instructionTimings = context.appendInstructionToTimeline(instruction, duration, delay);
                furthestTime = Math.max(furthestTime, instructionTimings.duration + instructionTimings.delay);
            });
        }
        return furthestTime;
    }
    visitReference(ast, context) {
        context.updateOptions(ast.options, true);
        visitDslNode(this, ast.animation, context);
        context.previousNode = ast;
    }
    visitSequence(ast, context) {
        const subContextCount = context.subContextCount;
        let ctx = context;
        const options = ast.options;
        if (options && (options.params || options.delay)) {
            ctx = context.createSubContext(options);
            ctx.transformIntoNewTimeline();
            if (options.delay != null) {
                if (ctx.previousNode.type == AnimationMetadataType.Style) {
                    ctx.currentTimeline.snapshotCurrentStyles();
                    ctx.previousNode = DEFAULT_NOOP_PREVIOUS_NODE;
                }
                const delay = resolveTimingValue(options.delay);
                ctx.delayNextStep(delay);
            }
        }
        if (ast.steps.length) {
            ast.steps.forEach((s) => visitDslNode(this, s, ctx));
            // this is here just in case the inner steps only contain or end with a style() call
            ctx.currentTimeline.applyStylesToKeyframe();
            // this means that some animation function within the sequence
            // ended up creating a sub timeline (which means the current
            // timeline cannot overlap with the contents of the sequence)
            if (ctx.subContextCount > subContextCount) {
                ctx.transformIntoNewTimeline();
            }
        }
        context.previousNode = ast;
    }
    visitGroup(ast, context) {
        const innerTimelines = [];
        let furthestTime = context.currentTimeline.currentTime;
        const delay = ast.options && ast.options.delay ? resolveTimingValue(ast.options.delay) : 0;
        ast.steps.forEach((s) => {
            const innerContext = context.createSubContext(ast.options);
            if (delay) {
                innerContext.delayNextStep(delay);
            }
            visitDslNode(this, s, innerContext);
            furthestTime = Math.max(furthestTime, innerContext.currentTimeline.currentTime);
            innerTimelines.push(innerContext.currentTimeline);
        });
        // this operation is run after the AST loop because otherwise
        // if the parent timeline's collected styles were updated then
        // it would pass in invalid data into the new-to-be forked items
        innerTimelines.forEach((timeline) => context.currentTimeline.mergeTimelineCollectedStyles(timeline));
        context.transformIntoNewTimeline(furthestTime);
        context.previousNode = ast;
    }
    _visitTiming(ast, context) {
        if (ast.dynamic) {
            const strValue = ast.strValue;
            const timingValue = context.params
                ? interpolateParams(strValue, context.params, context.errors)
                : strValue;
            return resolveTiming(timingValue, context.errors);
        }
        else {
            return { duration: ast.duration, delay: ast.delay, easing: ast.easing };
        }
    }
    visitAnimate(ast, context) {
        const timings = (context.currentAnimateTimings = this._visitTiming(ast.timings, context));
        const timeline = context.currentTimeline;
        if (timings.delay) {
            context.incrementTime(timings.delay);
            timeline.snapshotCurrentStyles();
        }
        const style = ast.style;
        if (style.type == AnimationMetadataType.Keyframes) {
            this.visitKeyframes(style, context);
        }
        else {
            context.incrementTime(timings.duration);
            this.visitStyle(style, context);
            timeline.applyStylesToKeyframe();
        }
        context.currentAnimateTimings = null;
        context.previousNode = ast;
    }
    visitStyle(ast, context) {
        const timeline = context.currentTimeline;
        const timings = context.currentAnimateTimings;
        // this is a special case for when a style() call
        // directly follows  an animate() call (but not inside of an animate() call)
        if (!timings && timeline.hasCurrentStyleProperties()) {
            timeline.forwardFrame();
        }
        const easing = (timings && timings.easing) || ast.easing;
        if (ast.isEmptyStep) {
            timeline.applyEmptyStep(easing);
        }
        else {
            timeline.setStyles(ast.styles, easing, context.errors, context.options);
        }
        context.previousNode = ast;
    }
    visitKeyframes(ast, context) {
        const currentAnimateTimings = context.currentAnimateTimings;
        const startTime = context.currentTimeline.duration;
        const duration = currentAnimateTimings.duration;
        const innerContext = context.createSubContext();
        const innerTimeline = innerContext.currentTimeline;
        innerTimeline.easing = currentAnimateTimings.easing;
        ast.styles.forEach((step) => {
            const offset = step.offset || 0;
            innerTimeline.forwardTime(offset * duration);
            innerTimeline.setStyles(step.styles, step.easing, context.errors, context.options);
            innerTimeline.applyStylesToKeyframe();
        });
        // this will ensure that the parent timeline gets all the styles from
        // the child even if the new timeline below is not used
        context.currentTimeline.mergeTimelineCollectedStyles(innerTimeline);
        // we do this because the window between this timeline and the sub timeline
        // should ensure that the styles within are exactly the same as they were before
        context.transformIntoNewTimeline(startTime + duration);
        context.previousNode = ast;
    }
    visitQuery(ast, context) {
        // in the event that the first step before this is a style step we need
        // to ensure the styles are applied before the children are animated
        const startTime = context.currentTimeline.currentTime;
        const options = (ast.options || {});
        const delay = options.delay ? resolveTimingValue(options.delay) : 0;
        if (delay &&
            (context.previousNode.type === AnimationMetadataType.Style ||
                (startTime == 0 && context.currentTimeline.hasCurrentStyleProperties()))) {
            context.currentTimeline.snapshotCurrentStyles();
            context.previousNode = DEFAULT_NOOP_PREVIOUS_NODE;
        }
        let furthestTime = startTime;
        const elms = context.invokeQuery(ast.selector, ast.originalSelector, ast.limit, ast.includeSelf, options.optional ? true : false, context.errors);
        context.currentQueryTotal = elms.length;
        let sameElementTimeline = null;
        elms.forEach((element, i) => {
            context.currentQueryIndex = i;
            const innerContext = context.createSubContext(ast.options, element);
            if (delay) {
                innerContext.delayNextStep(delay);
            }
            if (element === context.element) {
                sameElementTimeline = innerContext.currentTimeline;
            }
            visitDslNode(this, ast.animation, innerContext);
            // this is here just incase the inner steps only contain or end
            // with a style() call (which is here to signal that this is a preparatory
            // call to style an element before it is animated again)
            innerContext.currentTimeline.applyStylesToKeyframe();
            const endTime = innerContext.currentTimeline.currentTime;
            furthestTime = Math.max(furthestTime, endTime);
        });
        context.currentQueryIndex = 0;
        context.currentQueryTotal = 0;
        context.transformIntoNewTimeline(furthestTime);
        if (sameElementTimeline) {
            context.currentTimeline.mergeTimelineCollectedStyles(sameElementTimeline);
            context.currentTimeline.snapshotCurrentStyles();
        }
        context.previousNode = ast;
    }
    visitStagger(ast, context) {
        const parentContext = context.parentContext;
        const tl = context.currentTimeline;
        const timings = ast.timings;
        const duration = Math.abs(timings.duration);
        const maxTime = duration * (context.currentQueryTotal - 1);
        let delay = duration * context.currentQueryIndex;
        let staggerTransformer = timings.duration < 0 ? 'reverse' : timings.easing;
        switch (staggerTransformer) {
            case 'reverse':
                delay = maxTime - delay;
                break;
            case 'full':
                delay = parentContext.currentStaggerTime;
                break;
        }
        const timeline = context.currentTimeline;
        if (delay) {
            timeline.delayNextStep(delay);
        }
        const startingTime = timeline.currentTime;
        visitDslNode(this, ast.animation, context);
        context.previousNode = ast;
        // time = duration + delay
        // the reason why this computation is so complex is because
        // the inner timeline may either have a delay value or a stretched
        // keyframe depending on if a subtimeline is not used or is used.
        parentContext.currentStaggerTime =
            tl.currentTime - startingTime + (tl.startTime - parentContext.currentTimeline.startTime);
    }
}
const DEFAULT_NOOP_PREVIOUS_NODE = {};
class AnimationTimelineContext {
    _driver;
    element;
    subInstructions;
    _enterClassName;
    _leaveClassName;
    errors;
    timelines;
    parentContext = null;
    currentTimeline;
    currentAnimateTimings = null;
    previousNode = DEFAULT_NOOP_PREVIOUS_NODE;
    subContextCount = 0;
    options = {};
    currentQueryIndex = 0;
    currentQueryTotal = 0;
    currentStaggerTime = 0;
    constructor(_driver, element, subInstructions, _enterClassName, _leaveClassName, errors, timelines, initialTimeline) {
        this._driver = _driver;
        this.element = element;
        this.subInstructions = subInstructions;
        this._enterClassName = _enterClassName;
        this._leaveClassName = _leaveClassName;
        this.errors = errors;
        this.timelines = timelines;
        this.currentTimeline = initialTimeline || new TimelineBuilder(this._driver, element, 0);
        timelines.push(this.currentTimeline);
    }
    get params() {
        return this.options.params;
    }
    updateOptions(options, skipIfExists) {
        if (!options)
            return;
        const newOptions = options;
        let optionsToUpdate = this.options;
        // NOTE: this will get patched up when other animation methods support duration overrides
        if (newOptions.duration != null) {
            optionsToUpdate.duration = resolveTimingValue(newOptions.duration);
        }
        if (newOptions.delay != null) {
            optionsToUpdate.delay = resolveTimingValue(newOptions.delay);
        }
        const newParams = newOptions.params;
        if (newParams) {
            let paramsToUpdate = optionsToUpdate.params;
            if (!paramsToUpdate) {
                paramsToUpdate = this.options.params = {};
            }
            Object.keys(newParams).forEach((name) => {
                if (!skipIfExists || !paramsToUpdate.hasOwnProperty(name)) {
                    paramsToUpdate[name] = interpolateParams(newParams[name], paramsToUpdate, this.errors);
                }
            });
        }
    }
    _copyOptions() {
        const options = {};
        if (this.options) {
            const oldParams = this.options.params;
            if (oldParams) {
                const params = (options['params'] = {});
                Object.keys(oldParams).forEach((name) => {
                    params[name] = oldParams[name];
                });
            }
        }
        return options;
    }
    createSubContext(options = null, element, newTime) {
        const target = element || this.element;
        const context = new AnimationTimelineContext(this._driver, target, this.subInstructions, this._enterClassName, this._leaveClassName, this.errors, this.timelines, this.currentTimeline.fork(target, newTime || 0));
        context.previousNode = this.previousNode;
        context.currentAnimateTimings = this.currentAnimateTimings;
        context.options = this._copyOptions();
        context.updateOptions(options);
        context.currentQueryIndex = this.currentQueryIndex;
        context.currentQueryTotal = this.currentQueryTotal;
        context.parentContext = this;
        this.subContextCount++;
        return context;
    }
    transformIntoNewTimeline(newTime) {
        this.previousNode = DEFAULT_NOOP_PREVIOUS_NODE;
        this.currentTimeline = this.currentTimeline.fork(this.element, newTime);
        this.timelines.push(this.currentTimeline);
        return this.currentTimeline;
    }
    appendInstructionToTimeline(instruction, duration, delay) {
        const updatedTimings = {
            duration: duration != null ? duration : instruction.duration,
            delay: this.currentTimeline.currentTime + (delay != null ? delay : 0) + instruction.delay,
            easing: '',
        };
        const builder = new SubTimelineBuilder(this._driver, instruction.element, instruction.keyframes, instruction.preStyleProps, instruction.postStyleProps, updatedTimings, instruction.stretchStartingKeyframe);
        this.timelines.push(builder);
        return updatedTimings;
    }
    incrementTime(time) {
        this.currentTimeline.forwardTime(this.currentTimeline.duration + time);
    }
    delayNextStep(delay) {
        // negative delays are not yet supported
        if (delay > 0) {
            this.currentTimeline.delayNextStep(delay);
        }
    }
    invokeQuery(selector, originalSelector, limit, includeSelf, optional, errors) {
        let results = [];
        if (includeSelf) {
            results.push(this.element);
        }
        if (selector.length > 0) {
            // only if :self is used then the selector can be empty
            selector = selector.replace(ENTER_TOKEN_REGEX, '.' + this._enterClassName);
            selector = selector.replace(LEAVE_TOKEN_REGEX, '.' + this._leaveClassName);
            const multi = limit != 1;
            let elements = this._driver.query(this.element, selector, multi);
            if (limit !== 0) {
                elements =
                    limit < 0
                        ? elements.slice(elements.length + limit, elements.length)
                        : elements.slice(0, limit);
            }
            results.push(...elements);
        }
        if (!optional && results.length == 0) {
            errors.push(invalidQuery(originalSelector));
        }
        return results;
    }
}
class TimelineBuilder {
    _driver;
    element;
    startTime;
    _elementTimelineStylesLookup;
    duration = 0;
    easing = null;
    _previousKeyframe = new Map();
    _currentKeyframe = new Map();
    _keyframes = new Map();
    _styleSummary = new Map();
    _localTimelineStyles = new Map();
    _globalTimelineStyles;
    _pendingStyles = new Map();
    _backFill = new Map();
    _currentEmptyStepKeyframe = null;
    constructor(_driver, element, startTime, _elementTimelineStylesLookup) {
        this._driver = _driver;
        this.element = element;
        this.startTime = startTime;
        this._elementTimelineStylesLookup = _elementTimelineStylesLookup;
        if (!this._elementTimelineStylesLookup) {
            this._elementTimelineStylesLookup = new Map();
        }
        this._globalTimelineStyles = this._elementTimelineStylesLookup.get(element);
        if (!this._globalTimelineStyles) {
            this._globalTimelineStyles = this._localTimelineStyles;
            this._elementTimelineStylesLookup.set(element, this._localTimelineStyles);
        }
        this._loadKeyframe();
    }
    containsAnimation() {
        switch (this._keyframes.size) {
            case 0:
                return false;
            case 1:
                return this.hasCurrentStyleProperties();
            default:
                return true;
        }
    }
    hasCurrentStyleProperties() {
        return this._currentKeyframe.size > 0;
    }
    get currentTime() {
        return this.startTime + this.duration;
    }
    delayNextStep(delay) {
        // in the event that a style() step is placed right before a stagger()
        // and that style() step is the very first style() value in the animation
        // then we need to make a copy of the keyframe [0, copy, 1] so that the delay
        // properly applies the style() values to work with the stagger...
        const hasPreStyleStep = this._keyframes.size === 1 && this._pendingStyles.size;
        if (this.duration || hasPreStyleStep) {
            this.forwardTime(this.currentTime + delay);
            if (hasPreStyleStep) {
                this.snapshotCurrentStyles();
            }
        }
        else {
            this.startTime += delay;
        }
    }
    fork(element, currentTime) {
        this.applyStylesToKeyframe();
        return new TimelineBuilder(this._driver, element, currentTime || this.currentTime, this._elementTimelineStylesLookup);
    }
    _loadKeyframe() {
        if (this._currentKeyframe) {
            this._previousKeyframe = this._currentKeyframe;
        }
        this._currentKeyframe = this._keyframes.get(this.duration);
        if (!this._currentKeyframe) {
            this._currentKeyframe = new Map();
            this._keyframes.set(this.duration, this._currentKeyframe);
        }
    }
    forwardFrame() {
        this.duration += ONE_FRAME_IN_MILLISECONDS;
        this._loadKeyframe();
    }
    forwardTime(time) {
        this.applyStylesToKeyframe();
        this.duration = time;
        this._loadKeyframe();
    }
    _updateStyle(prop, value) {
        this._localTimelineStyles.set(prop, value);
        this._globalTimelineStyles.set(prop, value);
        this._styleSummary.set(prop, { time: this.currentTime, value });
    }
    allowOnlyTimelineStyles() {
        return this._currentEmptyStepKeyframe !== this._currentKeyframe;
    }
    applyEmptyStep(easing) {
        if (easing) {
            this._previousKeyframe.set('easing', easing);
        }
        // special case for animate(duration):
        // all missing styles are filled with a `*` value then
        // if any destination styles are filled in later on the same
        // keyframe then they will override the overridden styles
        // We use `_globalTimelineStyles` here because there may be
        // styles in previous keyframes that are not present in this timeline
        for (let [prop, value] of this._globalTimelineStyles) {
            this._backFill.set(prop, value || AUTO_STYLE);
            this._currentKeyframe.set(prop, AUTO_STYLE);
        }
        this._currentEmptyStepKeyframe = this._currentKeyframe;
    }
    setStyles(input, easing, errors, options) {
        if (easing) {
            this._previousKeyframe.set('easing', easing);
        }
        const params = (options && options.params) || {};
        const styles = flattenStyles(input, this._globalTimelineStyles);
        for (let [prop, value] of styles) {
            const val = interpolateParams(value, params, errors);
            this._pendingStyles.set(prop, val);
            if (!this._localTimelineStyles.has(prop)) {
                this._backFill.set(prop, this._globalTimelineStyles.get(prop) ?? AUTO_STYLE);
            }
            this._updateStyle(prop, val);
        }
    }
    applyStylesToKeyframe() {
        if (this._pendingStyles.size == 0)
            return;
        this._pendingStyles.forEach((val, prop) => {
            this._currentKeyframe.set(prop, val);
        });
        this._pendingStyles.clear();
        this._localTimelineStyles.forEach((val, prop) => {
            if (!this._currentKeyframe.has(prop)) {
                this._currentKeyframe.set(prop, val);
            }
        });
    }
    snapshotCurrentStyles() {
        for (let [prop, val] of this._localTimelineStyles) {
            this._pendingStyles.set(prop, val);
            this._updateStyle(prop, val);
        }
    }
    getFinalKeyframe() {
        return this._keyframes.get(this.duration);
    }
    get properties() {
        const properties = [];
        for (let prop in this._currentKeyframe) {
            properties.push(prop);
        }
        return properties;
    }
    mergeTimelineCollectedStyles(timeline) {
        timeline._styleSummary.forEach((details1, prop) => {
            const details0 = this._styleSummary.get(prop);
            if (!details0 || details1.time > details0.time) {
                this._updateStyle(prop, details1.value);
            }
        });
    }
    buildKeyframes() {
        this.applyStylesToKeyframe();
        const preStyleProps = new Set();
        const postStyleProps = new Set();
        const isEmpty = this._keyframes.size === 1 && this.duration === 0;
        let finalKeyframes = [];
        this._keyframes.forEach((keyframe, time) => {
            const finalKeyframe = new Map([...this._backFill, ...keyframe]);
            finalKeyframe.forEach((value, prop) => {
                if (value === _PRE_STYLE) {
                    preStyleProps.add(prop);
                }
                else if (value === AUTO_STYLE) {
                    postStyleProps.add(prop);
                }
            });
            if (!isEmpty) {
                finalKeyframe.set('offset', time / this.duration);
            }
            finalKeyframes.push(finalKeyframe);
        });
        const preProps = [...preStyleProps.values()];
        const postProps = [...postStyleProps.values()];
        // special case for a 0-second animation (which is designed just to place styles onscreen)
        if (isEmpty) {
            const kf0 = finalKeyframes[0];
            const kf1 = new Map(kf0);
            kf0.set('offset', 0);
            kf1.set('offset', 1);
            finalKeyframes = [kf0, kf1];
        }
        return createTimelineInstruction(this.element, finalKeyframes, preProps, postProps, this.duration, this.startTime, this.easing, false);
    }
}
class SubTimelineBuilder extends TimelineBuilder {
    keyframes;
    preStyleProps;
    postStyleProps;
    _stretchStartingKeyframe;
    timings;
    constructor(driver, element, keyframes, preStyleProps, postStyleProps, timings, _stretchStartingKeyframe = false) {
        super(driver, element, timings.delay);
        this.keyframes = keyframes;
        this.preStyleProps = preStyleProps;
        this.postStyleProps = postStyleProps;
        this._stretchStartingKeyframe = _stretchStartingKeyframe;
        this.timings = { duration: timings.duration, delay: timings.delay, easing: timings.easing };
    }
    containsAnimation() {
        return this.keyframes.length > 1;
    }
    buildKeyframes() {
        let keyframes = this.keyframes;
        let { delay, duration, easing } = this.timings;
        if (this._stretchStartingKeyframe && delay) {
            const newKeyframes = [];
            const totalTime = duration + delay;
            const startingGap = delay / totalTime;
            // the original starting keyframe now starts once the delay is done
            const newFirstKeyframe = new Map(keyframes[0]);
            newFirstKeyframe.set('offset', 0);
            newKeyframes.push(newFirstKeyframe);
            const oldFirstKeyframe = new Map(keyframes[0]);
            oldFirstKeyframe.set('offset', roundOffset(startingGap));
            newKeyframes.push(oldFirstKeyframe);
            /*
              When the keyframe is stretched then it means that the delay before the animation
              starts is gone. Instead the first keyframe is placed at the start of the animation
              and it is then copied to where it starts when the original delay is over. This basically
              means nothing animates during that delay, but the styles are still rendered. For this
              to work the original offset values that exist in the original keyframes must be "warped"
              so that they can take the new keyframe + delay into account.
      
              delay=1000, duration=1000, keyframes = 0 .5 1
      
              turns into
      
              delay=0, duration=2000, keyframes = 0 .33 .66 1
             */
            // offsets between 1 ... n -1 are all warped by the keyframe stretch
            const limit = keyframes.length - 1;
            for (let i = 1; i <= limit; i++) {
                let kf = new Map(keyframes[i]);
                const oldOffset = kf.get('offset');
                const timeAtKeyframe = delay + oldOffset * duration;
                kf.set('offset', roundOffset(timeAtKeyframe / totalTime));
                newKeyframes.push(kf);
            }
            // the new starting keyframe should be added at the start
            duration = totalTime;
            delay = 0;
            easing = '';
            keyframes = newKeyframes;
        }
        return createTimelineInstruction(this.element, keyframes, this.preStyleProps, this.postStyleProps, duration, delay, easing, true);
    }
}
function roundOffset(offset, decimalPoints = 3) {
    const mult = Math.pow(10, decimalPoints - 1);
    return Math.round(offset * mult) / mult;
}
function flattenStyles(input, allStyles) {
    const styles = new Map();
    let allProperties;
    input.forEach((token) => {
        if (token === '*') {
            allProperties ??= allStyles.keys();
            for (let prop of allProperties) {
                styles.set(prop, AUTO_STYLE);
            }
        }
        else {
            for (let [prop, val] of token) {
                styles.set(prop, val);
            }
        }
    });
    return styles;
}

function createTransitionInstruction(element, triggerName, fromState, toState, isRemovalTransition, fromStyles, toStyles, timelines, queriedElements, preStyleProps, postStyleProps, totalTime, errors) {
    return {
        type: 0 /* AnimationTransitionInstructionType.TransitionAnimation */,
        element,
        triggerName,
        isRemovalTransition,
        fromState,
        fromStyles,
        toState,
        toStyles,
        timelines,
        queriedElements,
        preStyleProps,
        postStyleProps,
        totalTime,
        errors,
    };
}

const EMPTY_OBJECT = {};
class AnimationTransitionFactory {
    _triggerName;
    ast;
    _stateStyles;
    constructor(_triggerName, ast, _stateStyles) {
        this._triggerName = _triggerName;
        this.ast = ast;
        this._stateStyles = _stateStyles;
    }
    match(currentState, nextState, element, params) {
        return oneOrMoreTransitionsMatch(this.ast.matchers, currentState, nextState, element, params);
    }
    buildStyles(stateName, params, errors) {
        let styler = this._stateStyles.get('*');
        if (stateName !== undefined) {
            styler = this._stateStyles.get(stateName?.toString()) || styler;
        }
        return styler ? styler.buildStyles(params, errors) : new Map();
    }
    build(driver, element, currentState, nextState, enterClassName, leaveClassName, currentOptions, nextOptions, subInstructions, skipAstBuild) {
        const errors = [];
        const transitionAnimationParams = (this.ast.options && this.ast.options.params) || EMPTY_OBJECT;
        const currentAnimationParams = (currentOptions && currentOptions.params) || EMPTY_OBJECT;
        const currentStateStyles = this.buildStyles(currentState, currentAnimationParams, errors);
        const nextAnimationParams = (nextOptions && nextOptions.params) || EMPTY_OBJECT;
        const nextStateStyles = this.buildStyles(nextState, nextAnimationParams, errors);
        const queriedElements = new Set();
        const preStyleMap = new Map();
        const postStyleMap = new Map();
        const isRemoval = nextState === 'void';
        const animationOptions = {
            params: applyParamDefaults(nextAnimationParams, transitionAnimationParams),
            delay: this.ast.options?.delay,
        };
        const timelines = skipAstBuild
            ? []
            : buildAnimationTimelines(driver, element, this.ast.animation, enterClassName, leaveClassName, currentStateStyles, nextStateStyles, animationOptions, subInstructions, errors);
        let totalTime = 0;
        timelines.forEach((tl) => {
            totalTime = Math.max(tl.duration + tl.delay, totalTime);
        });
        if (errors.length) {
            return createTransitionInstruction(element, this._triggerName, currentState, nextState, isRemoval, currentStateStyles, nextStateStyles, [], [], preStyleMap, postStyleMap, totalTime, errors);
        }
        timelines.forEach((tl) => {
            const elm = tl.element;
            const preProps = getOrSetDefaultValue(preStyleMap, elm, new Set());
            tl.preStyleProps.forEach((prop) => preProps.add(prop));
            const postProps = getOrSetDefaultValue(postStyleMap, elm, new Set());
            tl.postStyleProps.forEach((prop) => postProps.add(prop));
            if (elm !== element) {
                queriedElements.add(elm);
            }
        });
        if (typeof ngDevMode === 'undefined' || ngDevMode) {
            checkNonAnimatableInTimelines(timelines, this._triggerName, driver);
        }
        return createTransitionInstruction(element, this._triggerName, currentState, nextState, isRemoval, currentStateStyles, nextStateStyles, timelines, [...queriedElements.values()], preStyleMap, postStyleMap, totalTime);
    }
}
/**
 * Checks inside a set of timelines if they try to animate a css property which is not considered
 * animatable, in that case it prints a warning on the console.
 * Besides that the function doesn't have any other effect.
 *
 * Note: this check is done here after the timelines are built instead of doing on a lower level so
 * that we can make sure that the warning appears only once per instruction (we can aggregate here
 * all the issues instead of finding them separately).
 *
 * @param timelines The built timelines for the current instruction.
 * @param triggerName The name of the trigger for the current instruction.
 * @param driver Animation driver used to perform the check.
 *
 */
function checkNonAnimatableInTimelines(timelines, triggerName, driver) {
    if (!driver.validateAnimatableStyleProperty) {
        return;
    }
    const allowedNonAnimatableProps = new Set([
        // 'easing' is a utility/synthetic prop we use to represent
        // easing functions, it represents a property of the animation
        // which is not animatable but different values can be used
        // in different steps
        'easing',
    ]);
    const invalidNonAnimatableProps = new Set();
    timelines.forEach(({ keyframes }) => {
        const nonAnimatablePropsInitialValues = new Map();
        keyframes.forEach((keyframe) => {
            const entriesToCheck = Array.from(keyframe.entries()).filter(([prop]) => !allowedNonAnimatableProps.has(prop));
            for (const [prop, value] of entriesToCheck) {
                if (!driver.validateAnimatableStyleProperty(prop)) {
                    if (nonAnimatablePropsInitialValues.has(prop) && !invalidNonAnimatableProps.has(prop)) {
                        const propInitialValue = nonAnimatablePropsInitialValues.get(prop);
                        if (propInitialValue !== value) {
                            invalidNonAnimatableProps.add(prop);
                        }
                    }
                    else {
                        nonAnimatablePropsInitialValues.set(prop, value);
                    }
                }
            }
        });
    });
    if (invalidNonAnimatableProps.size > 0) {
        console.warn(`Warning: The animation trigger "${triggerName}" is attempting to animate the following` +
            ' not animatable properties: ' +
            Array.from(invalidNonAnimatableProps).join(', ') +
            '\n' +
            '(to check the list of all animatable properties visit https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_animated_properties)');
    }
}
function oneOrMoreTransitionsMatch(matchFns, currentState, nextState, element, params) {
    return matchFns.some((fn) => fn(currentState, nextState, element, params));
}
function applyParamDefaults(userParams, defaults) {
    const result = { ...defaults };
    Object.entries(userParams).forEach(([key, value]) => {
        if (value != null) {
            result[key] = value;
        }
    });
    return result;
}
class AnimationStateStyles {
    styles;
    defaultParams;
    normalizer;
    constructor(styles, defaultParams, normalizer) {
        this.styles = styles;
        this.defaultParams = defaultParams;
        this.normalizer = normalizer;
    }
    buildStyles(params, errors) {
        const finalStyles = new Map();
        const combinedParams = applyParamDefaults(params, this.defaultParams);
        this.styles.styles.forEach((value) => {
            if (typeof value !== 'string') {
                value.forEach((val, prop) => {
                    if (val) {
                        val = interpolateParams(val, combinedParams, errors);
                    }
                    const normalizedProp = this.normalizer.normalizePropertyName(prop, errors);
                    val = this.normalizer.normalizeStyleValue(prop, normalizedProp, val, errors);
                    finalStyles.set(prop, val);
                });
            }
        });
        return finalStyles;
    }
}

function buildTrigger(name, ast, normalizer) {
    return new AnimationTrigger(name, ast, normalizer);
}
class AnimationTrigger {
    name;
    ast;
    _normalizer;
    transitionFactories = [];
    fallbackTransition;
    states = new Map();
    constructor(name, ast, _normalizer) {
        this.name = name;
        this.ast = ast;
        this._normalizer = _normalizer;
        ast.states.forEach((ast) => {
            const defaultParams = (ast.options && ast.options.params) || {};
            this.states.set(ast.name, new AnimationStateStyles(ast.style, defaultParams, _normalizer));
        });
        balanceProperties(this.states, 'true', '1');
        balanceProperties(this.states, 'false', '0');
        ast.transitions.forEach((ast) => {
            this.transitionFactories.push(new AnimationTransitionFactory(name, ast, this.states));
        });
        this.fallbackTransition = createFallbackTransition(name, this.states);
    }
    get containsQueries() {
        return this.ast.queryCount > 0;
    }
    matchTransition(currentState, nextState, element, params) {
        const entry = this.transitionFactories.find((f) => f.match(currentState, nextState, element, params));
        return entry || null;
    }
    matchStyles(currentState, params, errors) {
        return this.fallbackTransition.buildStyles(currentState, params, errors);
    }
}
function createFallbackTransition(triggerName, states, normalizer) {
    const matchers = [(fromState, toState) => true];
    const animation = { type: AnimationMetadataType.Sequence, steps: [], options: null };
    const transition = {
        type: AnimationMetadataType.Transition,
        animation,
        matchers,
        options: null,
        queryCount: 0,
        depCount: 0,
    };
    return new AnimationTransitionFactory(triggerName, transition, states);
}
function balanceProperties(stateMap, key1, key2) {
    if (stateMap.has(key1)) {
        if (!stateMap.has(key2)) {
            stateMap.set(key2, stateMap.get(key1));
        }
    }
    else if (stateMap.has(key2)) {
        stateMap.set(key1, stateMap.get(key2));
    }
}

const EMPTY_INSTRUCTION_MAP = /* @__PURE__ */ new ElementInstructionMap();
class TimelineAnimationEngine {
    bodyNode;
    _driver;
    _normalizer;
    _animations = new Map();
    _playersById = new Map();
    players = [];
    constructor(bodyNode, _driver, _normalizer) {
        this.bodyNode = bodyNode;
        this._driver = _driver;
        this._normalizer = _normalizer;
    }
    register(id, metadata) {
        const errors = [];
        const warnings = [];
        const ast = buildAnimationAst(this._driver, metadata, errors, warnings);
        if (errors.length) {
            throw registerFailed(errors);
        }
        else {
            if (typeof ngDevMode === 'undefined' || ngDevMode) {
                if (warnings.length) {
                    warnRegister(warnings);
                }
            }
            this._animations.set(id, ast);
        }
    }
    _buildPlayer(i, preStyles, postStyles) {
        const element = i.element;
        const keyframes = normalizeKeyframes(this._normalizer, i.keyframes, preStyles, postStyles);
        return this._driver.animate(element, keyframes, i.duration, i.delay, i.easing, [], true);
    }
    create(id, element, options = {}) {
        const errors = [];
        const ast = this._animations.get(id);
        let instructions;
        const autoStylesMap = new Map();
        if (ast) {
            instructions = buildAnimationTimelines(this._driver, element, ast, ENTER_CLASSNAME, LEAVE_CLASSNAME, new Map(), new Map(), options, EMPTY_INSTRUCTION_MAP, errors);
            instructions.forEach((inst) => {
                const styles = getOrSetDefaultValue(autoStylesMap, inst.element, new Map());
                inst.postStyleProps.forEach((prop) => styles.set(prop, null));
            });
        }
        else {
            errors.push(missingOrDestroyedAnimation());
            instructions = [];
        }
        if (errors.length) {
            throw createAnimationFailed(errors);
        }
        autoStylesMap.forEach((styles, element) => {
            styles.forEach((_, prop) => {
                styles.set(prop, this._driver.computeStyle(element, prop, AUTO_STYLE));
            });
        });
        const players = instructions.map((i) => {
            const styles = autoStylesMap.get(i.element);
            return this._buildPlayer(i, new Map(), styles);
        });
        const player = optimizeGroupPlayer(players);
        this._playersById.set(id, player);
        player.onDestroy(() => this.destroy(id));
        this.players.push(player);
        return player;
    }
    destroy(id) {
        const player = this._getPlayer(id);
        player.destroy();
        this._playersById.delete(id);
        const index = this.players.indexOf(player);
        if (index >= 0) {
            this.players.splice(index, 1);
        }
    }
    _getPlayer(id) {
        const player = this._playersById.get(id);
        if (!player) {
            throw missingPlayer(id);
        }
        return player;
    }
    listen(id, element, eventName, callback) {
        // triggerName, fromState, toState are all ignored for timeline animations
        const baseEvent = makeAnimationEvent(element, '', '', '');
        listenOnPlayer(this._getPlayer(id), eventName, baseEvent, callback);
        return () => { };
    }
    command(id, element, command, args) {
        if (command == 'register') {
            this.register(id, args[0]);
            return;
        }
        if (command == 'create') {
            const options = (args[0] || {});
            this.create(id, element, options);
            return;
        }
        const player = this._getPlayer(id);
        switch (command) {
            case 'play':
                player.play();
                break;
            case 'pause':
                player.pause();
                break;
            case 'reset':
                player.reset();
                break;
            case 'restart':
                player.restart();
                break;
            case 'finish':
                player.finish();
                break;
            case 'init':
                player.init();
                break;
            case 'setPosition':
                player.setPosition(parseFloat(args[0]));
                break;
            case 'destroy':
                this.destroy(id);
                break;
        }
    }
}

const QUEUED_CLASSNAME = 'ng-animate-queued';
const QUEUED_SELECTOR = '.ng-animate-queued';
const DISABLED_CLASSNAME = 'ng-animate-disabled';
const DISABLED_SELECTOR = '.ng-animate-disabled';
const STAR_CLASSNAME = 'ng-star-inserted';
const STAR_SELECTOR = '.ng-star-inserted';
const EMPTY_PLAYER_ARRAY = [];
const NULL_REMOVAL_STATE = {
    namespaceId: '',
    setForRemoval: false,
    setForMove: false,
    hasAnimation: false,
    removedBeforeQueried: false,
};
const NULL_REMOVED_QUERIED_STATE = {
    namespaceId: '',
    setForMove: false,
    setForRemoval: false,
    hasAnimation: false,
    removedBeforeQueried: true,
};
const REMOVAL_FLAG = '__ng_removed';
class StateValue {
    namespaceId;
    value;
    options;
    get params() {
        return this.options.params;
    }
    constructor(input, namespaceId = '') {
        this.namespaceId = namespaceId;
        const isObj = input && input.hasOwnProperty('value');
        const value = isObj ? input['value'] : input;
        this.value = normalizeTriggerValue(value);
        if (isObj) {
            // we drop the value property from options.
            const { value, ...options } = input;
            this.options = options;
        }
        else {
            this.options = {};
        }
        if (!this.options.params) {
            this.options.params = {};
        }
    }
    absorbOptions(options) {
        const newParams = options.params;
        if (newParams) {
            const oldParams = this.options.params;
            Object.keys(newParams).forEach((prop) => {
                if (oldParams[prop] == null) {
                    oldParams[prop] = newParams[prop];
                }
            });
        }
    }
}
const VOID_VALUE = 'void';
const DEFAULT_STATE_VALUE = /* @__PURE__ */ new StateValue(VOID_VALUE);
class AnimationTransitionNamespace {
    id;
    hostElement;
    _engine;
    players = [];
    _triggers = new Map();
    _queue = [];
    _elementListeners = new Map();
    _hostClassName;
    constructor(id, hostElement, _engine) {
        this.id = id;
        this.hostElement = hostElement;
        this._engine = _engine;
        this._hostClassName = 'ng-tns-' + id;
        addClass(hostElement, this._hostClassName);
    }
    listen(element, name, phase, callback) {
        if (!this._triggers.has(name)) {
            throw missingTrigger(phase, name);
        }
        if (phase == null || phase.length == 0) {
            throw missingEvent(name);
        }
        if (!isTriggerEventValid(phase)) {
            throw unsupportedTriggerEvent(phase, name);
        }
        const listeners = getOrSetDefaultValue(this._elementListeners, element, []);
        const data = { name, phase, callback };
        listeners.push(data);
        const triggersWithStates = getOrSetDefaultValue(this._engine.statesByElement, element, new Map());
        if (!triggersWithStates.has(name)) {
            addClass(element, NG_TRIGGER_CLASSNAME);
            addClass(element, NG_TRIGGER_CLASSNAME + '-' + name);
            triggersWithStates.set(name, DEFAULT_STATE_VALUE);
        }
        return () => {
            // the event listener is removed AFTER the flush has occurred such
            // that leave animations callbacks can fire (otherwise if the node
            // is removed in between then the listeners would be deregistered)
            this._engine.afterFlush(() => {
                const index = listeners.indexOf(data);
                if (index >= 0) {
                    listeners.splice(index, 1);
                }
                if (!this._triggers.has(name)) {
                    triggersWithStates.delete(name);
                }
            });
        };
    }
    register(name, ast) {
        if (this._triggers.has(name)) {
            // throw
            return false;
        }
        else {
            this._triggers.set(name, ast);
            return true;
        }
    }
    _getTrigger(name) {
        const trigger = this._triggers.get(name);
        if (!trigger) {
            throw unregisteredTrigger(name);
        }
        return trigger;
    }
    trigger(element, triggerName, value, defaultToFallback = true) {
        const trigger = this._getTrigger(triggerName);
        const player = new TransitionAnimationPlayer(this.id, triggerName, element);
        let triggersWithStates = this._engine.statesByElement.get(element);
        if (!triggersWithStates) {
            addClass(element, NG_TRIGGER_CLASSNAME);
            addClass(element, NG_TRIGGER_CLASSNAME + '-' + triggerName);
            this._engine.statesByElement.set(element, (triggersWithStates = new Map()));
        }
        let fromState = triggersWithStates.get(triggerName);
        const toState = new StateValue(value, this.id);
        const isObj = value && value.hasOwnProperty('value');
        if (!isObj && fromState) {
            toState.absorbOptions(fromState.options);
        }
        triggersWithStates.set(triggerName, toState);
        if (!fromState) {
            fromState = DEFAULT_STATE_VALUE;
        }
        const isRemoval = toState.value === VOID_VALUE;
        // normally this isn't reached by here, however, if an object expression
        // is passed in then it may be a new object each time. Comparing the value
        // is important since that will stay the same despite there being a new object.
        // The removal arc here is special cased because the same element is triggered
        // twice in the event that it contains animations on the outer/inner portions
        // of the host container
        if (!isRemoval && fromState.value === toState.value) {
            // this means that despite the value not changing, some inner params
            // have changed which means that the animation final styles need to be applied
            if (!objEquals(fromState.params, toState.params)) {
                const errors = [];
                const fromStyles = trigger.matchStyles(fromState.value, fromState.params, errors);
                const toStyles = trigger.matchStyles(toState.value, toState.params, errors);
                if (errors.length) {
                    this._engine.reportError(errors);
                }
                else {
                    this._engine.afterFlush(() => {
                        eraseStyles(element, fromStyles);
                        setStyles(element, toStyles);
                    });
                }
            }
            return;
        }
        const playersOnElement = getOrSetDefaultValue(this._engine.playersByElement, element, []);
        playersOnElement.forEach((player) => {
            // only remove the player if it is queued on the EXACT same trigger/namespace
            // we only also deal with queued players here because if the animation has
            // started then we want to keep the player alive until the flush happens
            // (which is where the previousPlayers are passed into the new player)
            if (player.namespaceId == this.id && player.triggerName == triggerName && player.queued) {
                player.destroy();
            }
        });
        let transition = trigger.matchTransition(fromState.value, toState.value, element, toState.params);
        let isFallbackTransition = false;
        if (!transition) {
            if (!defaultToFallback)
                return;
            transition = trigger.fallbackTransition;
            isFallbackTransition = true;
        }
        this._engine.totalQueuedPlayers++;
        this._queue.push({
            element,
            triggerName,
            transition,
            fromState,
            toState,
            player,
            isFallbackTransition,
        });
        if (!isFallbackTransition) {
            addClass(element, QUEUED_CLASSNAME);
            player.onStart(() => {
                removeClass(element, QUEUED_CLASSNAME);
            });
        }
        player.onDone(() => {
            let index = this.players.indexOf(player);
            if (index >= 0) {
                this.players.splice(index, 1);
            }
            const players = this._engine.playersByElement.get(element);
            if (players) {
                let index = players.indexOf(player);
                if (index >= 0) {
                    players.splice(index, 1);
                }
            }
        });
        this.players.push(player);
        playersOnElement.push(player);
        return player;
    }
    deregister(name) {
        this._triggers.delete(name);
        this._engine.statesByElement.forEach((stateMap) => stateMap.delete(name));
        this._elementListeners.forEach((listeners, element) => {
            this._elementListeners.set(element, listeners.filter((entry) => {
                return entry.name != name;
            }));
        });
    }
    clearElementCache(element) {
        this._engine.statesByElement.delete(element);
        this._elementListeners.delete(element);
        const elementPlayers = this._engine.playersByElement.get(element);
        if (elementPlayers) {
            elementPlayers.forEach((player) => player.destroy());
            this._engine.playersByElement.delete(element);
        }
    }
    _signalRemovalForInnerTriggers(rootElement, context) {
        const elements = this._engine.driver.query(rootElement, NG_TRIGGER_SELECTOR, true);
        // emulate a leave animation for all inner nodes within this node.
        // If there are no animations found for any of the nodes then clear the cache
        // for the element.
        elements.forEach((elm) => {
            // this means that an inner remove() operation has already kicked off
            // the animation on this element...
            if (elm[REMOVAL_FLAG])
                return;
            const namespaces = this._engine.fetchNamespacesByElement(elm);
            if (namespaces.size) {
                namespaces.forEach((ns) => ns.triggerLeaveAnimation(elm, context, false, true));
            }
            else {
                this.clearElementCache(elm);
            }
        });
        // If the child elements were removed along with the parent, their animations might not
        // have completed. Clear all the elements from the cache so we don't end up with a memory leak.
        this._engine.afterFlushAnimationsDone(() => elements.forEach((elm) => this.clearElementCache(elm)));
    }
    triggerLeaveAnimation(element, context, destroyAfterComplete, defaultToFallback) {
        const triggerStates = this._engine.statesByElement.get(element);
        const previousTriggersValues = new Map();
        if (triggerStates) {
            const players = [];
            triggerStates.forEach((state, triggerName) => {
                previousTriggersValues.set(triggerName, state.value);
                // this check is here in the event that an element is removed
                // twice (both on the host level and the component level)
                if (this._triggers.has(triggerName)) {
                    const player = this.trigger(element, triggerName, VOID_VALUE, defaultToFallback);
                    if (player) {
                        players.push(player);
                    }
                }
            });
            if (players.length) {
                this._engine.markElementAsRemoved(this.id, element, true, context, previousTriggersValues);
                if (destroyAfterComplete) {
                    optimizeGroupPlayer(players).onDone(() => this._engine.processLeaveNode(element));
                }
                return true;
            }
        }
        return false;
    }
    prepareLeaveAnimationListeners(element) {
        const listeners = this._elementListeners.get(element);
        const elementStates = this._engine.statesByElement.get(element);
        // if this statement fails then it means that the element was picked up
        // by an earlier flush (or there are no listeners at all to track the leave).
        if (listeners && elementStates) {
            const visitedTriggers = new Set();
            listeners.forEach((listener) => {
                const triggerName = listener.name;
                if (visitedTriggers.has(triggerName))
                    return;
                visitedTriggers.add(triggerName);
                const trigger = this._triggers.get(triggerName);
                const transition = trigger.fallbackTransition;
                const fromState = elementStates.get(triggerName) || DEFAULT_STATE_VALUE;
                const toState = new StateValue(VOID_VALUE);
                const player = new TransitionAnimationPlayer(this.id, triggerName, element);
                this._engine.totalQueuedPlayers++;
                this._queue.push({
                    element,
                    triggerName,
                    transition,
                    fromState,
                    toState,
                    player,
                    isFallbackTransition: true,
                });
            });
        }
    }
    removeNode(element, context) {
        const engine = this._engine;
        if (element.childElementCount) {
            this._signalRemovalForInnerTriggers(element, context);
        }
        // this means that a * => VOID animation was detected and kicked off
        if (this.triggerLeaveAnimation(element, context, true))
            return;
        // find the player that is animating and make sure that the
        // removal is delayed until that player has completed
        let containsPotentialParentTransition = false;
        if (engine.totalAnimations) {
            const currentPlayers = engine.players.length
                ? engine.playersByQueriedElement.get(element)
                : [];
            // when this `if statement` does not continue forward it means that
            // a previous animation query has selected the current element and
            // is animating it. In this situation want to continue forwards and
            // allow the element to be queued up for animation later.
            if (currentPlayers && currentPlayers.length) {
                containsPotentialParentTransition = true;
            }
            else {
                let parent = element;
                while ((parent = parent.parentNode)) {
                    const triggers = engine.statesByElement.get(parent);
                    if (triggers) {
                        containsPotentialParentTransition = true;
                        break;
                    }
                }
            }
        }
        // at this stage we know that the element will either get removed
        // during flush or will be picked up by a parent query. Either way
        // we need to fire the listeners for this element when it DOES get
        // removed (once the query parent animation is done or after flush)
        this.prepareLeaveAnimationListeners(element);
        // whether or not a parent has an animation we need to delay the deferral of the leave
        // operation until we have more information (which we do after flush() has been called)
        if (containsPotentialParentTransition) {
            engine.markElementAsRemoved(this.id, element, false, context);
        }
        else {
            const removalFlag = element[REMOVAL_FLAG];
            if (!removalFlag || removalFlag === NULL_REMOVAL_STATE) {
                // we do this after the flush has occurred such
                // that the callbacks can be fired
                engine.afterFlush(() => this.clearElementCache(element));
                engine.destroyInnerAnimations(element);
                engine._onRemovalComplete(element, context);
            }
        }
    }
    insertNode(element, parent) {
        addClass(element, this._hostClassName);
    }
    drainQueuedTransitions(microtaskId) {
        const instructions = [];
        this._queue.forEach((entry) => {
            const player = entry.player;
            if (player.destroyed)
                return;
            const element = entry.element;
            const listeners = this._elementListeners.get(element);
            if (listeners) {
                listeners.forEach((listener) => {
                    if (listener.name == entry.triggerName) {
                        const baseEvent = makeAnimationEvent(element, entry.triggerName, entry.fromState.value, entry.toState.value);
                        baseEvent['_data'] = microtaskId;
                        listenOnPlayer(entry.player, listener.phase, baseEvent, listener.callback);
                    }
                });
            }
            if (player.markedForDestroy) {
                this._engine.afterFlush(() => {
                    // now we can destroy the element properly since the event listeners have
                    // been bound to the player
                    player.destroy();
                });
            }
            else {
                instructions.push(entry);
            }
        });
        this._queue = [];
        return instructions.sort((a, b) => {
            // if depCount == 0 them move to front
            // otherwise if a contains b then move back
            const d0 = a.transition.ast.depCount;
            const d1 = b.transition.ast.depCount;
            if (d0 == 0 || d1 == 0) {
                return d0 - d1;
            }
            return this._engine.driver.containsElement(a.element, b.element) ? 1 : -1;
        });
    }
    destroy(context) {
        this.players.forEach((p) => p.destroy());
        this._signalRemovalForInnerTriggers(this.hostElement, context);
    }
}
class TransitionAnimationEngine {
    bodyNode;
    driver;
    _normalizer;
    players = [];
    newHostElements = new Map();
    playersByElement = new Map();
    playersByQueriedElement = new Map();
    statesByElement = new Map();
    disabledNodes = new Set();
    totalAnimations = 0;
    totalQueuedPlayers = 0;
    _namespaceLookup = {};
    _namespaceList = [];
    _flushFns = [];
    _whenQuietFns = [];
    namespacesByHostElement = new Map();
    collectedEnterElements = [];
    collectedLeaveElements = [];
    // this method is designed to be overridden by the code that uses this engine
    onRemovalComplete = (element, context) => { };
    /** @internal */
    _onRemovalComplete(element, context) {
        this.onRemovalComplete(element, context);
    }
    constructor(bodyNode, driver, _normalizer) {
        this.bodyNode = bodyNode;
        this.driver = driver;
        this._normalizer = _normalizer;
    }
    get queuedPlayers() {
        const players = [];
        this._namespaceList.forEach((ns) => {
            ns.players.forEach((player) => {
                if (player.queued) {
                    players.push(player);
                }
            });
        });
        return players;
    }
    createNamespace(namespaceId, hostElement) {
        const ns = new AnimationTransitionNamespace(namespaceId, hostElement, this);
        if (this.bodyNode && this.driver.containsElement(this.bodyNode, hostElement)) {
            this._balanceNamespaceList(ns, hostElement);
        }
        else {
            // defer this later until flush during when the host element has
            // been inserted so that we know exactly where to place it in
            // the namespace list
            this.newHostElements.set(hostElement, ns);
            // given that this host element is a part of the animation code, it
            // may or may not be inserted by a parent node that is of an
            // animation renderer type. If this happens then we can still have
            // access to this item when we query for :enter nodes. If the parent
            // is a renderer then the set data-structure will normalize the entry
            this.collectEnterElement(hostElement);
        }
        return (this._namespaceLookup[namespaceId] = ns);
    }
    _balanceNamespaceList(ns, hostElement) {
        const namespaceList = this._namespaceList;
        const namespacesByHostElement = this.namespacesByHostElement;
        const limit = namespaceList.length - 1;
        if (limit >= 0) {
            let found = false;
            // Find the closest ancestor with an existing namespace so we can then insert `ns` after it,
            // establishing a top-down ordering of namespaces in `this._namespaceList`.
            let ancestor = this.driver.getParentElement(hostElement);
            while (ancestor) {
                const ancestorNs = namespacesByHostElement.get(ancestor);
                if (ancestorNs) {
                    // An animation namespace has been registered for this ancestor, so we insert `ns`
                    // right after it to establish top-down ordering of animation namespaces.
                    const index = namespaceList.indexOf(ancestorNs);
                    namespaceList.splice(index + 1, 0, ns);
                    found = true;
                    break;
                }
                ancestor = this.driver.getParentElement(ancestor);
            }
            if (!found) {
                // No namespace exists that is an ancestor of `ns`, so `ns` is inserted at the front to
                // ensure that any existing descendants are ordered after `ns`, retaining the desired
                // top-down ordering.
                namespaceList.unshift(ns);
            }
        }
        else {
            namespaceList.push(ns);
        }
        namespacesByHostElement.set(hostElement, ns);
        return ns;
    }
    register(namespaceId, hostElement) {
        let ns = this._namespaceLookup[namespaceId];
        if (!ns) {
            ns = this.createNamespace(namespaceId, hostElement);
        }
        return ns;
    }
    registerTrigger(namespaceId, name, trigger) {
        let ns = this._namespaceLookup[namespaceId];
        if (ns && ns.register(name, trigger)) {
            this.totalAnimations++;
        }
    }
    destroy(namespaceId, context) {
        if (!namespaceId)
            return;
        this.afterFlush(() => { });
        this.afterFlushAnimationsDone(() => {
            const ns = this._fetchNamespace(namespaceId);
            this.namespacesByHostElement.delete(ns.hostElement);
            const index = this._namespaceList.indexOf(ns);
            if (index >= 0) {
                this._namespaceList.splice(index, 1);
            }
            ns.destroy(context);
            delete this._namespaceLookup[namespaceId];
        });
    }
    _fetchNamespace(id) {
        return this._namespaceLookup[id];
    }
    fetchNamespacesByElement(element) {
        // normally there should only be one namespace per element, however
        // if @triggers are placed on both the component element and then
        // its host element (within the component code) then there will be
        // two namespaces returned. We use a set here to simply deduplicate
        // the namespaces in case (for the reason described above) there are multiple triggers
        const namespaces = new Set();
        const elementStates = this.statesByElement.get(element);
        if (elementStates) {
            for (let stateValue of elementStates.values()) {
                if (stateValue.namespaceId) {
                    const ns = this._fetchNamespace(stateValue.namespaceId);
                    if (ns) {
                        namespaces.add(ns);
                    }
                }
            }
        }
        return namespaces;
    }
    trigger(namespaceId, element, name, value) {
        if (isElementNode(element)) {
            const ns = this._fetchNamespace(namespaceId);
            if (ns) {
                ns.trigger(element, name, value);
                return true;
            }
        }
        return false;
    }
    insertNode(namespaceId, element, parent, insertBefore) {
        if (!isElementNode(element))
            return;
        // special case for when an element is removed and reinserted (move operation)
        // when this occurs we do not want to use the element for deletion later
        const details = element[REMOVAL_FLAG];
        if (details && details.setForRemoval) {
            details.setForRemoval = false;
            details.setForMove = true;
            const index = this.collectedLeaveElements.indexOf(element);
            if (index >= 0) {
                this.collectedLeaveElements.splice(index, 1);
            }
        }
        // in the event that the namespaceId is blank then the caller
        // code does not contain any animation code in it, but it is
        // just being called so that the node is marked as being inserted
        if (namespaceId) {
            const ns = this._fetchNamespace(namespaceId);
            // This if-statement is a workaround for router issue #21947.
            // The router sometimes hits a race condition where while a route
            // is being instantiated a new navigation arrives, triggering leave
            // animation of DOM that has not been fully initialized, until this
            // is resolved, we need to handle the scenario when DOM is not in a
            // consistent state during the animation.
            if (ns) {
                ns.insertNode(element, parent);
            }
        }
        // only *directives and host elements are inserted before
        if (insertBefore) {
            this.collectEnterElement(element);
        }
    }
    collectEnterElement(element) {
        this.collectedEnterElements.push(element);
    }
    markElementAsDisabled(element, value) {
        if (value) {
            if (!this.disabledNodes.has(element)) {
                this.disabledNodes.add(element);
                addClass(element, DISABLED_CLASSNAME);
            }
        }
        else if (this.disabledNodes.has(element)) {
            this.disabledNodes.delete(element);
            removeClass(element, DISABLED_CLASSNAME);
        }
    }
    removeNode(namespaceId, element, context) {
        if (isElementNode(element)) {
            const ns = namespaceId ? this._fetchNamespace(namespaceId) : null;
            if (ns) {
                ns.removeNode(element, context);
            }
            else {
                this.markElementAsRemoved(namespaceId, element, false, context);
            }
            const hostNS = this.namespacesByHostElement.get(element);
            if (hostNS && hostNS.id !== namespaceId) {
                hostNS.removeNode(element, context);
            }
        }
        else {
            this._onRemovalComplete(element, context);
        }
    }
    markElementAsRemoved(namespaceId, element, hasAnimation, context, previousTriggersValues) {
        this.collectedLeaveElements.push(element);
        element[REMOVAL_FLAG] = {
            namespaceId,
            setForRemoval: context,
            hasAnimation,
            removedBeforeQueried: false,
            previousTriggersValues,
        };
    }
    listen(namespaceId, element, name, phase, callback) {
        if (isElementNode(element)) {
            return this._fetchNamespace(namespaceId).listen(element, name, phase, callback);
        }
        return () => { };
    }
    _buildInstruction(entry, subTimelines, enterClassName, leaveClassName, skipBuildAst) {
        return entry.transition.build(this.driver, entry.element, entry.fromState.value, entry.toState.value, enterClassName, leaveClassName, entry.fromState.options, entry.toState.options, subTimelines, skipBuildAst);
    }
    destroyInnerAnimations(containerElement) {
        let elements = this.driver.query(containerElement, NG_TRIGGER_SELECTOR, true);
        elements.forEach((element) => this.destroyActiveAnimationsForElement(element));
        if (this.playersByQueriedElement.size == 0)
            return;
        elements = this.driver.query(containerElement, NG_ANIMATING_SELECTOR, true);
        elements.forEach((element) => this.finishActiveQueriedAnimationOnElement(element));
    }
    destroyActiveAnimationsForElement(element) {
        const players = this.playersByElement.get(element);
        if (players) {
            players.forEach((player) => {
                // special case for when an element is set for destruction, but hasn't started.
                // in this situation we want to delay the destruction until the flush occurs
                // so that any event listeners attached to the player are triggered.
                if (player.queued) {
                    player.markedForDestroy = true;
                }
                else {
                    player.destroy();
                }
            });
        }
    }
    finishActiveQueriedAnimationOnElement(element) {
        const players = this.playersByQueriedElement.get(element);
        if (players) {
            players.forEach((player) => player.finish());
        }
    }
    whenRenderingDone() {
        return new Promise((resolve) => {
            if (this.players.length) {
                return optimizeGroupPlayer(this.players).onDone(() => resolve());
            }
            else {
                resolve();
            }
        });
    }
    processLeaveNode(element) {
        const details = element[REMOVAL_FLAG];
        if (details && details.setForRemoval) {
            // this will prevent it from removing it twice
            element[REMOVAL_FLAG] = NULL_REMOVAL_STATE;
            if (details.namespaceId) {
                this.destroyInnerAnimations(element);
                const ns = this._fetchNamespace(details.namespaceId);
                if (ns) {
                    ns.clearElementCache(element);
                }
            }
            this._onRemovalComplete(element, details.setForRemoval);
        }
        if (element.classList?.contains(DISABLED_CLASSNAME)) {
            this.markElementAsDisabled(element, false);
        }
        this.driver.query(element, DISABLED_SELECTOR, true).forEach((node) => {
            this.markElementAsDisabled(node, false);
        });
    }
    flush(microtaskId = -1) {
        let players = [];
        if (this.newHostElements.size) {
            this.newHostElements.forEach((ns, element) => this._balanceNamespaceList(ns, element));
            this.newHostElements.clear();
        }
        if (this.totalAnimations && this.collectedEnterElements.length) {
            for (let i = 0; i < this.collectedEnterElements.length; i++) {
                const elm = this.collectedEnterElements[i];
                addClass(elm, STAR_CLASSNAME);
            }
        }
        if (this._namespaceList.length &&
            (this.totalQueuedPlayers || this.collectedLeaveElements.length)) {
            const cleanupFns = [];
            try {
                players = this._flushAnimations(cleanupFns, microtaskId);
            }
            finally {
                for (let i = 0; i < cleanupFns.length; i++) {
                    cleanupFns[i]();
                }
            }
        }
        else {
            for (let i = 0; i < this.collectedLeaveElements.length; i++) {
                const element = this.collectedLeaveElements[i];
                this.processLeaveNode(element);
            }
        }
        this.totalQueuedPlayers = 0;
        this.collectedEnterElements.length = 0;
        this.collectedLeaveElements.length = 0;
        this._flushFns.forEach((fn) => fn());
        this._flushFns = [];
        if (this._whenQuietFns.length) {
            // we move these over to a variable so that
            // if any new callbacks are registered in another
            // flush they do not populate the existing set
            const quietFns = this._whenQuietFns;
            this._whenQuietFns = [];
            if (players.length) {
                optimizeGroupPlayer(players).onDone(() => {
                    quietFns.forEach((fn) => fn());
                });
            }
            else {
                quietFns.forEach((fn) => fn());
            }
        }
    }
    reportError(errors) {
        throw triggerTransitionsFailed(errors);
    }
    _flushAnimations(cleanupFns, microtaskId) {
        const subTimelines = new ElementInstructionMap();
        const skippedPlayers = [];
        const skippedPlayersMap = new Map();
        const queuedInstructions = [];
        const queriedElements = new Map();
        const allPreStyleElements = new Map();
        const allPostStyleElements = new Map();
        const disabledElementsSet = new Set();
        this.disabledNodes.forEach((node) => {
            disabledElementsSet.add(node);
            const nodesThatAreDisabled = this.driver.query(node, QUEUED_SELECTOR, true);
            for (let i = 0; i < nodesThatAreDisabled.length; i++) {
                disabledElementsSet.add(nodesThatAreDisabled[i]);
            }
        });
        const bodyNode = this.bodyNode;
        const allTriggerElements = Array.from(this.statesByElement.keys());
        const enterNodeMap = buildRootMap(allTriggerElements, this.collectedEnterElements);
        // this must occur before the instructions are built below such that
        // the :enter queries match the elements (since the timeline queries
        // are fired during instruction building).
        const enterNodeMapIds = new Map();
        let i = 0;
        enterNodeMap.forEach((nodes, root) => {
            const className = ENTER_CLASSNAME + i++;
            enterNodeMapIds.set(root, className);
            nodes.forEach((node) => addClass(node, className));
        });
        const allLeaveNodes = [];
        const mergedLeaveNodes = new Set();
        const leaveNodesWithoutAnimations = new Set();
        for (let i = 0; i < this.collectedLeaveElements.length; i++) {
            const element = this.collectedLeaveElements[i];
            const details = element[REMOVAL_FLAG];
            if (details && details.setForRemoval) {
                allLeaveNodes.push(element);
                mergedLeaveNodes.add(element);
                if (details.hasAnimation) {
                    this.driver
                        .query(element, STAR_SELECTOR, true)
                        .forEach((elm) => mergedLeaveNodes.add(elm));
                }
                else {
                    leaveNodesWithoutAnimations.add(element);
                }
            }
        }
        const leaveNodeMapIds = new Map();
        const leaveNodeMap = buildRootMap(allTriggerElements, Array.from(mergedLeaveNodes));
        leaveNodeMap.forEach((nodes, root) => {
            const className = LEAVE_CLASSNAME + i++;
            leaveNodeMapIds.set(root, className);
            nodes.forEach((node) => addClass(node, className));
        });
        cleanupFns.push(() => {
            enterNodeMap.forEach((nodes, root) => {
                const className = enterNodeMapIds.get(root);
                nodes.forEach((node) => removeClass(node, className));
            });
            leaveNodeMap.forEach((nodes, root) => {
                const className = leaveNodeMapIds.get(root);
                nodes.forEach((node) => removeClass(node, className));
            });
            allLeaveNodes.forEach((element) => {
                this.processLeaveNode(element);
            });
        });
        const allPlayers = [];
        const erroneousTransitions = [];
        for (let i = this._namespaceList.length - 1; i >= 0; i--) {
            const ns = this._namespaceList[i];
            ns.drainQueuedTransitions(microtaskId).forEach((entry) => {
                const player = entry.player;
                const element = entry.element;
                allPlayers.push(player);
                if (this.collectedEnterElements.length) {
                    const details = element[REMOVAL_FLAG];
                    // animations for move operations (elements being removed and reinserted,
                    // e.g. when the order of an *ngFor list changes) are currently not supported
                    if (details && details.setForMove) {
                        if (details.previousTriggersValues &&
                            details.previousTriggersValues.has(entry.triggerName)) {
                            const previousValue = details.previousTriggersValues.get(entry.triggerName);
                            // we need to restore the previous trigger value since the element has
                            // only been moved and hasn't actually left the DOM
                            const triggersWithStates = this.statesByElement.get(entry.element);
                            if (triggersWithStates && triggersWithStates.has(entry.triggerName)) {
                                const state = triggersWithStates.get(entry.triggerName);
                                state.value = previousValue;
                                triggersWithStates.set(entry.triggerName, state);
                            }
                        }
                        player.destroy();
                        return;
                    }
                }
                const nodeIsOrphaned = !bodyNode || !this.driver.containsElement(bodyNode, element);
                const leaveClassName = leaveNodeMapIds.get(element);
                const enterClassName = enterNodeMapIds.get(element);
                const instruction = this._buildInstruction(entry, subTimelines, enterClassName, leaveClassName, nodeIsOrphaned);
                if (instruction.errors && instruction.errors.length) {
                    erroneousTransitions.push(instruction);
                    return;
                }
                // even though the element may not be in the DOM, it may still
                // be added at a later point (due to the mechanics of content
                // projection and/or dynamic component insertion) therefore it's
                // important to still style the element.
                if (nodeIsOrphaned) {
                    player.onStart(() => eraseStyles(element, instruction.fromStyles));
                    player.onDestroy(() => setStyles(element, instruction.toStyles));
                    skippedPlayers.push(player);
                    return;
                }
                // if an unmatched transition is queued and ready to go
                // then it SHOULD NOT render an animation and cancel the
                // previously running animations.
                if (entry.isFallbackTransition) {
                    player.onStart(() => eraseStyles(element, instruction.fromStyles));
                    player.onDestroy(() => setStyles(element, instruction.toStyles));
                    skippedPlayers.push(player);
                    return;
                }
                // this means that if a parent animation uses this animation as a sub-trigger
                // then it will instruct the timeline builder not to add a player delay, but
                // instead stretch the first keyframe gap until the animation starts. This is
                // important in order to prevent extra initialization styles from being
                // required by the user for the animation.
                const timelines = [];
                instruction.timelines.forEach((tl) => {
                    tl.stretchStartingKeyframe = true;
                    if (!this.disabledNodes.has(tl.element)) {
                        timelines.push(tl);
                    }
                });
                instruction.timelines = timelines;
                subTimelines.append(element, instruction.timelines);
                const tuple = { instruction, player, element };
                queuedInstructions.push(tuple);
                instruction.queriedElements.forEach((element) => getOrSetDefaultValue(queriedElements, element, []).push(player));
                instruction.preStyleProps.forEach((stringMap, element) => {
                    if (stringMap.size) {
                        let setVal = allPreStyleElements.get(element);
                        if (!setVal) {
                            allPreStyleElements.set(element, (setVal = new Set()));
                        }
                        stringMap.forEach((_, prop) => setVal.add(prop));
                    }
                });
                instruction.postStyleProps.forEach((stringMap, element) => {
                    let setVal = allPostStyleElements.get(element);
                    if (!setVal) {
                        allPostStyleElements.set(element, (setVal = new Set()));
                    }
                    stringMap.forEach((_, prop) => setVal.add(prop));
                });
            });
        }
        if (erroneousTransitions.length) {
            const errors = [];
            erroneousTransitions.forEach((instruction) => {
                errors.push(transitionFailed(instruction.triggerName, instruction.errors));
            });
            allPlayers.forEach((player) => player.destroy());
            this.reportError(errors);
        }
        const allPreviousPlayersMap = new Map();
        // this map tells us which element in the DOM tree is contained by
        // which animation. Further down this map will get populated once
        // the players are built and in doing so we can use it to efficiently
        // figure out if a sub player is skipped due to a parent player having priority.
        const animationElementMap = new Map();
        queuedInstructions.forEach((entry) => {
            const element = entry.element;
            if (subTimelines.has(element)) {
                animationElementMap.set(element, element);
                this._beforeAnimationBuild(entry.player.namespaceId, entry.instruction, allPreviousPlayersMap);
            }
        });
        skippedPlayers.forEach((player) => {
            const element = player.element;
            const previousPlayers = this._getPreviousPlayers(element, false, player.namespaceId, player.triggerName, null);
            previousPlayers.forEach((prevPlayer) => {
                getOrSetDefaultValue(allPreviousPlayersMap, element, []).push(prevPlayer);
                prevPlayer.destroy();
            });
        });
        // this is a special case for nodes that will be removed either by
        // having their own leave animations or by being queried in a container
        // that will be removed once a parent animation is complete. The idea
        // here is that * styles must be identical to ! styles because of
        // backwards compatibility (* is also filled in by default in many places).
        // Otherwise * styles will return an empty value or "auto" since the element
        // passed to getComputedStyle will not be visible (since * === destination)
        const replaceNodes = allLeaveNodes.filter((node) => {
            return replacePostStylesAsPre(node, allPreStyleElements, allPostStyleElements);
        });
        // POST STAGE: fill the * styles
        const postStylesMap = new Map();
        const allLeaveQueriedNodes = cloakAndComputeStyles(postStylesMap, this.driver, leaveNodesWithoutAnimations, allPostStyleElements, AUTO_STYLE);
        allLeaveQueriedNodes.forEach((node) => {
            if (replacePostStylesAsPre(node, allPreStyleElements, allPostStyleElements)) {
                replaceNodes.push(node);
            }
        });
        // PRE STAGE: fill the ! styles
        const preStylesMap = new Map();
        enterNodeMap.forEach((nodes, root) => {
            cloakAndComputeStyles(preStylesMap, this.driver, new Set(nodes), allPreStyleElements, _PRE_STYLE);
        });
        replaceNodes.forEach((node) => {
            const post = postStylesMap.get(node);
            const pre = preStylesMap.get(node);
            postStylesMap.set(node, new Map([...(post?.entries() ?? []), ...(pre?.entries() ?? [])]));
        });
        const rootPlayers = [];
        const subPlayers = [];
        const NO_PARENT_ANIMATION_ELEMENT_DETECTED = {};
        queuedInstructions.forEach((entry) => {
            const { element, player, instruction } = entry;
            // this means that it was never consumed by a parent animation which
            // means that it is independent and therefore should be set for animation
            if (subTimelines.has(element)) {
                if (disabledElementsSet.has(element)) {
                    player.onDestroy(() => setStyles(element, instruction.toStyles));
                    player.disabled = true;
                    player.overrideTotalTime(instruction.totalTime);
                    skippedPlayers.push(player);
                    return;
                }
                // this will flow up the DOM and query the map to figure out
                // if a parent animation has priority over it. In the situation
                // that a parent is detected then it will cancel the loop. If
                // nothing is detected, or it takes a few hops to find a parent,
                // then it will fill in the missing nodes and signal them as having
                // a detected parent (or a NO_PARENT value via a special constant).
                let parentWithAnimation = NO_PARENT_ANIMATION_ELEMENT_DETECTED;
                if (animationElementMap.size > 1) {
                    let elm = element;
                    const parentsToAdd = [];
                    while ((elm = elm.parentNode)) {
                        const detectedParent = animationElementMap.get(elm);
                        if (detectedParent) {
                            parentWithAnimation = detectedParent;
                            break;
                        }
                        parentsToAdd.push(elm);
                    }
                    parentsToAdd.forEach((parent) => animationElementMap.set(parent, parentWithAnimation));
                }
                const innerPlayer = this._buildAnimation(player.namespaceId, instruction, allPreviousPlayersMap, skippedPlayersMap, preStylesMap, postStylesMap);
                player.setRealPlayer(innerPlayer);
                if (parentWithAnimation === NO_PARENT_ANIMATION_ELEMENT_DETECTED) {
                    rootPlayers.push(player);
                }
                else {
                    const parentPlayers = this.playersByElement.get(parentWithAnimation);
                    if (parentPlayers && parentPlayers.length) {
                        player.parentPlayer = optimizeGroupPlayer(parentPlayers);
                    }
                    skippedPlayers.push(player);
                }
            }
            else {
                eraseStyles(element, instruction.fromStyles);
                player.onDestroy(() => setStyles(element, instruction.toStyles));
                // there still might be a ancestor player animating this
                // element therefore we will still add it as a sub player
                // even if its animation may be disabled
                subPlayers.push(player);
                if (disabledElementsSet.has(element)) {
                    skippedPlayers.push(player);
                }
            }
        });
        // find all of the sub players' corresponding inner animation players
        subPlayers.forEach((player) => {
            // even if no players are found for a sub animation it
            // will still complete itself after the next tick since it's Noop
            const playersForElement = skippedPlayersMap.get(player.element);
            if (playersForElement && playersForElement.length) {
                const innerPlayer = optimizeGroupPlayer(playersForElement);
                player.setRealPlayer(innerPlayer);
            }
        });
        // the reason why we don't actually play the animation is
        // because all that a skipped player is designed to do is to
        // fire the start/done transition callback events
        skippedPlayers.forEach((player) => {
            if (player.parentPlayer) {
                player.syncPlayerEvents(player.parentPlayer);
            }
            else {
                player.destroy();
            }
        });
        // run through all of the queued removals and see if they
        // were picked up by a query. If not then perform the removal
        // operation right away unless a parent animation is ongoing.
        for (let i = 0; i < allLeaveNodes.length; i++) {
            const element = allLeaveNodes[i];
            const details = element[REMOVAL_FLAG];
            removeClass(element, LEAVE_CLASSNAME);
            // this means the element has a removal animation that is being
            // taken care of and therefore the inner elements will hang around
            // until that animation is over (or the parent queried animation)
            if (details && details.hasAnimation)
                continue;
            let players = [];
            // if this element is queried or if it contains queried children
            // then we want for the element not to be removed from the page
            // until the queried animations have finished
            if (queriedElements.size) {
                let queriedPlayerResults = queriedElements.get(element);
                if (queriedPlayerResults && queriedPlayerResults.length) {
                    players.push(...queriedPlayerResults);
                }
                let queriedInnerElements = this.driver.query(element, NG_ANIMATING_SELECTOR, true);
                for (let j = 0; j < queriedInnerElements.length; j++) {
                    let queriedPlayers = queriedElements.get(queriedInnerElements[j]);
                    if (queriedPlayers && queriedPlayers.length) {
                        players.push(...queriedPlayers);
                    }
                }
            }
            const activePlayers = players.filter((p) => !p.destroyed);
            if (activePlayers.length) {
                removeNodesAfterAnimationDone(this, element, activePlayers);
            }
            else {
                this.processLeaveNode(element);
            }
        }
        // this is required so the cleanup method doesn't remove them
        allLeaveNodes.length = 0;
        rootPlayers.forEach((player) => {
            this.players.push(player);
            player.onDone(() => {
                player.destroy();
                const index = this.players.indexOf(player);
                this.players.splice(index, 1);
            });
            player.play();
        });
        return rootPlayers;
    }
    afterFlush(callback) {
        this._flushFns.push(callback);
    }
    afterFlushAnimationsDone(callback) {
        this._whenQuietFns.push(callback);
    }
    _getPreviousPlayers(element, isQueriedElement, namespaceId, triggerName, toStateValue) {
        let players = [];
        if (isQueriedElement) {
            const queriedElementPlayers = this.playersByQueriedElement.get(element);
            if (queriedElementPlayers) {
                players = queriedElementPlayers;
            }
        }
        else {
            const elementPlayers = this.playersByElement.get(element);
            if (elementPlayers) {
                const isRemovalAnimation = !toStateValue || toStateValue == VOID_VALUE;
                elementPlayers.forEach((player) => {
                    if (player.queued)
                        return;
                    if (!isRemovalAnimation && player.triggerName != triggerName)
                        return;
                    players.push(player);
                });
            }
        }
        if (namespaceId || triggerName) {
            players = players.filter((player) => {
                if (namespaceId && namespaceId != player.namespaceId)
                    return false;
                if (triggerName && triggerName != player.triggerName)
                    return false;
                return true;
            });
        }
        return players;
    }
    _beforeAnimationBuild(namespaceId, instruction, allPreviousPlayersMap) {
        const triggerName = instruction.triggerName;
        const rootElement = instruction.element;
        // when a removal animation occurs, ALL previous players are collected
        // and destroyed (even if they are outside of the current namespace)
        const targetNameSpaceId = instruction.isRemovalTransition
            ? undefined
            : namespaceId;
        const targetTriggerName = instruction.isRemovalTransition
            ? undefined
            : triggerName;
        for (const timelineInstruction of instruction.timelines) {
            const element = timelineInstruction.element;
            const isQueriedElement = element !== rootElement;
            const players = getOrSetDefaultValue(allPreviousPlayersMap, element, []);
            const previousPlayers = this._getPreviousPlayers(element, isQueriedElement, targetNameSpaceId, targetTriggerName, instruction.toState);
            previousPlayers.forEach((player) => {
                const realPlayer = player.getRealPlayer();
                if (realPlayer.beforeDestroy) {
                    realPlayer.beforeDestroy();
                }
                player.destroy();
                players.push(player);
            });
        }
        // this needs to be done so that the PRE/POST styles can be
        // computed properly without interfering with the previous animation
        eraseStyles(rootElement, instruction.fromStyles);
    }
    _buildAnimation(namespaceId, instruction, allPreviousPlayersMap, skippedPlayersMap, preStylesMap, postStylesMap) {
        const triggerName = instruction.triggerName;
        const rootElement = instruction.element;
        // we first run this so that the previous animation player
        // data can be passed into the successive animation players
        const allQueriedPlayers = [];
        const allConsumedElements = new Set();
        const allSubElements = new Set();
        const allNewPlayers = instruction.timelines.map((timelineInstruction) => {
            const element = timelineInstruction.element;
            allConsumedElements.add(element);
            // FIXME (matsko): make sure to-be-removed animations are removed properly
            const details = element[REMOVAL_FLAG];
            if (details && details.removedBeforeQueried)
                return new NoopAnimationPlayer(timelineInstruction.duration, timelineInstruction.delay);
            const isQueriedElement = element !== rootElement;
            const previousPlayers = flattenGroupPlayers((allPreviousPlayersMap.get(element) || EMPTY_PLAYER_ARRAY).map((p) => p.getRealPlayer())).filter((p) => {
                // the `element` is not apart of the AnimationPlayer definition, but
                // Mock/WebAnimations
                // use the element within their implementation. This will be added in Angular5 to
                // AnimationPlayer
                const pp = p;
                return pp.element ? pp.element === element : false;
            });
            const preStyles = preStylesMap.get(element);
            const postStyles = postStylesMap.get(element);
            const keyframes = normalizeKeyframes(this._normalizer, timelineInstruction.keyframes, preStyles, postStyles);
            const player = this._buildPlayer(timelineInstruction, keyframes, previousPlayers);
            // this means that this particular player belongs to a sub trigger. It is
            // important that we match this player up with the corresponding (@trigger.listener)
            if (timelineInstruction.subTimeline && skippedPlayersMap) {
                allSubElements.add(element);
            }
            if (isQueriedElement) {
                const wrappedPlayer = new TransitionAnimationPlayer(namespaceId, triggerName, element);
                wrappedPlayer.setRealPlayer(player);
                allQueriedPlayers.push(wrappedPlayer);
            }
            return player;
        });
        allQueriedPlayers.forEach((player) => {
            getOrSetDefaultValue(this.playersByQueriedElement, player.element, []).push(player);
            player.onDone(() => deleteOrUnsetInMap(this.playersByQueriedElement, player.element, player));
        });
        allConsumedElements.forEach((element) => addClass(element, NG_ANIMATING_CLASSNAME));
        const player = optimizeGroupPlayer(allNewPlayers);
        player.onDestroy(() => {
            allConsumedElements.forEach((element) => removeClass(element, NG_ANIMATING_CLASSNAME));
            setStyles(rootElement, instruction.toStyles);
        });
        // this basically makes all of the callbacks for sub element animations
        // be dependent on the upper players for when they finish
        allSubElements.forEach((element) => {
            getOrSetDefaultValue(skippedPlayersMap, element, []).push(player);
        });
        return player;
    }
    _buildPlayer(instruction, keyframes, previousPlayers) {
        if (keyframes.length > 0) {
            return this.driver.animate(instruction.element, keyframes, instruction.duration, instruction.delay, instruction.easing, previousPlayers);
        }
        // special case for when an empty transition|definition is provided
        // ... there is no point in rendering an empty animation
        return new NoopAnimationPlayer(instruction.duration, instruction.delay);
    }
}
class TransitionAnimationPlayer {
    namespaceId;
    triggerName;
    element;
    _player = new NoopAnimationPlayer();
    _containsRealPlayer = false;
    _queuedCallbacks = new Map();
    destroyed = false;
    parentPlayer = null;
    markedForDestroy = false;
    disabled = false;
    queued = true;
    totalTime = 0;
    constructor(namespaceId, triggerName, element) {
        this.namespaceId = namespaceId;
        this.triggerName = triggerName;
        this.element = element;
    }
    setRealPlayer(player) {
        if (this._containsRealPlayer)
            return;
        this._player = player;
        this._queuedCallbacks.forEach((callbacks, phase) => {
            callbacks.forEach((callback) => listenOnPlayer(player, phase, undefined, callback));
        });
        this._queuedCallbacks.clear();
        this._containsRealPlayer = true;
        this.overrideTotalTime(player.totalTime);
        this.queued = false;
    }
    getRealPlayer() {
        return this._player;
    }
    overrideTotalTime(totalTime) {
        this.totalTime = totalTime;
    }
    syncPlayerEvents(player) {
        const p = this._player;
        if (p.triggerCallback) {
            player.onStart(() => p.triggerCallback('start'));
        }
        player.onDone(() => this.finish());
        player.onDestroy(() => this.destroy());
    }
    _queueEvent(name, callback) {
        getOrSetDefaultValue(this._queuedCallbacks, name, []).push(callback);
    }
    onDone(fn) {
        if (this.queued) {
            this._queueEvent('done', fn);
        }
        this._player.onDone(fn);
    }
    onStart(fn) {
        if (this.queued) {
            this._queueEvent('start', fn);
        }
        this._player.onStart(fn);
    }
    onDestroy(fn) {
        if (this.queued) {
            this._queueEvent('destroy', fn);
        }
        this._player.onDestroy(fn);
    }
    init() {
        this._player.init();
    }
    hasStarted() {
        return this.queued ? false : this._player.hasStarted();
    }
    play() {
        !this.queued && this._player.play();
    }
    pause() {
        !this.queued && this._player.pause();
    }
    restart() {
        !this.queued && this._player.restart();
    }
    finish() {
        this._player.finish();
    }
    destroy() {
        this.destroyed = true;
        this._player.destroy();
    }
    reset() {
        !this.queued && this._player.reset();
    }
    setPosition(p) {
        if (!this.queued) {
            this._player.setPosition(p);
        }
    }
    getPosition() {
        return this.queued ? 0 : this._player.getPosition();
    }
    /** @internal */
    triggerCallback(phaseName) {
        const p = this._player;
        if (p.triggerCallback) {
            p.triggerCallback(phaseName);
        }
    }
}
function deleteOrUnsetInMap(map, key, value) {
    let currentValues = map.get(key);
    if (currentValues) {
        if (currentValues.length) {
            const index = currentValues.indexOf(value);
            currentValues.splice(index, 1);
        }
        if (currentValues.length == 0) {
            map.delete(key);
        }
    }
    return currentValues;
}
function normalizeTriggerValue(value) {
    // we use `!= null` here because it's the most simple
    // way to test against a "falsy" value without mixing
    // in empty strings or a zero value. DO NOT OPTIMIZE.
    return value != null ? value : null;
}
function isElementNode(node) {
    return node && node['nodeType'] === 1;
}
function isTriggerEventValid(eventName) {
    return eventName == 'start' || eventName == 'done';
}
function cloakElement(element, value) {
    const oldValue = element.style.display;
    element.style.display = value != null ? value : 'none';
    return oldValue;
}
function cloakAndComputeStyles(valuesMap, driver, elements, elementPropsMap, defaultStyle) {
    const cloakVals = [];
    elements.forEach((element) => cloakVals.push(cloakElement(element)));
    const failedElements = [];
    elementPropsMap.forEach((props, element) => {
        const styles = new Map();
        props.forEach((prop) => {
            const value = driver.computeStyle(element, prop, defaultStyle);
            styles.set(prop, value);
            // there is no easy way to detect this because a sub element could be removed
            // by a parent animation element being detached.
            if (!value || value.length == 0) {
                element[REMOVAL_FLAG] = NULL_REMOVED_QUERIED_STATE;
                failedElements.push(element);
            }
        });
        valuesMap.set(element, styles);
    });
    // we use a index variable here since Set.forEach(a, i) does not return
    // an index value for the closure (but instead just the value)
    let i = 0;
    elements.forEach((element) => cloakElement(element, cloakVals[i++]));
    return failedElements;
}
/*
Since the Angular renderer code will return a collection of inserted
nodes in all areas of a DOM tree, it's up to this algorithm to figure
out which nodes are roots for each animation @trigger.

By placing each inserted node into a Set and traversing upwards, it
is possible to find the @trigger elements and well any direct *star
insertion nodes, if a @trigger root is found then the enter element
is placed into the Map[@trigger] spot.
 */
function buildRootMap(roots, nodes) {
    const rootMap = new Map();
    roots.forEach((root) => rootMap.set(root, []));
    if (nodes.length == 0)
        return rootMap;
    const NULL_NODE = 1;
    const nodeSet = new Set(nodes);
    const localRootMap = new Map();
    function getRoot(node) {
        if (!node)
            return NULL_NODE;
        let root = localRootMap.get(node);
        if (root)
            return root;
        const parent = node.parentNode;
        if (rootMap.has(parent)) {
            // ngIf inside @trigger
            root = parent;
        }
        else if (nodeSet.has(parent)) {
            // ngIf inside ngIf
            root = NULL_NODE;
        }
        else {
            // recurse upwards
            root = getRoot(parent);
        }
        localRootMap.set(node, root);
        return root;
    }
    nodes.forEach((node) => {
        const root = getRoot(node);
        if (root !== NULL_NODE) {
            rootMap.get(root).push(node);
        }
    });
    return rootMap;
}
function addClass(element, className) {
    element.classList?.add(className);
}
function removeClass(element, className) {
    element.classList?.remove(className);
}
function removeNodesAfterAnimationDone(engine, element, players) {
    optimizeGroupPlayer(players).onDone(() => engine.processLeaveNode(element));
}
function flattenGroupPlayers(players) {
    const finalPlayers = [];
    _flattenGroupPlayersRecur(players, finalPlayers);
    return finalPlayers;
}
function _flattenGroupPlayersRecur(players, finalPlayers) {
    for (let i = 0; i < players.length; i++) {
        const player = players[i];
        if (player instanceof AnimationGroupPlayer) {
            _flattenGroupPlayersRecur(player.players, finalPlayers);
        }
        else {
            finalPlayers.push(player);
        }
    }
}
function objEquals(a, b) {
    const k1 = Object.keys(a);
    const k2 = Object.keys(b);
    if (k1.length != k2.length)
        return false;
    for (let i = 0; i < k1.length; i++) {
        const prop = k1[i];
        if (!b.hasOwnProperty(prop) || a[prop] !== b[prop])
            return false;
    }
    return true;
}
function replacePostStylesAsPre(element, allPreStyleElements, allPostStyleElements) {
    const postEntry = allPostStyleElements.get(element);
    if (!postEntry)
        return false;
    let preEntry = allPreStyleElements.get(element);
    if (preEntry) {
        postEntry.forEach((data) => preEntry.add(data));
    }
    else {
        allPreStyleElements.set(element, postEntry);
    }
    allPostStyleElements.delete(element);
    return true;
}

class AnimationEngine {
    _driver;
    _normalizer;
    _transitionEngine;
    _timelineEngine;
    _triggerCache = {};
    // this method is designed to be overridden by the code that uses this engine
    onRemovalComplete = (element, context) => { };
    constructor(doc, _driver, _normalizer) {
        this._driver = _driver;
        this._normalizer = _normalizer;
        this._transitionEngine = new TransitionAnimationEngine(doc.body, _driver, _normalizer);
        this._timelineEngine = new TimelineAnimationEngine(doc.body, _driver, _normalizer);
        this._transitionEngine.onRemovalComplete = (element, context) => this.onRemovalComplete(element, context);
    }
    registerTrigger(componentId, namespaceId, hostElement, name, metadata) {
        const cacheKey = componentId + '-' + name;
        let trigger = this._triggerCache[cacheKey];
        if (!trigger) {
            const errors = [];
            const warnings = [];
            const ast = buildAnimationAst(this._driver, metadata, errors, warnings);
            if (errors.length) {
                throw triggerBuildFailed(name, errors);
            }
            if (typeof ngDevMode === 'undefined' || ngDevMode) {
                if (warnings.length) {
                    warnTriggerBuild(name, warnings);
                }
            }
            trigger = buildTrigger(name, ast, this._normalizer);
            this._triggerCache[cacheKey] = trigger;
        }
        this._transitionEngine.registerTrigger(namespaceId, name, trigger);
    }
    register(namespaceId, hostElement) {
        this._transitionEngine.register(namespaceId, hostElement);
    }
    destroy(namespaceId, context) {
        this._transitionEngine.destroy(namespaceId, context);
    }
    onInsert(namespaceId, element, parent, insertBefore) {
        this._transitionEngine.insertNode(namespaceId, element, parent, insertBefore);
    }
    onRemove(namespaceId, element, context) {
        this._transitionEngine.removeNode(namespaceId, element, context);
    }
    disableAnimations(element, disable) {
        this._transitionEngine.markElementAsDisabled(element, disable);
    }
    process(namespaceId, element, property, value) {
        if (property.charAt(0) == '@') {
            const [id, action] = parseTimelineCommand(property);
            const args = value;
            this._timelineEngine.command(id, element, action, args);
        }
        else {
            this._transitionEngine.trigger(namespaceId, element, property, value);
        }
    }
    listen(namespaceId, element, eventName, eventPhase, callback) {
        // @@listen
        if (eventName.charAt(0) == '@') {
            const [id, action] = parseTimelineCommand(eventName);
            return this._timelineEngine.listen(id, element, action, callback);
        }
        return this._transitionEngine.listen(namespaceId, element, eventName, eventPhase, callback);
    }
    flush(microtaskId = -1) {
        this._transitionEngine.flush(microtaskId);
    }
    get players() {
        return [...this._transitionEngine.players, ...this._timelineEngine.players];
    }
    whenRenderingDone() {
        return this._transitionEngine.whenRenderingDone();
    }
    afterFlushAnimationsDone(cb) {
        this._transitionEngine.afterFlushAnimationsDone(cb);
    }
}

/**
 * Returns an instance of `SpecialCasedStyles` if and when any special (non animateable) styles are
 * detected.
 *
 * In CSS there exist properties that cannot be animated within a keyframe animation
 * (whether it be via CSS keyframes or web-animations) and the animation implementation
 * will ignore them. This function is designed to detect those special cased styles and
 * return a container that will be executed at the start and end of the animation.
 *
 * @returns an instance of `SpecialCasedStyles` if any special styles are detected otherwise `null`
 */
function packageNonAnimatableStyles(element, styles) {
    let startStyles = null;
    let endStyles = null;
    if (Array.isArray(styles) && styles.length) {
        startStyles = filterNonAnimatableStyles(styles[0]);
        if (styles.length > 1) {
            endStyles = filterNonAnimatableStyles(styles[styles.length - 1]);
        }
    }
    else if (styles instanceof Map) {
        startStyles = filterNonAnimatableStyles(styles);
    }
    return startStyles || endStyles ? new SpecialCasedStyles(element, startStyles, endStyles) : null;
}
/**
 * Designed to be executed during a keyframe-based animation to apply any special-cased styles.
 *
 * When started (when the `start()` method is run) then the provided `startStyles`
 * will be applied. When finished (when the `finish()` method is called) the
 * `endStyles` will be applied as well any any starting styles. Finally when
 * `destroy()` is called then all styles will be removed.
 */
class SpecialCasedStyles {
    _element;
    _startStyles;
    _endStyles;
    static initialStylesByElement = /* @__PURE__ */ new WeakMap();
    _state = 0 /* SpecialCasedStylesState.Pending */;
    _initialStyles;
    constructor(_element, _startStyles, _endStyles) {
        this._element = _element;
        this._startStyles = _startStyles;
        this._endStyles = _endStyles;
        let initialStyles = SpecialCasedStyles.initialStylesByElement.get(_element);
        if (!initialStyles) {
            SpecialCasedStyles.initialStylesByElement.set(_element, (initialStyles = new Map()));
        }
        this._initialStyles = initialStyles;
    }
    start() {
        if (this._state < 1 /* SpecialCasedStylesState.Started */) {
            if (this._startStyles) {
                setStyles(this._element, this._startStyles, this._initialStyles);
            }
            this._state = 1 /* SpecialCasedStylesState.Started */;
        }
    }
    finish() {
        this.start();
        if (this._state < 2 /* SpecialCasedStylesState.Finished */) {
            setStyles(this._element, this._initialStyles);
            if (this._endStyles) {
                setStyles(this._element, this._endStyles);
                this._endStyles = null;
            }
            this._state = 1 /* SpecialCasedStylesState.Started */;
        }
    }
    destroy() {
        this.finish();
        if (this._state < 3 /* SpecialCasedStylesState.Destroyed */) {
            SpecialCasedStyles.initialStylesByElement.delete(this._element);
            if (this._startStyles) {
                eraseStyles(this._element, this._startStyles);
                this._endStyles = null;
            }
            if (this._endStyles) {
                eraseStyles(this._element, this._endStyles);
                this._endStyles = null;
            }
            setStyles(this._element, this._initialStyles);
            this._state = 3 /* SpecialCasedStylesState.Destroyed */;
        }
    }
}
function filterNonAnimatableStyles(styles) {
    let result = null;
    styles.forEach((val, prop) => {
        if (isNonAnimatableStyle(prop)) {
            result = result || new Map();
            result.set(prop, val);
        }
    });
    return result;
}
function isNonAnimatableStyle(prop) {
    return prop === 'display' || prop === 'position';
}

class WebAnimationsPlayer {
    element;
    keyframes;
    options;
    _specialStyles;
    _onDoneFns = [];
    _onStartFns = [];
    _onDestroyFns = [];
    _duration;
    _delay;
    _initialized = false;
    _finished = false;
    _started = false;
    _destroyed = false;
    _finalKeyframe;
    // the following original fns are persistent copies of the _onStartFns and _onDoneFns
    // and are used to reset the fns to their original values upon reset()
    // (since the _onStartFns and _onDoneFns get deleted after they are called)
    _originalOnDoneFns = [];
    _originalOnStartFns = [];
    // using non-null assertion because it's re(set) by init();
    domPlayer;
    time = 0;
    parentPlayer = null;
    currentSnapshot = new Map();
    constructor(element, keyframes, options, _specialStyles) {
        this.element = element;
        this.keyframes = keyframes;
        this.options = options;
        this._specialStyles = _specialStyles;
        this._duration = options['duration'];
        this._delay = options['delay'] || 0;
        this.time = this._duration + this._delay;
    }
    _onFinish() {
        if (!this._finished) {
            this._finished = true;
            this._onDoneFns.forEach((fn) => fn());
            this._onDoneFns = [];
        }
    }
    init() {
        this._buildPlayer();
        this._preparePlayerBeforeStart();
    }
    _buildPlayer() {
        if (this._initialized)
            return;
        this._initialized = true;
        const keyframes = this.keyframes;
        // @ts-expect-error overwriting a readonly property
        this.domPlayer = this._triggerWebAnimation(this.element, keyframes, this.options);
        this._finalKeyframe = keyframes.length ? keyframes[keyframes.length - 1] : new Map();
        const onFinish = () => this._onFinish();
        this.domPlayer.addEventListener('finish', onFinish);
        this.onDestroy(() => {
            // We must remove the `finish` event listener once an animation has completed all its
            // iterations. This action is necessary to prevent a memory leak since the listener captures
            // `this`, creating a closure that prevents `this` from being garbage collected.
            this.domPlayer.removeEventListener('finish', onFinish);
        });
    }
    _preparePlayerBeforeStart() {
        // this is required so that the player doesn't start to animate right away
        if (this._delay) {
            this._resetDomPlayerState();
        }
        else {
            this.domPlayer.pause();
        }
    }
    _convertKeyframesToObject(keyframes) {
        const kfs = [];
        keyframes.forEach((frame) => {
            kfs.push(Object.fromEntries(frame));
        });
        return kfs;
    }
    /** @internal */
    _triggerWebAnimation(element, keyframes, options) {
        return element.animate(this._convertKeyframesToObject(keyframes), options);
    }
    onStart(fn) {
        this._originalOnStartFns.push(fn);
        this._onStartFns.push(fn);
    }
    onDone(fn) {
        this._originalOnDoneFns.push(fn);
        this._onDoneFns.push(fn);
    }
    onDestroy(fn) {
        this._onDestroyFns.push(fn);
    }
    play() {
        this._buildPlayer();
        if (!this.hasStarted()) {
            this._onStartFns.forEach((fn) => fn());
            this._onStartFns = [];
            this._started = true;
            if (this._specialStyles) {
                this._specialStyles.start();
            }
        }
        this.domPlayer.play();
    }
    pause() {
        this.init();
        this.domPlayer.pause();
    }
    finish() {
        this.init();
        if (this._specialStyles) {
            this._specialStyles.finish();
        }
        this._onFinish();
        this.domPlayer.finish();
    }
    reset() {
        this._resetDomPlayerState();
        this._destroyed = false;
        this._finished = false;
        this._started = false;
        this._onStartFns = this._originalOnStartFns;
        this._onDoneFns = this._originalOnDoneFns;
    }
    _resetDomPlayerState() {
        if (this.domPlayer) {
            this.domPlayer.cancel();
        }
    }
    restart() {
        this.reset();
        this.play();
    }
    hasStarted() {
        return this._started;
    }
    destroy() {
        if (!this._destroyed) {
            this._destroyed = true;
            this._resetDomPlayerState();
            this._onFinish();
            if (this._specialStyles) {
                this._specialStyles.destroy();
            }
            this._onDestroyFns.forEach((fn) => fn());
            this._onDestroyFns = [];
        }
    }
    setPosition(p) {
        if (this.domPlayer === undefined) {
            this.init();
        }
        this.domPlayer.currentTime = p * this.time;
    }
    getPosition() {
        // tsc is complaining with TS2362 without the conversion to number
        return +(this.domPlayer.currentTime ?? 0) / this.time;
    }
    get totalTime() {
        return this._delay + this._duration;
    }
    beforeDestroy() {
        const styles = new Map();
        if (this.hasStarted()) {
            // note: this code is invoked only when the `play` function was called prior to this
            // (thus `hasStarted` returns true), this implies that the code that initializes
            // `_finalKeyframe` has also been executed and the non-null assertion can be safely used here
            const finalKeyframe = this._finalKeyframe;
            finalKeyframe.forEach((val, prop) => {
                if (prop !== 'offset') {
                    styles.set(prop, this._finished ? val : computeStyle(this.element, prop));
                }
            });
        }
        this.currentSnapshot = styles;
    }
    /** @internal */
    triggerCallback(phaseName) {
        const methods = phaseName === 'start' ? this._onStartFns : this._onDoneFns;
        methods.forEach((fn) => fn());
        methods.length = 0;
    }
}

class WebAnimationsDriver {
    validateStyleProperty(prop) {
        // Perform actual validation in dev mode only, in prod mode this check is a noop.
        if (typeof ngDevMode === 'undefined' || ngDevMode) {
            return validateStyleProperty(prop);
        }
        return true;
    }
    validateAnimatableStyleProperty(prop) {
        // Perform actual validation in dev mode only, in prod mode this check is a noop.
        if (typeof ngDevMode === 'undefined' || ngDevMode) {
            const cssProp = camelCaseToDashCase(prop);
            return validateWebAnimatableStyleProperty(cssProp);
        }
        return true;
    }
    containsElement(elm1, elm2) {
        return containsElement(elm1, elm2);
    }
    getParentElement(element) {
        return getParentElement(element);
    }
    query(element, selector, multi) {
        return invokeQuery(element, selector, multi);
    }
    computeStyle(element, prop, defaultValue) {
        return computeStyle(element, prop);
    }
    animate(element, keyframes, duration, delay, easing, previousPlayers = []) {
        const fill = delay == 0 ? 'both' : 'forwards';
        const playerOptions = { duration, delay, fill };
        // we check for this to avoid having a null|undefined value be present
        // for the easing (which results in an error for certain browsers #9752)
        if (easing) {
            playerOptions['easing'] = easing;
        }
        const previousStyles = new Map();
        const previousWebAnimationPlayers = (previousPlayers.filter((player) => player instanceof WebAnimationsPlayer));
        if (allowPreviousPlayerStylesMerge(duration, delay)) {
            previousWebAnimationPlayers.forEach((player) => {
                player.currentSnapshot.forEach((val, prop) => previousStyles.set(prop, val));
            });
        }
        let _keyframes = normalizeKeyframes$1(keyframes).map((styles) => new Map(styles));
        _keyframes = balancePreviousStylesIntoKeyframes(element, _keyframes, previousStyles);
        const specialStyles = packageNonAnimatableStyles(element, _keyframes);
        return new WebAnimationsPlayer(element, _keyframes, playerOptions, specialStyles);
    }
}

function createEngine(type, doc) {
    // TODO: find a way to make this tree shakable.
    if (type === 'noop') {
        return new AnimationEngine(doc, new NoopAnimationDriver(), new NoopAnimationStyleNormalizer());
    }
    return new AnimationEngine(doc, new WebAnimationsDriver(), new WebAnimationsStyleNormalizer());
}

class Animation {
    _driver;
    _animationAst;
    constructor(_driver, input) {
        this._driver = _driver;
        const errors = [];
        const warnings = [];
        const ast = buildAnimationAst(_driver, input, errors, warnings);
        if (errors.length) {
            throw validationFailed(errors);
        }
        if (typeof ngDevMode === 'undefined' || ngDevMode) {
            if (warnings.length) {
                warnValidation(warnings);
            }
        }
        this._animationAst = ast;
    }
    buildTimelines(element, startingStyles, destinationStyles, options, subInstructions) {
        const start = Array.isArray(startingStyles)
            ? normalizeStyles(startingStyles)
            : startingStyles;
        const dest = Array.isArray(destinationStyles)
            ? normalizeStyles(destinationStyles)
            : destinationStyles;
        const errors = [];
        subInstructions = subInstructions || new ElementInstructionMap();
        const result = buildAnimationTimelines(this._driver, element, this._animationAst, ENTER_CLASSNAME, LEAVE_CLASSNAME, start, dest, options, subInstructions, errors);
        if (errors.length) {
            throw buildingFailed(errors);
        }
        return result;
    }
}

const ANIMATION_PREFIX = '@';
const DISABLE_ANIMATIONS_FLAG = '@.disabled';
class BaseAnimationRenderer {
    namespaceId;
    delegate;
    engine;
    _onDestroy;
    // We need to explicitly type this property because of an api-extractor bug
    // See https://github.com/microsoft/rushstack/issues/4390
    ɵtype = 0 /* AnimationRendererType.Regular */;
    constructor(namespaceId, delegate, engine, _onDestroy) {
        this.namespaceId = namespaceId;
        this.delegate = delegate;
        this.engine = engine;
        this._onDestroy = _onDestroy;
    }
    get data() {
        return this.delegate.data;
    }
    destroyNode(node) {
        this.delegate.destroyNode?.(node);
    }
    destroy() {
        this.engine.destroy(this.namespaceId, this.delegate);
        this.engine.afterFlushAnimationsDone(() => {
            // Call the renderer destroy method after the animations has finished as otherwise
            // styles will be removed too early which will cause an unstyled animation.
            queueMicrotask(() => {
                this.delegate.destroy();
            });
        });
        this._onDestroy?.();
    }
    createElement(name, namespace) {
        return this.delegate.createElement(name, namespace);
    }
    createComment(value) {
        return this.delegate.createComment(value);
    }
    createText(value) {
        return this.delegate.createText(value);
    }
    appendChild(parent, newChild) {
        this.delegate.appendChild(parent, newChild);
        this.engine.onInsert(this.namespaceId, newChild, parent, false);
    }
    insertBefore(parent, newChild, refChild, isMove = true) {
        this.delegate.insertBefore(parent, newChild, refChild);
        // If `isMove` true than we should animate this insert.
        this.engine.onInsert(this.namespaceId, newChild, parent, isMove);
    }
    removeChild(parent, oldChild, isHostElement) {
        // Prior to the changes in #57203, this method wasn't being called at all by `core` if the child
        // doesn't have a parent. There appears to be some animation-specific downstream logic that
        // depends on the null check happening before the animation engine. This check keeps the old
        // behavior while allowing `core` to not have to check for the parent element anymore.
        if (this.parentNode(oldChild)) {
            this.engine.onRemove(this.namespaceId, oldChild, this.delegate);
        }
    }
    selectRootElement(selectorOrNode, preserveContent) {
        return this.delegate.selectRootElement(selectorOrNode, preserveContent);
    }
    parentNode(node) {
        return this.delegate.parentNode(node);
    }
    nextSibling(node) {
        return this.delegate.nextSibling(node);
    }
    setAttribute(el, name, value, namespace) {
        this.delegate.setAttribute(el, name, value, namespace);
    }
    removeAttribute(el, name, namespace) {
        this.delegate.removeAttribute(el, name, namespace);
    }
    addClass(el, name) {
        this.delegate.addClass(el, name);
    }
    removeClass(el, name) {
        this.delegate.removeClass(el, name);
    }
    setStyle(el, style, value, flags) {
        this.delegate.setStyle(el, style, value, flags);
    }
    removeStyle(el, style, flags) {
        this.delegate.removeStyle(el, style, flags);
    }
    setProperty(el, name, value) {
        if (name.charAt(0) == ANIMATION_PREFIX && name == DISABLE_ANIMATIONS_FLAG) {
            this.disableAnimations(el, !!value);
        }
        else {
            this.delegate.setProperty(el, name, value);
        }
    }
    setValue(node, value) {
        this.delegate.setValue(node, value);
    }
    listen(target, eventName, callback, options) {
        return this.delegate.listen(target, eventName, callback, options);
    }
    disableAnimations(element, value) {
        this.engine.disableAnimations(element, value);
    }
}
class AnimationRenderer extends BaseAnimationRenderer {
    factory;
    constructor(factory, namespaceId, delegate, engine, onDestroy) {
        super(namespaceId, delegate, engine, onDestroy);
        this.factory = factory;
        this.namespaceId = namespaceId;
    }
    setProperty(el, name, value) {
        if (name.charAt(0) == ANIMATION_PREFIX) {
            if (name.charAt(1) == '.' && name == DISABLE_ANIMATIONS_FLAG) {
                value = value === undefined ? true : !!value;
                this.disableAnimations(el, value);
            }
            else {
                this.engine.process(this.namespaceId, el, name.slice(1), value);
            }
        }
        else {
            this.delegate.setProperty(el, name, value);
        }
    }
    listen(target, eventName, callback, options) {
        if (eventName.charAt(0) == ANIMATION_PREFIX) {
            const element = resolveElementFromTarget(target);
            let name = eventName.slice(1);
            let phase = '';
            // @listener.phase is for trigger animation callbacks
            // @@listener is for animation builder callbacks
            if (name.charAt(0) != ANIMATION_PREFIX) {
                [name, phase] = parseTriggerCallbackName(name);
            }
            return this.engine.listen(this.namespaceId, element, name, phase, (event) => {
                const countId = event['_data'] || -1;
                this.factory.scheduleListenerCallback(countId, callback, event);
            });
        }
        return this.delegate.listen(target, eventName, callback, options);
    }
}
function resolveElementFromTarget(target) {
    switch (target) {
        case 'body':
            return document.body;
        case 'document':
            return document;
        case 'window':
            return window;
        default:
            return target;
    }
}
function parseTriggerCallbackName(triggerName) {
    const dotIndex = triggerName.indexOf('.');
    const trigger = triggerName.substring(0, dotIndex);
    const phase = triggerName.slice(dotIndex + 1);
    return [trigger, phase];
}

class AnimationRendererFactory {
    delegate;
    engine;
    _zone;
    _currentId = 0;
    _microtaskId = 1;
    _animationCallbacksBuffer = [];
    _rendererCache = new Map();
    _cdRecurDepth = 0;
    constructor(delegate, engine, _zone) {
        this.delegate = delegate;
        this.engine = engine;
        this._zone = _zone;
        engine.onRemovalComplete = (element, delegate) => {
            delegate?.removeChild(null, element);
        };
    }
    createRenderer(hostElement, type) {
        const EMPTY_NAMESPACE_ID = '';
        // cache the delegates to find out which cached delegate can
        // be used by which cached renderer
        const delegate = this.delegate.createRenderer(hostElement, type);
        if (!hostElement || !type?.data?.['animation']) {
            const cache = this._rendererCache;
            let renderer = cache.get(delegate);
            if (!renderer) {
                // Ensure that the renderer is removed from the cache on destroy
                // since it may contain references to detached DOM nodes.
                const onRendererDestroy = () => cache.delete(delegate);
                renderer = new BaseAnimationRenderer(EMPTY_NAMESPACE_ID, delegate, this.engine, onRendererDestroy);
                // only cache this result when the base renderer is used
                cache.set(delegate, renderer);
            }
            return renderer;
        }
        const componentId = type.id;
        const namespaceId = type.id + '-' + this._currentId;
        this._currentId++;
        this.engine.register(namespaceId, hostElement);
        const registerTrigger = (trigger) => {
            if (Array.isArray(trigger)) {
                trigger.forEach(registerTrigger);
            }
            else {
                this.engine.registerTrigger(componentId, namespaceId, hostElement, trigger.name, trigger);
            }
        };
        const animationTriggers = type.data['animation'];
        animationTriggers.forEach(registerTrigger);
        return new AnimationRenderer(this, namespaceId, delegate, this.engine);
    }
    begin() {
        this._cdRecurDepth++;
        if (this.delegate.begin) {
            this.delegate.begin();
        }
    }
    _scheduleCountTask() {
        queueMicrotask(() => {
            this._microtaskId++;
        });
    }
    /** @internal */
    scheduleListenerCallback(count, fn, data) {
        if (count >= 0 && count < this._microtaskId) {
            this._zone.run(() => fn(data));
            return;
        }
        const animationCallbacksBuffer = this._animationCallbacksBuffer;
        if (animationCallbacksBuffer.length == 0) {
            queueMicrotask(() => {
                this._zone.run(() => {
                    animationCallbacksBuffer.forEach((tuple) => {
                        const [fn, data] = tuple;
                        fn(data);
                    });
                    this._animationCallbacksBuffer = [];
                });
            });
        }
        animationCallbacksBuffer.push([fn, data]);
    }
    end() {
        this._cdRecurDepth--;
        // this is to prevent animations from running twice when an inner
        // component does CD when a parent component instead has inserted it
        if (this._cdRecurDepth == 0) {
            this._zone.runOutsideAngular(() => {
                this._scheduleCountTask();
                this.engine.flush(this._microtaskId);
            });
        }
        if (this.delegate.end) {
            this.delegate.end();
        }
    }
    whenRenderingDone() {
        return this.engine.whenRenderingDone();
    }
    /**
     * Used during HMR to clear any cached data about a component.
     * @param componentId ID of the component that is being replaced.
     */
    componentReplaced(componentId) {
        // Flush the engine since the renderer destruction waits for animations to be done.
        this.engine.flush();
        this.delegate.componentReplaced?.(componentId);
    }
}

export { AnimationDriver, NoopAnimationDriver, Animation as ɵAnimation, AnimationEngine as ɵAnimationEngine, AnimationRenderer as ɵAnimationRenderer, AnimationRendererFactory as ɵAnimationRendererFactory, AnimationStyleNormalizer as ɵAnimationStyleNormalizer, BaseAnimationRenderer as ɵBaseAnimationRenderer, ENTER_CLASSNAME as ɵENTER_CLASSNAME, LEAVE_CLASSNAME as ɵLEAVE_CLASSNAME, NoopAnimationStyleNormalizer as ɵNoopAnimationStyleNormalizer, TransitionAnimationPlayer as ɵTransitionAnimationPlayer, WebAnimationsDriver as ɵWebAnimationsDriver, WebAnimationsPlayer as ɵWebAnimationsPlayer, WebAnimationsStyleNormalizer as ɵWebAnimationsStyleNormalizer, allowPreviousPlayerStylesMerge as ɵallowPreviousPlayerStylesMerge, camelCaseToDashCase as ɵcamelCaseToDashCase, containsElement as ɵcontainsElement, createEngine as ɵcreateEngine, getParentElement as ɵgetParentElement, invokeQuery as ɵinvokeQuery, normalizeKeyframes$1 as ɵnormalizeKeyframes, validateStyleProperty as ɵvalidateStyleProperty, validateWebAnimatableStyleProperty as ɵvalidateWebAnimatableStyleProperty };
//# sourceMappingURL=browser.mjs.map


      import {createRequire as __cjsCompatRequire} from 'module';
      const require = __cjsCompatRequire(import.meta.url);
    
import {
  SourceFileLoader
} from "./chunk-PML5JK7B.js";
import {
  Context,
  ExpressionTranslatorVisitor
} from "./chunk-6ECVYRSU.js";

// bazel-out/k8-fastbuild/bin/packages/compiler-cli/linker/src/fatal_linker_error.js
var FatalLinkerError = class extends Error {
  node;
  type = "FatalLinkerError";
  constructor(node, message) {
    super(message);
    this.node = node;
  }
};
function isFatalLinkerError(e) {
  return e && e.type === "FatalLinkerError";
}

// bazel-out/k8-fastbuild/bin/packages/compiler-cli/linker/src/ast/utils.js
function assert(node, predicate, expected) {
  if (!predicate(node)) {
    throw new FatalLinkerError(node, `Unsupported syntax, expected ${expected}.`);
  }
}

// bazel-out/k8-fastbuild/bin/packages/compiler-cli/linker/src/ast/ast_value.js
import * as o from "@angular/compiler";
var AstObject = class {
  expression;
  obj;
  host;
  static parse(expression, host) {
    const obj = host.parseObjectLiteral(expression);
    return new AstObject(expression, obj, host);
  }
  constructor(expression, obj, host) {
    this.expression = expression;
    this.obj = obj;
    this.host = host;
  }
  has(propertyName) {
    return this.obj.has(propertyName);
  }
  getNumber(propertyName) {
    return this.host.parseNumericLiteral(this.getRequiredProperty(propertyName));
  }
  getString(propertyName) {
    return this.host.parseStringLiteral(this.getRequiredProperty(propertyName));
  }
  getBoolean(propertyName) {
    return this.host.parseBooleanLiteral(this.getRequiredProperty(propertyName));
  }
  getObject(propertyName) {
    const expr = this.getRequiredProperty(propertyName);
    const obj = this.host.parseObjectLiteral(expr);
    return new AstObject(expr, obj, this.host);
  }
  getArray(propertyName) {
    const arr = this.host.parseArrayLiteral(this.getRequiredProperty(propertyName));
    return arr.map((entry) => new AstValue(entry, this.host));
  }
  getOpaque(propertyName) {
    return new o.WrappedNodeExpr(this.getRequiredProperty(propertyName));
  }
  getNode(propertyName) {
    return this.getRequiredProperty(propertyName);
  }
  getValue(propertyName) {
    return new AstValue(this.getRequiredProperty(propertyName), this.host);
  }
  toLiteral(mapper) {
    const result = {};
    for (const [key, expression] of this.obj) {
      result[key] = mapper(new AstValue(expression, this.host), key);
    }
    return result;
  }
  toMap(mapper) {
    const result = /* @__PURE__ */ new Map();
    for (const [key, expression] of this.obj) {
      result.set(key, mapper(new AstValue(expression, this.host)));
    }
    return result;
  }
  getRequiredProperty(propertyName) {
    if (!this.obj.has(propertyName)) {
      throw new FatalLinkerError(this.expression, `Expected property '${propertyName}' to be present.`);
    }
    return this.obj.get(propertyName);
  }
};
var AstValue = class {
  expression;
  host;
  \u0275typeBrand = null;
  constructor(expression, host) {
    this.expression = expression;
    this.host = host;
  }
  getSymbolName() {
    return this.host.getSymbolName(this.expression);
  }
  isNumber() {
    return this.host.isNumericLiteral(this.expression);
  }
  getNumber() {
    return this.host.parseNumericLiteral(this.expression);
  }
  isString() {
    return this.host.isStringLiteral(this.expression);
  }
  getString() {
    return this.host.parseStringLiteral(this.expression);
  }
  isBoolean() {
    return this.host.isBooleanLiteral(this.expression);
  }
  getBoolean() {
    return this.host.parseBooleanLiteral(this.expression);
  }
  isObject() {
    return this.host.isObjectLiteral(this.expression);
  }
  getObject() {
    return AstObject.parse(this.expression, this.host);
  }
  isArray() {
    return this.host.isArrayLiteral(this.expression);
  }
  isNull() {
    return this.host.isNull(this.expression);
  }
  getArray() {
    const arr = this.host.parseArrayLiteral(this.expression);
    return arr.map((entry) => new AstValue(entry, this.host));
  }
  isFunction() {
    return this.host.isFunctionExpression(this.expression);
  }
  getFunctionReturnValue() {
    return new AstValue(this.host.parseReturnValue(this.expression), this.host);
  }
  getFunctionParameters() {
    return this.host.parseParameters(this.expression).map((param) => new AstValue(param, this.host));
  }
  isCallExpression() {
    return this.host.isCallExpression(this.expression);
  }
  getCallee() {
    return new AstValue(this.host.parseCallee(this.expression), this.host);
  }
  getArguments() {
    const args = this.host.parseArguments(this.expression);
    return args.map((arg) => new AstValue(arg, this.host));
  }
  getOpaque() {
    return new o.WrappedNodeExpr(this.expression);
  }
  getRange() {
    return this.host.getRange(this.expression);
  }
};

// bazel-out/k8-fastbuild/bin/packages/compiler-cli/linker/src/file_linker/emit_scopes/emit_scope.js
import { ConstantPool } from "@angular/compiler";

// bazel-out/k8-fastbuild/bin/packages/compiler-cli/linker/src/linker_import_generator.js
var LinkerImportGenerator = class {
  factory;
  ngImport;
  constructor(factory, ngImport) {
    this.factory = factory;
    this.ngImport = ngImport;
  }
  addImport(request) {
    this.assertModuleName(request.exportModuleSpecifier);
    if (request.exportSymbolName === null) {
      return this.ngImport;
    }
    return this.factory.createPropertyAccess(this.ngImport, request.exportSymbolName);
  }
  assertModuleName(moduleName) {
    if (moduleName !== "@angular/core") {
      throw new FatalLinkerError(this.ngImport, `Unable to import from anything other than '@angular/core'`);
    }
  }
};

// bazel-out/k8-fastbuild/bin/packages/compiler-cli/linker/src/file_linker/emit_scopes/emit_scope.js
var EmitScope = class {
  ngImport;
  translator;
  factory;
  constantPool = new ConstantPool();
  constructor(ngImport, translator, factory) {
    this.ngImport = ngImport;
    this.translator = translator;
    this.factory = factory;
  }
  translateDefinition(definition) {
    const expression = this.translator.translateExpression(definition.expression, new LinkerImportGenerator(this.factory, this.ngImport));
    if (definition.statements.length > 0) {
      const importGenerator = new LinkerImportGenerator(this.factory, this.ngImport);
      return this.wrapInIifeWithStatements(expression, definition.statements.map((statement) => this.translator.translateStatement(statement, importGenerator)));
    } else {
      return expression;
    }
  }
  getConstantStatements() {
    const importGenerator = new LinkerImportGenerator(this.factory, this.ngImport);
    return this.constantPool.statements.map((statement) => this.translator.translateStatement(statement, importGenerator));
  }
  wrapInIifeWithStatements(expression, statements) {
    const returnStatement = this.factory.createReturnStatement(expression);
    const body = this.factory.createBlock([...statements, returnStatement]);
    const fn = this.factory.createFunctionExpression(null, [], body);
    return this.factory.createCallExpression(fn, [], false);
  }
};

// bazel-out/k8-fastbuild/bin/packages/compiler-cli/linker/src/file_linker/emit_scopes/local_emit_scope.js
var LocalEmitScope = class extends EmitScope {
  translateDefinition(definition) {
    return super.translateDefinition({
      expression: definition.expression,
      statements: [...this.constantPool.statements, ...definition.statements]
    });
  }
  getConstantStatements() {
    throw new Error("BUG - LocalEmitScope should not expose any constant statements");
  }
};

// bazel-out/k8-fastbuild/bin/packages/compiler-cli/linker/src/file_linker/partial_linkers/partial_linker_selector.js
import semver3 from "semver";

// bazel-out/k8-fastbuild/bin/packages/compiler-cli/linker/src/file_linker/get_source_file.js
function createGetSourceFile(sourceUrl, code, loader) {
  if (loader === null) {
    return () => null;
  } else {
    let sourceFile = void 0;
    return () => {
      if (sourceFile === void 0) {
        sourceFile = loader.loadSourceFile(sourceUrl, code);
      }
      return sourceFile;
    };
  }
}

// bazel-out/k8-fastbuild/bin/packages/compiler-cli/linker/src/file_linker/partial_linkers/partial_class_metadata_async_linker_1.js
import { compileOpaqueAsyncClassMetadata } from "@angular/compiler";
var PartialClassMetadataAsyncLinkerVersion1 = class {
  linkPartialDeclaration(constantPool, metaObj) {
    const resolveMetadataKey = "resolveMetadata";
    const resolveMetadata = metaObj.getValue(resolveMetadataKey);
    if (!resolveMetadata.isFunction()) {
      throw new FatalLinkerError(resolveMetadata, `Unsupported \`${resolveMetadataKey}\` value. Expected a function.`);
    }
    const dependencyResolverFunction = metaObj.getOpaque("resolveDeferredDeps");
    const deferredSymbolNames = resolveMetadata.getFunctionParameters().map((p) => p.getSymbolName());
    const returnValue = resolveMetadata.getFunctionReturnValue().getObject();
    const metadata = {
      type: metaObj.getOpaque("type"),
      decorators: returnValue.getOpaque("decorators"),
      ctorParameters: returnValue.getOpaque("ctorParameters"),
      propDecorators: returnValue.getOpaque("propDecorators")
    };
    return {
      expression: compileOpaqueAsyncClassMetadata(metadata, dependencyResolverFunction, deferredSymbolNames),
      statements: []
    };
  }
};

// bazel-out/k8-fastbuild/bin/packages/compiler-cli/linker/src/file_linker/partial_linkers/partial_class_metadata_linker_1.js
import { compileClassMetadata } from "@angular/compiler";
var PartialClassMetadataLinkerVersion1 = class {
  linkPartialDeclaration(constantPool, metaObj) {
    const meta = toR3ClassMetadata(metaObj);
    return {
      expression: compileClassMetadata(meta),
      statements: []
    };
  }
};
function toR3ClassMetadata(metaObj) {
  return {
    type: metaObj.getOpaque("type"),
    decorators: metaObj.getOpaque("decorators"),
    ctorParameters: metaObj.has("ctorParameters") ? metaObj.getOpaque("ctorParameters") : null,
    propDecorators: metaObj.has("propDecorators") ? metaObj.getOpaque("propDecorators") : null
  };
}

// bazel-out/k8-fastbuild/bin/packages/compiler-cli/linker/src/file_linker/partial_linkers/partial_component_linker_1.js
import { ChangeDetectionStrategy, compileComponentFromMetadata, DEFAULT_INTERPOLATION_CONFIG, InterpolationConfig, makeBindingParser as makeBindingParser2, parseTemplate, R3TargetBinder, R3TemplateDependencyKind, ViewEncapsulation } from "@angular/compiler";
import semver2 from "semver";

// bazel-out/k8-fastbuild/bin/packages/compiler-cli/linker/src/file_linker/partial_linkers/partial_directive_linker_1.js
import { compileDirectiveFromMetadata, makeBindingParser, ParseLocation, ParseSourceFile, ParseSourceSpan } from "@angular/compiler";

// bazel-out/k8-fastbuild/bin/packages/compiler-cli/linker/src/file_linker/partial_linkers/util.js
import { createMayBeForwardRefExpression, outputAst as o2 } from "@angular/compiler";
import semver from "semver";
var PLACEHOLDER_VERSION = "20.1.0";
function wrapReference(wrapped) {
  return { value: wrapped, type: wrapped };
}
function parseEnum(value, Enum) {
  const symbolName = value.getSymbolName();
  if (symbolName === null) {
    throw new FatalLinkerError(value.expression, "Expected value to have a symbol name");
  }
  const enumValue = Enum[symbolName];
  if (enumValue === void 0) {
    throw new FatalLinkerError(value.expression, `Unsupported enum value for ${Enum}`);
  }
  return enumValue;
}
function getDependency(depObj) {
  const isAttribute = depObj.has("attribute") && depObj.getBoolean("attribute");
  const token = depObj.getOpaque("token");
  const attributeNameType = isAttribute ? o2.literal("unknown") : null;
  return {
    token,
    attributeNameType,
    host: depObj.has("host") && depObj.getBoolean("host"),
    optional: depObj.has("optional") && depObj.getBoolean("optional"),
    self: depObj.has("self") && depObj.getBoolean("self"),
    skipSelf: depObj.has("skipSelf") && depObj.getBoolean("skipSelf")
  };
}
function extractForwardRef(expr) {
  if (!expr.isCallExpression()) {
    return createMayBeForwardRefExpression(expr.getOpaque(), 0);
  }
  const callee = expr.getCallee();
  if (callee.getSymbolName() !== "forwardRef") {
    throw new FatalLinkerError(callee.expression, "Unsupported expression, expected a `forwardRef()` call or a type reference");
  }
  const args = expr.getArguments();
  if (args.length !== 1) {
    throw new FatalLinkerError(expr, "Unsupported `forwardRef(fn)` call, expected a single argument");
  }
  const wrapperFn = args[0];
  if (!wrapperFn.isFunction()) {
    throw new FatalLinkerError(wrapperFn, "Unsupported `forwardRef(fn)` call, expected its argument to be a function");
  }
  return createMayBeForwardRefExpression(wrapperFn.getFunctionReturnValue().getOpaque(), 2);
}
var STANDALONE_IS_DEFAULT_RANGE = new semver.Range(`>= 19.0.0 || ${PLACEHOLDER_VERSION}`, {
  includePrerelease: true
});
function getDefaultStandaloneValue(version) {
  return STANDALONE_IS_DEFAULT_RANGE.test(version);
}

// bazel-out/k8-fastbuild/bin/packages/compiler-cli/linker/src/file_linker/partial_linkers/partial_directive_linker_1.js
var PartialDirectiveLinkerVersion1 = class {
  sourceUrl;
  code;
  constructor(sourceUrl, code) {
    this.sourceUrl = sourceUrl;
    this.code = code;
  }
  linkPartialDeclaration(constantPool, metaObj, version) {
    const meta = toR3DirectiveMeta(metaObj, this.code, this.sourceUrl, version);
    return compileDirectiveFromMetadata(meta, constantPool, makeBindingParser());
  }
};
function toR3DirectiveMeta(metaObj, code, sourceUrl, version) {
  const typeExpr = metaObj.getValue("type");
  const typeName = typeExpr.getSymbolName();
  if (typeName === null) {
    throw new FatalLinkerError(typeExpr.expression, "Unsupported type, its name could not be determined");
  }
  return {
    typeSourceSpan: createSourceSpan(typeExpr.getRange(), code, sourceUrl),
    type: wrapReference(typeExpr.getOpaque()),
    typeArgumentCount: 0,
    deps: null,
    host: toHostMetadata(metaObj),
    inputs: metaObj.has("inputs") ? metaObj.getObject("inputs").toLiteral(toInputMapping) : {},
    outputs: metaObj.has("outputs") ? metaObj.getObject("outputs").toLiteral((value) => value.getString()) : {},
    queries: metaObj.has("queries") ? metaObj.getArray("queries").map((entry) => toQueryMetadata(entry.getObject())) : [],
    viewQueries: metaObj.has("viewQueries") ? metaObj.getArray("viewQueries").map((entry) => toQueryMetadata(entry.getObject())) : [],
    providers: metaObj.has("providers") ? metaObj.getOpaque("providers") : null,
    fullInheritance: false,
    selector: metaObj.has("selector") ? metaObj.getString("selector") : null,
    exportAs: metaObj.has("exportAs") ? metaObj.getArray("exportAs").map((entry) => entry.getString()) : null,
    lifecycle: {
      usesOnChanges: metaObj.has("usesOnChanges") ? metaObj.getBoolean("usesOnChanges") : false
    },
    name: typeName,
    usesInheritance: metaObj.has("usesInheritance") ? metaObj.getBoolean("usesInheritance") : false,
    isStandalone: metaObj.has("isStandalone") ? metaObj.getBoolean("isStandalone") : getDefaultStandaloneValue(version),
    isSignal: metaObj.has("isSignal") ? metaObj.getBoolean("isSignal") : false,
    hostDirectives: metaObj.has("hostDirectives") ? toHostDirectivesMetadata(metaObj.getValue("hostDirectives")) : null
  };
}
function toInputMapping(value, key) {
  if (value.isObject()) {
    const obj = value.getObject();
    const transformValue = obj.getValue("transformFunction");
    return {
      classPropertyName: obj.getString("classPropertyName"),
      bindingPropertyName: obj.getString("publicName"),
      isSignal: obj.getBoolean("isSignal"),
      required: obj.getBoolean("isRequired"),
      transformFunction: transformValue.isNull() ? null : transformValue.getOpaque()
    };
  }
  return parseLegacyInputPartialOutput(key, value);
}
function parseLegacyInputPartialOutput(key, value) {
  if (value.isString()) {
    return {
      bindingPropertyName: value.getString(),
      classPropertyName: key,
      required: false,
      transformFunction: null,
      isSignal: false
    };
  }
  const values = value.getArray();
  if (values.length !== 2 && values.length !== 3) {
    throw new FatalLinkerError(value.expression, "Unsupported input, expected a string or an array containing two strings and an optional function");
  }
  return {
    bindingPropertyName: values[0].getString(),
    classPropertyName: values[1].getString(),
    transformFunction: values.length > 2 ? values[2].getOpaque() : null,
    required: false,
    isSignal: false
  };
}
function toHostMetadata(metaObj) {
  if (!metaObj.has("host")) {
    return {
      attributes: {},
      listeners: {},
      properties: {},
      specialAttributes: {}
    };
  }
  const host = metaObj.getObject("host");
  const specialAttributes = {};
  if (host.has("styleAttribute")) {
    specialAttributes.styleAttr = host.getString("styleAttribute");
  }
  if (host.has("classAttribute")) {
    specialAttributes.classAttr = host.getString("classAttribute");
  }
  return {
    attributes: host.has("attributes") ? host.getObject("attributes").toLiteral((value) => value.getOpaque()) : {},
    listeners: host.has("listeners") ? host.getObject("listeners").toLiteral((value) => value.getString()) : {},
    properties: host.has("properties") ? host.getObject("properties").toLiteral((value) => value.getString()) : {},
    specialAttributes
  };
}
function toQueryMetadata(obj) {
  let predicate;
  const predicateExpr = obj.getValue("predicate");
  if (predicateExpr.isArray()) {
    predicate = predicateExpr.getArray().map((entry) => entry.getString());
  } else {
    predicate = extractForwardRef(predicateExpr);
  }
  return {
    propertyName: obj.getString("propertyName"),
    first: obj.has("first") ? obj.getBoolean("first") : false,
    predicate,
    descendants: obj.has("descendants") ? obj.getBoolean("descendants") : false,
    emitDistinctChangesOnly: obj.has("emitDistinctChangesOnly") ? obj.getBoolean("emitDistinctChangesOnly") : true,
    read: obj.has("read") ? obj.getOpaque("read") : null,
    static: obj.has("static") ? obj.getBoolean("static") : false,
    isSignal: obj.has("isSignal") ? obj.getBoolean("isSignal") : false
  };
}
function toHostDirectivesMetadata(hostDirectives) {
  return hostDirectives.getArray().map((hostDirective) => {
    const hostObject = hostDirective.getObject();
    const type = extractForwardRef(hostObject.getValue("directive"));
    const meta = {
      directive: wrapReference(type.expression),
      isForwardReference: type.forwardRef !== 0,
      inputs: hostObject.has("inputs") ? getHostDirectiveBindingMapping(hostObject.getArray("inputs")) : null,
      outputs: hostObject.has("outputs") ? getHostDirectiveBindingMapping(hostObject.getArray("outputs")) : null
    };
    return meta;
  });
}
function getHostDirectiveBindingMapping(array) {
  let result = null;
  for (let i = 1; i < array.length; i += 2) {
    result = result || {};
    result[array[i - 1].getString()] = array[i].getString();
  }
  return result;
}
function createSourceSpan(range, code, sourceUrl) {
  const sourceFile = new ParseSourceFile(code, sourceUrl);
  const startLocation = new ParseLocation(sourceFile, range.startPos, range.startLine, range.startCol);
  return new ParseSourceSpan(startLocation, startLocation.moveBy(range.endPos - range.startPos));
}

// bazel-out/k8-fastbuild/bin/packages/compiler-cli/linker/src/file_linker/partial_linkers/partial_component_linker_1.js
function makeDirectiveMetadata(directiveExpr, typeExpr, isComponentByDefault = null) {
  return {
    kind: R3TemplateDependencyKind.Directive,
    isComponent: isComponentByDefault || directiveExpr.has("kind") && directiveExpr.getString("kind") === "component",
    type: typeExpr,
    selector: directiveExpr.getString("selector"),
    inputs: directiveExpr.has("inputs") ? directiveExpr.getArray("inputs").map((input) => input.getString()) : [],
    outputs: directiveExpr.has("outputs") ? directiveExpr.getArray("outputs").map((input) => input.getString()) : [],
    exportAs: directiveExpr.has("exportAs") ? directiveExpr.getArray("exportAs").map((exportAs) => exportAs.getString()) : null
  };
}
var PartialComponentLinkerVersion1 = class {
  getSourceFile;
  sourceUrl;
  code;
  constructor(getSourceFile, sourceUrl, code) {
    this.getSourceFile = getSourceFile;
    this.sourceUrl = sourceUrl;
    this.code = code;
  }
  linkPartialDeclaration(constantPool, metaObj, version) {
    const meta = this.toR3ComponentMeta(metaObj, version);
    return compileComponentFromMetadata(meta, constantPool, makeBindingParser2());
  }
  toR3ComponentMeta(metaObj, version) {
    const interpolation = parseInterpolationConfig(metaObj);
    const templateSource = metaObj.getValue("template");
    const isInline = metaObj.has("isInline") ? metaObj.getBoolean("isInline") : false;
    const templateInfo = this.getTemplateInfo(templateSource, isInline);
    const { major, minor } = new semver2.SemVer(version);
    const enableBlockSyntax = major >= 17 || version === PLACEHOLDER_VERSION;
    const enableLetSyntax = major > 18 || major === 18 && minor >= 1 || version === PLACEHOLDER_VERSION;
    const template = parseTemplate(templateInfo.code, templateInfo.sourceUrl, {
      escapedString: templateInfo.isEscaped,
      interpolationConfig: interpolation,
      range: templateInfo.range,
      enableI18nLegacyMessageIdFormat: false,
      preserveWhitespaces: metaObj.has("preserveWhitespaces") ? metaObj.getBoolean("preserveWhitespaces") : false,
      i18nNormalizeLineEndingsInICUs: isInline,
      enableBlockSyntax,
      enableLetSyntax,
      enableSelectorless: false
    });
    if (template.errors !== null) {
      const errors = template.errors.map((err) => err.toString()).join("\n");
      throw new FatalLinkerError(templateSource.expression, `Errors found in the template:
${errors}`);
    }
    let declarationListEmitMode = 0;
    const extractDeclarationTypeExpr = (type) => {
      const { expression, forwardRef } = extractForwardRef(type);
      if (forwardRef === 2) {
        declarationListEmitMode = 1;
      }
      return expression;
    };
    let declarations = [];
    if (metaObj.has("components")) {
      declarations.push(...metaObj.getArray("components").map((dir) => {
        const dirExpr = dir.getObject();
        const typeExpr = extractDeclarationTypeExpr(dirExpr.getValue("type"));
        return makeDirectiveMetadata(dirExpr, typeExpr, true);
      }));
    }
    if (metaObj.has("directives")) {
      declarations.push(...metaObj.getArray("directives").map((dir) => {
        const dirExpr = dir.getObject();
        const typeExpr = extractDeclarationTypeExpr(dirExpr.getValue("type"));
        return makeDirectiveMetadata(dirExpr, typeExpr);
      }));
    }
    if (metaObj.has("pipes")) {
      const pipes = metaObj.getObject("pipes").toMap((pipe) => pipe);
      for (const [name, type] of pipes) {
        const typeExpr = extractDeclarationTypeExpr(type);
        declarations.push({
          kind: R3TemplateDependencyKind.Pipe,
          name,
          type: typeExpr
        });
      }
    }
    const baseMeta = toR3DirectiveMeta(metaObj, this.code, this.sourceUrl, version);
    const deferBlockDependencies = this.createR3ComponentDeferMetadata(metaObj, template);
    let hasDirectiveDependencies = false;
    for (const depFn of deferBlockDependencies.blocks.values()) {
      if (depFn !== null) {
        hasDirectiveDependencies = true;
      }
    }
    if (metaObj.has("dependencies")) {
      for (const dep of metaObj.getArray("dependencies")) {
        const depObj = dep.getObject();
        const typeExpr = extractDeclarationTypeExpr(depObj.getValue("type"));
        switch (depObj.getString("kind")) {
          case "directive":
          case "component":
            hasDirectiveDependencies = true;
            declarations.push(makeDirectiveMetadata(depObj, typeExpr));
            break;
          case "pipe":
            const pipeObj = depObj;
            declarations.push({
              kind: R3TemplateDependencyKind.Pipe,
              name: pipeObj.getString("name"),
              type: typeExpr
            });
            break;
          case "ngmodule":
            hasDirectiveDependencies = true;
            declarations.push({
              kind: R3TemplateDependencyKind.NgModule,
              type: typeExpr
            });
            break;
          default:
            continue;
        }
      }
    }
    return {
      ...baseMeta,
      viewProviders: metaObj.has("viewProviders") ? metaObj.getOpaque("viewProviders") : null,
      template: {
        nodes: template.nodes,
        ngContentSelectors: template.ngContentSelectors
      },
      declarationListEmitMode,
      styles: metaObj.has("styles") ? metaObj.getArray("styles").map((entry) => entry.getString()) : [],
      defer: deferBlockDependencies,
      encapsulation: metaObj.has("encapsulation") ? parseEncapsulation(metaObj.getValue("encapsulation")) : ViewEncapsulation.Emulated,
      interpolation,
      changeDetection: metaObj.has("changeDetection") ? parseChangeDetectionStrategy(metaObj.getValue("changeDetection")) : ChangeDetectionStrategy.Default,
      animations: metaObj.has("animations") ? metaObj.getOpaque("animations") : null,
      relativeContextFilePath: this.sourceUrl,
      relativeTemplatePath: null,
      i18nUseExternalIds: false,
      declarations,
      hasDirectiveDependencies: !baseMeta.isStandalone || hasDirectiveDependencies
    };
  }
  getTemplateInfo(templateNode, isInline) {
    const range = templateNode.getRange();
    if (!isInline) {
      const externalTemplate = this.tryExternalTemplate(range);
      if (externalTemplate !== null) {
        return externalTemplate;
      }
    }
    return this.templateFromPartialCode(templateNode, range);
  }
  tryExternalTemplate(range) {
    const sourceFile = this.getSourceFile();
    if (sourceFile === null) {
      return null;
    }
    const pos = sourceFile.getOriginalLocation(range.startLine, range.startCol);
    if (pos === null || pos.file === this.sourceUrl || /\.[jt]s$/.test(pos.file) || pos.line !== 0 || pos.column !== 0) {
      return null;
    }
    const templateContents = sourceFile.sources.find((src) => src?.sourcePath === pos.file).contents;
    return {
      code: templateContents,
      sourceUrl: pos.file,
      range: { startPos: 0, startLine: 0, startCol: 0, endPos: templateContents.length },
      isEscaped: false
    };
  }
  templateFromPartialCode(templateNode, { startPos, endPos, startLine, startCol }) {
    if (!/["'`]/.test(this.code[startPos]) || this.code[startPos] !== this.code[endPos - 1]) {
      throw new FatalLinkerError(templateNode.expression, `Expected the template string to be wrapped in quotes but got: ${this.code.substring(startPos, endPos)}`);
    }
    return {
      code: this.code,
      sourceUrl: this.sourceUrl,
      range: { startPos: startPos + 1, endPos: endPos - 1, startLine, startCol: startCol + 1 },
      isEscaped: true
    };
  }
  createR3ComponentDeferMetadata(metaObj, template) {
    const result = {
      mode: 0,
      blocks: /* @__PURE__ */ new Map()
    };
    if (template.nodes.length === 0) {
      return result;
    }
    const boundTarget = new R3TargetBinder(null).bind({ template: template.nodes });
    const deferredBlocks = boundTarget.getDeferBlocks();
    const dependencies = metaObj.has("deferBlockDependencies") ? metaObj.getArray("deferBlockDependencies") : null;
    for (let i = 0; i < deferredBlocks.length; i++) {
      const matchingDependencyFn = dependencies?.[i];
      if (matchingDependencyFn == null) {
        result.blocks.set(deferredBlocks[i], null);
      } else {
        result.blocks.set(deferredBlocks[i], matchingDependencyFn.isNull() ? null : matchingDependencyFn.getOpaque());
      }
    }
    return result;
  }
};
function parseInterpolationConfig(metaObj) {
  if (!metaObj.has("interpolation")) {
    return DEFAULT_INTERPOLATION_CONFIG;
  }
  const interpolationExpr = metaObj.getValue("interpolation");
  const values = interpolationExpr.getArray().map((entry) => entry.getString());
  if (values.length !== 2) {
    throw new FatalLinkerError(interpolationExpr.expression, "Unsupported interpolation config, expected an array containing exactly two strings");
  }
  return InterpolationConfig.fromArray(values);
}
function parseEncapsulation(encapsulation) {
  const symbolName = encapsulation.getSymbolName();
  if (symbolName === null) {
    throw new FatalLinkerError(encapsulation.expression, "Expected encapsulation to have a symbol name");
  }
  const enumValue = ViewEncapsulation[symbolName];
  if (enumValue === void 0) {
    throw new FatalLinkerError(encapsulation.expression, "Unsupported encapsulation");
  }
  return enumValue;
}
function parseChangeDetectionStrategy(changeDetectionStrategy) {
  const symbolName = changeDetectionStrategy.getSymbolName();
  if (symbolName === null) {
    throw new FatalLinkerError(changeDetectionStrategy.expression, "Expected change detection strategy to have a symbol name");
  }
  const enumValue = ChangeDetectionStrategy[symbolName];
  if (enumValue === void 0) {
    throw new FatalLinkerError(changeDetectionStrategy.expression, "Unsupported change detection strategy");
  }
  return enumValue;
}

// bazel-out/k8-fastbuild/bin/packages/compiler-cli/linker/src/file_linker/partial_linkers/partial_factory_linker_1.js
import { compileFactoryFunction, FactoryTarget } from "@angular/compiler";
var PartialFactoryLinkerVersion1 = class {
  linkPartialDeclaration(constantPool, metaObj) {
    const meta = toR3FactoryMeta(metaObj);
    return compileFactoryFunction(meta);
  }
};
function toR3FactoryMeta(metaObj) {
  const typeExpr = metaObj.getValue("type");
  const typeName = typeExpr.getSymbolName();
  if (typeName === null) {
    throw new FatalLinkerError(typeExpr.expression, "Unsupported type, its name could not be determined");
  }
  return {
    name: typeName,
    type: wrapReference(typeExpr.getOpaque()),
    typeArgumentCount: 0,
    target: parseEnum(metaObj.getValue("target"), FactoryTarget),
    deps: getDependencies(metaObj, "deps")
  };
}
function getDependencies(metaObj, propName) {
  if (!metaObj.has(propName)) {
    return null;
  }
  const deps = metaObj.getValue(propName);
  if (deps.isArray()) {
    return deps.getArray().map((dep) => getDependency(dep.getObject()));
  }
  if (deps.isString()) {
    return "invalid";
  }
  return null;
}

// bazel-out/k8-fastbuild/bin/packages/compiler-cli/linker/src/file_linker/partial_linkers/partial_injectable_linker_1.js
import { compileInjectable, createMayBeForwardRefExpression as createMayBeForwardRefExpression2, outputAst as o3 } from "@angular/compiler";
var PartialInjectableLinkerVersion1 = class {
  linkPartialDeclaration(constantPool, metaObj) {
    const meta = toR3InjectableMeta(metaObj);
    return compileInjectable(meta, false);
  }
};
function toR3InjectableMeta(metaObj) {
  const typeExpr = metaObj.getValue("type");
  const typeName = typeExpr.getSymbolName();
  if (typeName === null) {
    throw new FatalLinkerError(typeExpr.expression, "Unsupported type, its name could not be determined");
  }
  const meta = {
    name: typeName,
    type: wrapReference(typeExpr.getOpaque()),
    typeArgumentCount: 0,
    providedIn: metaObj.has("providedIn") ? extractForwardRef(metaObj.getValue("providedIn")) : createMayBeForwardRefExpression2(o3.literal(null), 0)
  };
  if (metaObj.has("useClass")) {
    meta.useClass = extractForwardRef(metaObj.getValue("useClass"));
  }
  if (metaObj.has("useFactory")) {
    meta.useFactory = metaObj.getOpaque("useFactory");
  }
  if (metaObj.has("useExisting")) {
    meta.useExisting = extractForwardRef(metaObj.getValue("useExisting"));
  }
  if (metaObj.has("useValue")) {
    meta.useValue = extractForwardRef(metaObj.getValue("useValue"));
  }
  if (metaObj.has("deps")) {
    meta.deps = metaObj.getArray("deps").map((dep) => getDependency(dep.getObject()));
  }
  return meta;
}

// bazel-out/k8-fastbuild/bin/packages/compiler-cli/linker/src/file_linker/partial_linkers/partial_injector_linker_1.js
import { compileInjector } from "@angular/compiler";
var PartialInjectorLinkerVersion1 = class {
  linkPartialDeclaration(constantPool, metaObj) {
    const meta = toR3InjectorMeta(metaObj);
    return compileInjector(meta);
  }
};
function toR3InjectorMeta(metaObj) {
  const typeExpr = metaObj.getValue("type");
  const typeName = typeExpr.getSymbolName();
  if (typeName === null) {
    throw new FatalLinkerError(typeExpr.expression, "Unsupported type, its name could not be determined");
  }
  return {
    name: typeName,
    type: wrapReference(typeExpr.getOpaque()),
    providers: metaObj.has("providers") ? metaObj.getOpaque("providers") : null,
    imports: metaObj.has("imports") ? metaObj.getArray("imports").map((i) => i.getOpaque()) : []
  };
}

// bazel-out/k8-fastbuild/bin/packages/compiler-cli/linker/src/file_linker/partial_linkers/partial_ng_module_linker_1.js
import { compileNgModule, R3NgModuleMetadataKind, R3SelectorScopeMode } from "@angular/compiler";
var PartialNgModuleLinkerVersion1 = class {
  emitInline;
  constructor(emitInline) {
    this.emitInline = emitInline;
  }
  linkPartialDeclaration(constantPool, metaObj) {
    const meta = toR3NgModuleMeta(metaObj, this.emitInline);
    return compileNgModule(meta);
  }
};
function toR3NgModuleMeta(metaObj, supportJit) {
  const wrappedType = metaObj.getOpaque("type");
  const meta = {
    kind: R3NgModuleMetadataKind.Global,
    type: wrapReference(wrappedType),
    bootstrap: [],
    declarations: [],
    publicDeclarationTypes: null,
    includeImportTypes: true,
    imports: [],
    exports: [],
    selectorScopeMode: supportJit ? R3SelectorScopeMode.Inline : R3SelectorScopeMode.Omit,
    containsForwardDecls: false,
    schemas: [],
    id: metaObj.has("id") ? metaObj.getOpaque("id") : null
  };
  if (metaObj.has("bootstrap")) {
    const bootstrap = metaObj.getValue("bootstrap");
    if (bootstrap.isFunction()) {
      meta.containsForwardDecls = true;
      meta.bootstrap = wrapReferences(unwrapForwardRefs(bootstrap));
    } else
      meta.bootstrap = wrapReferences(bootstrap);
  }
  if (metaObj.has("declarations")) {
    const declarations = metaObj.getValue("declarations");
    if (declarations.isFunction()) {
      meta.containsForwardDecls = true;
      meta.declarations = wrapReferences(unwrapForwardRefs(declarations));
    } else
      meta.declarations = wrapReferences(declarations);
  }
  if (metaObj.has("imports")) {
    const imports = metaObj.getValue("imports");
    if (imports.isFunction()) {
      meta.containsForwardDecls = true;
      meta.imports = wrapReferences(unwrapForwardRefs(imports));
    } else
      meta.imports = wrapReferences(imports);
  }
  if (metaObj.has("exports")) {
    const exports = metaObj.getValue("exports");
    if (exports.isFunction()) {
      meta.containsForwardDecls = true;
      meta.exports = wrapReferences(unwrapForwardRefs(exports));
    } else
      meta.exports = wrapReferences(exports);
  }
  if (metaObj.has("schemas")) {
    const schemas = metaObj.getValue("schemas");
    meta.schemas = wrapReferences(schemas);
  }
  return meta;
}
function unwrapForwardRefs(field) {
  return field.getFunctionReturnValue();
}
function wrapReferences(values) {
  return values.getArray().map((i) => wrapReference(i.getOpaque()));
}

// bazel-out/k8-fastbuild/bin/packages/compiler-cli/linker/src/file_linker/partial_linkers/partial_pipe_linker_1.js
import { compilePipeFromMetadata } from "@angular/compiler";
var PartialPipeLinkerVersion1 = class {
  constructor() {
  }
  linkPartialDeclaration(constantPool, metaObj, version) {
    const meta = toR3PipeMeta(metaObj, version);
    return compilePipeFromMetadata(meta);
  }
};
function toR3PipeMeta(metaObj, version) {
  const typeExpr = metaObj.getValue("type");
  const typeName = typeExpr.getSymbolName();
  if (typeName === null) {
    throw new FatalLinkerError(typeExpr.expression, "Unsupported type, its name could not be determined");
  }
  const pure = metaObj.has("pure") ? metaObj.getBoolean("pure") : true;
  const isStandalone = metaObj.has("isStandalone") ? metaObj.getBoolean("isStandalone") : getDefaultStandaloneValue(version);
  return {
    name: typeName,
    type: wrapReference(typeExpr.getOpaque()),
    typeArgumentCount: 0,
    deps: null,
    pipeName: metaObj.getString("name"),
    pure,
    isStandalone
  };
}

// bazel-out/k8-fastbuild/bin/packages/compiler-cli/linker/src/file_linker/partial_linkers/partial_linker_selector.js
var \u0275\u0275ngDeclareDirective = "\u0275\u0275ngDeclareDirective";
var \u0275\u0275ngDeclareClassMetadata = "\u0275\u0275ngDeclareClassMetadata";
var \u0275\u0275ngDeclareComponent = "\u0275\u0275ngDeclareComponent";
var \u0275\u0275ngDeclareFactory = "\u0275\u0275ngDeclareFactory";
var \u0275\u0275ngDeclareInjectable = "\u0275\u0275ngDeclareInjectable";
var \u0275\u0275ngDeclareInjector = "\u0275\u0275ngDeclareInjector";
var \u0275\u0275ngDeclareNgModule = "\u0275\u0275ngDeclareNgModule";
var \u0275\u0275ngDeclarePipe = "\u0275\u0275ngDeclarePipe";
var \u0275\u0275ngDeclareClassMetadataAsync = "\u0275\u0275ngDeclareClassMetadataAsync";
var declarationFunctions = [
  \u0275\u0275ngDeclareDirective,
  \u0275\u0275ngDeclareClassMetadata,
  \u0275\u0275ngDeclareComponent,
  \u0275\u0275ngDeclareFactory,
  \u0275\u0275ngDeclareInjectable,
  \u0275\u0275ngDeclareInjector,
  \u0275\u0275ngDeclareNgModule,
  \u0275\u0275ngDeclarePipe,
  \u0275\u0275ngDeclareClassMetadataAsync
];
function createLinkerMap(environment, sourceUrl, code) {
  const linkers = /* @__PURE__ */ new Map();
  const LATEST_VERSION_RANGE = getRange("<=", PLACEHOLDER_VERSION);
  linkers.set(\u0275\u0275ngDeclareDirective, [
    { range: LATEST_VERSION_RANGE, linker: new PartialDirectiveLinkerVersion1(sourceUrl, code) }
  ]);
  linkers.set(\u0275\u0275ngDeclareClassMetadataAsync, [
    { range: LATEST_VERSION_RANGE, linker: new PartialClassMetadataAsyncLinkerVersion1() }
  ]);
  linkers.set(\u0275\u0275ngDeclareClassMetadata, [
    { range: LATEST_VERSION_RANGE, linker: new PartialClassMetadataLinkerVersion1() }
  ]);
  linkers.set(\u0275\u0275ngDeclareComponent, [
    {
      range: LATEST_VERSION_RANGE,
      linker: new PartialComponentLinkerVersion1(createGetSourceFile(sourceUrl, code, environment.sourceFileLoader), sourceUrl, code)
    }
  ]);
  linkers.set(\u0275\u0275ngDeclareFactory, [
    { range: LATEST_VERSION_RANGE, linker: new PartialFactoryLinkerVersion1() }
  ]);
  linkers.set(\u0275\u0275ngDeclareInjectable, [
    { range: LATEST_VERSION_RANGE, linker: new PartialInjectableLinkerVersion1() }
  ]);
  linkers.set(\u0275\u0275ngDeclareInjector, [
    { range: LATEST_VERSION_RANGE, linker: new PartialInjectorLinkerVersion1() }
  ]);
  linkers.set(\u0275\u0275ngDeclareNgModule, [
    {
      range: LATEST_VERSION_RANGE,
      linker: new PartialNgModuleLinkerVersion1(environment.options.linkerJitMode)
    }
  ]);
  linkers.set(\u0275\u0275ngDeclarePipe, [
    { range: LATEST_VERSION_RANGE, linker: new PartialPipeLinkerVersion1() }
  ]);
  return linkers;
}
var PartialLinkerSelector = class {
  linkers;
  logger;
  unknownDeclarationVersionHandling;
  constructor(linkers, logger, unknownDeclarationVersionHandling) {
    this.linkers = linkers;
    this.logger = logger;
    this.unknownDeclarationVersionHandling = unknownDeclarationVersionHandling;
  }
  supportsDeclaration(functionName) {
    return this.linkers.has(functionName);
  }
  getLinker(functionName, minVersion, version) {
    if (!this.linkers.has(functionName)) {
      throw new Error(`Unknown partial declaration function ${functionName}.`);
    }
    const linkerRanges = this.linkers.get(functionName);
    if (version === PLACEHOLDER_VERSION) {
      return linkerRanges[linkerRanges.length - 1].linker;
    }
    const declarationRange = getRange(">=", minVersion);
    for (const { range: linkerRange, linker } of linkerRanges) {
      if (semver3.intersects(declarationRange, linkerRange)) {
        return linker;
      }
    }
    const message = `This application depends upon a library published using Angular version ${version}, which requires Angular version ${minVersion} or newer to work correctly.
Consider upgrading your application to use a more recent version of Angular.`;
    if (this.unknownDeclarationVersionHandling === "error") {
      throw new Error(message);
    } else if (this.unknownDeclarationVersionHandling === "warn") {
      this.logger.warn(`${message}
Attempting to continue using this version of Angular.`);
    }
    return linkerRanges[linkerRanges.length - 1].linker;
  }
};
function getRange(comparator, versionStr) {
  if (versionStr === "0.0.0" && PLACEHOLDER_VERSION === "0.0.0") {
    return new semver3.Range("*.*.*");
  }
  const version = new semver3.SemVer(versionStr);
  version.prerelease = [];
  return new semver3.Range(`${comparator}${version.format()}`);
}

// bazel-out/k8-fastbuild/bin/packages/compiler-cli/linker/src/file_linker/file_linker.js
var FileLinker = class {
  linkerEnvironment;
  linkerSelector;
  emitScopes = /* @__PURE__ */ new Map();
  constructor(linkerEnvironment, sourceUrl, code) {
    this.linkerEnvironment = linkerEnvironment;
    this.linkerSelector = new PartialLinkerSelector(createLinkerMap(this.linkerEnvironment, sourceUrl, code), this.linkerEnvironment.logger, this.linkerEnvironment.options.unknownDeclarationVersionHandling);
  }
  isPartialDeclaration(calleeName) {
    return this.linkerSelector.supportsDeclaration(calleeName);
  }
  linkPartialDeclaration(declarationFn, args, declarationScope) {
    if (args.length !== 1) {
      throw new Error(`Invalid function call: It should have only a single object literal argument, but contained ${args.length}.`);
    }
    const metaObj = AstObject.parse(args[0], this.linkerEnvironment.host);
    const ngImport = metaObj.getNode("ngImport");
    const emitScope = this.getEmitScope(ngImport, declarationScope);
    const minVersion = metaObj.getString("minVersion");
    const version = metaObj.getString("version");
    const linker = this.linkerSelector.getLinker(declarationFn, minVersion, version);
    const definition = linker.linkPartialDeclaration(emitScope.constantPool, metaObj, version);
    return emitScope.translateDefinition(definition);
  }
  getConstantStatements() {
    const results = [];
    for (const [constantScope, emitScope] of this.emitScopes.entries()) {
      const statements = emitScope.getConstantStatements();
      results.push({ constantScope, statements });
    }
    return results;
  }
  getEmitScope(ngImport, declarationScope) {
    const constantScope = declarationScope.getConstantScopeRef(ngImport);
    if (constantScope === null) {
      return new LocalEmitScope(ngImport, this.linkerEnvironment.translator, this.linkerEnvironment.factory);
    }
    if (!this.emitScopes.has(constantScope)) {
      this.emitScopes.set(constantScope, new EmitScope(ngImport, this.linkerEnvironment.translator, this.linkerEnvironment.factory));
    }
    return this.emitScopes.get(constantScope);
  }
};

// bazel-out/k8-fastbuild/bin/packages/compiler-cli/linker/src/file_linker/linker_options.js
var DEFAULT_LINKER_OPTIONS = {
  sourceMapping: true,
  linkerJitMode: false,
  unknownDeclarationVersionHandling: "error"
};

// bazel-out/k8-fastbuild/bin/packages/compiler-cli/linker/src/file_linker/translator.js
var Translator = class {
  factory;
  constructor(factory) {
    this.factory = factory;
  }
  translateExpression(expression, imports, options = {}) {
    return expression.visitExpression(new ExpressionTranslatorVisitor(this.factory, imports, null, options), new Context(false));
  }
  translateStatement(statement, imports, options = {}) {
    return statement.visitStatement(new ExpressionTranslatorVisitor(this.factory, imports, null, options), new Context(true));
  }
};

// bazel-out/k8-fastbuild/bin/packages/compiler-cli/linker/src/file_linker/linker_environment.js
var LinkerEnvironment = class {
  fileSystem;
  logger;
  host;
  factory;
  options;
  translator;
  sourceFileLoader;
  constructor(fileSystem, logger, host, factory, options) {
    this.fileSystem = fileSystem;
    this.logger = logger;
    this.host = host;
    this.factory = factory;
    this.options = options;
    this.translator = new Translator(this.factory);
    this.sourceFileLoader = this.options.sourceMapping ? new SourceFileLoader(this.fileSystem, this.logger, {}) : null;
  }
  static create(fileSystem, logger, host, factory, options) {
    return new LinkerEnvironment(fileSystem, logger, host, factory, {
      sourceMapping: options.sourceMapping ?? DEFAULT_LINKER_OPTIONS.sourceMapping,
      linkerJitMode: options.linkerJitMode ?? DEFAULT_LINKER_OPTIONS.linkerJitMode,
      unknownDeclarationVersionHandling: options.unknownDeclarationVersionHandling ?? DEFAULT_LINKER_OPTIONS.unknownDeclarationVersionHandling
    });
  }
};

// bazel-out/k8-fastbuild/bin/packages/compiler-cli/linker/src/file_linker/needs_linking.js
function needsLinking(path, source) {
  return declarationFunctions.some((fn) => source.includes(fn));
}

export {
  FatalLinkerError,
  isFatalLinkerError,
  assert,
  FileLinker,
  DEFAULT_LINKER_OPTIONS,
  LinkerEnvironment,
  needsLinking
};
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
//# sourceMappingURL=chunk-FPHHL4UV.js.map

"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SERVER_APP_ENGINE_MANIFEST_FILENAME = exports.SERVER_APP_MANIFEST_FILENAME = void 0;
exports.generateAngularServerAppEngineManifest = generateAngularServerAppEngineManifest;
exports.generateAngularServerAppManifest = generateAngularServerAppManifest;
const node_path_1 = require("node:path");
const node_vm_1 = require("node:vm");
const bundler_context_1 = require("../../tools/esbuild/bundler-context");
const utils_1 = require("../../tools/esbuild/utils");
const environment_options_1 = require("../environment-options");
exports.SERVER_APP_MANIFEST_FILENAME = 'angular-app-manifest.mjs';
exports.SERVER_APP_ENGINE_MANIFEST_FILENAME = 'angular-app-engine-manifest.mjs';
const MAIN_SERVER_OUTPUT_FILENAME = 'main.server.mjs';
/**
 * A mapping of unsafe characters to their escaped Unicode equivalents.
 */
const UNSAFE_CHAR_MAP = {
    '`': '\\`',
    '$': '\\$',
    '\\': '\\\\',
};
/**
 * Escapes unsafe characters in a given string by replacing them with
 * their Unicode escape sequences.
 *
 * @param str - The string to be escaped.
 * @returns The escaped string where unsafe characters are replaced.
 */
function escapeUnsafeChars(str) {
    return str.replace(/[$`\\]/g, (c) => UNSAFE_CHAR_MAP[c]);
}
/**
 * Generates the server manifest for the App Engine environment.
 *
 * This manifest is used to configure the server-side rendering (SSR) setup for the
 * Angular application when deployed to Google App Engine. It includes the entry points
 * for different locales and the base HREF for the application.
 *
 * @param i18nOptions - The internationalization options for the application build. This
 * includes settings for inlining locales and determining the output structure.
 * @param baseHref - The base HREF for the application. This is used to set the base URL
 * for all relative URLs in the application.
 */
function generateAngularServerAppEngineManifest(i18nOptions, baseHref) {
    const entryPoints = {};
    const supportedLocales = {};
    if (i18nOptions.shouldInline && !i18nOptions.flatOutput) {
        for (const locale of i18nOptions.inlineLocales) {
            const { subPath } = i18nOptions.locales[locale];
            const importPath = `${subPath ? `${subPath}/` : ''}${MAIN_SERVER_OUTPUT_FILENAME}`;
            entryPoints[subPath] = `() => import('./${importPath}')`;
            supportedLocales[locale] = subPath;
        }
    }
    else {
        entryPoints[''] = `() => import('./${MAIN_SERVER_OUTPUT_FILENAME}')`;
        supportedLocales[i18nOptions.sourceLocale] = '';
    }
    // Remove trailing slash but retain leading slash.
    let basePath = baseHref || '/';
    if (basePath.length > 1 && basePath[basePath.length - 1] === '/') {
        basePath = basePath.slice(0, -1);
    }
    const manifestContent = `
export default {
  basePath: '${basePath}',
  supportedLocales: ${JSON.stringify(supportedLocales, undefined, 2)},
  entryPoints: {
    ${Object.entries(entryPoints)
        .map(([key, value]) => `'${key}': ${value}`)
        .join(',\n    ')}
  },
};
`;
    return manifestContent;
}
/**
 * Generates the server manifest for the standard Node.js environment.
 *
 * This manifest is used to configure the server-side rendering (SSR) setup for the
 * Angular application when running in a standard Node.js environment. It includes
 * information about the bootstrap module, whether to inline critical CSS, and any
 * additional HTML and CSS output files.
 *
 * @param additionalHtmlOutputFiles - A map of additional HTML output files generated
 * during the build process, keyed by their file paths.
 * @param outputFiles - An array of all output files from the build process, including
 * JavaScript and CSS files.
 * @param inlineCriticalCss - A boolean indicating whether critical CSS should be inlined
 * in the server-side rendered pages.
 * @param routes - An optional array of route definitions for the application, used for
 * server-side rendering and routing.
 * @param locale - An optional string representing the locale or language code to be used for
 * the application, helping with localization and rendering content specific to the locale.
 * @param baseHref - The base HREF for the application. This is used to set the base URL
 * for all relative URLs in the application.
 * @param initialFiles - A list of initial files that preload tags have already been added for.
 * @param metafile - An esbuild metafile object.
 * @param publicPath - The configured public path.
 *
 * @returns An object containing:
 * - `manifestContent`: A string of the SSR manifest content.
 * - `serverAssetsChunks`: An array of build output files containing the generated assets for the server.
 */
function generateAngularServerAppManifest(additionalHtmlOutputFiles, outputFiles, inlineCriticalCss, routes, locale, baseHref, initialFiles, metafile, publicPath) {
    const serverAssetsChunks = [];
    const serverAssets = {};
    for (const file of [...additionalHtmlOutputFiles.values(), ...outputFiles]) {
        const extension = (0, node_path_1.extname)(file.path);
        if (extension === '.html' || (inlineCriticalCss && extension === '.css')) {
            const jsChunkFilePath = `assets-chunks/${file.path.replace(/[./]/g, '_')}.mjs`;
            const escapedContent = escapeUnsafeChars(file.text);
            serverAssetsChunks.push((0, utils_1.createOutputFile)(jsChunkFilePath, `export default \`${escapedContent}\`;`, bundler_context_1.BuildOutputFileType.ServerApplication));
            // This is needed because JavaScript engines script parser convert `\r\n` to `\n` in template literals,
            // which can result in an incorrect byte length.
            const size = (0, node_vm_1.runInThisContext)(`new TextEncoder().encode(\`${escapedContent}\`).byteLength`);
            serverAssets[file.path] =
                `{size: ${size}, hash: '${file.hash}', text: () => import('./${jsChunkFilePath}').then(m => m.default)}`;
        }
    }
    // When routes have been extracted, mappings are no longer needed, as preloads will be included in the metadata.
    // When shouldOptimizeChunks is enabled the metadata is no longer correct and thus we cannot generate the mappings.
    const entryPointToBrowserMapping = routes?.length || environment_options_1.shouldOptimizeChunks
        ? undefined
        : generateLazyLoadedFilesMappings(metafile, initialFiles, publicPath);
    const manifestContent = `
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: ${inlineCriticalCss},
  baseHref: '${baseHref}',
  locale: ${JSON.stringify(locale)},
  routes: ${JSON.stringify(routes, undefined, 2)},
  entryPointToBrowserMapping: ${JSON.stringify(entryPointToBrowserMapping, undefined, 2)},
  assets: {
    ${Object.entries(serverAssets)
        .map(([key, value]) => `'${key}': ${value}`)
        .join(',\n    ')}
  },
};
`;
    return { manifestContent, serverAssetsChunks };
}
/**
 * Maps entry points to their corresponding browser bundles for lazy loading.
 *
 * This function processes a metafile's outputs to generate a mapping between browser-side entry points
 * and the associated JavaScript files that should be loaded in the browser. It includes the entry-point's
 * own path and any valid imports while excluding initial files or external resources.
 */
function generateLazyLoadedFilesMappings(metafile, initialFiles, publicPath = '') {
    const entryPointToBundles = {};
    for (const [fileName, { entryPoint, exports, imports }] of Object.entries(metafile.outputs)) {
        // Skip files that don't have an entryPoint, no exports, or are not .js
        if (!entryPoint || exports?.length < 1 || !fileName.endsWith('.js')) {
            continue;
        }
        const importedPaths = [`${publicPath}${fileName}`];
        for (const { kind, external, path } of imports) {
            if (external || initialFiles.has(path) || kind !== 'import-statement') {
                continue;
            }
            importedPaths.push(`${publicPath}${path}`);
        }
        entryPointToBundles[entryPoint] = importedPaths;
    }
    return entryPointToBundles;
}

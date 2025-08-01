/**
 * @license Angular v20.1.0
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */

import * as i0 from '@angular/core';
import { ProviderToken, Type, NgModuleFactory, Provider, EnvironmentProviders, EnvironmentInjector, InjectionToken, Signal, ComponentRef, EventEmitter, OnDestroy, OnInit, SimpleChanges, OnChanges, Renderer2, ElementRef, AfterContentInit, QueryList, ChangeDetectorRef, ModuleWithProviders } from '@angular/core';
import { Observable } from 'rxjs';
import { LocationStrategy } from '@angular/common';

/**
 * The primary routing outlet.
 *
 * @publicApi
 */
declare const PRIMARY_OUTLET = "primary";
/**
 * A collection of matrix and query URL parameters.
 * @see {@link convertToParamMap}
 * @see {@link ParamMap}
 *
 * @publicApi
 */
type Params = {
    [key: string]: any;
};
/**
 * A map that provides access to the required and optional parameters
 * specific to a route.
 * The map supports retrieving a single value with `get()`
 * or multiple values with `getAll()`.
 *
 * @see [URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams)
 *
 * @publicApi
 */
interface ParamMap {
    /**
     * Reports whether the map contains a given parameter.
     * @param name The parameter name.
     * @returns True if the map contains the given parameter, false otherwise.
     */
    has(name: string): boolean;
    /**
     * Retrieves a single value for a parameter.
     * @param name The parameter name.
     * @return The parameter's single value,
     * or the first value if the parameter has multiple values,
     * or `null` when there is no such parameter.
     */
    get(name: string): string | null;
    /**
     * Retrieves multiple values for a parameter.
     * @param name The parameter name.
     * @return An array containing one or more values,
     * or an empty array if there is no such parameter.
     *
     */
    getAll(name: string): string[];
    /** Names of the parameters in the map. */
    readonly keys: string[];
}
/**
 * Converts a `Params` instance to a `ParamMap`.
 * @param params The instance to convert.
 * @returns The new map instance.
 *
 * @publicApi
 */
declare function convertToParamMap(params: Params): ParamMap;
/**
 * Matches the route configuration (`route`) against the actual URL (`segments`).
 *
 * When no matcher is defined on a `Route`, this is the matcher used by the Router by default.
 *
 * @param segments The remaining unmatched segments in the current navigation
 * @param segmentGroup The current segment group being matched
 * @param route The `Route` to match against.
 *
 * @see {@link UrlMatchResult}
 * @see {@link Route}
 *
 * @returns The resulting match information or `null` if the `route` should not match.
 * @publicApi
 */
declare function defaultUrlMatcher(segments: UrlSegment[], segmentGroup: UrlSegmentGroup, route: Route): UrlMatchResult | null;

/**
 * A set of options which specify how to determine if a `UrlTree` is active, given the `UrlTree`
 * for the current router state.
 *
 * @publicApi
 * @see {@link Router#isActive}
 */
interface IsActiveMatchOptions {
    /**
     * Defines the strategy for comparing the matrix parameters of two `UrlTree`s.
     *
     * The matrix parameter matching is dependent on the strategy for matching the
     * segments. That is, if the `paths` option is set to `'subset'`, only
     * the matrix parameters of the matching segments will be compared.
     *
     * - `'exact'`: Requires that matching segments also have exact matrix parameter
     * matches.
     * - `'subset'`: The matching segments in the router's active `UrlTree` may contain
     * extra matrix parameters, but those that exist in the `UrlTree` in question must match.
     * - `'ignored'`: When comparing `UrlTree`s, matrix params will be ignored.
     */
    matrixParams: 'exact' | 'subset' | 'ignored';
    /**
     * Defines the strategy for comparing the query parameters of two `UrlTree`s.
     *
     * - `'exact'`: the query parameters must match exactly.
     * - `'subset'`: the active `UrlTree` may contain extra parameters,
     * but must match the key and value of any that exist in the `UrlTree` in question.
     * - `'ignored'`: When comparing `UrlTree`s, query params will be ignored.
     */
    queryParams: 'exact' | 'subset' | 'ignored';
    /**
     * Defines the strategy for comparing the `UrlSegment`s of the `UrlTree`s.
     *
     * - `'exact'`: all segments in each `UrlTree` must match.
     * - `'subset'`: a `UrlTree` will be determined to be active if it
     * is a subtree of the active route. That is, the active route may contain extra
     * segments, but must at least have all the segments of the `UrlTree` in question.
     */
    paths: 'exact' | 'subset';
    /**
     * - `'exact'`: indicates that the `UrlTree` fragments must be equal.
     * - `'ignored'`: the fragments will not be compared when determining if a
     * `UrlTree` is active.
     */
    fragment: 'exact' | 'ignored';
}
/**
 * @description
 *
 * Represents the parsed URL.
 *
 * Since a router state is a tree, and the URL is nothing but a serialized state, the URL is a
 * serialized tree.
 * UrlTree is a data structure that provides a lot of affordances in dealing with URLs
 *
 * @usageNotes
 * ### Example
 *
 * ```ts
 * @Component({templateUrl:'template.html'})
 * class MyComponent {
 *   constructor(router: Router) {
 *     const tree: UrlTree =
 *       router.parseUrl('/team/33/(user/victor//support:help)?debug=true#fragment');
 *     const f = tree.fragment; // return 'fragment'
 *     const q = tree.queryParams; // returns {debug: 'true'}
 *     const g: UrlSegmentGroup = tree.root.children[PRIMARY_OUTLET];
 *     const s: UrlSegment[] = g.segments; // returns 2 segments 'team' and '33'
 *     g.children[PRIMARY_OUTLET].segments; // returns 2 segments 'user' and 'victor'
 *     g.children['support'].segments; // return 1 segment 'help'
 *   }
 * }
 * ```
 *
 * @publicApi
 */
declare class UrlTree {
    /** The root segment group of the URL tree */
    root: UrlSegmentGroup;
    /** The query params of the URL */
    queryParams: Params;
    /** The fragment of the URL */
    fragment: string | null;
    constructor(
    /** The root segment group of the URL tree */
    root?: UrlSegmentGroup, 
    /** The query params of the URL */
    queryParams?: Params, 
    /** The fragment of the URL */
    fragment?: string | null);
    get queryParamMap(): ParamMap;
    /** @docsNotRequired */
    toString(): string;
}
/**
 * @description
 *
 * Represents the parsed URL segment group.
 *
 * See `UrlTree` for more information.
 *
 * @publicApi
 */
declare class UrlSegmentGroup {
    /** The URL segments of this group. See `UrlSegment` for more information */
    segments: UrlSegment[];
    /** The list of children of this group */
    children: {
        [key: string]: UrlSegmentGroup;
    };
    /** The parent node in the url tree */
    parent: UrlSegmentGroup | null;
    constructor(
    /** The URL segments of this group. See `UrlSegment` for more information */
    segments: UrlSegment[], 
    /** The list of children of this group */
    children: {
        [key: string]: UrlSegmentGroup;
    });
    /** Whether the segment has child segments */
    hasChildren(): boolean;
    /** Number of child segments */
    get numberOfChildren(): number;
    /** @docsNotRequired */
    toString(): string;
}
/**
 * @description
 *
 * Represents a single URL segment.
 *
 * A UrlSegment is a part of a URL between the two slashes. It contains a path and the matrix
 * parameters associated with the segment.
 *
 * @usageNotes
 * ### Example
 *
 * ```ts
 * @Component({templateUrl:'template.html'})
 * class MyComponent {
 *   constructor(router: Router) {
 *     const tree: UrlTree = router.parseUrl('/team;id=33');
 *     const g: UrlSegmentGroup = tree.root.children[PRIMARY_OUTLET];
 *     const s: UrlSegment[] = g.segments;
 *     s[0].path; // returns 'team'
 *     s[0].parameters; // returns {id: 33}
 *   }
 * }
 * ```
 *
 * @publicApi
 */
declare class UrlSegment {
    /** The path part of a URL segment */
    path: string;
    /** The matrix parameters associated with a segment */
    parameters: {
        [name: string]: string;
    };
    constructor(
    /** The path part of a URL segment */
    path: string, 
    /** The matrix parameters associated with a segment */
    parameters: {
        [name: string]: string;
    });
    get parameterMap(): ParamMap;
    /** @docsNotRequired */
    toString(): string;
}
/**
 * @description
 *
 * Serializes and deserializes a URL string into a URL tree.
 *
 * The url serialization strategy is customizable. You can
 * make all URLs case insensitive by providing a custom UrlSerializer.
 *
 * See `DefaultUrlSerializer` for an example of a URL serializer.
 *
 * @publicApi
 */
declare abstract class UrlSerializer {
    /** Parse a url into a `UrlTree` */
    abstract parse(url: string): UrlTree;
    /** Converts a `UrlTree` into a url */
    abstract serialize(tree: UrlTree): string;
    static ɵfac: i0.ɵɵFactoryDeclaration<UrlSerializer, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<UrlSerializer>;
}
/**
 * @description
 *
 * A default implementation of the `UrlSerializer`.
 *
 * Example URLs:
 *
 * ```
 * /inbox/33(popup:compose)
 * /inbox/33;open=true/messages/44
 * ```
 *
 * DefaultUrlSerializer uses parentheses to serialize secondary segments (e.g., popup:compose), the
 * colon syntax to specify the outlet, and the ';parameter=value' syntax (e.g., open=true) to
 * specify route specific parameters.
 *
 * @publicApi
 */
declare class DefaultUrlSerializer implements UrlSerializer {
    /** Parses a url into a `UrlTree` */
    parse(url: string): UrlTree;
    /** Converts a `UrlTree` into a url */
    serialize(tree: UrlTree): string;
}

/**
 * How to handle a navigation request to the current URL. One of:
 *
 * - `'ignore'` : The router ignores the request if it is the same as the current state.
 * - `'reload'` : The router processes the URL even if it is not different from the current state.
 * One example of when you might want to use this option is if a `canMatch` guard depends on the
 * application state and initially rejects navigation to a route. After fixing the state, you want
 * to re-navigate to the same URL so that the route with the `canMatch` guard can activate.
 *
 * Note that this only configures whether or not the Route reprocesses the URL and triggers related
 * actions and events like redirects, guards, and resolvers. By default, the router re-uses a
 * component instance when it re-navigates to the same component type without visiting a different
 * component first. This behavior is configured by the `RouteReuseStrategy`. In order to reload
 * routed components on same url navigation, you need to set `onSameUrlNavigation` to `'reload'`
 * _and_ provide a `RouteReuseStrategy` which returns `false` for `shouldReuseRoute`. Additionally,
 * resolvers and most guards for routes do not run unless the path or path params have changed
 * (configured by `runGuardsAndResolvers`).
 *
 * @publicApi
 * @see {@link RouteReuseStrategy}
 * @see {@link RunGuardsAndResolvers}
 * @see {@link NavigationBehaviorOptions}
 * @see {@link RouterConfigOptions}
 */
type OnSameUrlNavigation = 'reload' | 'ignore';
/**
 * The `InjectionToken` and `@Injectable` classes for guards are deprecated in favor
 * of plain JavaScript functions instead. Dependency injection can still be achieved using the
 * [`inject`](api/core/inject) function from `@angular/core` and an injectable class can be used as
 * a functional guard using [`inject`](api/core/inject): `canActivate: [() =>
 * inject(myGuard).canActivate()]`.
 *
 * @deprecated
 * @see {@link CanMatchFn}
 * @see {@link CanLoadFn}
 * @see {@link CanActivateFn}
 * @see {@link CanActivateChildFn}
 * @see {@link CanDeactivateFn}
 * @see {@link /api/core/inject inject}
 * @publicApi
 */
type DeprecatedGuard = ProviderToken<any> | string;
/**
 * The `InjectionToken` and `@Injectable` classes for resolvers are deprecated in favor
 * of plain JavaScript functions instead. Dependency injection can still be achieved using the
 * [`inject`](api/core/inject) function from `@angular/core` and an injectable class can be used as
 * a functional guard using [`inject`](api/core/inject): `myResolvedData: () => inject(MyResolver).resolve()`.
 *
 * @deprecated
 * @see {@link ResolveFn}
 * @see {@link /api/core/inject inject}
 * @publicApi
 */
type DeprecatedResolve = DeprecatedGuard | any;
/**
 * The supported types that can be returned from a `Router` guard.
 *
 * @see [Routing guide](guide/routing/common-router-tasks#preventing-unauthorized-access)
 * @publicApi
 */
type GuardResult = boolean | UrlTree | RedirectCommand;
/**
 * Can be returned by a `Router` guard to instruct the `Router` to redirect rather than continue
 * processing the path of the in-flight navigation. The `redirectTo` indicates _where_ the new
 * navigation should go to and the optional `navigationBehaviorOptions` can provide more information
 * about _how_ to perform the navigation.
 *
 * ```ts
 * const route: Route = {
 *   path: "user/:userId",
 *   component: User,
 *   canActivate: [
 *     () => {
 *       const router = inject(Router);
 *       const authService = inject(AuthenticationService);
 *
 *       if (!authService.isLoggedIn()) {
 *         const loginPath = router.parseUrl("/login");
 *         return new RedirectCommand(loginPath, {
 *           skipLocationChange: true,
 *         });
 *       }
 *
 *       return true;
 *     },
 *   ],
 * };
 * ```
 * @see [Routing guide](guide/routing/common-router-tasks#preventing-unauthorized-access)
 *
 * @publicApi
 */
declare class RedirectCommand {
    readonly redirectTo: UrlTree;
    readonly navigationBehaviorOptions?: NavigationBehaviorOptions | undefined;
    constructor(redirectTo: UrlTree, navigationBehaviorOptions?: NavigationBehaviorOptions | undefined);
}
/**
 * Type used to represent a value which may be synchronous or async.
 *
 * @publicApi
 */
type MaybeAsync<T> = T | Observable<T> | Promise<T>;
/**
 * Represents a route configuration for the Router service.
 * An array of `Route` objects, used in `Router.config` and for nested route configurations
 * in `Route.children`.
 *
 * @see {@link Route}
 * @see {@link Router}
 * @see [Router configuration guide](guide/routing/router-reference#configuration)
 * @publicApi
 */
type Routes = Route[];
/**
 * Represents the result of matching URLs with a custom matching function.
 *
 * * `consumed` is an array of the consumed URL segments.
 * * `posParams` is a map of positional parameters.
 *
 * @see {@link UrlMatcher}
 * @publicApi
 */
type UrlMatchResult = {
    consumed: UrlSegment[];
    posParams?: {
        [name: string]: UrlSegment;
    };
};
/**
 * A function for matching a route against URLs. Implement a custom URL matcher
 * for `Route.matcher` when a combination of `path` and `pathMatch`
 * is not expressive enough. Cannot be used together with `path` and `pathMatch`.
 *
 * The function takes the following arguments and returns a `UrlMatchResult` object.
 * * *segments* : An array of URL segments.
 * * *group* : A segment group.
 * * *route* : The route to match against.
 *
 * The following example implementation matches HTML files.
 *
 * ```ts
 * export function htmlFiles(url: UrlSegment[]) {
 *   return url.length === 1 && url[0].path.endsWith('.html') ? ({consumed: url}) : null;
 * }
 *
 * export const routes = [{ matcher: htmlFiles, component: AnyComponent }];
 * ```
 *
 * @publicApi
 */
type UrlMatcher = (segments: UrlSegment[], group: UrlSegmentGroup, route: Route) => UrlMatchResult | null;
/**
 *
 * Represents static data associated with a particular route.
 *
 * @see {@link Route#data}
 *
 * @publicApi
 */
type Data = {
    [key: string | symbol]: any;
};
/**
 *
 * Represents the resolved data associated with a particular route.
 *
 * Returning a `RedirectCommand` directs the router to cancel the current navigation and redirect to
 * the location provided in the `RedirectCommand`. Note that there are no ordering guarantees when
 * resolvers execute. If multiple resolvers would return a `RedirectCommand`, only the first one
 * returned will be used.
 *
 * @see {@link Route#resolve}
 *
 * @publicApi
 */
type ResolveData = {
    [key: string | symbol]: ResolveFn<unknown> | DeprecatedResolve;
};
/**
 * An ES Module object with a default export of the given type.
 *
 * @see {@link Route#loadComponent}
 * @see {@link LoadChildrenCallback}
 *
 * @publicApi
 */
interface DefaultExport<T> {
    /**
     * Default exports are bound under the name `"default"`, per the ES Module spec:
     * https://tc39.es/ecma262/#table-export-forms-mapping-to-exportentry-records
     */
    default: T;
}
/**
 *
 * A function that is called to resolve a collection of lazy-loaded routes.
 * Must be an arrow function of the following form:
 * `() => import('...').then(mod => mod.MODULE)`
 * or
 * `() => import('...').then(mod => mod.ROUTES)`
 *
 * For example:
 *
 * ```ts
 * [{
 *   path: 'lazy',
 *   loadChildren: () => import('./lazy-route/lazy.module').then(mod => mod.LazyModule),
 * }];
 * ```
 * or
 * ```ts
 * [{
 *   path: 'lazy',
 *   loadChildren: () => import('./lazy-route/lazy.routes').then(mod => mod.ROUTES),
 * }];
 * ```
 *
 * If the lazy-loaded routes are exported via a `default` export, the `.then` can be omitted:
 * ```ts
 * [{
 *   path: 'lazy',
 *   loadChildren: () => import('./lazy-route/lazy.routes'),
 * }];
 * ```
 *
 * @see {@link Route#loadChildren}
 * @publicApi
 */
type LoadChildrenCallback = () => Type<any> | NgModuleFactory<any> | Routes | Observable<Type<any> | Routes | DefaultExport<Type<any>> | DefaultExport<Routes>> | Promise<NgModuleFactory<any> | Type<any> | Routes | DefaultExport<Type<any>> | DefaultExport<Routes>>;
/**
 *
 * A function that returns a set of routes to load.
 *
 * @see {@link LoadChildrenCallback}
 * @publicApi
 */
type LoadChildren = LoadChildrenCallback;
/**
 *
 * How to handle query parameters in a router link.
 * One of:
 * - `"merge"` : Merge new parameters with current parameters.
 * - `"preserve"` : Preserve current parameters.
 * - `"replace"` : Replace current parameters with new parameters. This is the default behavior.
 * - `""` : For legacy reasons, the same as `'replace'`.
 *
 * @see {@link UrlCreationOptions#queryParamsHandling}
 * @see {@link RouterLink}
 * @publicApi
 */
type QueryParamsHandling = 'merge' | 'preserve' | 'replace' | '';
/**
 * The type for the function that can be used to handle redirects when the path matches a `Route` config.
 *
 * The `RedirectFunction` does _not_ have access to the full
 * `ActivatedRouteSnapshot` interface. Some data are not accurately known
 * at the route matching phase. For example, resolvers are not run until
 * later, so any resolved title would not be populated. The same goes for lazy
 * loaded components. This is also true for all the snapshots up to the
 * root, so properties that include parents (root, parent, pathFromRoot)
 * are also excluded. And naturally, the full route matching hasn't yet
 * happened so firstChild and children are not available either.
 *
 * @see {@link Route#redirectTo}
 * @publicApi
 */
type RedirectFunction = (redirectData: Pick<ActivatedRouteSnapshot, 'routeConfig' | 'url' | 'params' | 'queryParams' | 'fragment' | 'data' | 'outlet' | 'title'>) => MaybeAsync<string | UrlTree>;
/**
 * A policy for when to run guards and resolvers on a route.
 *
 * Guards and/or resolvers will always run when a route is activated or deactivated. When a route is
 * unchanged, the default behavior is the same as `paramsChange`.
 *
 * `paramsChange` : Rerun the guards and resolvers when path or
 * path param changes. This does not include query parameters. This option is the default.
 * - `always` : Run on every execution.
 * - `pathParamsChange` : Rerun guards and resolvers when the path params
 * change. This does not compare matrix or query parameters.
 * - `paramsOrQueryParamsChange` : Run when path, matrix, or query parameters change.
 * - `pathParamsOrQueryParamsChange` : Rerun guards and resolvers when the path params
 * change or query params have changed. This does not include matrix parameters.
 *
 * @see {@link Route#runGuardsAndResolvers}
 * @publicApi
 */
type RunGuardsAndResolvers = 'pathParamsChange' | 'pathParamsOrQueryParamsChange' | 'paramsChange' | 'paramsOrQueryParamsChange' | 'always' | ((from: ActivatedRouteSnapshot, to: ActivatedRouteSnapshot) => boolean);
/**
 * A configuration object that defines a single route.
 * A set of routes are collected in a `Routes` array to define a `Router` configuration.
 * The router attempts to match segments of a given URL against each route,
 * using the configuration options defined in this object.
 *
 * Supports static, parameterized, redirect, and wildcard routes, as well as
 * custom route data and resolve methods.
 *
 * For detailed usage information, see the [Routing Guide](guide/routing/common-router-tasks).
 *
 * @usageNotes
 *
 * ### Simple Configuration
 *
 * The following route specifies that when navigating to, for example,
 * `/team/11/user/bob`, the router creates the 'Team' component
 * with the 'User' child component in it.
 *
 * ```ts
 * [{
 *   path: 'team/:id',
 *  component: Team,
 *   children: [{
 *     path: 'user/:name',
 *     component: User
 *   }]
 * }]
 * ```
 *
 * ### Multiple Outlets
 *
 * The following route creates sibling components with multiple outlets.
 * When navigating to `/team/11(aux:chat/jim)`, the router creates the 'Team' component next to
 * the 'Chat' component. The 'Chat' component is placed into the 'aux' outlet.
 *
 * ```ts
 * [{
 *   path: 'team/:id',
 *   component: Team
 * }, {
 *   path: 'chat/:user',
 *   component: Chat
 *   outlet: 'aux'
 * }]
 * ```
 *
 * ### Wild Cards
 *
 * The following route uses wild-card notation to specify a component
 * that is always instantiated regardless of where you navigate to.
 *
 * ```ts
 * [{
 *   path: '**',
 *   component: WildcardComponent
 * }]
 * ```
 *
 * ### Redirects
 *
 * The following route uses the `redirectTo` property to ignore a segment of
 * a given URL when looking for a child path.
 *
 * When navigating to '/team/11/legacy/user/jim', the router changes the URL segment
 * '/team/11/legacy/user/jim' to '/team/11/user/jim', and then instantiates
 * the Team component with the User child component in it.
 *
 * ```ts
 * [{
 *   path: 'team/:id',
 *   component: Team,
 *   children: [{
 *     path: 'legacy/user/:name',
 *     redirectTo: 'user/:name'
 *   }, {
 *     path: 'user/:name',
 *     component: User
 *   }]
 * }]
 * ```
 *
 * The redirect path can be relative, as shown in this example, or absolute.
 * If we change the `redirectTo` value in the example to the absolute URL segment '/user/:name',
 * the result URL is also absolute, '/user/jim'.

 * ### Empty Path
 *
 * Empty-path route configurations can be used to instantiate components that do not 'consume'
 * any URL segments.
 *
 * In the following configuration, when navigating to
 * `/team/11`, the router instantiates the 'AllUsers' component.
 *
 * ```ts
 * [{
 *   path: 'team/:id',
 *   component: Team,
 *   children: [{
 *     path: '',
 *     component: AllUsers
 *   }, {
 *     path: 'user/:name',
 *     component: User
 *   }]
 * }]
 * ```
 *
 * Empty-path routes can have children. In the following example, when navigating
 * to `/team/11/user/jim`, the router instantiates the wrapper component with
 * the user component in it.
 *
 * Note that an empty path route inherits its parent's parameters and data.
 *
 * ```ts
 * [{
 *   path: 'team/:id',
 *   component: Team,
 *   children: [{
 *     path: '',
 *     component: WrapperCmp,
 *     children: [{
 *       path: 'user/:name',
 *       component: User
 *     }]
 *   }]
 * }]
 * ```
 *
 * ### Matching Strategy
 *
 * The default path-match strategy is 'prefix', which means that the router
 * checks URL elements from the left to see if the URL matches a specified path.
 * For example, '/team/11/user' matches 'team/:id'.
 *
 * ```ts
 * [{
 *   path: '',
 *   pathMatch: 'prefix', //default
 *   redirectTo: 'main'
 * }, {
 *   path: 'main',
 *   component: Main
 * }]
 * ```
 *
 * You can specify the path-match strategy 'full' to make sure that the path
 * covers the whole unconsumed URL. It is important to do this when redirecting
 * empty-path routes. Otherwise, because an empty path is a prefix of any URL,
 * the router would apply the redirect even when navigating to the redirect destination,
 * creating an endless loop.
 *
 * In the following example, supplying the 'full' `pathMatch` strategy ensures
 * that the router applies the redirect if and only if navigating to '/'.
 *
 * ```ts
 * [{
 *   path: '',
 *   pathMatch: 'full',
 *   redirectTo: 'main'
 * }, {
 *   path: 'main',
 *   component: Main
 * }]
 * ```
 *
 * ### Componentless Routes
 *
 * You can share parameters between sibling components.
 * For example, suppose that two sibling components should go next to each other,
 * and both of them require an ID parameter. You can accomplish this using a route
 * that does not specify a component at the top level.
 *
 * In the following example, 'MainChild' and 'AuxChild' are siblings.
 * When navigating to 'parent/10/(a//aux:b)', the route instantiates
 * the main child and aux child components next to each other.
 * For this to work, the application component must have the primary and aux outlets defined.
 *
 * ```ts
 * [{
 *    path: 'parent/:id',
 *    children: [
 *      { path: 'a', component: MainChild },
 *      { path: 'b', component: AuxChild, outlet: 'aux' }
 *    ]
 * }]
 * ```
 *
 * The router merges the parameters, data, and resolve of the componentless
 * parent into the parameters, data, and resolve of the children.
 *
 * This is especially useful when child components are defined
 * with an empty path string, as in the following example.
 * With this configuration, navigating to '/parent/10' creates
 * the main child and aux components.
 *
 * ```ts
 * [{
 *    path: 'parent/:id',
 *    children: [
 *      { path: '', component: MainChild },
 *      { path: '', component: AuxChild, outlet: 'aux' }
 *    ]
 * }]
 * ```
 *
 * ### Lazy Loading
 *
 * Lazy loading speeds up application load time by splitting the application
 * into multiple bundles and loading them on demand.
 * To use lazy loading, provide the `loadChildren` property in the `Route` object,
 * instead of the `children` property.
 *
 * Given the following example route, the router will lazy load
 * the associated module on demand using the browser native import system.
 *
 * ```ts
 * [{
 *   path: 'lazy',
 *   loadChildren: () => import('./lazy-route/lazy.module').then(mod => mod.LazyModule),
 * }];
 * ```
 *
 * @publicApi
 */
interface Route {
    /**
     * Used to define a page title for the route. This can be a static string or an `Injectable` that
     * implements `Resolve`.
     *
     * @see {@link TitleStrategy}
     */
    title?: string | Type<Resolve<string>> | ResolveFn<string>;
    /**
     * The path to match against. Cannot be used together with a custom `matcher` function.
     * A URL string that uses router matching notation.
     * Can be a wild card (`**`) that matches any URL (see Usage Notes below).
     * Default is "/" (the root path).
     *
     */
    path?: string;
    /**
     * The path-matching strategy, one of 'prefix' or 'full'.
     * Default is 'prefix'.
     *
     * By default, the router checks URL elements from the left to see if the URL
     * matches a given path and stops when there is a config match. Importantly there must still be a
     * config match for each segment of the URL. For example, '/team/11/user' matches the prefix
     * 'team/:id' if one of the route's children matches the segment 'user'. That is, the URL
     * '/team/11/user' matches the config
     * `{path: 'team/:id', children: [{path: ':user', component: User}]}`
     * but does not match when there are no children as in `{path: 'team/:id', component: Team}`.
     *
     * The path-match strategy 'full' matches against the entire URL.
     * It is important to do this when redirecting empty-path routes.
     * Otherwise, because an empty path is a prefix of any URL,
     * the router would apply the redirect even when navigating
     * to the redirect destination, creating an endless loop.
     *
     */
    pathMatch?: 'prefix' | 'full';
    /**
     * A custom URL-matching function. Cannot be used together with `path`.
     */
    matcher?: UrlMatcher;
    /**
     * The component to instantiate when the path matches.
     * Can be empty if child routes specify components.
     */
    component?: Type<any>;
    /**
     * An object specifying a lazy-loaded component.
     */
    loadComponent?: () => Type<unknown> | Observable<Type<unknown> | DefaultExport<Type<unknown>>> | Promise<Type<unknown> | DefaultExport<Type<unknown>>>;
    /**
     * A URL or function that returns a URL to redirect to when the path matches.
     *
     * Absolute if the URL begins with a slash (/) or the function returns a `UrlTree`, otherwise
     * relative to the path URL.
     *
     * The `RedirectFunction` is run in an injection context so it can call `inject` to get any
     * required dependencies.
     *
     * When not present, router does not redirect.
     */
    redirectTo?: string | RedirectFunction;
    /**
     * Name of a `RouterOutlet` object where the component can be placed
     * when the path matches.
     */
    outlet?: string;
    /**
     * An array of `CanActivateFn` or DI tokens used to look up `CanActivate()`
     * handlers, in order to determine if the current user is allowed to
     * activate the component. By default, any user can activate.
     *
     * When using a function rather than DI tokens, the function can call `inject` to get any required
     * dependencies. This `inject` call must be done in a synchronous context.
     */
    canActivate?: Array<CanActivateFn | DeprecatedGuard>;
    /**
     * An array of `CanMatchFn` or DI tokens used to look up `CanMatch()`
     * handlers, in order to determine if the current user is allowed to
     * match the `Route`. By default, any route can match.
     *
     * When using a function rather than DI tokens, the function can call `inject` to get any required
     * dependencies. This `inject` call must be done in a synchronous context.
     */
    canMatch?: Array<CanMatchFn | DeprecatedGuard>;
    /**
     * An array of `CanActivateChildFn` or DI tokens used to look up `CanActivateChild()` handlers,
     * in order to determine if the current user is allowed to activate
     * a child of the component. By default, any user can activate a child.
     *
     * When using a function rather than DI tokens, the function can call `inject` to get any required
     * dependencies. This `inject` call must be done in a synchronous context.
     */
    canActivateChild?: Array<CanActivateChildFn | DeprecatedGuard>;
    /**
     * An array of `CanDeactivateFn` or DI tokens used to look up `CanDeactivate()`
     * handlers, in order to determine if the current user is allowed to
     * deactivate the component. By default, any user can deactivate.
     *
     * When using a function rather than DI tokens, the function can call `inject` to get any required
     * dependencies. This `inject` call must be done in a synchronous context.
     */
    canDeactivate?: Array<CanDeactivateFn<any> | DeprecatedGuard>;
    /**
     * An array of `CanLoadFn` or DI tokens used to look up `CanLoad()`
     * handlers, in order to determine if the current user is allowed to
     * load the component. By default, any user can load.
     *
     * When using a function rather than DI tokens, the function can call `inject` to get any required
     * dependencies. This `inject` call must be done in a synchronous context.
     * @deprecated Use `canMatch` instead
     */
    canLoad?: Array<CanLoadFn | DeprecatedGuard>;
    /**
     * Additional developer-defined data provided to the component via
     * `ActivatedRoute`. By default, no additional data is passed.
     */
    data?: Data;
    /**
     * A map of DI tokens used to look up data resolvers. See `Resolve`.
     */
    resolve?: ResolveData;
    /**
     * An array of child `Route` objects that specifies a nested route
     * configuration.
     */
    children?: Routes;
    /**
     * An object specifying lazy-loaded child routes.
     */
    loadChildren?: LoadChildren;
    /**
     * A policy for when to run guards and resolvers on a route.
     *
     * Guards and/or resolvers will always run when a route is activated or deactivated. When a route
     * is unchanged, the default behavior is the same as `paramsChange`.
     *
     * `paramsChange` : Rerun the guards and resolvers when path or
     * path param changes. This does not include query parameters. This option is the default.
     * - `always` : Run on every execution.
     * - `pathParamsChange` : Rerun guards and resolvers when the path params
     * change. This does not compare matrix or query parameters.
     * - `paramsOrQueryParamsChange` : Run when path, matrix, or query parameters change.
     * - `pathParamsOrQueryParamsChange` : Rerun guards and resolvers when the path params
     * change or query params have changed. This does not include matrix parameters.
     *
     * @see {@link RunGuardsAndResolvers}
     */
    runGuardsAndResolvers?: RunGuardsAndResolvers;
    /**
     * A `Provider` array to use for this `Route` and its `children`.
     *
     * The `Router` will create a new `EnvironmentInjector` for this
     * `Route` and use it for this `Route` and its `children`. If this
     * route also has a `loadChildren` function which returns an `NgModuleRef`, this injector will be
     * used as the parent of the lazy loaded module.
     */
    providers?: Array<Provider | EnvironmentProviders>;
}
interface LoadedRouterConfig {
    routes: Route[];
    injector: EnvironmentInjector | undefined;
}
/**
 * @description
 *
 * Interface that a class can implement to be a guard deciding if a route can be activated.
 * If all guards return `true`, navigation continues. If any guard returns `false`,
 * navigation is cancelled. If any guard returns a `UrlTree`, the current navigation
 * is cancelled and a new navigation begins to the `UrlTree` returned from the guard.
 *
 * The following example implements a `CanActivate` function that checks whether the
 * current user has permission to activate the requested route.
 *
 * ```ts
 * class UserToken {}
 * class Permissions {
 *   canActivate(): boolean {
 *     return true;
 *   }
 * }
 *
 * @Injectable()
 * class CanActivateTeam implements CanActivate {
 *   constructor(private permissions: Permissions, private currentUser: UserToken) {}
 *
 *   canActivate(
 *     route: ActivatedRouteSnapshot,
 *     state: RouterStateSnapshot
 *   ): MaybeAsync<GuardResult> {
 *     return this.permissions.canActivate(this.currentUser, route.params.id);
 *   }
 * }
 * ```
 *
 * Here, the defined guard function is provided as part of the `Route` object
 * in the router configuration:
 *
 * ```ts
 * @NgModule({
 *   imports: [
 *     RouterModule.forRoot([
 *       {
 *         path: 'team/:id',
 *         component: TeamComponent,
 *         canActivate: [CanActivateTeam]
 *       }
 *     ])
 *   ],
 *   providers: [CanActivateTeam, UserToken, Permissions]
 * })
 * class AppModule {}
 * ```
 *
 * @publicApi
 */
interface CanActivate {
    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): MaybeAsync<GuardResult>;
}
/**
 * The signature of a function used as a `canActivate` guard on a `Route`.
 *
 * If all guards return `true`, navigation continues. If any guard returns `false`,
 * navigation is cancelled. If any guard returns a `UrlTree`, the current navigation
 * is cancelled and a new navigation begins to the `UrlTree` returned from the guard.
 *
 * The following example implements and uses a `CanActivateFn` that checks whether the
 * current user has permission to activate the requested route.
 *
 * ```ts
 * @Injectable()
 * class UserToken {}
 *
 * @Injectable()
 * class PermissionsService {
 *   canActivate(currentUser: UserToken, userId: string): boolean {
 *     return true;
 *   }
 *   canMatch(currentUser: UserToken): boolean {
 *     return true;
 *   }
 * }
 *
 * const canActivateTeam: CanActivateFn = (
 *   route: ActivatedRouteSnapshot,
 *   state: RouterStateSnapshot,
 * ) => {
 *   return inject(PermissionsService).canActivate(inject(UserToken), route.params['id']);
 * };
 * ```
 *
 * Here, the defined guard function is provided as part of the `Route` object
 * in the router configuration:
 *
 * ```ts
 * bootstrapApplication(App, {
 *    providers: [
 *      provideRouter([
 *        {
 *          path: 'team/:id',
 *          component: TeamComponent,
 *          canActivate: [canActivateTeam],
 *        },
 *      ]),
 *    ],
 *  });
 * ```
 *
 * @publicApi
 * @see {@link Route}
 */
type CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => MaybeAsync<GuardResult>;
/**
 * @description
 *
 * Interface that a class can implement to be a guard deciding if a child route can be activated.
 * If all guards return `true`, navigation continues. If any guard returns `false`,
 * navigation is cancelled. If any guard returns a `UrlTree`, current navigation
 * is cancelled and a new navigation begins to the `UrlTree` returned from the guard.
 *
 * The following example implements a `CanActivateChild` function that checks whether the
 * current user has permission to activate the requested child route.
 *
 * ```ts
 * class UserToken {}
 * class Permissions {
 *   canActivate(user: UserToken, id: string): boolean {
 *     return true;
 *   }
 * }
 *
 * @Injectable()
 * class CanActivateTeam implements CanActivateChild {
 *   constructor(private permissions: Permissions, private currentUser: UserToken) {}
 *
 *   canActivateChild(
 *     route: ActivatedRouteSnapshot,
 *     state: RouterStateSnapshot
 *   ): MaybeAsync<GuardResult> {
 *     return this.permissions.canActivate(this.currentUser, route.params.id);
 *   }
 * }
 * ```
 *
 * Here, the defined guard function is provided as part of the `Route` object
 * in the router configuration:
 *
 * ```ts
 * @NgModule({
 *   imports: [
 *     RouterModule.forRoot([
 *       {
 *         path: 'root',
 *         canActivateChild: [CanActivateTeam],
 *         children: [
 *           {
 *              path: 'team/:id',
 *              component: TeamComponent
 *           }
 *         ]
 *       }
 *     ])
 *   ],
 *   providers: [CanActivateTeam, UserToken, Permissions]
 * })
 * class AppModule {}
 * ```
 *
 * @publicApi
 */
interface CanActivateChild {
    canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): MaybeAsync<GuardResult>;
}
/**
 * The signature of a function used as a `canActivateChild` guard on a `Route`.
 *
 * If all guards return `true`, navigation continues. If any guard returns `false`,
 * navigation is cancelled. If any guard returns a `UrlTree`, the current navigation
 * is cancelled and a new navigation begins to the `UrlTree` returned from the guard.
 *
 * The following example implements a `canActivate` function that checks whether the
 * current user has permission to activate the requested route.
 *
 * {@example router/route_functional_guards.ts region="CanActivateChildFn"}
 *
 * @publicApi
 * @see {@link Route}
 */
type CanActivateChildFn = (childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot) => MaybeAsync<GuardResult>;
/**
 * @description
 *
 * Interface that a class can implement to be a guard deciding if a route can be deactivated.
 * If all guards return `true`, navigation continues. If any guard returns `false`,
 * navigation is cancelled. If any guard returns a `UrlTree`, current navigation
 * is cancelled and a new navigation begins to the `UrlTree` returned from the guard.
 *
 * The following example implements a `CanDeactivate` function that checks whether the
 * current user has permission to deactivate the requested route.
 *
 * ```ts
 * class UserToken {}
 * class Permissions {
 *   canDeactivate(user: UserToken, id: string): boolean {
 *     return true;
 *   }
 * }
 * ```
 *
 * Here, the defined guard function is provided as part of the `Route` object
 * in the router configuration:
 *
 * ```ts
 * @Injectable()
 * class CanDeactivateTeam implements CanDeactivate<TeamComponent> {
 *   constructor(private permissions: Permissions, private currentUser: UserToken) {}
 *
 *   canDeactivate(
 *     component: TeamComponent,
 *     currentRoute: ActivatedRouteSnapshot,
 *     currentState: RouterStateSnapshot,
 *     nextState: RouterStateSnapshot
 *   ): MaybeAsync<GuardResult> {
 *     return this.permissions.canDeactivate(this.currentUser, route.params.id);
 *   }
 * }
 *
 * @NgModule({
 *   imports: [
 *     RouterModule.forRoot([
 *       {
 *         path: 'team/:id',
 *         component: TeamComponent,
 *         canDeactivate: [CanDeactivateTeam]
 *       }
 *     ])
 *   ],
 *   providers: [CanDeactivateTeam, UserToken, Permissions]
 * })
 * class AppModule {}
 * ```
 *
 * @publicApi
 */
interface CanDeactivate<T> {
    canDeactivate(component: T, currentRoute: ActivatedRouteSnapshot, currentState: RouterStateSnapshot, nextState: RouterStateSnapshot): MaybeAsync<GuardResult>;
}
/**
 * The signature of a function used as a `canDeactivate` guard on a `Route`.
 *
 * If all guards return `true`, navigation continues. If any guard returns `false`,
 * navigation is cancelled. If any guard returns a `UrlTree`, the current navigation
 * is cancelled and a new navigation begins to the `UrlTree` returned from the guard.
 *
 * The following example implements and uses a `CanDeactivateFn` that checks whether the
 * user component has unsaved changes before navigating away from the route.
 *
 * {@example router/route_functional_guards.ts region="CanDeactivateFn"}
 *
 * @publicApi
 * @see {@link Route}
 */
type CanDeactivateFn<T> = (component: T, currentRoute: ActivatedRouteSnapshot, currentState: RouterStateSnapshot, nextState: RouterStateSnapshot) => MaybeAsync<GuardResult>;
/**
 * @description
 *
 * Interface that a class can implement to be a guard deciding if a `Route` can be matched.
 * If all guards return `true`, navigation continues and the `Router` will use the `Route` during
 * activation. If any guard returns `false`, the `Route` is skipped for matching and other `Route`
 * configurations are processed instead.
 *
 * The following example implements a `CanMatch` function that decides whether the
 * current user has permission to access the users page.
 *
 *
 * ```ts
 * class UserToken {}
 * class Permissions {
 *   canAccess(user: UserToken, route: Route, segments: UrlSegment[]): boolean {
 *     return true;
 *   }
 * }
 *
 * @Injectable()
 * class CanMatchTeamSection implements CanMatch {
 *   constructor(private permissions: Permissions, private currentUser: UserToken) {}
 *
 *   canMatch(route: Route, segments: UrlSegment[]): Observable<boolean>|Promise<boolean>|boolean {
 *     return this.permissions.canAccess(this.currentUser, route, segments);
 *   }
 * }
 * ```
 *
 * Here, the defined guard function is provided as part of the `Route` object
 * in the router configuration:
 *
 * ```ts
 * @NgModule({
 *   imports: [
 *     RouterModule.forRoot([
 *       {
 *         path: 'team/:id',
 *         component: TeamComponent,
 *         loadChildren: () => import('./team').then(mod => mod.TeamModule),
 *         canMatch: [CanMatchTeamSection]
 *       },
 *       {
 *         path: '**',
 *         component: NotFoundComponent
 *       }
 *     ])
 *   ],
 *   providers: [CanMatchTeamSection, UserToken, Permissions]
 * })
 * class AppModule {}
 * ```
 *
 * If the `CanMatchTeamSection` were to return `false`, the router would continue navigating to the
 * `team/:id` URL, but would load the `NotFoundComponent` because the `Route` for `'team/:id'`
 * could not be used for a URL match but the catch-all `**` `Route` did instead.
 *
 * @publicApi
 */
interface CanMatch {
    canMatch(route: Route, segments: UrlSegment[]): MaybeAsync<GuardResult>;
}
/**
 * The signature of a function used as a `canMatch` guard on a `Route`.
 *
 * If all guards return `true`, navigation continues and the `Router` will use the `Route` during
 * activation. If any guard returns `false`, the `Route` is skipped for matching and other `Route`
 * configurations are processed instead.
 *
 * The following example implements and uses a `CanMatchFn` that checks whether the
 * current user has permission to access the team page.
 *
 * {@example router/route_functional_guards.ts region="CanMatchFn"}
 *
 * @param route The route configuration.
 * @param segments The URL segments that have not been consumed by previous parent route evaluations.
 *
 * @publicApi
 * @see {@link Route}
 */
type CanMatchFn = (route: Route, segments: UrlSegment[]) => MaybeAsync<GuardResult>;
/**
 * @description
 *
 * Interface that classes can implement to be a data provider.
 * A data provider class can be used with the router to resolve data during navigation.
 * The interface defines a `resolve()` method that is invoked right after the `ResolveStart`
 * router event. The router waits for the data to be resolved before the route is finally activated.
 *
 * The following example implements a `resolve()` method that retrieves the data
 * needed to activate the requested route.
 *
 * ```ts
 * @Injectable({ providedIn: 'root' })
 * export class HeroResolver implements Resolve<Hero> {
 *   constructor(private service: HeroService) {}
 *
 *   resolve(
 *     route: ActivatedRouteSnapshot,
 *     state: RouterStateSnapshot
 *   ): Observable<Hero>|Promise<Hero>|Hero {
 *     return this.service.getHero(route.paramMap.get('id'));
 *   }
 * }
 * ```
 *
 * Here, the defined `resolve()` function is provided as part of the `Route` object
 * in the router configuration:
 *
 * ```ts
 * @NgModule({
 *   imports: [
 *     RouterModule.forRoot([
 *       {
 *         path: 'detail/:id',
 *         component: HeroDetailComponent,
 *         resolve: {
 *           hero: HeroResolver
 *         }
 *       }
 *     ])
 *   ],
 *   exports: [RouterModule]
 * })
 * export class AppRoutingModule {}
 * ```
 *
 * And you can access to your resolved data from `HeroComponent`:
 *
 * ```ts
 * @Component({
 *  selector: "app-hero",
 *  templateUrl: "hero.component.html",
 * })
 * export class HeroComponent {
 *
 *  constructor(private activatedRoute: ActivatedRoute) {}
 *
 *  ngOnInit() {
 *    this.activatedRoute.data.subscribe(({ hero }) => {
 *      // do something with your resolved data ...
 *    })
 *  }
 *
 * }
 * ```
 *
 * @usageNotes
 *
 * When both guard and resolvers are specified, the resolvers are not executed until
 * all guards have run and succeeded.
 * For example, consider the following route configuration:
 *
 * ```ts
 * {
 *  path: 'base'
 *  canActivate: [BaseGuard],
 *  resolve: {data: BaseDataResolver}
 *  children: [
 *   {
 *     path: 'child',
 *     guards: [ChildGuard],
 *     component: ChildComponent,
 *     resolve: {childData: ChildDataResolver}
 *    }
 *  ]
 * }
 * ```
 * The order of execution is: BaseGuard, ChildGuard, BaseDataResolver, ChildDataResolver.
 *
 * @publicApi
 * @see {@link ResolveFn}
 */
interface Resolve<T> {
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): MaybeAsync<T | RedirectCommand>;
}
/**
 * Function type definition for a data provider.
 *
 * A data provider can be used with the router to resolve data during navigation.
 * The router waits for the data to be resolved before the route is finally activated.
 *
 * A resolver can also redirect a `RedirectCommand` and the Angular router will use
 * it to redirect the current navigation to the new destination.
 *
 * @usageNotes
 *
 * The following example implements a function that retrieves the data
 * needed to activate the requested route.
 *
 * ```ts
 * interface Hero {
 *   name: string;
 * }
 * @Injectable()
 * export class HeroService {
 *   getHero(id: string) {
 *     return {name: `Superman-${id}`};
 *   }
 * }
 *
 * export const heroResolver: ResolveFn<Hero> = (
 *   route: ActivatedRouteSnapshot,
 *   state: RouterStateSnapshot,
 * ) => {
 *   return inject(HeroService).getHero(route.paramMap.get('id')!);
 * };
 *
 * bootstrapApplication(App, {
 *   providers: [
 *     provideRouter([
 *       {
 *         path: 'detail/:id',
 *         component: HeroDetailComponent,
 *         resolve: {hero: heroResolver},
 *       },
 *     ]),
 *   ],
 * });
 * ```
 *
 * And you can access to your resolved data from `HeroComponent`:
 *
 * ```ts
 * @Component({template: ''})
 * export class HeroDetailComponent {
 *   private activatedRoute = inject(ActivatedRoute);
 *
 *   ngOnInit() {
 *     this.activatedRoute.data.subscribe(({hero}) => {
 *       // do something with your resolved data ...
 *     });
 *   }
 * }
 * ```
 *
 * If resolved data cannot be retrieved, you may want to redirect the user
 * to a new page instead:
 *
 * ```ts
 * export const heroResolver: ResolveFn<Hero> = async (
 *   route: ActivatedRouteSnapshot,
 *   state: RouterStateSnapshot,
 * ) => {
 *   const router = inject(Router);
 *   const heroService = inject(HeroService);
 *   try {
 *     return await heroService.getHero(route.paramMap.get('id')!);
 *   } catch {
 *     return new RedirectCommand(router.parseUrl('/404'));
 *   }
 * };
 * ```
 *
 * When both guard and resolvers are specified, the resolvers are not executed until
 * all guards have run and succeeded.
 * For example, consider the following route configuration:
 *
 * ```ts
 * {
 *  path: 'base'
 *  canActivate: [baseGuard],
 *  resolve: {data: baseDataResolver}
 *  children: [
 *   {
 *     path: 'child',
 *     canActivate: [childGuard],
 *     component: ChildComponent,
 *     resolve: {childData: childDataResolver}
 *    }
 *  ]
 * }
 * ```
 * The order of execution is: baseGuard, childGuard, baseDataResolver, childDataResolver.
 *
 * @publicApi
 * @see {@link Route}
 */
type ResolveFn<T> = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => MaybeAsync<T | RedirectCommand>;
/**
 * @description
 *
 * Interface that a class can implement to be a guard deciding if children can be loaded.
 * If all guards return `true`, navigation continues. If any guard returns `false`,
 * navigation is cancelled. If any guard returns a `UrlTree`, current navigation
 * is cancelled and a new navigation starts to the `UrlTree` returned from the guard.
 *
 * The following example implements a `CanLoad` function that decides whether the
 * current user has permission to load requested child routes.
 *
 *
 * ```ts
 * class UserToken {}
 * class Permissions {
 *   canLoadChildren(user: UserToken, id: string, segments: UrlSegment[]): boolean {
 *     return true;
 *   }
 * }
 *
 * @Injectable()
 * class CanLoadTeamSection implements CanLoad {
 *   constructor(private permissions: Permissions, private currentUser: UserToken) {}
 *
 *   canLoad(route: Route, segments: UrlSegment[]): Observable<boolean>|Promise<boolean>|boolean {
 *     return this.permissions.canLoadChildren(this.currentUser, route, segments);
 *   }
 * }
 * ```
 *
 * Here, the defined guard function is provided as part of the `Route` object
 * in the router configuration:
 *
 * ```ts
 * @NgModule({
 *   imports: [
 *     RouterModule.forRoot([
 *       {
 *         path: 'team/:id',
 *         component: TeamComponent,
 *         loadChildren: () => import('./team').then(mod => mod.TeamModule),
 *         canLoad: [CanLoadTeamSection]
 *       }
 *     ])
 *   ],
 *   providers: [CanLoadTeamSection, UserToken, Permissions]
 * })
 * class AppModule {}
 * ```
 *
 * @publicApi
 * @deprecated Use {@link CanMatch} instead
 */
interface CanLoad {
    canLoad(route: Route, segments: UrlSegment[]): MaybeAsync<GuardResult>;
}
/**
 * The signature of a function used as a `canLoad` guard on a `Route`.
 *
 * @publicApi
 * @see {@link CanLoad}
 * @see {@link Route}
 * @see {@link CanMatch}
 * @deprecated Use `Route.canMatch` and `CanMatchFn` instead
 */
type CanLoadFn = (route: Route, segments: UrlSegment[]) => MaybeAsync<GuardResult>;
/**
 * @description
 *
 * Options that modify the `Router` navigation strategy.
 * Supply an object containing any of these properties to a `Router` navigation function to
 * control how the navigation should be handled.
 *
 * @see {@link Router#navigate}
 * @see {@link Router#navigateByUrl}
 * @see [Routing and Navigation guide](guide/routing/common-router-tasks)
 *
 * @publicApi
 */
interface NavigationBehaviorOptions {
    /**
     * How to handle a navigation request to the current URL.
     *
     * This value is a subset of the options available in `OnSameUrlNavigation` and
     * will take precedence over the default value set for the `Router`.
     *
     * @see {@link OnSameUrlNavigation}
     * @see {@link RouterConfigOptions}
     */
    onSameUrlNavigation?: OnSameUrlNavigation;
    /**
     * When true, navigates without pushing a new state into history.
     *
     * ```
     * // Navigate silently to /view
     * this.router.navigate(['/view'], { skipLocationChange: true });
     * ```
     */
    skipLocationChange?: boolean;
    /**
     * When true, navigates while replacing the current state in history.
     *
     * ```
     * // Navigate to /view
     * this.router.navigate(['/view'], { replaceUrl: true });
     * ```
     */
    replaceUrl?: boolean;
    /**
     * Developer-defined state that can be passed to any navigation.
     * Access this value through the `Navigation.extras` object
     * returned from the [Router.getCurrentNavigation()
     * method](api/router/Router#getcurrentnavigation) while a navigation is executing.
     *
     * After a navigation completes, the router writes an object containing this
     * value together with a `navigationId` to `history.state`.
     * The value is written when `location.go()` or `location.replaceState()`
     * is called before activating this route.
     *
     * Note that `history.state` does not pass an object equality test because
     * the router adds the `navigationId` on each navigation.
     *
     */
    state?: {
        [k: string]: any;
    };
    /**
     * Use this to convey transient information about this particular navigation, such as how it
     * happened. In this way, it's different from the persisted value `state` that will be set to
     * `history.state`. This object is assigned directly to the Router's current `Navigation`
     * (it is not copied or cloned), so it should be mutated with caution.
     *
     * One example of how this might be used is to trigger different single-page navigation animations
     * depending on how a certain route was reached. For example, consider a photo gallery app, where
     * you can reach the same photo URL and state via various routes:
     *
     * - Clicking on it in a gallery view
     * - Clicking
     * - "next" or "previous" when viewing another photo in the album
     * - Etc.
     *
     * Each of these wants a different animation at navigate time. This information doesn't make sense
     * to store in the persistent URL or history entry state, but it's still important to communicate
     * from the rest of the application, into the router.
     *
     * This information could be used in coordination with the View Transitions feature and the
     * `onViewTransitionCreated` callback. The information might be used in the callback to set
     * classes on the document in order to control the transition animations and remove the classes
     * when the transition has finished animating.
     */
    readonly info?: unknown;
    /**
     * When set, the Router will update the browser's address bar to match the given `UrlTree` instead
     * of the one used for route matching.
     *
     *
     * @usageNotes
     *
     * This feature is useful for redirects, such as redirecting to an error page, without changing
     * the value that will be displayed in the browser's address bar.
     *
     * ```ts
     * const canActivate: CanActivateFn = (route: ActivatedRouteSnapshot) => {
     *   const userService = inject(UserService);
     *   const router = inject(Router);
     *   if (!userService.isLoggedIn()) {
     *     const targetOfCurrentNavigation = router.getCurrentNavigation()?.finalUrl;
     *     const redirect = router.parseUrl('/404');
     *     return new RedirectCommand(redirect, {browserUrl: targetOfCurrentNavigation});
     *   }
     *   return true;
     * };
     * ```
     *
     * This value is used directly, without considering any `UrlHandingStrategy`. In this way,
     * `browserUrl` can also be used to use a different value for the browser URL than what would have
     * been produced by from the navigation due to `UrlHandlingStrategy.merge`.
     *
     * This value only affects the path presented in the browser's address bar. It does not apply to
     * the internal `Router` state. Information such as `params` and `data` will match the internal
     * state used to match routes which will be different from the browser URL when using this feature
     * The same is true when using other APIs that cause the browser URL the differ from the Router
     * state, such as `skipLocationChange`.
     */
    readonly browserUrl?: UrlTree | string;
}

declare class Tree<T> {
    constructor(root: TreeNode<T>);
    get root(): T;
}
declare class TreeNode<T> {
    value: T;
    children: TreeNode<T>[];
    constructor(value: T, children: TreeNode<T>[]);
    toString(): string;
}

/**
 * Represents the state of the router as a tree of activated routes.
 *
 * @usageNotes
 *
 * Every node in the route tree is an `ActivatedRoute` instance
 * that knows about the "consumed" URL segments, the extracted parameters,
 * and the resolved data.
 * Use the `ActivatedRoute` properties to traverse the tree from any node.
 *
 * The following fragment shows how a component gets the root node
 * of the current state to establish its own route tree:
 *
 * ```ts
 * @Component({templateUrl:'template.html'})
 * class MyComponent {
 *   constructor(router: Router) {
 *     const state: RouterState = router.routerState;
 *     const root: ActivatedRoute = state.root;
 *     const child = root.firstChild;
 *     const id: Observable<string> = child.params.map(p => p.id);
 *     //...
 *   }
 * }
 * ```
 *
 * @see {@link ActivatedRoute}
 * @see [Getting route information](guide/routing/common-router-tasks#getting-route-information)
 *
 * @publicApi
 */
declare class RouterState extends Tree<ActivatedRoute> {
    /** The current snapshot of the router state */
    snapshot: RouterStateSnapshot;
    toString(): string;
}
/**
 * Provides access to information about a route associated with a component
 * that is loaded in an outlet.
 * Use to traverse the `RouterState` tree and extract information from nodes.
 *
 * The following example shows how to construct a component using information from a
 * currently activated route.
 *
 * Note: the observables in this class only emit when the current and previous values differ based
 * on shallow equality. For example, changing deeply nested properties in resolved `data` will not
 * cause the `ActivatedRoute.data` `Observable` to emit a new value.
 *
 * {@example router/activated-route/module.ts region="activated-route"
 *     header="activated-route.component.ts"}
 *
 * @see [Getting route information](guide/routing/common-router-tasks#getting-route-information)
 *
 * @publicApi
 */
declare class ActivatedRoute {
    /** The outlet name of the route, a constant. */
    outlet: string;
    /** The component of the route, a constant. */
    component: Type<any> | null;
    /** The current snapshot of this route */
    snapshot: ActivatedRouteSnapshot;
    /** An Observable of the resolved route title */
    readonly title: Observable<string | undefined>;
    /** An observable of the URL segments matched by this route. */
    url: Observable<UrlSegment[]>;
    /** An observable of the matrix parameters scoped to this route. */
    params: Observable<Params>;
    /** An observable of the query parameters shared by all the routes. */
    queryParams: Observable<Params>;
    /** An observable of the URL fragment shared by all the routes. */
    fragment: Observable<string | null>;
    /** An observable of the static and resolved data of this route. */
    data: Observable<Data>;
    /** The configuration used to match this route. */
    get routeConfig(): Route | null;
    /** The root of the router state. */
    get root(): ActivatedRoute;
    /** The parent of this route in the router state tree. */
    get parent(): ActivatedRoute | null;
    /** The first child of this route in the router state tree. */
    get firstChild(): ActivatedRoute | null;
    /** The children of this route in the router state tree. */
    get children(): ActivatedRoute[];
    /** The path from the root of the router state tree to this route. */
    get pathFromRoot(): ActivatedRoute[];
    /**
     * An Observable that contains a map of the required and optional parameters
     * specific to the route.
     * The map supports retrieving single and multiple values from the same parameter.
     */
    get paramMap(): Observable<ParamMap>;
    /**
     * An Observable that contains a map of the query parameters available to all routes.
     * The map supports retrieving single and multiple values from the query parameter.
     */
    get queryParamMap(): Observable<ParamMap>;
    toString(): string;
}
/**
 * @description
 *
 * Contains the information about a route associated with a component loaded in an
 * outlet at a particular moment in time. ActivatedRouteSnapshot can also be used to
 * traverse the router state tree.
 *
 * The following example initializes a component with route information extracted
 * from the snapshot of the root node at the time of creation.
 *
 * ```ts
 * @Component({templateUrl:'./my-component.html'})
 * class MyComponent {
 *   constructor(route: ActivatedRoute) {
 *     const id: string = route.snapshot.params.id;
 *     const url: string = route.snapshot.url.join('');
 *     const user = route.snapshot.data.user;
 *   }
 * }
 * ```
 *
 * @publicApi
 */
declare class ActivatedRouteSnapshot {
    /** The URL segments matched by this route */
    url: UrlSegment[];
    /**
     *  The matrix parameters scoped to this route.
     *
     *  You can compute all params (or data) in the router state or to get params outside
     *  of an activated component by traversing the `RouterState` tree as in the following
     *  example:
     *  ```ts
     *  collectRouteParams(router: Router) {
     *    let params = {};
     *    let stack: ActivatedRouteSnapshot[] = [router.routerState.snapshot.root];
     *    while (stack.length > 0) {
     *      const route = stack.pop()!;
     *      params = {...params, ...route.params};
     *      stack.push(...route.children);
     *    }
     *    return params;
     *  }
     *  ```
     */
    params: Params;
    /** The query parameters shared by all the routes */
    queryParams: Params;
    /** The URL fragment shared by all the routes */
    fragment: string | null;
    /** The static and resolved data of this route */
    data: Data;
    /** The outlet name of the route */
    outlet: string;
    /** The component of the route */
    component: Type<any> | null;
    /** The configuration used to match this route **/
    readonly routeConfig: Route | null;
    /** The resolved route title */
    get title(): string | undefined;
    /** The root of the router state */
    get root(): ActivatedRouteSnapshot;
    /** The parent of this route in the router state tree */
    get parent(): ActivatedRouteSnapshot | null;
    /** The first child of this route in the router state tree */
    get firstChild(): ActivatedRouteSnapshot | null;
    /** The children of this route in the router state tree */
    get children(): ActivatedRouteSnapshot[];
    /** The path from the root of the router state tree to this route */
    get pathFromRoot(): ActivatedRouteSnapshot[];
    get paramMap(): ParamMap;
    get queryParamMap(): ParamMap;
    toString(): string;
}
/**
 * @description
 *
 * Represents the state of the router at a moment in time.
 *
 * This is a tree of activated route snapshots. Every node in this tree knows about
 * the "consumed" URL segments, the extracted parameters, and the resolved data.
 *
 * The following example shows how a component is initialized with information
 * from the snapshot of the root node's state at the time of creation.
 *
 * ```ts
 * @Component({templateUrl:'template.html'})
 * class MyComponent {
 *   constructor(router: Router) {
 *     const state: RouterState = router.routerState;
 *     const snapshot: RouterStateSnapshot = state.snapshot;
 *     const root: ActivatedRouteSnapshot = snapshot.root;
 *     const child = root.firstChild;
 *     const id: Observable<string> = child.params.map(p => p.id);
 *     //...
 *   }
 * }
 * ```
 *
 * @publicApi
 */
declare class RouterStateSnapshot extends Tree<ActivatedRouteSnapshot> {
    /** The url from which this snapshot was created */
    url: string;
    toString(): string;
}

/**
 * Identifies the call or event that triggered a navigation.
 *
 * * 'imperative': Triggered by `router.navigateByUrl()` or `router.navigate()`.
 * * 'popstate' : Triggered by a `popstate` event.
 * * 'hashchange'-: Triggered by a `hashchange` event.
 *
 * @publicApi
 */
type NavigationTrigger = 'imperative' | 'popstate' | 'hashchange';
/**
 * Identifies the type of a router event.
 *
 * @publicApi
 */
declare enum EventType {
    NavigationStart = 0,
    NavigationEnd = 1,
    NavigationCancel = 2,
    NavigationError = 3,
    RoutesRecognized = 4,
    ResolveStart = 5,
    ResolveEnd = 6,
    GuardsCheckStart = 7,
    GuardsCheckEnd = 8,
    RouteConfigLoadStart = 9,
    RouteConfigLoadEnd = 10,
    ChildActivationStart = 11,
    ChildActivationEnd = 12,
    ActivationStart = 13,
    ActivationEnd = 14,
    Scroll = 15,
    NavigationSkipped = 16
}
/**
 * Base for events the router goes through, as opposed to events tied to a specific
 * route. Fired one time for any given navigation.
 *
 * The following code shows how a class subscribes to router events.
 *
 * ```ts
 * import {Event, RouterEvent, Router} from '@angular/router';
 *
 * class MyService {
 *   constructor(public router: Router) {
 *     router.events.pipe(
 *        filter((e: Event | RouterEvent): e is RouterEvent => e instanceof RouterEvent)
 *     ).subscribe((e: RouterEvent) => {
 *       // Do something
 *     });
 *   }
 * }
 * ```
 *
 * @see {@link Event}
 * @see [Router events summary](guide/routing/router-reference#router-events)
 * @publicApi
 */
declare class RouterEvent {
    /** A unique ID that the router assigns to every router navigation. */
    id: number;
    /** The URL that is the destination for this navigation. */
    url: string;
    constructor(
    /** A unique ID that the router assigns to every router navigation. */
    id: number, 
    /** The URL that is the destination for this navigation. */
    url: string);
}
/**
 * An event triggered when a navigation starts.
 *
 * @publicApi
 */
declare class NavigationStart extends RouterEvent {
    readonly type = EventType.NavigationStart;
    /**
     * Identifies the call or event that triggered the navigation.
     * An `imperative` trigger is a call to `router.navigateByUrl()` or `router.navigate()`.
     *
     * @see {@link NavigationEnd}
     * @see {@link NavigationCancel}
     * @see {@link NavigationError}
     */
    navigationTrigger?: NavigationTrigger;
    /**
     * The navigation state that was previously supplied to the `pushState` call,
     * when the navigation is triggered by a `popstate` event. Otherwise null.
     *
     * The state object is defined by `NavigationExtras`, and contains any
     * developer-defined state value, as well as a unique ID that
     * the router assigns to every router transition/navigation.
     *
     * From the perspective of the router, the router never "goes back".
     * When the user clicks on the back button in the browser,
     * a new navigation ID is created.
     *
     * Use the ID in this previous-state object to differentiate between a newly created
     * state and one returned to by a `popstate` event, so that you can restore some
     * remembered state, such as scroll position.
     *
     */
    restoredState?: {
        [k: string]: any;
        navigationId: number;
    } | null;
    constructor(
    /** @docsNotRequired */
    id: number, 
    /** @docsNotRequired */
    url: string, 
    /** @docsNotRequired */
    navigationTrigger?: NavigationTrigger, 
    /** @docsNotRequired */
    restoredState?: {
        [k: string]: any;
        navigationId: number;
    } | null);
    /** @docsNotRequired */
    toString(): string;
}
/**
 * An event triggered when a navigation ends successfully.
 *
 * @see {@link NavigationStart}
 * @see {@link NavigationCancel}
 * @see {@link NavigationError}
 *
 * @publicApi
 */
declare class NavigationEnd extends RouterEvent {
    /** @docsNotRequired */
    urlAfterRedirects: string;
    readonly type = EventType.NavigationEnd;
    constructor(
    /** @docsNotRequired */
    id: number, 
    /** @docsNotRequired */
    url: string, 
    /** @docsNotRequired */
    urlAfterRedirects: string);
    /** @docsNotRequired */
    toString(): string;
}
/**
 * A code for the `NavigationCancel` event of the `Router` to indicate the
 * reason a navigation failed.
 *
 * @publicApi
 */
declare enum NavigationCancellationCode {
    /**
     * A navigation failed because a guard returned a `UrlTree` to redirect.
     */
    Redirect = 0,
    /**
     * A navigation failed because a more recent navigation started.
     */
    SupersededByNewNavigation = 1,
    /**
     * A navigation failed because one of the resolvers completed without emitting a value.
     */
    NoDataFromResolver = 2,
    /**
     * A navigation failed because a guard returned `false`.
     */
    GuardRejected = 3,
    /**
     * A navigation was aborted by the `Navigation.abort` function.
     *
     * @see {@link Navigation}
     */
    Aborted = 4
}
/**
 * A code for the `NavigationSkipped` event of the `Router` to indicate the
 * reason a navigation was skipped.
 *
 * @publicApi
 */
declare enum NavigationSkippedCode {
    /**
     * A navigation was skipped because the navigation URL was the same as the current Router URL.
     */
    IgnoredSameUrlNavigation = 0,
    /**
     * A navigation was skipped because the configured `UrlHandlingStrategy` return `false` for both
     * the current Router URL and the target of the navigation.
     *
     * @see {@link UrlHandlingStrategy}
     */
    IgnoredByUrlHandlingStrategy = 1
}
/**
 * An event triggered when a navigation is canceled, directly or indirectly.
 * This can happen for several reasons including when a route guard
 * returns `false` or initiates a redirect by returning a `UrlTree`.
 *
 * @see {@link NavigationStart}
 * @see {@link NavigationEnd}
 * @see {@link NavigationError}
 *
 * @publicApi
 */
declare class NavigationCancel extends RouterEvent {
    /**
     * A description of why the navigation was cancelled. For debug purposes only. Use `code`
     * instead for a stable cancellation reason that can be used in production.
     */
    reason: string;
    /**
     * A code to indicate why the navigation was canceled. This cancellation code is stable for
     * the reason and can be relied on whereas the `reason` string could change and should not be
     * used in production.
     */
    readonly code?: NavigationCancellationCode | undefined;
    readonly type = EventType.NavigationCancel;
    constructor(
    /** @docsNotRequired */
    id: number, 
    /** @docsNotRequired */
    url: string, 
    /**
     * A description of why the navigation was cancelled. For debug purposes only. Use `code`
     * instead for a stable cancellation reason that can be used in production.
     */
    reason: string, 
    /**
     * A code to indicate why the navigation was canceled. This cancellation code is stable for
     * the reason and can be relied on whereas the `reason` string could change and should not be
     * used in production.
     */
    code?: NavigationCancellationCode | undefined);
    /** @docsNotRequired */
    toString(): string;
}
/**
 * An event triggered when a navigation is skipped.
 * This can happen for a couple reasons including onSameUrlHandling
 * is set to `ignore` and the navigation URL is not different than the
 * current state.
 *
 * @publicApi
 */
declare class NavigationSkipped extends RouterEvent {
    /**
     * A description of why the navigation was skipped. For debug purposes only. Use `code`
     * instead for a stable skipped reason that can be used in production.
     */
    reason: string;
    /**
     * A code to indicate why the navigation was skipped. This code is stable for
     * the reason and can be relied on whereas the `reason` string could change and should not be
     * used in production.
     */
    readonly code?: NavigationSkippedCode | undefined;
    readonly type = EventType.NavigationSkipped;
    constructor(
    /** @docsNotRequired */
    id: number, 
    /** @docsNotRequired */
    url: string, 
    /**
     * A description of why the navigation was skipped. For debug purposes only. Use `code`
     * instead for a stable skipped reason that can be used in production.
     */
    reason: string, 
    /**
     * A code to indicate why the navigation was skipped. This code is stable for
     * the reason and can be relied on whereas the `reason` string could change and should not be
     * used in production.
     */
    code?: NavigationSkippedCode | undefined);
}
/**
 * An event triggered when a navigation fails due to an unexpected error.
 *
 * @see {@link NavigationStart}
 * @see {@link NavigationEnd}
 * @see {@link NavigationCancel}
 *
 * @publicApi
 */
declare class NavigationError extends RouterEvent {
    /** @docsNotRequired */
    error: any;
    /**
     * The target of the navigation when the error occurred.
     *
     * Note that this can be `undefined` because an error could have occurred before the
     * `RouterStateSnapshot` was created for the navigation.
     */
    readonly target?: RouterStateSnapshot | undefined;
    readonly type = EventType.NavigationError;
    constructor(
    /** @docsNotRequired */
    id: number, 
    /** @docsNotRequired */
    url: string, 
    /** @docsNotRequired */
    error: any, 
    /**
     * The target of the navigation when the error occurred.
     *
     * Note that this can be `undefined` because an error could have occurred before the
     * `RouterStateSnapshot` was created for the navigation.
     */
    target?: RouterStateSnapshot | undefined);
    /** @docsNotRequired */
    toString(): string;
}
/**
 * An event triggered when routes are recognized.
 *
 * @publicApi
 */
declare class RoutesRecognized extends RouterEvent {
    /** @docsNotRequired */
    urlAfterRedirects: string;
    /** @docsNotRequired */
    state: RouterStateSnapshot;
    readonly type = EventType.RoutesRecognized;
    constructor(
    /** @docsNotRequired */
    id: number, 
    /** @docsNotRequired */
    url: string, 
    /** @docsNotRequired */
    urlAfterRedirects: string, 
    /** @docsNotRequired */
    state: RouterStateSnapshot);
    /** @docsNotRequired */
    toString(): string;
}
/**
 * An event triggered at the start of the Guard phase of routing.
 *
 * @see {@link GuardsCheckEnd}
 *
 * @publicApi
 */
declare class GuardsCheckStart extends RouterEvent {
    /** @docsNotRequired */
    urlAfterRedirects: string;
    /** @docsNotRequired */
    state: RouterStateSnapshot;
    readonly type = EventType.GuardsCheckStart;
    constructor(
    /** @docsNotRequired */
    id: number, 
    /** @docsNotRequired */
    url: string, 
    /** @docsNotRequired */
    urlAfterRedirects: string, 
    /** @docsNotRequired */
    state: RouterStateSnapshot);
    toString(): string;
}
/**
 * An event triggered at the end of the Guard phase of routing.
 *
 * @see {@link GuardsCheckStart}
 *
 * @publicApi
 */
declare class GuardsCheckEnd extends RouterEvent {
    /** @docsNotRequired */
    urlAfterRedirects: string;
    /** @docsNotRequired */
    state: RouterStateSnapshot;
    /** @docsNotRequired */
    shouldActivate: boolean;
    readonly type = EventType.GuardsCheckEnd;
    constructor(
    /** @docsNotRequired */
    id: number, 
    /** @docsNotRequired */
    url: string, 
    /** @docsNotRequired */
    urlAfterRedirects: string, 
    /** @docsNotRequired */
    state: RouterStateSnapshot, 
    /** @docsNotRequired */
    shouldActivate: boolean);
    toString(): string;
}
/**
 * An event triggered at the start of the Resolve phase of routing.
 *
 * Runs in the "resolve" phase whether or not there is anything to resolve.
 * In future, may change to only run when there are things to be resolved.
 *
 * @see {@link ResolveEnd}
 *
 * @publicApi
 */
declare class ResolveStart extends RouterEvent {
    /** @docsNotRequired */
    urlAfterRedirects: string;
    /** @docsNotRequired */
    state: RouterStateSnapshot;
    readonly type = EventType.ResolveStart;
    constructor(
    /** @docsNotRequired */
    id: number, 
    /** @docsNotRequired */
    url: string, 
    /** @docsNotRequired */
    urlAfterRedirects: string, 
    /** @docsNotRequired */
    state: RouterStateSnapshot);
    toString(): string;
}
/**
 * An event triggered at the end of the Resolve phase of routing.
 * @see {@link ResolveStart}
 *
 * @publicApi
 */
declare class ResolveEnd extends RouterEvent {
    /** @docsNotRequired */
    urlAfterRedirects: string;
    /** @docsNotRequired */
    state: RouterStateSnapshot;
    readonly type = EventType.ResolveEnd;
    constructor(
    /** @docsNotRequired */
    id: number, 
    /** @docsNotRequired */
    url: string, 
    /** @docsNotRequired */
    urlAfterRedirects: string, 
    /** @docsNotRequired */
    state: RouterStateSnapshot);
    toString(): string;
}
/**
 * An event triggered before lazy loading a route configuration.
 *
 * @see {@link RouteConfigLoadEnd}
 *
 * @publicApi
 */
declare class RouteConfigLoadStart {
    /** @docsNotRequired */
    route: Route;
    readonly type = EventType.RouteConfigLoadStart;
    constructor(
    /** @docsNotRequired */
    route: Route);
    toString(): string;
}
/**
 * An event triggered when a route has been lazy loaded.
 *
 * @see {@link RouteConfigLoadStart}
 *
 * @publicApi
 */
declare class RouteConfigLoadEnd {
    /** @docsNotRequired */
    route: Route;
    readonly type = EventType.RouteConfigLoadEnd;
    constructor(
    /** @docsNotRequired */
    route: Route);
    toString(): string;
}
/**
 * An event triggered at the start of the child-activation
 * part of the Resolve phase of routing.
 * @see {@link ChildActivationEnd}
 * @see {@link ResolveStart}
 *
 * @publicApi
 */
declare class ChildActivationStart {
    /** @docsNotRequired */
    snapshot: ActivatedRouteSnapshot;
    readonly type = EventType.ChildActivationStart;
    constructor(
    /** @docsNotRequired */
    snapshot: ActivatedRouteSnapshot);
    toString(): string;
}
/**
 * An event triggered at the end of the child-activation part
 * of the Resolve phase of routing.
 * @see {@link ChildActivationStart}
 * @see {@link ResolveStart}
 * @publicApi
 */
declare class ChildActivationEnd {
    /** @docsNotRequired */
    snapshot: ActivatedRouteSnapshot;
    readonly type = EventType.ChildActivationEnd;
    constructor(
    /** @docsNotRequired */
    snapshot: ActivatedRouteSnapshot);
    toString(): string;
}
/**
 * An event triggered at the start of the activation part
 * of the Resolve phase of routing.
 * @see {@link ActivationEnd}
 * @see {@link ResolveStart}
 *
 * @publicApi
 */
declare class ActivationStart {
    /** @docsNotRequired */
    snapshot: ActivatedRouteSnapshot;
    readonly type = EventType.ActivationStart;
    constructor(
    /** @docsNotRequired */
    snapshot: ActivatedRouteSnapshot);
    toString(): string;
}
/**
 * An event triggered at the end of the activation part
 * of the Resolve phase of routing.
 * @see {@link ActivationStart}
 * @see {@link ResolveStart}
 *
 * @publicApi
 */
declare class ActivationEnd {
    /** @docsNotRequired */
    snapshot: ActivatedRouteSnapshot;
    readonly type = EventType.ActivationEnd;
    constructor(
    /** @docsNotRequired */
    snapshot: ActivatedRouteSnapshot);
    toString(): string;
}
/**
 * An event triggered by scrolling.
 *
 * @publicApi
 */
declare class Scroll {
    /** @docsNotRequired */
    readonly routerEvent: NavigationEnd | NavigationSkipped;
    /** @docsNotRequired */
    readonly position: [number, number] | null;
    /** @docsNotRequired */
    readonly anchor: string | null;
    readonly type = EventType.Scroll;
    constructor(
    /** @docsNotRequired */
    routerEvent: NavigationEnd | NavigationSkipped, 
    /** @docsNotRequired */
    position: [number, number] | null, 
    /** @docsNotRequired */
    anchor: string | null);
    toString(): string;
}
/**
 * Router events that allow you to track the lifecycle of the router.
 *
 * The events occur in the following sequence:
 *
 * * [NavigationStart](api/router/NavigationStart): Navigation starts.
 * * [RouteConfigLoadStart](api/router/RouteConfigLoadStart): Before
 * the router [lazy loads](guide/routing/common-router-tasks#lazy-loading) a route configuration.
 * * [RouteConfigLoadEnd](api/router/RouteConfigLoadEnd): After a route has been lazy loaded.
 * * [RoutesRecognized](api/router/RoutesRecognized): When the router parses the URL
 * and the routes are recognized.
 * * [GuardsCheckStart](api/router/GuardsCheckStart): When the router begins the *guards*
 * phase of routing.
 * * [ChildActivationStart](api/router/ChildActivationStart): When the router
 * begins activating a route's children.
 * * [ActivationStart](api/router/ActivationStart): When the router begins activating a route.
 * * [GuardsCheckEnd](api/router/GuardsCheckEnd): When the router finishes the *guards*
 * phase of routing successfully.
 * * [ResolveStart](api/router/ResolveStart): When the router begins the *resolve*
 * phase of routing.
 * * [ResolveEnd](api/router/ResolveEnd): When the router finishes the *resolve*
 * phase of routing successfully.
 * * [ChildActivationEnd](api/router/ChildActivationEnd): When the router finishes
 * activating a route's children.
 * * [ActivationEnd](api/router/ActivationEnd): When the router finishes activating a route.
 * * [NavigationEnd](api/router/NavigationEnd): When navigation ends successfully.
 * * [NavigationCancel](api/router/NavigationCancel): When navigation is canceled.
 * * [NavigationError](api/router/NavigationError): When navigation fails
 * due to an unexpected error.
 * * [Scroll](api/router/Scroll): When the user scrolls.
 *
 * @publicApi
 */
type Event = NavigationStart | NavigationEnd | NavigationCancel | NavigationError | RoutesRecognized | GuardsCheckStart | GuardsCheckEnd | RouteConfigLoadStart | RouteConfigLoadEnd | ChildActivationStart | ChildActivationEnd | ActivationStart | ActivationEnd | Scroll | ResolveStart | ResolveEnd | NavigationSkipped;

/**
 * @description
 *
 * Represents the detached route tree.
 *
 * This is an opaque value the router will give to a custom route reuse strategy
 * to store and retrieve later on.
 *
 * @publicApi
 */
type DetachedRouteHandle = {};
/**
 * @description
 *
 * Provides a way to customize when activated routes get reused.
 *
 * @publicApi
 */
declare abstract class RouteReuseStrategy {
    /** Determines if this route (and its subtree) should be detached to be reused later */
    abstract shouldDetach(route: ActivatedRouteSnapshot): boolean;
    /**
     * Stores the detached route.
     *
     * Storing a `null` value should erase the previously stored value.
     */
    abstract store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle | null): void;
    /** Determines if this route (and its subtree) should be reattached */
    abstract shouldAttach(route: ActivatedRouteSnapshot): boolean;
    /** Retrieves the previously stored route */
    abstract retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null;
    /** Determines if a route should be reused */
    abstract shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean;
    static ɵfac: i0.ɵɵFactoryDeclaration<RouteReuseStrategy, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<RouteReuseStrategy>;
}
/**
 * @description
 *
 * This base route reuse strategy only reuses routes when the matched router configs are
 * identical. This prevents components from being destroyed and recreated
 * when just the route parameters, query parameters or fragment change
 * (that is, the existing component is _reused_).
 *
 * This strategy does not store any routes for later reuse.
 *
 * Angular uses this strategy by default.
 *
 *
 * It can be used as a base class for custom route reuse strategies, i.e. you can create your own
 * class that extends the `BaseRouteReuseStrategy` one.
 * @publicApi
 */
declare abstract class BaseRouteReuseStrategy implements RouteReuseStrategy {
    /**
     * Whether the given route should detach for later reuse.
     * Always returns false for `BaseRouteReuseStrategy`.
     * */
    shouldDetach(route: ActivatedRouteSnapshot): boolean;
    /**
     * A no-op; the route is never stored since this strategy never detaches routes for later re-use.
     */
    store(route: ActivatedRouteSnapshot, detachedTree: DetachedRouteHandle): void;
    /** Returns `false`, meaning the route (and its subtree) is never reattached */
    shouldAttach(route: ActivatedRouteSnapshot): boolean;
    /** Returns `null` because this strategy does not store routes for later re-use. */
    retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null;
    /**
     * Determines if a route should be reused.
     * This strategy returns `true` when the future route config and current route config are
     * identical.
     */
    shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean;
}

/**
 * An `InjectionToken` provided by the `RouterOutlet` and can be set using the `routerOutletData`
 * input.
 *
 * When unset, this value is `null` by default.
 *
 * @usageNotes
 *
 * To set the data from the template of the component with `router-outlet`:
 * ```html
 * <router-outlet [routerOutletData]="{name: 'Angular'}" />
 * ```
 *
 * To read the data in the routed component:
 * ```ts
 * data = inject(ROUTER_OUTLET_DATA) as Signal<{name: string}>;
 * ```
 *
 * @publicApi
 */
declare const ROUTER_OUTLET_DATA: InjectionToken<Signal<unknown>>;
/**
 * An interface that defines the contract for developing a component outlet for the `Router`.
 *
 * An outlet acts as a placeholder that Angular dynamically fills based on the current router state.
 *
 * A router outlet should register itself with the `Router` via
 * `ChildrenOutletContexts#onChildOutletCreated` and unregister with
 * `ChildrenOutletContexts#onChildOutletDestroyed`. When the `Router` identifies a matched `Route`,
 * it looks for a registered outlet in the `ChildrenOutletContexts` and activates it.
 *
 * @see {@link ChildrenOutletContexts}
 * @publicApi
 */
interface RouterOutletContract {
    /**
     * Whether the given outlet is activated.
     *
     * An outlet is considered "activated" if it has an active component.
     */
    isActivated: boolean;
    /** The instance of the activated component or `null` if the outlet is not activated. */
    component: Object | null;
    /**
     * The `Data` of the `ActivatedRoute` snapshot.
     */
    activatedRouteData: Data;
    /**
     * The `ActivatedRoute` for the outlet or `null` if the outlet is not activated.
     */
    activatedRoute: ActivatedRoute | null;
    /**
     * Called by the `Router` when the outlet should activate (create a component).
     */
    activateWith(activatedRoute: ActivatedRoute, environmentInjector: EnvironmentInjector): void;
    /**
     * A request to destroy the currently activated component.
     *
     * When a `RouteReuseStrategy` indicates that an `ActivatedRoute` should be removed but stored for
     * later re-use rather than destroyed, the `Router` will call `detach` instead.
     */
    deactivate(): void;
    /**
     * Called when the `RouteReuseStrategy` instructs to detach the subtree.
     *
     * This is similar to `deactivate`, but the activated component should _not_ be destroyed.
     * Instead, it is returned so that it can be reattached later via the `attach` method.
     */
    detach(): ComponentRef<unknown>;
    /**
     * Called when the `RouteReuseStrategy` instructs to re-attach a previously detached subtree.
     */
    attach(ref: ComponentRef<unknown>, activatedRoute: ActivatedRoute): void;
    /**
     * Emits an activate event when a new component is instantiated
     **/
    activateEvents?: EventEmitter<unknown>;
    /**
     * Emits a deactivate event when a component is destroyed.
     */
    deactivateEvents?: EventEmitter<unknown>;
    /**
     * Emits an attached component instance when the `RouteReuseStrategy` instructs to re-attach a
     * previously detached subtree.
     **/
    attachEvents?: EventEmitter<unknown>;
    /**
     * Emits a detached component instance when the `RouteReuseStrategy` instructs to detach the
     * subtree.
     */
    detachEvents?: EventEmitter<unknown>;
    /**
     * Used to indicate that the outlet is able to bind data from the `Router` to the outlet
     * component's inputs.
     *
     * When this is `undefined` or `false` and the developer has opted in to the
     * feature using `withComponentInputBinding`, a warning will be logged in dev mode if this outlet
     * is used in the application.
     */
    readonly supportsBindingToComponentInputs?: true;
}
/**
 * @description
 *
 * Acts as a placeholder that Angular dynamically fills based on the current router state.
 *
 * Each outlet can have a unique name, determined by the optional `name` attribute.
 * The name cannot be set or changed dynamically. If not set, default value is "primary".
 *
 * ```html
 * <router-outlet></router-outlet>
 * <router-outlet name='left'></router-outlet>
 * <router-outlet name='right'></router-outlet>
 * ```
 *
 * Named outlets can be the targets of secondary routes.
 * The `Route` object for a secondary route has an `outlet` property to identify the target outlet:
 *
 * `{path: <base-path>, component: <component>, outlet: <target_outlet_name>}`
 *
 * Using named outlets and secondary routes, you can target multiple outlets in
 * the same `RouterLink` directive.
 *
 * The router keeps track of separate branches in a navigation tree for each named outlet and
 * generates a representation of that tree in the URL.
 * The URL for a secondary route uses the following syntax to specify both the primary and secondary
 * routes at the same time:
 *
 * `http://base-path/primary-route-path(outlet-name:route-path)`
 *
 * A router outlet emits an activate event when a new component is instantiated,
 * deactivate event when a component is destroyed.
 * An attached event emits when the `RouteReuseStrategy` instructs the outlet to reattach the
 * subtree, and the detached event emits when the `RouteReuseStrategy` instructs the outlet to
 * detach the subtree.
 *
 * ```html
 * <router-outlet
 *   (activate)='onActivate($event)'
 *   (deactivate)='onDeactivate($event)'
 *   (attach)='onAttach($event)'
 *   (detach)='onDetach($event)'></router-outlet>
 * ```
 *
 * @see {@link RouterLink}
 * @see {@link Route}
 * @ngModule RouterModule
 *
 * @publicApi
 */
declare class RouterOutlet implements OnDestroy, OnInit, RouterOutletContract {
    private activated;
    private _activatedRoute;
    /**
     * The name of the outlet
     *
     */
    name: string;
    activateEvents: EventEmitter<any>;
    deactivateEvents: EventEmitter<any>;
    /**
     * Emits an attached component instance when the `RouteReuseStrategy` instructs to re-attach a
     * previously detached subtree.
     **/
    attachEvents: EventEmitter<unknown>;
    /**
     * Emits a detached component instance when the `RouteReuseStrategy` instructs to detach the
     * subtree.
     */
    detachEvents: EventEmitter<unknown>;
    /**
     * Data that will be provided to the child injector through the `ROUTER_OUTLET_DATA` token.
     *
     * When unset, the value of the token is `undefined` by default.
     */
    readonly routerOutletData: i0.InputSignal<unknown>;
    private parentContexts;
    private location;
    private changeDetector;
    private inputBinder;
    /** @docs-private */
    readonly supportsBindingToComponentInputs = true;
    /** @docs-private */
    ngOnChanges(changes: SimpleChanges): void;
    /** @docs-private */
    ngOnDestroy(): void;
    private isTrackedInParentContexts;
    /** @docs-private */
    ngOnInit(): void;
    private initializeOutletWithName;
    get isActivated(): boolean;
    /**
     * @returns The currently activated component instance.
     * @throws An error if the outlet is not activated.
     */
    get component(): Object;
    get activatedRoute(): ActivatedRoute;
    get activatedRouteData(): Data;
    /**
     * Called when the `RouteReuseStrategy` instructs to detach the subtree
     */
    detach(): ComponentRef<any>;
    /**
     * Called when the `RouteReuseStrategy` instructs to re-attach a previously detached subtree
     */
    attach(ref: ComponentRef<any>, activatedRoute: ActivatedRoute): void;
    deactivate(): void;
    activateWith(activatedRoute: ActivatedRoute, environmentInjector: EnvironmentInjector): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<RouterOutlet, never>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<RouterOutlet, "router-outlet", ["outlet"], { "name": { "alias": "name"; "required": false; }; "routerOutletData": { "alias": "routerOutletData"; "required": false; "isSignal": true; }; }, { "activateEvents": "activate"; "deactivateEvents": "deactivate"; "attachEvents": "attach"; "detachEvents": "detach"; }, never, never, true, never>;
}

/**
 * @description
 *
 * Options that modify the `Router` URL.
 * Supply an object containing any of these properties to a `Router` navigation function to
 * control how the target URL should be constructed.
 *
 * @see {@link Router#navigate}
 * @see {@link Router#createUrlTree}
 * @see [Routing and Navigation guide](guide/routing/common-router-tasks)
 *
 * @publicApi
 */
interface UrlCreationOptions {
    /**
     * Specifies a root URI to use for relative navigation.
     *
     * For example, consider the following route configuration where the parent route
     * has two children.
     *
     * ```
     * [{
     *   path: 'parent',
     *   component: ParentComponent,
     *   children: [{
     *     path: 'list',
     *     component: ListComponent
     *   },{
     *     path: 'child',
     *     component: ChildComponent
     *   }]
     * }]
     * ```
     *
     * The following `go()` function navigates to the `list` route by
     * interpreting the destination URI as relative to the activated `child`  route
     *
     * ```ts
     *  @Component({...})
     *  class ChildComponent {
     *    constructor(private router: Router, private route: ActivatedRoute) {}
     *
     *    go() {
     *      router.navigate(['../list'], { relativeTo: this.route });
     *    }
     *  }
     * ```
     *
     * A value of `null` or `undefined` indicates that the navigation commands should be applied
     * relative to the root.
     */
    relativeTo?: ActivatedRoute | null;
    /**
     * Sets query parameters to the URL.
     *
     * ```
     * // Navigate to /results?page=1
     * router.navigate(['/results'], { queryParams: { page: 1 } });
     * ```
     */
    queryParams?: Params | null;
    /**
     * Sets the hash fragment for the URL.
     *
     * ```
     * // Navigate to /results#top
     * router.navigate(['/results'], { fragment: 'top' });
     * ```
     */
    fragment?: string;
    /**
     * How to handle query parameters in the router link for the next navigation.
     * One of:
     * * `preserve` : Preserve current parameters.
     * * `merge` : Merge new with current parameters.
     *
     * The "preserve" option discards any new query params:
     * ```
     * // from /view1?page=1 to/view2?page=1
     * router.navigate(['/view2'], { queryParams: { page: 2 },  queryParamsHandling: "preserve"
     * });
     * ```
     * The "merge" option appends new query params to the params from the current URL:
     * ```
     * // from /view1?page=1 to/view2?page=1&otherKey=2
     * router.navigate(['/view2'], { queryParams: { otherKey: 2 },  queryParamsHandling: "merge"
     * });
     * ```
     * In case of a key collision between current parameters and those in the `queryParams` object,
     * the new value is used.
     *
     */
    queryParamsHandling?: QueryParamsHandling | null;
    /**
     * When true, preserves the URL fragment for the next navigation
     *
     * ```
     * // Preserve fragment from /results#top to /view#top
     * router.navigate(['/view'], { preserveFragment: true });
     * ```
     */
    preserveFragment?: boolean;
}
/**
 * @description
 *
 * Options that modify the `Router` navigation strategy.
 * Supply an object containing any of these properties to a `Router` navigation function to
 * control how the target URL should be constructed or interpreted.
 *
 * @see {@link Router#navigate}
 * @see {@link Router#navigateByUrl}
 * @see {@link Router#createurltree}
 * @see [Routing and Navigation guide](guide/routing/common-router-tasks)
 * @see {@link UrlCreationOptions}
 * @see {@link NavigationBehaviorOptions}
 *
 * @publicApi
 */
interface NavigationExtras extends UrlCreationOptions, NavigationBehaviorOptions {
}
type RestoredState = {
    [k: string]: any;
    navigationId: number;
    ɵrouterPageId?: number;
};
/**
 * Information about a navigation operation.
 * Retrieve the most recent navigation object with the
 * [Router.getCurrentNavigation() method](api/router/Router#getcurrentnavigation) .
 *
 * * *id* : The unique identifier of the current navigation.
 * * *initialUrl* : The target URL passed into the `Router#navigateByUrl()` call before navigation.
 * This is the value before the router has parsed or applied redirects to it.
 * * *extractedUrl* : The initial target URL after being parsed with `UrlSerializer.extract()`.
 * * *finalUrl* : The extracted URL after redirects have been applied.
 * This URL may not be available immediately, therefore this property can be `undefined`.
 * It is guaranteed to be set after the `RoutesRecognized` event fires.
 * * *trigger* : Identifies how this navigation was triggered.
 * -- 'imperative'--Triggered by `router.navigateByUrl` or `router.navigate`.
 * -- 'popstate'--Triggered by a popstate event.
 * -- 'hashchange'--Triggered by a hashchange event.
 * * *extras* : A `NavigationExtras` options object that controlled the strategy used for this
 * navigation.
 * * *previousNavigation* : The previously successful `Navigation` object. Only one previous
 * navigation is available, therefore this previous `Navigation` object has a `null` value for its
 * own `previousNavigation`.
 *
 * @publicApi
 */
interface Navigation {
    /**
     * The unique identifier of the current navigation.
     */
    id: number;
    /**
     * The target URL passed into the `Router#navigateByUrl()` call before navigation. This is
     * the value before the router has parsed or applied redirects to it.
     */
    initialUrl: UrlTree;
    /**
     * The initial target URL after being parsed with `UrlHandlingStrategy.extract()`.
     */
    extractedUrl: UrlTree;
    /**
     * The extracted URL after redirects have been applied.
     * This URL may not be available immediately, therefore this property can be `undefined`.
     * It is guaranteed to be set after the `RoutesRecognized` event fires.
     */
    finalUrl?: UrlTree;
    /**
     * Identifies how this navigation was triggered.
     */
    trigger: NavigationTrigger;
    /**
     * Options that controlled the strategy used for this navigation.
     * See `NavigationExtras`.
     */
    extras: NavigationExtras;
    /**
     * The previously successful `Navigation` object. Only one previous navigation
     * is available, therefore this previous `Navigation` object has a `null` value
     * for its own `previousNavigation`.
     */
    previousNavigation: Navigation | null;
    /**
     * Aborts the navigation if it has not yet been completed or reached the point where routes are being activated.
     * This function is a no-op if the navigation is beyond the point where it can be aborted.
     */
    readonly abort: () => void;
}

/**
 * @description
 *
 * A service that facilitates navigation among views and URL manipulation capabilities.
 * This service is provided in the root scope and configured with [provideRouter](api/router/provideRouter).
 *
 * @see {@link Route}
 * @see {@link provideRouter}
 * @see [Routing and Navigation Guide](guide/routing/common-router-tasks).
 *
 * @ngModule RouterModule
 *
 * @publicApi
 */
declare class Router {
    private get currentUrlTree();
    private get rawUrlTree();
    private disposed;
    private nonRouterCurrentEntryChangeSubscription?;
    private readonly console;
    private readonly stateManager;
    private readonly options;
    private readonly pendingTasks;
    private readonly urlUpdateStrategy;
    private readonly navigationTransitions;
    private readonly urlSerializer;
    private readonly location;
    private readonly urlHandlingStrategy;
    private readonly injector;
    /**
     * The private `Subject` type for the public events exposed in the getter. This is used internally
     * to push events to. The separate field allows us to expose separate types in the public API
     * (i.e., an Observable rather than the Subject).
     */
    private _events;
    /**
     * An event stream for routing events.
     */
    get events(): Observable<Event>;
    /**
     * The current state of routing in this NgModule.
     */
    get routerState(): RouterState;
    /**
     * True if at least one navigation event has occurred,
     * false otherwise.
     */
    navigated: boolean;
    /**
     * A strategy for re-using routes.
     *
     * @deprecated Configure using `providers` instead:
     *   `{provide: RouteReuseStrategy, useClass: MyStrategy}`.
     */
    routeReuseStrategy: RouteReuseStrategy;
    /**
     * How to handle a navigation request to the current URL.
     *
     *
     * @deprecated Configure this through `provideRouter` or `RouterModule.forRoot` instead.
     * @see {@link withRouterConfig}
     * @see {@link provideRouter}
     * @see {@link RouterModule}
     */
    onSameUrlNavigation: OnSameUrlNavigation;
    config: Routes;
    /**
     * Indicates whether the application has opted in to binding Router data to component inputs.
     *
     * This option is enabled by the `withComponentInputBinding` feature of `provideRouter` or
     * `bindToComponentInputs` in the `ExtraOptions` of `RouterModule.forRoot`.
     */
    readonly componentInputBindingEnabled: boolean;
    constructor();
    private eventsSubscription;
    private subscribeToNavigationEvents;
    /**
     * Sets up the location change listener and performs the initial navigation.
     */
    initialNavigation(): void;
    /**
     * Sets up the location change listener. This listener detects navigations triggered from outside
     * the Router (the browser back/forward buttons, for example) and schedules a corresponding Router
     * navigation so that the correct events, guards, etc. are triggered.
     */
    setUpLocationChangeListener(): void;
    /**
     * Schedules a router navigation to synchronize Router state with the browser state.
     *
     * This is done as a response to a popstate event and the initial navigation. These
     * two scenarios represent times when the browser URL/state has been updated and
     * the Router needs to respond to ensure its internal state matches.
     */
    private navigateToSyncWithBrowser;
    /** The current URL. */
    get url(): string;
    /**
     * Returns the current `Navigation` object when the router is navigating,
     * and `null` when idle.
     */
    getCurrentNavigation(): Navigation | null;
    /**
     * The `Navigation` object of the most recent navigation to succeed and `null` if there
     *     has not been a successful navigation yet.
     */
    get lastSuccessfulNavigation(): Navigation | null;
    /**
     * Resets the route configuration used for navigation and generating links.
     *
     * @param config The route array for the new configuration.
     *
     * @usageNotes
     *
     * ```ts
     * router.resetConfig([
     *  { path: 'team/:id', component: TeamCmp, children: [
     *    { path: 'simple', component: SimpleCmp },
     *    { path: 'user/:name', component: UserCmp }
     *  ]}
     * ]);
     * ```
     */
    resetConfig(config: Routes): void;
    /** @docs-private */
    ngOnDestroy(): void;
    /** Disposes of the router. */
    dispose(): void;
    /**
     * Appends URL segments to the current URL tree to create a new URL tree.
     *
     * @param commands An array of URL fragments with which to construct the new URL tree.
     * If the path is static, can be the literal URL string. For a dynamic path, pass an array of path
     * segments, followed by the parameters for each segment.
     * The fragments are applied to the current URL tree or the one provided  in the `relativeTo`
     * property of the options object, if supplied.
     * @param navigationExtras Options that control the navigation strategy.
     * @returns The new URL tree.
     *
     * @usageNotes
     *
     * ```
     * // create /team/33/user/11
     * router.createUrlTree(['/team', 33, 'user', 11]);
     *
     * // create /team/33;expand=true/user/11
     * router.createUrlTree(['/team', 33, {expand: true}, 'user', 11]);
     *
     * // you can collapse static segments like this (this works only with the first passed-in value):
     * router.createUrlTree(['/team/33/user', userId]);
     *
     * // If the first segment can contain slashes, and you do not want the router to split it,
     * // you can do the following:
     * router.createUrlTree([{segmentPath: '/one/two'}]);
     *
     * // create /team/33/(user/11//right:chat)
     * router.createUrlTree(['/team', 33, {outlets: {primary: 'user/11', right: 'chat'}}]);
     *
     * // remove the right secondary node
     * router.createUrlTree(['/team', 33, {outlets: {primary: 'user/11', right: null}}]);
     *
     * // assuming the current url is `/team/33/user/11` and the route points to `user/11`
     *
     * // navigate to /team/33/user/11/details
     * router.createUrlTree(['details'], {relativeTo: route});
     *
     * // navigate to /team/33/user/22
     * router.createUrlTree(['../22'], {relativeTo: route});
     *
     * // navigate to /team/44/user/22
     * router.createUrlTree(['../../team/44/user/22'], {relativeTo: route});
     *
     * Note that a value of `null` or `undefined` for `relativeTo` indicates that the
     * tree should be created relative to the root.
     * ```
     */
    createUrlTree(commands: readonly any[], navigationExtras?: UrlCreationOptions): UrlTree;
    /**
     * Navigates to a view using an absolute route path.
     *
     * @param url An absolute path for a defined route. The function does not apply any delta to the
     *     current URL.
     * @param extras An object containing properties that modify the navigation strategy.
     *
     * @returns A Promise that resolves to 'true' when navigation succeeds,
     * to 'false' when navigation fails, or is rejected on error.
     *
     * @usageNotes
     *
     * The following calls request navigation to an absolute path.
     *
     * ```ts
     * router.navigateByUrl("/team/33/user/11");
     *
     * // Navigate without updating the URL
     * router.navigateByUrl("/team/33/user/11", { skipLocationChange: true });
     * ```
     *
     * @see [Routing and Navigation guide](guide/routing/common-router-tasks)
     *
     */
    navigateByUrl(url: string | UrlTree, extras?: NavigationBehaviorOptions): Promise<boolean>;
    /**
     * Navigate based on the provided array of commands and a starting point.
     * If no starting route is provided, the navigation is absolute.
     *
     * @param commands An array of URL fragments with which to construct the target URL.
     * If the path is static, can be the literal URL string. For a dynamic path, pass an array of path
     * segments, followed by the parameters for each segment.
     * The fragments are applied to the current URL or the one provided  in the `relativeTo` property
     * of the options object, if supplied.
     * @param extras An options object that determines how the URL should be constructed or
     *     interpreted.
     *
     * @returns A Promise that resolves to `true` when navigation succeeds, or `false` when navigation
     *     fails. The Promise is rejected when an error occurs if `resolveNavigationPromiseOnError` is
     * not `true`.
     *
     * @usageNotes
     *
     * The following calls request navigation to a dynamic route path relative to the current URL.
     *
     * ```ts
     * router.navigate(['team', 33, 'user', 11], {relativeTo: route});
     *
     * // Navigate without updating the URL, overriding the default behavior
     * router.navigate(['team', 33, 'user', 11], {relativeTo: route, skipLocationChange: true});
     * ```
     *
     * @see [Routing and Navigation guide](guide/routing/common-router-tasks)
     *
     */
    navigate(commands: readonly any[], extras?: NavigationExtras): Promise<boolean>;
    /** Serializes a `UrlTree` into a string */
    serializeUrl(url: UrlTree): string;
    /** Parses a string into a `UrlTree` */
    parseUrl(url: string): UrlTree;
    /**
     * Returns whether the url is activated.
     *
     * @deprecated
     * Use `IsActiveMatchOptions` instead.
     *
     * - The equivalent `IsActiveMatchOptions` for `true` is
     * `{paths: 'exact', queryParams: 'exact', fragment: 'ignored', matrixParams: 'ignored'}`.
     * - The equivalent for `false` is
     * `{paths: 'subset', queryParams: 'subset', fragment: 'ignored', matrixParams: 'ignored'}`.
     */
    isActive(url: string | UrlTree, exact: boolean): boolean;
    /**
     * Returns whether the url is activated.
     */
    isActive(url: string | UrlTree, matchOptions: IsActiveMatchOptions): boolean;
    private removeEmptyProps;
    private scheduleNavigation;
    static ɵfac: i0.ɵɵFactoryDeclaration<Router, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<Router>;
}

/**
 * @description
 *
 * When applied to an element in a template, makes that element a link
 * that initiates navigation to a route. Navigation opens one or more routed components
 * in one or more `<router-outlet>` locations on the page.
 *
 * Given a route configuration `[{ path: 'user/:name', component: UserCmp }]`,
 * the following creates a static link to the route:
 * `<a routerLink="/user/bob">link to user component</a>`
 *
 * You can use dynamic values to generate the link.
 * For a dynamic link, pass an array of path segments,
 * followed by the params for each segment.
 * For example, `['/team', teamId, 'user', userName, {details: true}]`
 * generates a link to `/team/11/user/bob;details=true`.
 *
 * Multiple static segments can be merged into one term and combined with dynamic segments.
 * For example, `['/team/11/user', userName, {details: true}]`
 *
 * The input that you provide to the link is treated as a delta to the current URL.
 * For instance, suppose the current URL is `/user/(box//aux:team)`.
 * The link `<a [routerLink]="['/user/jim']">Jim</a>` creates the URL
 * `/user/(jim//aux:team)`.
 * See {@link Router#createUrlTree} for more information.
 *
 * @usageNotes
 *
 * You can use absolute or relative paths in a link, set query parameters,
 * control how parameters are handled, and keep a history of navigation states.
 *
 * ### Relative link paths
 *
 * The first segment name can be prepended with `/`, `./`, or `../`.
 * * If the first segment begins with `/`, the router looks up the route from the root of the
 *   app.
 * * If the first segment begins with `./`, or doesn't begin with a slash, the router
 *   looks in the children of the current activated route.
 * * If the first segment begins with `../`, the router goes up one level in the route tree.
 *
 * ### Setting and handling query params and fragments
 *
 * The following link adds a query parameter and a fragment to the generated URL:
 *
 * ```html
 * <a [routerLink]="['/user/bob']" [queryParams]="{debug: true}" fragment="education">
 *   link to user component
 * </a>
 * ```
 * By default, the directive constructs the new URL using the given query parameters.
 * The example generates the link: `/user/bob?debug=true#education`.
 *
 * You can instruct the directive to handle query parameters differently
 * by specifying the `queryParamsHandling` option in the link.
 * Allowed values are:
 *
 *  - `'merge'`: Merge the given `queryParams` into the current query params.
 *  - `'preserve'`: Preserve the current query params.
 *
 * For example:
 *
 * ```html
 * <a [routerLink]="['/user/bob']" [queryParams]="{debug: true}" queryParamsHandling="merge">
 *   link to user component
 * </a>
 * ```
 *
 * `queryParams`, `fragment`, `queryParamsHandling`, `preserveFragment`, and `relativeTo`
 * cannot be used when the `routerLink` input is a `UrlTree`.
 *
 * See {@link UrlCreationOptions#queryParamsHandling}.
 *
 * ### Preserving navigation history
 *
 * You can provide a `state` value to be persisted to the browser's
 * [`History.state` property](https://developer.mozilla.org/en-US/docs/Web/API/History#Properties).
 * For example:
 *
 * ```html
 * <a [routerLink]="['/user/bob']" [state]="{tracingId: 123}">
 *   link to user component
 * </a>
 * ```
 *
 * Use {@link Router#getCurrentNavigation} to retrieve a saved
 * navigation-state value. For example, to capture the `tracingId` during the `NavigationStart`
 * event:
 *
 * ```ts
 * // Get NavigationStart events
 * router.events.pipe(filter(e => e instanceof NavigationStart)).subscribe(e => {
 *   const navigation = router.getCurrentNavigation();
 *   tracingService.trace({id: navigation.extras.state.tracingId});
 * });
 * ```
 *
 * ### RouterLink compatible custom elements
 *
 * In order to make a custom element work with routerLink, the corresponding custom
 * element must implement the `href` attribute and must list `href` in the array of
 * the static property/getter `observedAttributes`.
 *
 * @ngModule RouterModule
 *
 * @publicApi
 */
declare class RouterLink implements OnChanges, OnDestroy {
    private router;
    private route;
    private readonly tabIndexAttribute;
    private readonly renderer;
    private readonly el;
    private locationStrategy?;
    /** @nodoc */
    protected readonly reactiveHref: i0.WritableSignal<string | null>;
    /**
     * Represents an `href` attribute value applied to a host element,
     * when a host element is an `<a>`/`<area>` tag or a compatible custom element.
     * For other tags, the value is `null`.
     */
    get href(): string | null;
    /** @deprecated */
    set href(value: string | null);
    /**
     * Represents the `target` attribute on a host element.
     * This is only used when the host element is
     * an `<a>`/`<area>` tag or a compatible custom element.
     */
    target?: string;
    /**
     * Passed to {@link Router#createUrlTree} as part of the
     * `UrlCreationOptions`.
     * @see {@link UrlCreationOptions#queryParams}
     * @see {@link Router#createUrlTree}
     */
    queryParams?: Params | null;
    /**
     * Passed to {@link Router#createUrlTree} as part of the
     * `UrlCreationOptions`.
     * @see {@link UrlCreationOptions#fragment}
     * @see {@link Router#createUrlTree}
     */
    fragment?: string;
    /**
     * Passed to {@link Router#createUrlTree} as part of the
     * `UrlCreationOptions`.
     * @see {@link UrlCreationOptions#queryParamsHandling}
     * @see {@link Router#createUrlTree}
     */
    queryParamsHandling?: QueryParamsHandling | null;
    /**
     * Passed to {@link Router#navigateByUrl} as part of the
     * `NavigationBehaviorOptions`.
     * @see {@link NavigationBehaviorOptions#state}
     * @see {@link Router#navigateByUrl}
     */
    state?: {
        [k: string]: any;
    };
    /**
     * Passed to {@link Router#navigateByUrl} as part of the
     * `NavigationBehaviorOptions`.
     * @see {@link NavigationBehaviorOptions#info}
     * @see {@link Router#navigateByUrl}
     */
    info?: unknown;
    /**
     * Passed to {@link Router#createUrlTree} as part of the
     * `UrlCreationOptions`.
     * Specify a value here when you do not want to use the default value
     * for `routerLink`, which is the current activated route.
     * Note that a value of `undefined` here will use the `routerLink` default.
     * @see {@link UrlCreationOptions#relativeTo}
     * @see {@link Router#createUrlTree}
     */
    relativeTo?: ActivatedRoute | null;
    /** Whether a host element is an `<a>`/`<area>` tag or a compatible custom element. */
    private isAnchorElement;
    private subscription?;
    private readonly applicationErrorHandler;
    private readonly options;
    constructor(router: Router, route: ActivatedRoute, tabIndexAttribute: string | null | undefined, renderer: Renderer2, el: ElementRef, locationStrategy?: LocationStrategy | undefined);
    private subscribeToNavigationEventsIfNecessary;
    /**
     * Passed to {@link Router#createUrlTree} as part of the
     * `UrlCreationOptions`.
     * @see {@link UrlCreationOptions#preserveFragment}
     * @see {@link Router#createUrlTree}
     */
    preserveFragment: boolean;
    /**
     * Passed to {@link Router#navigateByUrl} as part of the
     * `NavigationBehaviorOptions`.
     * @see {@link NavigationBehaviorOptions#skipLocationChange}
     * @see {@link Router#navigateByUrl}
     */
    skipLocationChange: boolean;
    /**
     * Passed to {@link Router#navigateByUrl} as part of the
     * `NavigationBehaviorOptions`.
     * @see {@link NavigationBehaviorOptions#replaceUrl}
     * @see {@link Router#navigateByUrl}
     */
    replaceUrl: boolean;
    /**
     * Modifies the tab index if there was not a tabindex attribute on the element during
     * instantiation.
     */
    private setTabIndexIfNotOnNativeEl;
    /** @docs-private */
    ngOnChanges(changes?: SimpleChanges): void;
    private routerLinkInput;
    /**
     * Commands to pass to {@link Router#createUrlTree} or a `UrlTree`.
     *   - **array**: commands to pass to {@link Router#createUrlTree}.
     *   - **string**: shorthand for array of commands with just the string, i.e. `['/route']`
     *   - **UrlTree**: a `UrlTree` for this link rather than creating one from the commands
     *     and other inputs that correspond to properties of `UrlCreationOptions`.
     *   - **null|undefined**: effectively disables the `routerLink`
     * @see {@link Router#createUrlTree}
     */
    set routerLink(commandsOrUrlTree: readonly any[] | string | UrlTree | null | undefined);
    /** @docs-private */
    onClick(button: number, ctrlKey: boolean, shiftKey: boolean, altKey: boolean, metaKey: boolean): boolean;
    /** @docs-private */
    ngOnDestroy(): any;
    private updateHref;
    private applyAttributeValue;
    get urlTree(): UrlTree | null;
    static ɵfac: i0.ɵɵFactoryDeclaration<RouterLink, [null, null, { attribute: "tabindex"; }, null, null, null]>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<RouterLink, "[routerLink]", never, { "target": { "alias": "target"; "required": false; }; "queryParams": { "alias": "queryParams"; "required": false; }; "fragment": { "alias": "fragment"; "required": false; }; "queryParamsHandling": { "alias": "queryParamsHandling"; "required": false; }; "state": { "alias": "state"; "required": false; }; "info": { "alias": "info"; "required": false; }; "relativeTo": { "alias": "relativeTo"; "required": false; }; "preserveFragment": { "alias": "preserveFragment"; "required": false; }; "skipLocationChange": { "alias": "skipLocationChange"; "required": false; }; "replaceUrl": { "alias": "replaceUrl"; "required": false; }; "routerLink": { "alias": "routerLink"; "required": false; }; }, {}, never, never, true, never>;
    static ngAcceptInputType_preserveFragment: unknown;
    static ngAcceptInputType_skipLocationChange: unknown;
    static ngAcceptInputType_replaceUrl: unknown;
}

/**
 *
 * @description
 *
 * Tracks whether the linked route of an element is currently active, and allows you
 * to specify one or more CSS classes to add to the element when the linked route
 * is active.
 *
 * Use this directive to create a visual distinction for elements associated with an active route.
 * For example, the following code highlights the word "Bob" when the router
 * activates the associated route:
 *
 * ```html
 * <a routerLink="/user/bob" routerLinkActive="active-link">Bob</a>
 * ```
 *
 * Whenever the URL is either '/user' or '/user/bob', the "active-link" class is
 * added to the anchor tag. If the URL changes, the class is removed.
 *
 * You can set more than one class using a space-separated string or an array.
 * For example:
 *
 * ```html
 * <a routerLink="/user/bob" routerLinkActive="class1 class2">Bob</a>
 * <a routerLink="/user/bob" [routerLinkActive]="['class1', 'class2']">Bob</a>
 * ```
 *
 * To add the classes only when the URL matches the link exactly, add the option `exact: true`:
 *
 * ```html
 * <a routerLink="/user/bob" routerLinkActive="active-link" [routerLinkActiveOptions]="{exact:
 * true}">Bob</a>
 * ```
 *
 * To directly check the `isActive` status of the link, assign the `RouterLinkActive`
 * instance to a template variable.
 * For example, the following checks the status without assigning any CSS classes:
 *
 * ```html
 * <a routerLink="/user/bob" routerLinkActive #rla="routerLinkActive">
 *   Bob {{ rla.isActive ? '(already open)' : ''}}
 * </a>
 * ```
 *
 * You can apply the `RouterLinkActive` directive to an ancestor of linked elements.
 * For example, the following sets the active-link class on the `<div>`  parent tag
 * when the URL is either '/user/jim' or '/user/bob'.
 *
 * ```html
 * <div routerLinkActive="active-link" [routerLinkActiveOptions]="{exact: true}">
 *   <a routerLink="/user/jim">Jim</a>
 *   <a routerLink="/user/bob">Bob</a>
 * </div>
 * ```
 *
 * The `RouterLinkActive` directive can also be used to set the aria-current attribute
 * to provide an alternative distinction for active elements to visually impaired users.
 *
 * For example, the following code adds the 'active' class to the Home Page link when it is
 * indeed active and in such case also sets its aria-current attribute to 'page':
 *
 * ```html
 * <a routerLink="/" routerLinkActive="active" ariaCurrentWhenActive="page">Home Page</a>
 * ```
 *
 * @ngModule RouterModule
 *
 * @publicApi
 */
declare class RouterLinkActive implements OnChanges, OnDestroy, AfterContentInit {
    private router;
    private element;
    private renderer;
    private readonly cdr;
    private link?;
    links: QueryList<RouterLink>;
    private classes;
    private routerEventsSubscription;
    private linkInputChangesSubscription?;
    private _isActive;
    get isActive(): boolean;
    /**
     * Options to configure how to determine if the router link is active.
     *
     * These options are passed to the `Router.isActive()` function.
     *
     * @see {@link Router#isActive}
     */
    routerLinkActiveOptions: {
        exact: boolean;
    } | IsActiveMatchOptions;
    /**
     * Aria-current attribute to apply when the router link is active.
     *
     * Possible values: `'page'` | `'step'` | `'location'` | `'date'` | `'time'` | `true` | `false`.
     *
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-current}
     */
    ariaCurrentWhenActive?: 'page' | 'step' | 'location' | 'date' | 'time' | true | false;
    /**
     *
     * You can use the output `isActiveChange` to get notified each time the link becomes
     * active or inactive.
     *
     * Emits:
     * true  -> Route is active
     * false -> Route is inactive
     *
     * ```html
     * <a
     *  routerLink="/user/bob"
     *  routerLinkActive="active-link"
     *  (isActiveChange)="this.onRouterLinkActive($event)">Bob</a>
     * ```
     */
    readonly isActiveChange: EventEmitter<boolean>;
    constructor(router: Router, element: ElementRef, renderer: Renderer2, cdr: ChangeDetectorRef, link?: RouterLink | undefined);
    /** @docs-private */
    ngAfterContentInit(): void;
    private subscribeToEachLinkOnChanges;
    set routerLinkActive(data: string[] | string);
    /** @docs-private */
    ngOnChanges(changes: SimpleChanges): void;
    /** @docs-private */
    ngOnDestroy(): void;
    private update;
    private isLinkActive;
    private hasActiveLinks;
    static ɵfac: i0.ɵɵFactoryDeclaration<RouterLinkActive, [null, null, null, null, { optional: true; }]>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<RouterLinkActive, "[routerLinkActive]", ["routerLinkActive"], { "routerLinkActiveOptions": { "alias": "routerLinkActiveOptions"; "required": false; }; "ariaCurrentWhenActive": { "alias": "ariaCurrentWhenActive"; "required": false; }; "routerLinkActive": { "alias": "routerLinkActive"; "required": false; }; }, { "isActiveChange": "isActiveChange"; }, ["links"], never, true, never>;
}

/**
 * Allowed values in an `ExtraOptions` object that configure
 * when the router performs the initial navigation operation.
 *
 * * 'enabledNonBlocking' - (default) The initial navigation starts after the
 * root component has been created. The bootstrap is not blocked on the completion of the initial
 * navigation.
 * * 'enabledBlocking' - The initial navigation starts before the root component is created.
 * The bootstrap is blocked until the initial navigation is complete. This value should be set in
 * case you use [server-side rendering](guide/ssr), but do not enable [hydration](guide/hydration)
 * for your application.
 * * 'disabled' - The initial navigation is not performed. The location listener is set up before
 * the root component gets created. Use if there is a reason to have
 * more control over when the router starts its initial navigation due to some complex
 * initialization logic.
 *
 * @see {@link /api/router/RouterModule#forRoot forRoot}
 *
 * @publicApi
 */
type InitialNavigation = 'disabled' | 'enabledBlocking' | 'enabledNonBlocking';
/**
 * Extra configuration options that can be used with the `withRouterConfig` function.
 *
 * @publicApi
 */
interface RouterConfigOptions {
    /**
     * Configures how the Router attempts to restore state when a navigation is cancelled.
     *
     * 'replace' - Always uses `location.replaceState` to set the browser state to the state of the
     * router before the navigation started. This means that if the URL of the browser is updated
     * _before_ the navigation is canceled, the Router will simply replace the item in history rather
     * than trying to restore to the previous location in the session history. This happens most
     * frequently with `urlUpdateStrategy: 'eager'` and navigations with the browser back/forward
     * buttons.
     *
     * 'computed' - Will attempt to return to the same index in the session history that corresponds
     * to the Angular route when the navigation gets cancelled. For example, if the browser back
     * button is clicked and the navigation is cancelled, the Router will trigger a forward navigation
     * and vice versa.
     *
     * Note: the 'computed' option is incompatible with any `UrlHandlingStrategy` which only
     * handles a portion of the URL because the history restoration navigates to the previous place in
     * the browser history rather than simply resetting a portion of the URL.
     *
     * The default value is `replace` when not set.
     */
    canceledNavigationResolution?: 'replace' | 'computed';
    /**
     * Configures the default for handling a navigation request to the current URL.
     *
     * If unset, the `Router` will use `'ignore'`.
     *
     * @see {@link OnSameUrlNavigation}
     */
    onSameUrlNavigation?: OnSameUrlNavigation;
    /**
     * Defines how the router merges parameters, data, and resolved data from parent to child
     * routes.
     *
     * By default ('emptyOnly'), a route inherits the parent route's parameters when the route itself
     * has an empty path (meaning its configured with path: '') or when the parent route doesn't have
     * any component set.
     *
     * Set to 'always' to enable unconditional inheritance of parent parameters.
     *
     * Note that when dealing with matrix parameters, "parent" refers to the parent `Route`
     * config which does not necessarily mean the "URL segment to the left". When the `Route` `path`
     * contains multiple segments, the matrix parameters must appear on the last segment. For example,
     * matrix parameters for `{path: 'a/b', component: MyComp}` should appear as `a/b;foo=bar` and not
     * `a;foo=bar/b`.
     *
     */
    paramsInheritanceStrategy?: 'emptyOnly' | 'always';
    /**
     * Defines when the router updates the browser URL. By default ('deferred'),
     * update after successful navigation.
     * Set to 'eager' if prefer to update the URL at the beginning of navigation.
     * Updating the URL early allows you to handle a failure of navigation by
     * showing an error message with the URL that failed.
     */
    urlUpdateStrategy?: 'deferred' | 'eager';
    /**
     * The default strategy to use for handling query params in `Router.createUrlTree` when one is not provided.
     *
     * The `createUrlTree` method is used internally by `Router.navigate` and `RouterLink`.
     * Note that `QueryParamsHandling` does not apply to `Router.navigateByUrl`.
     *
     * When neither the default nor the queryParamsHandling option is specified in the call to `createUrlTree`,
     * the current parameters will be replaced by new parameters.
     *
     * @see {@link Router#createUrlTree}
     * @see {@link QueryParamsHandling}
     */
    defaultQueryParamsHandling?: QueryParamsHandling;
    /**
     * When `true`, the `Promise` will instead resolve with `false`, as it does with other failed
     * navigations (for example, when guards are rejected).
  
     * Otherwise the `Promise` returned by the Router's navigation with be rejected
     * if an error occurs.
     */
    resolveNavigationPromiseOnError?: boolean;
}
/**
 * Configuration options for the scrolling feature which can be used with `withInMemoryScrolling`
 * function.
 *
 * @publicApi
 */
interface InMemoryScrollingOptions {
    /**
     * When set to 'enabled', scrolls to the anchor element when the URL has a fragment.
     * Anchor scrolling is disabled by default.
     *
     * Anchor scrolling does not happen on 'popstate'. Instead, we restore the position
     * that we stored or scroll to the top.
     */
    anchorScrolling?: 'disabled' | 'enabled';
    /**
     * Configures if the scroll position needs to be restored when navigating back.
     *
     * * 'disabled'- (Default) Does nothing. Scroll position is maintained on navigation.
     * * 'top'- Sets the scroll position to x = 0, y = 0 on all navigation.
     * * 'enabled'- Restores the previous scroll position on backward navigation, else sets the
     * position to the anchor if one is provided, or sets the scroll position to [0, 0] (forward
     * navigation). This option will be the default in the future.
     *
     * You can implement custom scroll restoration behavior by adapting the enabled behavior as
     * in the following example.
     *
     * ```ts
     * class AppComponent {
     *   movieData: any;
     *
     *   constructor(private router: Router, private viewportScroller: ViewportScroller,
     * changeDetectorRef: ChangeDetectorRef) {
     *   router.events.pipe(filter((event: Event): event is Scroll => event instanceof Scroll)
     *     ).subscribe(e => {
     *       fetch('http://example.com/movies.json').then(response => {
     *         this.movieData = response.json();
     *         // update the template with the data before restoring scroll
     *         changeDetectorRef.detectChanges();
     *
     *         if (e.position) {
     *           viewportScroller.scrollToPosition(e.position);
     *         }
     *       });
     *     });
     *   }
     * }
     * ```
     */
    scrollPositionRestoration?: 'disabled' | 'enabled' | 'top';
}
/**
 * A set of configuration options for a router module, provided in the
 * `forRoot()` method.
 *
 * @see {@link /api/router/routerModule#forRoot forRoot}
 *
 *
 * @publicApi
 */
interface ExtraOptions extends InMemoryScrollingOptions, RouterConfigOptions {
    /**
     * When true, log all internal navigation events to the console.
     * Use for debugging.
     */
    enableTracing?: boolean;
    /**
     * When true, enable the location strategy that uses the URL fragment
     * instead of the history API.
     */
    useHash?: boolean;
    /**
     * One of `enabled`, `enabledBlocking`, `enabledNonBlocking` or `disabled`.
     * When set to `enabled` or `enabledBlocking`, the initial navigation starts before the root
     * component is created. The bootstrap is blocked until the initial navigation is complete. This
     * value should be set in case you use [server-side rendering](guide/ssr), but do not enable
     * [hydration](guide/hydration) for your application. When set to `enabledNonBlocking`,
     * the initial navigation starts after the root component has been created.
     * The bootstrap is not blocked on the completion of the initial navigation. When set to
     * `disabled`, the initial navigation is not performed. The location listener is set up before the
     * root component gets created. Use if there is a reason to have more control over when the router
     * starts its initial navigation due to some complex initialization logic.
     */
    initialNavigation?: InitialNavigation;
    /**
     * When true, enables binding information from the `Router` state directly to the inputs of the
     * component in `Route` configurations.
     */
    bindToComponentInputs?: boolean;
    /**
     * When true, enables view transitions in the Router by running the route activation and
     * deactivation inside of `document.startViewTransition`.
     *
     * @see https://developer.chrome.com/docs/web-platform/view-transitions/
     * @see https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API
     * @experimental 17.0
     */
    enableViewTransitions?: boolean;
    /**
     * A custom error handler for failed navigations.
     * If the handler returns a value, the navigation Promise is resolved with this value.
     * If the handler throws an exception, the navigation Promise is rejected with the exception.
     *
     * @see RouterConfigOptions
     */
    errorHandler?: (error: any) => RedirectCommand | any;
    /**
     * Configures a preloading strategy.
     * One of `PreloadAllModules` or `NoPreloading` (the default).
     */
    preloadingStrategy?: any;
    /**
     * Configures the scroll offset the router will use when scrolling to an element.
     *
     * When given a tuple with x and y position value,
     * the router uses that offset each time it scrolls.
     * When given a function, the router invokes the function every time
     * it restores scroll position.
     */
    scrollOffset?: [number, number] | (() => [number, number]);
}
/**
 * A DI token for the router service.
 *
 * @publicApi
 */
declare const ROUTER_CONFIGURATION: InjectionToken<ExtraOptions>;

/**
 * This component is used internally within the router to be a placeholder when an empty
 * router-outlet is needed. For example, with a config such as:
 *
 * `{path: 'parent', outlet: 'nav', children: [...]}`
 *
 * In order to render, there needs to be a component on this config, which will default
 * to this `EmptyOutletComponent`.
 */
declare class ɵEmptyOutletComponent {
    static ɵfac: i0.ɵɵFactoryDeclaration<ɵEmptyOutletComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<ɵEmptyOutletComponent, "ng-component", ["emptyRouterOutlet"], {}, {}, never, never, true, never>;
}

declare const ROUTER_PROVIDERS: Provider[];
/**
 * @description
 *
 * Adds directives and providers for in-app navigation among views defined in an application.
 * Use the Angular `Router` service to declaratively specify application states and manage state
 * transitions.
 *
 * You can import this NgModule multiple times, once for each lazy-loaded bundle.
 * However, only one `Router` service can be active.
 * To ensure this, there are two ways to register routes when importing this module:
 *
 * * The `forRoot()` method creates an `NgModule` that contains all the directives, the given
 * routes, and the `Router` service itself.
 * * The `forChild()` method creates an `NgModule` that contains all the directives and the given
 * routes, but does not include the `Router` service.
 *
 * @see [Routing and Navigation guide](guide/routing/common-router-tasks) for an
 * overview of how the `Router` service should be used.
 *
 * @publicApi
 */
declare class RouterModule {
    constructor();
    /**
     * Creates and configures a module with all the router providers and directives.
     * Optionally sets up an application listener to perform an initial navigation.
     *
     * When registering the NgModule at the root, import as follows:
     *
     * ```ts
     * @NgModule({
     *   imports: [RouterModule.forRoot(ROUTES)]
     * })
     * class MyNgModule {}
     * ```
     *
     * @param routes An array of `Route` objects that define the navigation paths for the application.
     * @param config An `ExtraOptions` configuration object that controls how navigation is performed.
     * @return The new `NgModule`.
     *
     */
    static forRoot(routes: Routes, config?: ExtraOptions): ModuleWithProviders<RouterModule>;
    /**
     * Creates a module with all the router directives and a provider registering routes,
     * without creating a new Router service.
     * When registering for submodules and lazy-loaded submodules, create the NgModule as follows:
     *
     * ```ts
     * @NgModule({
     *   imports: [RouterModule.forChild(ROUTES)]
     * })
     * class MyNgModule {}
     * ```
     *
     * @param routes An array of `Route` objects that define the navigation paths for the submodule.
     * @return The new NgModule.
     *
     */
    static forChild(routes: Routes): ModuleWithProviders<RouterModule>;
    static ɵfac: i0.ɵɵFactoryDeclaration<RouterModule, never>;
    static ɵmod: i0.ɵɵNgModuleDeclaration<RouterModule, never, [typeof RouterOutlet, typeof RouterLink, typeof RouterLinkActive, typeof ɵEmptyOutletComponent], [typeof RouterOutlet, typeof RouterLink, typeof RouterLinkActive, typeof ɵEmptyOutletComponent]>;
    static ɵinj: i0.ɵɵInjectorDeclaration<RouterModule>;
}
/**
 * A DI token for the router initializer that
 * is called after the app is bootstrapped.
 *
 * @publicApi
 */
declare const ROUTER_INITIALIZER: InjectionToken<(compRef: ComponentRef<any>) => void>;

export { ActivatedRoute, ActivatedRouteSnapshot, ActivationEnd, ActivationStart, BaseRouteReuseStrategy, ChildActivationEnd, ChildActivationStart, DefaultUrlSerializer, EventType, GuardsCheckEnd, GuardsCheckStart, NavigationCancel, NavigationCancellationCode, NavigationEnd, NavigationError, NavigationSkipped, NavigationSkippedCode, NavigationStart, PRIMARY_OUTLET, ROUTER_CONFIGURATION, ROUTER_INITIALIZER, ROUTER_OUTLET_DATA, ROUTER_PROVIDERS, RedirectCommand, ResolveEnd, ResolveStart, RouteConfigLoadEnd, RouteConfigLoadStart, RouteReuseStrategy, Router, RouterEvent, RouterLink, RouterLinkActive, RouterModule, RouterOutlet, RouterState, RouterStateSnapshot, RoutesRecognized, Scroll, UrlSegment, UrlSegmentGroup, UrlSerializer, UrlTree, convertToParamMap, defaultUrlMatcher, ɵEmptyOutletComponent };
export type { CanActivate, CanActivateChild, CanActivateChildFn, CanActivateFn, CanDeactivate, CanDeactivateFn, CanLoad, CanLoadFn, CanMatch, CanMatchFn, Data, DefaultExport, DeprecatedGuard, DeprecatedResolve, DetachedRouteHandle, Event, ExtraOptions, GuardResult, InMemoryScrollingOptions, InitialNavigation, IsActiveMatchOptions, LoadChildren, LoadChildrenCallback, LoadedRouterConfig, MaybeAsync, Navigation, NavigationBehaviorOptions, NavigationExtras, OnSameUrlNavigation, ParamMap, Params, QueryParamsHandling, RedirectFunction, Resolve, ResolveData, ResolveFn, RestoredState, Route, RouterConfigOptions, RouterOutletContract, Routes, RunGuardsAndResolvers, UrlCreationOptions, UrlMatchResult, UrlMatcher };

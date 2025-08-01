import { OnDestroy, OnInit, OnChanges, SimpleChange, ChangeDetectorRef, ElementRef } from "@angular/core";
import { NgxSpinnerService } from "./ngx-spinner.service";
import { Subject } from "rxjs";
import { Size, NgxSpinner } from "./ngx-spinner.enum";
import { NgxSpinnerConfig } from "./config";
import * as i0 from "@angular/core";
export declare class NgxSpinnerComponent implements OnDestroy, OnInit, OnChanges {
    private spinnerService;
    private changeDetector;
    private elementRef;
    private globalConfig;
    /**
     * To set backdrop color
     * Only supports RGBA color format
     * @memberof NgxSpinnerComponent
     */
    bdColor: string;
    /**
     * To set spinner size
     *
     * @memberof NgxSpinnerComponent
     */
    size: Size;
    /**
     * To set spinner color(DEFAULTS.SPINNER_COLOR)
     *
     * @memberof NgxSpinnerComponent
     */
    color: string;
    /**
     * To set type of spinner
     *
     * @memberof NgxSpinnerComponent
     */
    type: string;
    /**
     * To toggle fullscreen mode
     *
     * @memberof NgxSpinnerComponent
     */
    fullScreen: boolean;
    /**
     * Spinner name
     *
     * @memberof NgxSpinnerComponent
     */
    name: string;
    /**
     * z-index value
     *
     * @memberof NgxSpinnerComponent
     */
    zIndex: number;
    /**
     * Custom template for spinner/loader
     *
     * @memberof NgxSpinnerComponent
     */
    template: string;
    /**
     * Show/Hide the spinner
     *
     * @type {boolean}
     * @memberof NgxSpinnerComponent
     */
    showSpinner: boolean;
    /**
     * To enable/disable animation
     *
     * @type {boolean}
     * @memberof NgxSpinnerComponent
     */
    disableAnimation: boolean;
    /**
     * Spinner Object
     *
     * @memberof NgxSpinnerComponent
     */
    spinner: NgxSpinner;
    /**
     * Array for spinner's div
     *
     * @memberof NgxSpinnerComponent
     */
    divArray: Array<number>;
    /**
     * Counter for div
     *
     * @memberof NgxSpinnerComponent
     *
     */
    divCount: number;
    /**
     * Show spinner
     *
     * @memberof NgxSpinnerComponent
     **/
    show: boolean;
    /**
     * Unsubscribe from spinner's observable
     *
     * @memberof NgxSpinnerComponent
     **/
    ngUnsubscribe: Subject<void>;
    /**
     * Element Reference
     *
     * @memberof NgxSpinnerComponent
     */
    spinnerDOM: {
        nativeElement: any;
    };
    /**
     * Creates an instance of NgxSpinnerComponent.
     *
     * @memberof NgxSpinnerComponent
     */
    constructor(spinnerService: NgxSpinnerService, changeDetector: ChangeDetectorRef, elementRef: ElementRef, globalConfig: NgxSpinnerConfig);
    initObservable(): void;
    /**
     * Initialization method
     *
     * @memberof NgxSpinnerComponent
     */
    ngOnInit(): void;
    /**
     * To check event triggers inside the Spinner Zone
     *
     * @param {*} element
     * @returns {boolean}
     * @memberof NgxSpinnerComponent
     */
    isSpinnerZone(element: any): boolean;
    /**
     * To set default ngx-spinner options
     *
     * @memberof NgxSpinnerComponent
     */
    setDefaultOptions: () => void;
    /**
     * On changes event for input variables
     *
     * @memberof NgxSpinnerComponent
     */
    ngOnChanges(changes: {
        [propKey: string]: SimpleChange;
    }): void;
    /**
     * To get class for spinner
     *
     * @memberof NgxSpinnerComponent
     */
    getClass(type: string, size: Size): string;
    /**
     * Check if input variables have changed
     *
     * @memberof NgxSpinnerComponent
     */
    onInputChange(): void;
    /**
     * Component destroy event
     *
     * @memberof NgxSpinnerComponent
     */
    ngOnDestroy(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<NgxSpinnerComponent, [null, null, null, { optional: true; }]>;
    static ɵcmp: i0.ɵɵComponentDeclaration<NgxSpinnerComponent, "ngx-spinner", never, { "bdColor": { "alias": "bdColor"; "required": false; }; "size": { "alias": "size"; "required": false; }; "color": { "alias": "color"; "required": false; }; "type": { "alias": "type"; "required": false; }; "fullScreen": { "alias": "fullScreen"; "required": false; }; "name": { "alias": "name"; "required": false; }; "zIndex": { "alias": "zIndex"; "required": false; }; "template": { "alias": "template"; "required": false; }; "showSpinner": { "alias": "showSpinner"; "required": false; }; "disableAnimation": { "alias": "disableAnimation"; "required": false; }; }, {}, never, ["*"], true, never>;
}

import {
    AfterViewInit, ContentChildren, Directive, ElementRef, EventEmitter,
    Inject, Input, LOCALE_ID, OnDestroy, Optional, Output, QueryList
} from '@angular/core';
import { merge, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DisplayDensityBase, DisplayDensityToken, IDisplayDensityOptions } from '../core/density';
import { EditorProvider } from '../core/edit-provider';
import { IToggleView } from '../core/navigation';
import { IBaseCancelableBrowserEventArgs, IBaseEventArgs } from '../core/utils';
import { DateRange } from '../date-range-picker/public_api';
import { IgxOverlayOutletDirective } from '../directives/toggle/toggle.directive';
import { IgxInputGroupType, IGX_INPUT_GROUP_TYPE } from '../input-group/public_api';
import { OverlaySettings } from '../services/overlay/utilities';
import { IgxPickerToggleComponent } from './picker-icons.common';
import { PickerInteractionMode } from './types';

@Directive()
export abstract class PickerBaseDirective extends DisplayDensityBase implements IToggleView, EditorProvider, AfterViewInit, OnDestroy {
    /**
     * The editor's input mask.
     *
     * @remarks
     * Also used as a placeholder when none is provided.
     * Default is `"'MM/dd/yyyy'"`
     *
     * @example
     * ```html
     * <igx-date-picker inputFormat="dd/MM/yy"></igx-date-picker>
     * ```
     */
    @Input()
    public inputFormat: string;

    /**
     * The format used to display the picker's value when it's not being edited.
     *
     * @remarks
     * Uses Angular's DatePipe.
     *
     * @example
     * ```html
     * <igx-date-picker displayFormat="EE/M/yy"></igx-date-picker>
     * ```
     *
     */
    @Input()
    public displayFormat: string;

    /**
     * Sets the `placeholder` of the picker's input.
     *
     * @example
     * ```html
     * <igx-date-picker [placeholder]="'Choose your date'"></igx-date-picker>
     * ```
     */
    @Input()
    public placeholder = '';

    /**
     * Can be `dropdown` with editable input field or `dialog` with readonly input field.
     *
     * @remarks
     * Default mode is `dropdown`
     *
     * @example
     * ```html
     * <igx-date-picker mode="dialog"></igx-date-picker>
     * ```
     */
    @Input()
    public mode: PickerInteractionMode = PickerInteractionMode.DropDown;

    /**
     * Overlay settings used to display the pop-up element.
     *
     * @example
     * ```html
     * <igx-date-picker [overlaySettings]="customOverlaySettings"></igx-date-picker>
     * ```
     */
    @Input()
    public overlaySettings: OverlaySettings;

    /**
     * Enables or disables the picker.
     *
     * @example
     * ```html
     * <igx-date-picker [disabled]="'true'"></igx-date-picker>
     * ```
     */
    @Input()
    public disabled = false;

    // /**
    //  * Locale settings used for value formatting and calendar or time spinner.
    //  *
    //  * @remarks
    //  * Uses Angular's `LOCALE_ID` by default. Affects both input mask and display format if those are not set.
    //  * If a `locale` is set, it must be registered via `registerLocaleData`.
    //  * Please refer to https://angular.io/guide/i18n#i18n-pipes.
    //  * If it is not registered, `Intl` will be used for formatting.
    //  *
    //  * @example
    //  * ```html
    //  * <igx-date-picker locale="jp"></igx-date-picker>
    //  * ```
    //  */
    // /**
    //  * Gets the `locale` of the date-picker.
    //  * Default value is `application's LOCALE_ID`.
    //  */
    // @Input()
    // public get locale(): string {
    //     return this._locale;
    // }
    //
    // /**
    //  * Sets the `locale` of the date-picker.
    //  * Expects a valid BCP 47 language tag.
    //  * Default value is `application's LOCALE_ID`.
    //  */
    // public set locale(value: string) {
    //     debugger
    //     this._locale = value;
    //     try {
    //         getLocaleFirstDayOfWeek(this._locale);
    //     } catch (e) {
    //         this._locale = this._localeId;
    //     }
    //
    // }

    /**
     * The container used for the pop-up element.
     *
     * @example
     * ```html
     * <div igxOverlayOutlet #outlet="overlay-outlet"></div>
     * <!-- ... -->
     * <igx-date-picker [outlet]="outlet"></igx-date-picker>
     * <!-- ... -->
     * ```
     */
    @Input()
    public outlet: IgxOverlayOutletDirective | ElementRef;

    /**
     * Determines how the picker's input will be styled.
     *
     * @remarks
     * Default is `box`.
     *
     * @example
     * ```html
     * <igx-date-picker [type]="'line'"></igx-date-picker>
     * ```
     */
    @Input()
    public set type(val: IgxInputGroupType) {
        this._type = val;
    }
    public get type(): IgxInputGroupType {
        return this._type || this._inputGroupType;
    }

    /**
     * Gets/Sets the default template editor's tabindex.
     *
     * @example
     * ```html
     * <igx-date-picker [tabIndex]="1"></igx-date-picker>
     * ```
     */
    @Input()
    public tabIndex: number | string;

    /**
     * Emitted when the calendar has started opening, cancelable.
     *
     * @example
     * ```html
     * <igx-date-picker (opening)="handleOpening($event)"></igx-date-picker>
     * ```
     */
    @Output()
    public opening = new EventEmitter<IBaseCancelableBrowserEventArgs>();

    /**
     * Emitted after the calendar has opened.
     *
     * @example
     * ```html
     * <igx-date-picker (opened)="handleOpened($event)"></igx-date-picker>
     * ```
     */
    @Output()
    public opened = new EventEmitter<IBaseEventArgs>();

    /**
     * Emitted when the calendar has started closing, cancelable.
     *
     * @example
     * ```html
     * <igx-date-picker (closing)="handleClosing($event)"></igx-date-picker>
     * ```
     */
    @Output()
    public closing = new EventEmitter<IBaseCancelableBrowserEventArgs>();

    /**
     * Emitted after the calendar has closed.
     *
     * @example
     * ```html
     * <igx-date-picker (closed)="handleClosed($event)"></igx-date-picker>
     * ```
     */
    @Output()
    public closed = new EventEmitter<IBaseEventArgs>();

    /** @hidden @internal */
    @ContentChildren(IgxPickerToggleComponent, { descendants: true })
    public toggleComponents: QueryList<IgxPickerToggleComponent>;

    protected _collapsed = true;
    protected _type: IgxInputGroupType;
    protected _minValue: Date | string;
    protected _maxValue: Date | string;

    /**
     * Gets the picker's pop-up state.
     *
     * @example
     * ```typescript
     * const state = this.picker.collapsed;
     * ```
     */
    public get collapsed(): boolean {
        return this._collapsed;
    }

    /** @hidden @internal */
    public get isDropdown(): boolean {
        return this.mode === PickerInteractionMode.DropDown;
    }

    protected _destroy$ = new Subject();

    // D.P. EventEmitter<string | Date | DateRange | null> throws on strict checks for more restrictive overrides
    // w/ TS2416 Type 'string | Date ...' not assignable to type 'DateRange' due to observer method check
    public abstract valueChange: EventEmitter<any>;

    constructor(public element: ElementRef,
        @Inject(LOCALE_ID) protected _localeId: string,
        @Optional() @Inject(DisplayDensityToken) protected _displayDensityOptions?: IDisplayDensityOptions,
        @Optional() @Inject(IGX_INPUT_GROUP_TYPE) protected _inputGroupType?: IgxInputGroupType) {
        super(_displayDensityOptions || { displayDensity: 'comfortable' });
    }

    /** @hidden @internal */
    public ngAfterViewInit(): void {
        this.subToIconsClicked(this.toggleComponents, () => this.open());
        this.toggleComponents.changes.pipe(takeUntil(this._destroy$))
            .subscribe(() => this.subToIconsClicked(this.toggleComponents, () => this.open()));
    }

    /** @hidden @internal */
    public ngOnDestroy(): void {
        this._destroy$.next();
        this._destroy$.complete();
    }

    /** Subscribes to the click events of toggle/clear icons in a query */
    protected subToIconsClicked(components: QueryList<IgxPickerToggleComponent>, next: () => any) {
        components.forEach(toggle => {
            toggle.clicked
                .pipe(takeUntil(merge(components.changes, this._destroy$)))
                .subscribe(next);
        });
    };

    public abstract select(value: Date | DateRange | string): void;
    public abstract open(settings?: OverlaySettings): void;
    public abstract toggle(settings?: OverlaySettings): void;
    public abstract close(): void;
    public abstract getEditElement(): HTMLInputElement;
}

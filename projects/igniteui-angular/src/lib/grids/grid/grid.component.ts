import {
    Component, ChangeDetectionStrategy, Input, Output, EventEmitter, ContentChild, ViewChildren,
    QueryList, ViewChild, TemplateRef, DoCheck, AfterContentInit, HostBinding,
    OnInit, AfterViewInit, ContentChildren
} from '@angular/core';
import { IgxGridBaseDirective } from '../grid-base.directive';
import { IgxGridNavigationService } from '../grid-navigation.service';
import { IgxGridAPIService } from './grid-api.service';
import { cloneArray, IBaseEventArgs } from '../../core/utils';
import { IGroupByRecord } from '../../data-operations/groupby-record.interface';
import { IgxGroupByRowTemplateDirective, IgxGridDetailTemplateDirective } from './grid.directives';
import { IgxGridGroupByRowComponent } from './groupby-row.component';
import { IGroupByExpandState } from '../../data-operations/groupby-expand-state.interface';
import { IForOfState } from '../../directives/for-of/for_of.directive';
import { IgxColumnComponent } from '../columns/column.component';
import { takeUntil } from 'rxjs/operators';
import { IgxFilteringService } from '../filtering/grid-filtering.service';
import { IGroupingExpression } from '../../data-operations/grouping-expression.interface';
import { IgxColumnResizingService } from '../resizing/resizing.service';
import { IgxGridSummaryService } from '../summaries/grid-summary.service';
import { IgxGridSelectionService } from '../selection/selection.service';
import { IgxForOfSyncService, IgxForOfScrollSyncService } from '../../directives/for-of/for_of.sync.service';
import { IgxGridMRLNavigationService } from '../grid-mrl-navigation.service';
import { FilterMode, GridInstanceType } from '../common/enums';
import { CellType, GridType, IGX_GRID_BASE, IGX_GRID_SERVICE_BASE, RowType } from '../common/grid.interface';
import { IgxGroupByRowSelectorDirective } from '../selection/row-selectors';
import { IgxGridCRUDService } from '../common/crud.service';
import { IgxGridRow, IgxGroupByRow, IgxSummaryRow } from '../grid-public-row';
import { IgxGridGroupByAreaComponent } from '../grouping/grid-group-by-area.component';
import { IgxGridCell } from '../grid-public-cell';
import { ISortingExpression } from '../../data-operations/sorting-strategy';
import { IGridGroupingStrategy } from '../common/strategy';

let NEXT_ID = 0;

export interface IGroupingDoneEventArgs extends IBaseEventArgs {
    expressions: Array<ISortingExpression> | ISortingExpression;
    groupedColumns: Array<IgxColumnComponent> | IgxColumnComponent;
    ungroupedColumns: Array<IgxColumnComponent> | IgxColumnComponent;
}

/**
 * Grid provides a way to present and manipulate tabular data.
 *
 * @igxModule IgxGridModule
 * @igxGroup Grids & Lists
 * @igxKeywords grid, table
 * @igxTheme igx-grid-theme
 * @remarks
 * The Ignite UI Grid is used for presenting and manipulating tabular data in the simplest way possible.  Once data
 * has been bound, it can be manipulated through filtering, sorting & editing operations.
 * @example
 * ```html
 * <igx-grid [data]="employeeData" [autoGenerate]="false">
 *   <igx-column field="first" header="First Name"></igx-column>
 *   <igx-column field="last" header="Last Name"></igx-column>
 *   <igx-column field="role" header="Role"></igx-column>
 * </igx-grid>
 * ```
 */
@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    preserveWhitespaces: false,
    providers: [
        IgxGridCRUDService,
        IgxGridNavigationService,
        IgxGridSummaryService,
        IgxGridSelectionService,
        { provide: IGX_GRID_SERVICE_BASE, useClass: IgxGridAPIService },
        { provide: IGX_GRID_BASE, useExisting: IgxGridComponent },
        IgxFilteringService,
        IgxColumnResizingService,
        IgxForOfSyncService,
        IgxForOfScrollSyncService
    ],
    selector: 'igx-grid',
    templateUrl: './grid.component.html'
})
export class IgxGridComponent extends IgxGridBaseDirective implements GridType, OnInit, DoCheck, AfterContentInit, AfterViewInit {
    /**
     * Emitted when a new chunk of data is loaded from virtualization.
     *
     * @example
     * ```typescript
     *  <igx-grid #grid [data]="localData" [autoGenerate]="true" (dataPreLoad)='handleDataPreloadEvent()'></igx-grid>
     * ```
     */
    @Output()
    public dataPreLoad = new EventEmitter<IForOfState>();

    /**
     * @hidden
     */
    @Output()
    public groupingExpressionsChange = new EventEmitter<IGroupingExpression[]>();

    /**
     * @hidden @internal
     */
    @Output()
    public groupingExpansionStateChange = new EventEmitter<IGroupByExpandState[]>();

    /**
     * Emitted when columns are grouped/ungrouped.
     *
     * @remarks
     * The `onGroupingDone` event would be raised only once if several columns get grouped at once by calling
     * the `groupBy()` or `clearGrouping()` API methods and passing an array as an argument.
     * The event arguments provide the `expressions`, `groupedColumns` and `ungroupedColumns` properties, which contain
     * the `ISortingExpression` and the `IgxColumnComponent` related to the grouping/ungrouping operation.
     * Please note that `groupedColumns` and `ungroupedColumns` show only the **newly** changed columns (affected by the **last**
     * grouping/ungrouping operation), not all columns which are currently grouped/ungrouped.
     * columns.
     * @example
     * ```html
     * <igx-grid #grid [data]="localData" (onGroupingDone)="groupingDone($event)" [autoGenerate]="true"></igx-grid>
     * ```
     */
    @Output()
    public onGroupingDone = new EventEmitter<IGroupingDoneEventArgs>();

    /**
     * Gets/Sets whether created groups are rendered expanded or collapsed.
     *
     * @remarks
     * The default rendered state is expanded.
     * @example
     * ```html
     * <igx-grid #grid [data]="Data" [groupsExpanded]="false" [autoGenerate]="true"></igx-grid>
     * ```
     */
    @Input()
    public groupsExpanded = true;

    /**
     * Gets/Sets the template that will be rendered as a GroupBy drop area.
     *
     * @remarks
     * The grid needs to have at least one groupable column in order the GroupBy area to be displayed.
     * @example
     * ```html
     * <igx-grid [dropAreaTemplate]="dropAreaRef">
     * </igx-grid>
     * <ng-template #myDropArea>
     *      <span> Custom drop area! </span>
     * </ng-template>
     * ```
     */
    @Input()
    public dropAreaTemplate: TemplateRef<any>;

    /**
     * @hidden @internal
     */
    @ContentChildren(IgxGridDetailTemplateDirective, { read: TemplateRef })
    public detailTemplate: QueryList<TemplateRef<any>> = new QueryList();

    /**
     * @hidden @internal
     */
    @ViewChild(IgxGridGroupByAreaComponent)
    public groupArea: IgxGridGroupByAreaComponent;

    /**
     * @hidden @internal
     */
    @HostBinding('attr.role')
    public role = 'grid';

    /**
     * Gets/Sets the value of the `id` attribute.
     *
     * @remarks
     * If not provided it will be automatically generated.
     * @example
     * ```html
     * <igx-grid [id]="'igx-grid-1'" [data]="Data" [autoGenerate]="true"></igx-grid>
     * ```
     */
    @HostBinding('attr.id')
    @Input()
    public id = `igx-grid-${NEXT_ID++}`;

    /**
     * @hidden @internal
     */
    @ViewChild('record_template', { read: TemplateRef, static: true })
    protected recordTemplate: TemplateRef<any>;

    @ViewChild('detail_template_container', { read: TemplateRef, static: true })
    protected detailTemplateContainer: TemplateRef<any>;

    @ViewChild('group_template', { read: TemplateRef, static: true })
    protected defaultGroupTemplate: TemplateRef<any>;

    @ViewChild('summary_template', { read: TemplateRef, static: true })
    protected summaryTemplate: TemplateRef<any>;

    /**
     * @hidden @internal
     */
    @ContentChild(IgxGroupByRowTemplateDirective, { read: IgxGroupByRowTemplateDirective })
    protected groupTemplate: IgxGroupByRowTemplateDirective;

    /**
     * @hidden
     * @internal
     */
    @ContentChildren(IgxGroupByRowSelectorDirective, { read: IgxGroupByRowSelectorDirective, descendants: false })
    protected groupByRowSelectorsTemplates: QueryList<IgxGroupByRowSelectorDirective>;

    @ViewChildren(IgxGridGroupByRowComponent, { read: IgxGridGroupByRowComponent })
    private _groupsRowList: QueryList<IgxGridGroupByRowComponent>;

    /**
     * Gets the hierarchical representation of the group by records.
     *
     * @example
     * ```typescript
     * let groupRecords = this.grid.groupsRecords;
     * ```
     */
    public groupsRecords: IGroupByRecord[] = [];

    /**
     * @hidden @internal
     * Includes children of collapsed group rows.
     */
    public groupingResult: any[];

    /**
     * @hidden @internal
     */
    public groupingMetadata: any[];

    /**
     * @hidden @internal
     * Does not include children of collapsed group rows.
     */
    public groupingFlatResult: any[];
    /**
     * @hidden
     */
    protected _groupingExpressions: IGroupingExpression[] = [];
    /**
     * @hidden
     */
    protected _groupingExpandState: IGroupByExpandState[] = [];
    /**
     * @hidden
     */
    protected _groupRowTemplate: TemplateRef<any>;
    /**
     * @hidden
     */
    protected _groupAreaTemplate: TemplateRef<any>;
    /**
     * @hidden
     */
    protected _groupStrategy: IGridGroupingStrategy;
    /**
     * @hidden
     */
    protected groupingDiffer;
    private _data?: any[] | null;
    private _hideGroupedColumns = false;
    private _dropAreaMessage = null;
    private _showGroupArea = true;

    /**
     * Gets/Sets the array of data that populates the `IgxGridComponent`.
     *
     * @example
     * ```html
     * <igx-grid [data]="Data" [autoGenerate]="true"></igx-grid>
     * ```
     */
    @Input()
    public get data(): any[] | null {
        return this._data;
    }

    public set data(value: any[] | null) {
        this._data = value || [];
        this.summaryService.clearSummaryCache();
        if (this.shouldGenerate) {
            this.setupColumns();
        }
        this.cdr.markForCheck();
        if (this.isPercentHeight) {
            this.notifyChanges(true);
        }
    }

    /**
     * Gets/Sets an array of objects containing the filtered data.
     *
     * @example
     * ```typescript
     * let filteredData = this.grid.filteredData;
     * this.grid.filteredData = [...];
     * ```
     */
    public get filteredData() {
        return this._filteredData;
    }

    public set filteredData(value) {
        this._filteredData = value;
    }

    /**
     * Gets/Sets the total number of records in the data source.
     *
     * @remarks
     * This property is required for remote grid virtualization to function when it is bound to remote data.
     * @example
     * ```typescript
     * const itemCount = this.grid1.totalItemCount;
     * this.grid1.totalItemCount = 55;
     * ```
     */
    public set totalItemCount(count) {
        this.verticalScrollContainer.totalItemCount = count;
        this.cdr.detectChanges();
    }

    public get totalItemCount() {
        return this.verticalScrollContainer.totalItemCount;
    }

    private get _gridAPI(): IgxGridAPIService {
        return this.gridAPI as IgxGridAPIService;
    }
    private _filteredData = null;

    private childDetailTemplates: Map<any, any> = new Map();

    /**
     * Gets/Sets the group by state.
     *
     * @example
     * ```typescript
     * let groupByState = this.grid.groupingExpressions;
     * this.grid.groupingExpressions = [...];
     * ```
     * @remarks
     * Supports two-way data binding.
     * @example
     * ```html
     * <igx-grid #grid [data]="Data" [autoGenerate]="true" [(groupingExpressions)]="model.groupingExpressions"></igx-grid>
     * ```
     */
    @Input()
    public get groupingExpressions(): IGroupingExpression[] {
        return this._groupingExpressions;
    }

    public set groupingExpressions(value: IGroupingExpression[]) {
        if (this.groupingExpressions === value) {
            return;
        }
        if (value && value.length > 10) {
            throw Error('Maximum amount of grouped columns is 10.');
        }
        const oldExpressions: IGroupingExpression[] = this.groupingExpressions;
        const newExpressions: IGroupingExpression[] = value;
        this._groupingExpressions = cloneArray(value);
        this.groupingExpressionsChange.emit(this._groupingExpressions);
        if (this._gridAPI.grid) {
            /* grouping and sorting are working separate from each other */
            this._applyGrouping();
            this.notifyChanges();
        }
        if (!this._init && JSON.stringify(oldExpressions) !== JSON.stringify(newExpressions) && this.columnList) {
            const groupedCols: IgxColumnComponent[] = [];
            const ungroupedCols: IgxColumnComponent[] = [];
            const groupedColsArr = newExpressions.filter((obj) => !oldExpressions.some((obj2) => obj.fieldName === obj2.fieldName));
            groupedColsArr.forEach((elem) => {
                groupedCols.push(this.getColumnByName(elem.fieldName));
            }, this);
            const ungroupedColsArr = oldExpressions.filter((obj) => !newExpressions.some((obj2) => obj.fieldName === obj2.fieldName));
            ungroupedColsArr.forEach((elem) => {
                ungroupedCols.push(this.getColumnByName(elem.fieldName));
            }, this);
            this.notifyChanges();
            const groupingDoneArgs: IGroupingDoneEventArgs = {
                expressions: newExpressions,
                groupedColumns: groupedCols,
                ungroupedColumns: ungroupedCols
            };
            this.onGroupingDone.emit(groupingDoneArgs);
        }
    }

    /**
     * Gets/Sets a list of expansion states for group rows.
     *
     * @remarks
     * Includes only states that differ from the default one (controlled through groupsExpanded and states that the user has changed.
     * Contains the expansion state (expanded: boolean) and the unique identifier for the group row (Array).
     * Supports two-way data binding.
     * @example
     * ```html
     * <igx-grid #grid [data]="Data" [autoGenerate]="true" [(groupingExpansionState)]="model.groupingExpansionState"></igx-grid>
     * ```
     */
    @Input()
    public get groupingExpansionState() {
        return this._groupingExpandState;
    }

    public set groupingExpansionState(value) {
        if (value !== this._groupingExpandState) {
            this.groupingExpansionStateChange.emit(value);
        }
        this._groupingExpandState = value;
        if (this.gridAPI.grid) {
            this.cdr.detectChanges();
        }
    }

    /**
     * Gets/Sets whether the grouped columns should be hidden.
     *
     * @remarks
     * The default value is "false"
     * @example
     * ```html
     * <igx-grid #grid [data]="localData" [hideGroupedColumns]="true" [autoGenerate]="true"></igx-grid>
     * ```
     */
    @Input()
    public get hideGroupedColumns() {
        return this._hideGroupedColumns;
    }

    public set hideGroupedColumns(value: boolean) {
        if (value) {
            this.groupingDiffer = this.differs.find(this.groupingExpressions).create();
        } else {
            this.groupingDiffer = null;
        }
        if (this.columnList && this.groupingExpressions) {
            this._setGroupColsVisibility(value);
        }

        this._hideGroupedColumns = value;
    }

    /**
     * Gets/Sets the grouping strategy of the grid.
     *
     * @remarks The default IgxGrouping extends from IgxSorting and a custom one can be used as a `sortStrategy` as well.
     *
     * @example
     * ```html
     *  <igx-grid #grid [data]="localData" [groupStrategy]="groupStrategy"></igx-grid>
     * ```
     */
    @Input()
    public get groupStrategy(): IGridGroupingStrategy {
        return this._groupStrategy;
    }

    public set groupStrategy(value: IGridGroupingStrategy) {
        this._groupStrategy = value;
    }

    /**
     * Gets/Sets the message displayed inside the GroupBy drop area where columns can be dragged on.
     *
     * @remarks
     * The grid needs to have at least one groupable column in order the GroupBy area to be displayed.
     * @example
     * ```html
     * <igx-grid dropAreaMessage="Drop here to group!">
     *      <igx-column [groupable]="true" field="ID"></igx-column>
     * </igx-grid>
     * ```
     */
    @Input()
    public set dropAreaMessage(value: string) {
        this._dropAreaMessage = value;
        this.notifyChanges();
    }

    public get dropAreaMessage(): string {
        return this._dropAreaMessage || this.resourceStrings.igx_grid_groupByArea_message;
    }

    /**
     * @deprecated in version 12.1.0. Use `getCellByColumn` or `getCellByKey` instead
     *
     * Returns a `CellType` object that matches the conditions.
     *
     * @example
     * ```typescript
     * const myCell = this.grid1.getCellByColumnVisibleIndex(2,"UnitPrice");
     * ```
     * @param rowIndex
     * @param index
     */
     public getCellByColumnVisibleIndex(rowIndex: number, index: number): CellType {
        const row = this.getRowByIndex(rowIndex);
        const column = this.columnList.find((col) => col.visibleIndex === index);
        if (row && row instanceof IgxGridRow && !row.data?.detailsData && column) {
            return new IgxGridCell(this, rowIndex, column.field);
        }
    }

    /**
     * Gets the list of group rows.
     *
     * @example
     * ```typescript
     * const groupList = this.grid.groupsRowList;
     * ```
     */
    public get groupsRowList() {
        const res = new QueryList<any>();
        if (!this._groupsRowList) {
            return res;
        }
        const rList = this._groupsRowList.filter(item => item.element.nativeElement.parentElement !== null)
            .sort((item1, item2) => item1.index - item2.index);
        res.reset(rList);
        return res;
    }

    /**
     * @hidden
     * @internal
     */
    public get groupByRowSelectorTemplate(): TemplateRef<IgxGroupByRowSelectorDirective> {
        if (this.groupByRowSelectorsTemplates && this.groupByRowSelectorsTemplates.first) {
            return this.groupByRowSelectorsTemplates.first.templateRef;
        }
        return null;
    }

    /**
     * @hidden @internal
     */
    public getDetailsContext(rowData, index) {
        return {
            $implicit: rowData,
            index
        };
    }

    /**
     * @hidden @internal
     */
    public detailsViewFocused(container, rowIndex) {
        this.navigation.setActiveNode({ row: rowIndex });
    }

    /**
     * @hidden @internal
     */
    public get hasDetails() {
        return !!this.detailTemplate.length;
    }

    /**
     * @hidden @internal
     */
    public getRowTemplate(rowData) {
        if (this.isGroupByRecord(rowData)) {
            return this.defaultGroupTemplate;
        } else if (this.isSummaryRow(rowData)) {
            return this.summaryTemplate;
        } else if (this.hasDetails && this.isDetailRecord(rowData)) {
            return this.detailTemplateContainer;
        } else {
            return this.recordTemplate;
        }
    }

    /**
     * @hidden @internal
     */
    public isDetailRecord(record) {
        return record && record.detailsData !== undefined;
    }

    /**
     * @hidden @internal
     */
    public isDetailActive(rowIndex) {
        return this.navigation.activeNode ? this.navigation.activeNode.row === rowIndex : false;
    }

    /**
     * Gets/Sets the template reference for the group row.
     *
     * @example
     * ```
     * const groupRowTemplate = this.grid.groupRowTemplate;
     * this.grid.groupRowTemplate = myRowTemplate;
     * ```
     */
    public get groupRowTemplate(): TemplateRef<any> {
        return this._groupRowTemplate;
    }

    public set groupRowTemplate(template: TemplateRef<any>) {
        this._groupRowTemplate = template;
        this.notifyChanges();
    }


    /**
     * Gets/Sets the template reference of the `IgxGridComponent`'s group area.
     *
     * @example
     * ```typescript
     * const groupAreaTemplate = this.grid.groupAreaTemplate;
     * this.grid.groupAreaTemplate = myAreaTemplate.
     * ```
     */
    public get groupAreaTemplate(): TemplateRef<any> {
        return this._groupAreaTemplate;
    }

    public set groupAreaTemplate(template: TemplateRef<any>) {
        this._groupAreaTemplate = template;
        this.notifyChanges();
    }

    /** @hidden @internal */
    public trackChanges: (index, rec) => any;

    /**
     * Groups by a new `IgxColumnComponent` based on the provided expression, or modifies an existing one.
     *
     * @remarks
     * Also allows for multiple columns to be grouped at once if an array of `ISortingExpression` is passed.
     * The onGroupingDone event would get raised only **once** if this method gets called multiple times with the same arguments.
     * @example
     * ```typescript
     * this.grid.groupBy({ fieldName: name, dir: SortingDirection.Asc, ignoreCase: false });
     * this.grid.groupBy([
     *     { fieldName: name1, dir: SortingDirection.Asc, ignoreCase: false },
     *     { fieldName: name2, dir: SortingDirection.Desc, ignoreCase: true },
     *     { fieldName: name3, dir: SortingDirection.Desc, ignoreCase: false }
     * ]);
     * ```
     */
    public groupBy(expression: IGroupingExpression | Array<IGroupingExpression>): void {
        if (this.checkIfNoColumnField(expression)) {
            return;
        }
        this.crudService.endEdit(false);
        if (expression instanceof Array) {
            this._gridAPI.groupBy_multiple(expression);
        } else {
            this._gridAPI.groupBy(expression);
        }
        this.notifyChanges(true);
    }

    /**
     * Clears grouping for particular column, array of columns or all columns.
     *
     * @remarks
     * Clears all grouping in the grid, if no parameter is passed.
     * If a parameter is provided, clears grouping for a particular column or an array of columns.
     * @example
     * ```typescript
     * this.grid.clearGrouping(); //clears all grouping
     * this.grid.clearGrouping("ID"); //ungroups a single column
     * this.grid.clearGrouping(["ID", "Column1", "Column2"]); //ungroups multiple columns
     * ```
     * @param name Name of column or array of column names to be ungrouped.
     */
    public clearGrouping(name?: string | Array<string>): void {
        this._gridAPI.clear_groupby(name);
        this.calculateGridSizes();
        this.notifyChanges(true);
    }

    /**
     * Returns if a group is expanded or not.
     *
     * @param group The group record.
     * @example
     * ```typescript
     * public groupRow: IGroupByRecord;
     * const expandedGroup = this.grid.isExpandedGroup(this.groupRow);
     * ```
     */
    public isExpandedGroup(group: IGroupByRecord): boolean {
        const state: IGroupByExpandState = this._getStateForGroupRow(group);
        return state ? state.expanded : this.groupsExpanded;
    }

    /**
     * Toggles the expansion state of a group.
     *
     * @param groupRow The group record to toggle.
     * @example
     * ```typescript
     * public groupRow: IGroupByRecord;
     * const toggleExpGroup = this.grid.toggleGroup(this.groupRow);
     * ```
     */
    public toggleGroup(groupRow: IGroupByRecord) {
        this._toggleGroup(groupRow);
        this.notifyChanges();
    }

    /**
     * Select all rows within a group.
     *
     * @param groupRow: The group record which rows would be selected.
     * @param clearCurrentSelection if true clears the current selection
     * @example
     * ```typescript
     * this.grid.selectRowsInGroup(this.groupRow, true);
     * ```
     */
    public selectRowsInGroup(groupRow: IGroupByRecord, clearPrevSelection?: boolean) {
        this._gridAPI.groupBy_select_all_rows_in_group(groupRow, clearPrevSelection);
        this.notifyChanges();
    }

    /**
     * Deselect all rows within a group.
     *
     * @param groupRow The group record which rows would be deselected.
     * @example
     * ```typescript
     * public groupRow: IGroupByRecord;
     * this.grid.deselectRowsInGroup(this.groupRow);
     * ```
     */
    public deselectRowsInGroup(groupRow: IGroupByRecord) {
        this._gridAPI.groupBy_deselect_all_rows_in_group(groupRow);
        this.notifyChanges();
    }

    /**
     * Expands the specified group and all of its parent groups.
     *
     * @param groupRow The group record to fully expand.
     * @example
     * ```typescript
     * public groupRow: IGroupByRecord;
     * this.grid.fullyExpandGroup(this.groupRow);
     * ```
     */
    public fullyExpandGroup(groupRow: IGroupByRecord) {
        this._fullyExpandGroup(groupRow);
        this.notifyChanges();
    }

    /**
     * @hidden @internal
     */
    public isGroupByRecord(record: any): boolean {
        // return record.records instance of GroupedRecords fails under Webpack
        return record && record?.records && record.records?.length &&
         record.expression && record.expression?.fieldName;
    }

    /**
     * Toggles the expansion state of all group rows recursively.
     *
     * @example
     * ```typescript
     * this.grid.toggleAllGroupRows;
     * ```
     */
    public toggleAllGroupRows() {
        this.groupingExpansionState = [];
        this.groupsExpanded = !this.groupsExpanded;
        this.notifyChanges();
    }

    /**
     * Returns if the `IgxGridComponent` has groupable columns.
     *
     * @example
     * ```typescript
     * const groupableGrid = this.grid.hasGroupableColumns;
     * ```
     */
    public get hasGroupableColumns(): boolean {
        return this.columnList.some((col) => col.groupable && !col.columnGroup);
    }

    /**
     * Returns whether the `IgxGridComponent` has group area.
     *
     * @example
     * ```typescript
     * let isGroupAreaVisible = this.grid.showGroupArea;
     * ```
     *
     * @example
     * ```html
     * <igx-grid #grid [data]="Data" [showGroupArea]="false"></igx-grid>
     * ```
     */
    @Input()
    public get showGroupArea(): boolean {
        return this._showGroupArea;
    }
    public set showGroupArea(value: boolean) {
        this._showGroupArea = value;
        this.notifyChanges(true);
    }

    /**
     * Gets if the grid's group by drop area is visible.
     *
     * @example
     * ```typescript
     * const dropVisible = this.grid.dropAreaVisible;
     * ```
     */
    public get dropAreaVisible(): boolean {
        return this.columnInDrag?.groupable || !this.groupingExpressions.length;
    }

    /**
     * @hidden @internal
     */
    public isColumnGrouped(fieldName: string): boolean {
        return this.groupingExpressions.find(exp => exp.fieldName === fieldName) ? true : false;
    }

    /**
     * @hidden @internal
     */
    public getContext(rowData: any, rowIndex: number, pinned?: boolean): any {
        if (this.isDetailRecord(rowData)) {
            const cachedData = this.childDetailTemplates.get(rowData.detailsData);
            const rowID = this.primaryKey ? rowData.detailsData[this.primaryKey] : rowData.detailsData;
            if (cachedData) {
                const view = cachedData.view;
                const tmlpOutlet = cachedData.owner;
                return {
                    $implicit: rowData.detailsData,
                    moveView: view,
                    owner: tmlpOutlet,
                    index: this.dataView.indexOf(rowData),
                    templateID: {
                        type:'detailRow',
                        id: rowID
                    }
                };
            } else {
                // child rows contain unique grids, hence should have unique templates
                return {
                    $implicit: rowData.detailsData,
                    templateID: {
                        type:'detailRow',
                        id: rowID
                    },
                    index: this.dataView.indexOf(rowData)
                };
            }
        }
        return {
            $implicit: this.isGhostRecord(rowData) ? rowData.recordRef : rowData,
            index: this.getDataViewIndex(rowIndex, pinned),
            templateID: {
                type: this.isGroupByRecord(rowData) ? 'groupRow' : this.isSummaryRow(rowData) ? 'summaryRow' : 'dataRow',
                id: null
            },
            disabled: this.isGhostRecord(rowData)
        };
    }

    /**
     * @hidden @internal
     */
    public viewCreatedHandler(args) {
        if (args.context.templateID.type === 'detailRow') {
            this.childDetailTemplates.set(args.context.$implicit, args);
        }
    }

    /**
     * @hidden @internal
     */
    public viewMovedHandler(args) {
        if (args.context.templateID.type === 'detailRow') {
            // view was moved, update owner in cache
            const key = args.context.$implicit;
            const cachedData = this.childDetailTemplates.get(key);
            cachedData.owner = args.owner;
        }
    }

    /**
     * @hidden @internal
     */
    public get iconTemplate() {
        if (this.groupsExpanded) {
            return this.headerExpandIndicatorTemplate || this.defaultExpandedTemplate;
        } else {
            return this.headerCollapseIndicatorTemplate || this.defaultCollapsedTemplate;
        }
    }

    /**
     * @hidden @internal
     */
    public ngAfterContentInit() {
        super.ngAfterContentInit();
        if (this.allowFiltering && this.hasColumnLayouts) {
            this.filterMode = FilterMode.excelStyleFilter;
        }
        if (this.groupTemplate) {
            this._groupRowTemplate = this.groupTemplate.template;
        }

        this.detailTemplate.changes.subscribe(() =>
            this.trackChanges = (_, rec) => (rec?.detailsData !== undefined ? rec.detailsData : rec));

        if (this.hideGroupedColumns && this.columnList && this.groupingExpressions) {
            this._setGroupColsVisibility(this.hideGroupedColumns);
        }
        this._setupNavigationService();
    }

    /**
     * @hidden @internal
     */
    public ngAfterViewInit() {
        super.ngAfterViewInit();
        this.verticalScrollContainer.beforeViewDestroyed.pipe(takeUntil(this.destroy$)).subscribe((view) => {
            const rowData = view.context.$implicit;
            if (this.isDetailRecord(rowData)) {
                const cachedData = this.childDetailTemplates.get(rowData.detailsData);
                if (cachedData) {
                    const tmlpOutlet = cachedData.owner;
                    tmlpOutlet._viewContainerRef.detach(0);
                }
            }
        });

        this.sortingExpressionsChange.pipe(takeUntil(this.destroy$)).subscribe((sortingExpressions: ISortingExpression[]) => {
            if (!this.groupingExpressions || !this.groupingExpressions.length) {
                return;
            }

            sortingExpressions.forEach((sortExpr: ISortingExpression) => {
                const fieldName = sortExpr.fieldName;
                const groupingExpr = this.groupingExpressions.find(ex => ex.fieldName === fieldName);
                if (groupingExpr) {
                    groupingExpr.dir = sortExpr.dir;
                }
            });
        });
    }

    /**
     * @hidden @internal
     */
    public ngOnInit() {
        super.ngOnInit();
        this.onGroupingDone.pipe(takeUntil(this.destroy$)).subscribe((args) => {
            this.crudService.endEdit(false);
            this.summaryService.updateSummaryCache(args);
            this._headerFeaturesWidth = NaN;
        });
    }

    /**
     * @hidden @internal
     */
    public ngDoCheck(): void {
        if (this.groupingDiffer && this.columnList && !this.hasColumnLayouts) {
            const changes = this.groupingDiffer.diff(this.groupingExpressions);
            if (changes && this.columnList.length > 0) {
                changes.forEachAddedItem((rec) => {
                    const col = this.getColumnByName(rec.item.fieldName);
                    if (col) {
                        col.hidden = true;
                    }
                });
                changes.forEachRemovedItem((rec) => {
                    const col = this.getColumnByName(rec.item.fieldName);
                    col.hidden = false;
                });
            }
        }
        super.ngDoCheck();
    }

    /**
     * @hidden @internal
     */
    public dataLoading(event) {
        this.dataPreLoad.emit(event);
    }

    /**
     * @inheritdoc
     */
    public getSelectedData(formatters = false, headers = false): any[] {
        if (this.groupingExpressions.length || this.hasDetails) {
            const source = [];

            const process = (record) => {
                if (record.expression || record.summaries || this.isDetailRecord(record)) {
                    source.push(null);
                    return;
                }
                source.push(record);

            };

            this.dataView.forEach(process);
            return this.extractDataFromSelection(source, formatters, headers);
        } else {
            return super.getSelectedData(formatters, headers);
        }
    }

    /**
     * Returns the `IgxGridRow` by index.
     *
     * @example
     * ```typescript
     * const myRow = grid.getRowByIndex(1);
     * ```
     * @param index
     */
    public getRowByIndex(index: number): RowType {
        let row: RowType;
        if (index < 0) {
            return undefined;
        }
        if (this.dataView.length >= this.virtualizationState.startIndex + this.virtualizationState.chunkSize) {
            row = this.createRow(index);
        } else {
            if (!(index < this.virtualizationState.startIndex) && !(index > this.virtualizationState.startIndex + this.virtualizationState.chunkSize)) {
                row = this.createRow(index);
            }
        }

        if (this.gridAPI.grid.pagingMode === 1 && this.gridAPI.grid.page !== 0) {
            row.index = index + this.paginator.perPage * this.paginator.page;
        }
        return row;
    }

    /**
     * Returns `IgxGridRow` object by the specified primary key.
     *
     * @remarks
     * Requires that the `primaryKey` property is set.
     * @example
     * ```typescript
     * const myRow = this.grid1.getRowByKey("cell5");
     * ```
     * @param keyValue
     */
    public getRowByKey(key: any): RowType {
        const rec = this.filteredSortedData ? this.primaryKey ?
            this.filteredSortedData.find(record => record[this.primaryKey] === key) :
            this.filteredSortedData.find(record => record === key) : undefined;
        const index = this.dataView.indexOf(rec);
        if (index < 0 || index > this.dataView.length) {
            return undefined;
        }

        return new IgxGridRow(this, index, rec);
    }

    /**
     * @hidden @internal
     */
    public allRows(): RowType[] {
        return this.dataView.map((rec, index) => {
            this.pagingMode === 1 && this.paginator.page !== 0 ? index = index + this.paginator.perPage * this.paginator.page : index = this.dataRowList.first.index + index;
            return this.createRow(index);
        });
    }

    /**
     * Returns the collection of `IgxGridRow`s for current page.
     *
     * @hidden @internal
     */
    public dataRows(): RowType[] {
        return this.allRows().filter(row => row instanceof IgxGridRow);
    }

    /**
     * Returns an array of the selected `IgxGridCell`s.
     *
     * @example
     * ```typescript
     * const selectedCells = this.grid.selectedCells;
     * ```
     */
    public get selectedCells(): CellType[] {
        return this.dataRows().map((row) => row.cells.filter((cell) => cell.selected))
            .reduce((a, b) => a.concat(b), []);
    }

    /**
     * Returns a `CellType` object that matches the conditions.
     *
     * @example
     * ```typescript
     * const myCell = this.grid1.getCellByColumn(2, "UnitPrice");
     * ```
     * @param rowIndex
     * @param columnField
     */
    public getCellByColumn(rowIndex: number, columnField: string): CellType {
        const row = this.getRowByIndex(rowIndex);
        const column = this.columnList.find((col) => col.field === columnField);
        if (row && row instanceof IgxGridRow && !row.data?.detailsData && column) {
            if (this.pagingMode === 1 && this.gridAPI.grid.page !== 0) {
                row.index = rowIndex + this.paginator.perPage * this.paginator.page;
            }
            return new IgxGridCell(this, row.index, columnField);
        }
    }

    /**
     * Returns a `CellType` object that matches the conditions.
     *
     * @remarks
     * Requires that the primaryKey property is set.
     * @example
     * ```typescript
     * grid.getCellByKey(1, 'index');
     * ```
     * @param rowSelector match any rowID
     * @param columnField
     */
    public getCellByKey(rowSelector: any, columnField: string): CellType {
        const row = this.getRowByKey(rowSelector);
        const column = this.columnList.find((col) => col.field === columnField);
        if (row && column) {
            return new IgxGridCell(this, row.index, columnField);
        }
    }

    public pinRow(rowID: any, index?: number): boolean {
        const row = this.getRowByKey(rowID);
        return super.pinRow(rowID, index, row);
    }

    public unpinRow(rowID: any): boolean {
        const row = this.getRowByKey(rowID);
        return super.unpinRow(rowID, row);
    }

    /**
     * @hidden @internal
     */
    public createRow(index: number, data?: any): RowType {
        let row: RowType;
        let rec: any;

        const dataIndex = this._getDataViewIndex(index);
        rec = data ?? this.dataView[dataIndex];

        if (rec && this.isGroupByRecord(rec)) {
            row = new IgxGroupByRow(this, index, rec);
        }
        if (rec && this.isSummaryRow(rec)) {
            row = new IgxSummaryRow(this, index, rec.summaries, GridInstanceType.Grid);
        }
        // if found record is a no a groupby or summary row, return IgxGridRow instance
        if (!row && rec) {
            row = new IgxGridRow(this, index, rec);
        }

        return row;
    }

    /**
     * @hidden @internal
     */
    protected get defaultTargetBodyHeight(): number {
        const allItems = this.totalItemCount || this.dataLength;
        return this.renderedRowHeight * Math.min(this._defaultTargetRecordNumber,
            this.paginator ? Math.min(allItems, this.paginator.perPage) : allItems);
    }

    /**
     * @hidden @internal
     */
    protected getGroupAreaHeight(): number {
        return this.groupArea ? this.getComputedHeight(this.groupArea.nativeElement) : 0;
    }

    /**
     * @hidden @internal
     */
    protected scrollTo(row: any | number, column: any | number): void {
        if (this.groupingExpressions && this.groupingExpressions.length
            && typeof (row) !== 'number') {
            const rowIndex = this.groupingResult.indexOf(row);
            const groupByRecord = this.groupingMetadata[rowIndex];
            if (groupByRecord) {
                this._fullyExpandGroup(groupByRecord);
            }
        }

        super.scrollTo(row, column, this.groupingFlatResult);
    }

    /**
     * @hidden @internal
     */
    protected _getStateForGroupRow(groupRow: IGroupByRecord): IGroupByExpandState {
        return this._gridAPI.groupBy_get_expanded_for_group(groupRow);
    }

    /**
     * @hidden
     */
    protected _toggleGroup(groupRow: IGroupByRecord) {
        this._gridAPI.groupBy_toggle_group(groupRow);
    }

    /**
     * @hidden @internal
     */
    protected _fullyExpandGroup(groupRow: IGroupByRecord) {
        this._gridAPI.groupBy_fully_expand_group(groupRow);
    }

    /**
     * @hidden @internal
     */
    protected _applyGrouping() {
        this._gridAPI.sort_groupBy_multiple(this._groupingExpressions);
    }

    private _setupNavigationService() {
        if (this.hasColumnLayouts) {
            this.navigation = new IgxGridMRLNavigationService(this.platform);
            this.navigation.grid = this;
        }
    }

    private checkIfNoColumnField(expression: IGroupingExpression | Array<IGroupingExpression> | any): boolean {
        if (expression instanceof Array) {
            for (const singleExpression of expression) {
                if (!singleExpression.fieldName) {
                    return true;
                }
            }
            return false;
        }
        return !expression.fieldName;
    }

    private _setGroupColsVisibility(value) {
        if (this.columnList.length > 0 && !this.hasColumnLayouts) {
            this.groupingExpressions.forEach((expr) => {
                const col = this.getColumnByName(expr.fieldName);
                col.hidden = value;
            });
        }
    }
}

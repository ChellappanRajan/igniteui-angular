import { GridColumnDataType } from '../../data-operations/data-util';
import { FilteringExpressionsTree } from '../../data-operations/filtering-expressions-tree';
import { SortingDirection } from '../../data-operations/sorting-strategy';
import { ColumnType } from '../common/grid.interface';


/**
* Default pivot keys used for data processing in the pivot pipes.
*/
export const DEFAULT_PIVOT_KEYS = {
    aggregations: 'aggregations', records: 'records', children: 'children', level: 'level',
    rowDimensionSeparator: '_', columnDimensionSeparator: '-'
};


/**
 * Event emitted when dimension collection for rows, columns of filters is changed.
 */
export interface IDimensionsChange {
    /** The new list of dimensions. */
    dimensions: IPivotDimension[],
    /** The dimension list type - Row, Column or Filter. */
    dimensionCollectionType: PivotDimensionType
}

/**
* Event emitted when values list is changed.
*/
export interface IValuesChange {
    /** The new list of values. */
    values: IPivotValue[]
}

/**
* Interface describing Pivot data processing for dimensions.
* Should contain a process method and return records hierarchy based on the provided dimensions.
*/
export interface IPivotDimensionStrategy {
    process(collection: any,
        dimensions: IPivotDimension[],
        values: IPivotValue[],
        pivotKeys?: IPivotKeys): any[];
}

/**
* Interface describing a PivotAggregation function. 
* Accepts an array of extracted data members and a array of the original data records.
*/
export type PivotAggregation = (members: any[], data: any[]) => any;

/**
* Interface describing a IPivotAggregator class.
* Used for specifying custom aggregator lists.
*/
export interface IPivotAggregator {
    /** Aggregation unique key. */
    key: string;
    /** Aggregation label to show in the UI. */
    label: string;
    /**
     * Aggregator function can be a custom implementation of `PivotAggregation`, or 
     * use predefined ones from `IgxPivotAggregate` and its variants.
     */
    aggregator: (members: any[], data?: any[]) => any;
}

/**
* Configuration of the pivot grid.
*/
export interface IPivotConfiguration {
    /** A strategy to transform the rows. */
    rowStrategy?: IPivotDimensionStrategy | null;
    /** A strategy to transform the columns. */
    columnStrategy?: IPivotDimensionStrategy | null;
    /** A list of the rows. */
    rows: IPivotDimension[] | null;
    /** A list of the columns. */
    columns: IPivotDimension[] | null;
    /** A list of the values. */
    values: IPivotValue[] | null;
    /** Dimensions to be displayed in the filter area. */
    filters?: IPivotDimension[] | null;
    /** Pivot data keys used for data generation. Can be used for custom remote scenarios where the data is pre-populated. */
    pivotKeys?: IPivotKeys;
}

/**
* Configuration of a pivot dimension.
*/
export interface IPivotDimension {
    /** Allows defining a hierarchy when multiple sub groups need to be extracted from single member. */
    childLevel?: IPivotDimension;
    /** Field name to use in order to extract value. */
    memberName: string;
    /** Function that extracts the value */
    memberFunction?: (data: any) => any;
    /** Enables/Disables a particular dimension from pivot structure. */
    enabled: boolean;
    /**
     * A predefined or defined via the `igxPivotSelector` filter expression tree for the current dimension to be applied in the filter pipe.
     * */
    filter?: FilteringExpressionsTree | null;
    /**
     * The sorting direction of the current dimension. Determines the order in which the values will appear in the related dimension.
     */
    sortDirection?: SortingDirection;
    /**
     * The dataType of the related data field.
     */
    dataType?: GridColumnDataType;
    /** The width of the dimension cells to be rendered.Can be pixel or %. */
    width?: string;
    /** Level of the dimension. */
    level?: number;
}
/**
* Configuration of a pivot value aggregation.
*/
export interface IPivotValue {
    /** Field name to use in order to extract value. */
    member: string;
    /** Display name to show instead of member for the column header of this value. **/
    displayName?: string;
    /**
     * Active aggregator definition with key, label and aggregator.
     */
    aggregate: IPivotAggregator;
    /**
     * List of aggregates to show in aggregate drop-down.
     */
    aggregateList?: IPivotAggregator[];
    /** Enables/Disables a particular value from pivot aggregation. */
    enabled: boolean;
    /**  Allow conditionally styling of the IgxPivotGrid cells. */
    styles?: any;
    /** Enables a data type specific template of the cells */
    dataType?: GridColumnDataType;
    /** Applies display format to cell values. */
    formatter?: (value: any, rowData?: IPivotGridRecord, columnData?: IPivotGridColumn) => any;
}

/** Interface describing the Pivot column data.
*  Contains information on the related column dimensions and their values.
*/
export interface IPivotGridColumn {
        field: string,
        /** Gets/Sets the group value associated with the related column dimension by its memberName. **/
        dimensionValues: Map<string, string>;
        /** List of dimensions associated with the column.**/
        dimensions: IPivotDimension[];
        value: IPivotValue
}

/** Interface describing the Pivot data keys used for data generation.
*  Can be used for custom remote scenarios where the data is pre-populated.
*/
export interface IPivotKeys {
    /** Field that stores children for hierarchy building. */
    children: string;
    /** Field that stores reference to the original data records. */
    records: string;
    /** Field that stores aggregation values. */
    aggregations: string;
    /** Field that stores dimension level based on its hierarchy. */
    level: string;
    /** Separator used when generating the unique column field values. */
    columnDimensionSeparator: string;
    /** Separator used when generating the unique row field values. */
    rowDimensionSeparator: string;
}

/** The dimension types - Row, Column or Filter. */
export enum PivotDimensionType {
    Row,
    Column,
    Filter
}

/** Interface describing the pivot dimension data.
* Contains additional information needed to render dimension headers.
*/
export interface IPivotDimensionData {
    /** Associated column definition. */
    column: ColumnType;
    /** Associated dimension definition. */
    dimension: IPivotDimension;
    /** List of previous dimension groups. */
    prevDimensions: IPivotDimension[];
    /** Whether this a child dimension. */
    isChild?: boolean;
}

export interface PivotRowHeaderGroupType {
    rowIndex: number;
    parent: any;
    header: any;
    headerID: string;
    grid: any;
}

export interface IPivotGridRecord {
    /** Gets/Sets the group value associated with the related row dimension by its memberName. **/
    dimensionValues: Map<string, string>;
    /** Gets/Sets the aggregation value associated with the value path. Value path depends on configured column dimension hierarchy and values.**/
    aggregationValues: Map<string, any>;
    /** List of children records in case any row dimension member contain a hierarchy. Each dimension member contains its own hierarchy, which you can get by its memberName. **/
    children?: Map<string, IPivotGridRecord[]>;
    /** List of original data records associated with the current pivoted data. **/
    records?: any[];
     /** Record level**/
    level?: number;
    /** List of dimensions associated with the record.**/
    dimensions: IPivotDimension[];
}

export interface IPivotGridGroupRecord extends IPivotGridRecord {
    height?: number;
    rowSpan?: number;
}

import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { IgxTreeGridComponent } from './tree-grid.component';
import { IgxTreeGridRowComponent } from './tree-grid-row.component';
import { IgxGridCommonModule } from '../grid-common.module';
import { IgxTreeGridHierarchizingPipe, IgxTreeGridNormalizeRecordsPipe } from './tree-grid.pipes';
import { IgxTreeGridFlatteningPipe, IgxTreeGridSortingPipe, IgxTreeGridPagingPipe, IgxTreeGridTransactionPipe } from './tree-grid.pipes';
import { IgxTreeGridCellComponent } from './tree-cell.component';
import { IgxTreeGridFilteringPipe } from './tree-grid.filtering.pipe';
import { IgxTreeGridSummaryPipe } from './tree-grid.summary.pipe';
import { IgxRowLoadingIndicatorTemplateDirective } from './tree-grid.directives';
import { IgxTreeGridGroupingPipe } from './tree-grid.grouping.pipe';
import { IgxTreeGridGroupByAreaComponent } from '../grouping/tree-grid-group-by-area.component';
import { IgxPivotFilterPipe, IgxPivotRowPipe } from './pivot.pipes';
/**
 * @hidden
 */
@NgModule({
  declarations: [
    IgxTreeGridComponent,
    IgxTreeGridRowComponent,
    IgxTreeGridCellComponent,
    IgxTreeGridHierarchizingPipe,
    IgxTreeGridFlatteningPipe,
    IgxTreeGridSortingPipe,
    IgxTreeGridFilteringPipe,
    IgxTreeGridPagingPipe,
    IgxTreeGridTransactionPipe,
    IgxTreeGridSummaryPipe,
    IgxRowLoadingIndicatorTemplateDirective,
    IgxTreeGridNormalizeRecordsPipe,
    IgxPivotRowPipe,
    IgxTreeGridGroupingPipe,
    IgxPivotFilterPipe,
    IgxTreeGridGroupByAreaComponent
  ],
  exports: [
    IgxTreeGridComponent,
    IgxTreeGridRowComponent,
    IgxTreeGridCellComponent,
    IgxRowLoadingIndicatorTemplateDirective,
    IgxGridCommonModule,
    IgxTreeGridGroupingPipe,
    IgxPivotRowPipe,
    IgxPivotFilterPipe,
    IgxTreeGridGroupByAreaComponent
  ],
  imports: [
    IgxGridCommonModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class IgxTreeGridModule {
}

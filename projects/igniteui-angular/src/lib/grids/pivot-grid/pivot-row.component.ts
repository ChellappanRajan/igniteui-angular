import {
    ChangeDetectionStrategy,
    Component,
    forwardRef
} from '@angular/core';
import { IgxPivotGridComponent } from './pivot-grid.component';
import { IgxRowDirective } from '../row.directive';
import { IgxColumnComponent } from '../hierarchical-grid/public_api';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'igx-pivot-row',
    templateUrl: './pivot-row.component.html',
    providers: [{ provide: IgxRowDirective, useExisting: forwardRef(() => IgxPivotRowComponent) }]
})
export class IgxPivotRowComponent extends IgxRowDirective<IgxPivotGridComponent> {

    /**
     * @hidden
     * @internal
     */
     public get viewIndex(): number {
        return this.index;
    }

    public getRowColumns(rowData, cols: IgxColumnComponent[]) {
        cols.forEach(col => {
            col.header = rowData[col.field];
            col.field =  rowData[col.field];
            col.title = rowData[col.field];
        });
        return cols;
    }

    public getRowColumnWidth(cols: IgxColumnComponent[]) {
        let width = 0;
        cols.forEach(col => {
            width += col.calcWidth;
        });
        return width;
    }
}


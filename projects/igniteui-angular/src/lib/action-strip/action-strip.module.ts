import { NgModule } from '@angular/core';
import { IgxActionStripComponent, IgxActionStripMenuItemDirective } from './action-strip.component';
import { IgxGridPinningActionsComponent } from './grid-actions/grid-pinning-actions.component';
import { IgxGridEditingActionsComponent } from './grid-actions/grid-editing-actions.component';
import { IgxGridActionsBaseDirective } from './grid-actions/grid-actions-base.directive';
import { CommonModule } from '@angular/common';
import { IgxDropDownModule } from '../drop-down';
import { IgxToggleModule } from '../directives/toggle/toggle.directive';
import { IgxButtonModule } from '../directives/button/button.directive';
import { IgxIconModule } from '../icon';
import { IgxRippleModule } from '../directives/ripple/ripple.directive';

/**
 * @hidden
 */
@NgModule({
    declarations: [
        IgxActionStripComponent,
        IgxActionStripMenuItemDirective,
        IgxGridPinningActionsComponent,
        IgxGridEditingActionsComponent,
        IgxGridActionsBaseDirective
    ],
    entryComponents: [
    ],
    exports: [
        IgxActionStripComponent,
        IgxActionStripMenuItemDirective,
        IgxGridPinningActionsComponent,
        IgxGridEditingActionsComponent,
        IgxGridActionsBaseDirective
    ],
    imports: [CommonModule, IgxDropDownModule, IgxToggleModule, IgxButtonModule, IgxIconModule, IgxRippleModule]
})
export class IgxActionStripModule { }

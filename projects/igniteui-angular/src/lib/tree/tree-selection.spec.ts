import { TestBed, fakeAsync, waitForAsync } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { configureTestSuite } from '../test-utils/configure-suite';
import { Component, EventEmitter, QueryList, ViewChild } from '@angular/core';
import { IgxTreeComponent, IgxTreeModule } from './tree.component';
import { HIERARCHICAL_SAMPLE_DATA } from 'src/app/shared/sample-data';
import { UIInteractions } from '../test-utils/ui-interactions.spec';
import { TreeFunctions, TREE_NODE_DIV_SELECTION_CHECKBOX_CSS_CLASS } from './tree-functions.spec';
import { IgxTree, IGX_TREE_SELECTION_TYPE, ITreeNodeSelectionEvent } from './common';
import { IgxTreeSelectionService } from './tree-selection.service';
import { IgxTreeService } from './tree.service';
import { IgxTreeNodeComponent } from './tree-node/tree-node.component';

describe('IgxTree - Selection', () => {
    configureTestSuite();
    beforeAll(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [
                IgxTreeSimpleComponent
            ],
            imports: [IgxTreeModule, NoopAnimationsModule]
        }).compileComponents();
    }));

    describe('UI Interaction tests - None & BiState', () => {
        let fix;
        let tree: IgxTreeComponent;

        beforeEach(fakeAsync(() => {
            fix = TestBed.createComponent(IgxTreeSimpleComponent);
            fix.detectChanges();
            tree = fix.componentInstance.tree;
            tree.selection = IGX_TREE_SELECTION_TYPE.BiState;
            fix.detectChanges();
        }));

        it('Should have checkbox on each node if selection mode is BiState', () => {
            const nodes = TreeFunctions.getAllNodes(fix);
            expect(nodes.length).toBe(4);
            nodes.forEach((node) => {
                const checkBoxElement = node.nativeElement.querySelector(`.${TREE_NODE_DIV_SELECTION_CHECKBOX_CSS_CLASS}`);
                expect(checkBoxElement).not.toBeNull();
            });

            tree.selection = IGX_TREE_SELECTION_TYPE.None;
            fix.detectChanges();

            expect(nodes.length).toBe(4);
            nodes.forEach((node) => {
                const checkBoxElement = node.nativeElement.querySelector(`.${TREE_NODE_DIV_SELECTION_CHECKBOX_CSS_CLASS}`);
                expect(checkBoxElement).toBeNull();
            });
        });

        it('Should be able to change node selection to None', () => {
            expect(tree.selection).toEqual(IGX_TREE_SELECTION_TYPE.BiState);
            const firstNode = tree.nodes.toArray()[0];
            TreeFunctions.clickNodeCheckbox(firstNode);
            fix.detectChanges();
            TreeFunctions.verifyNodeSelected(firstNode);

            tree.selection = IGX_TREE_SELECTION_TYPE.None;
            fix.detectChanges();
            expect(tree.selection).toEqual(IGX_TREE_SELECTION_TYPE.None);
            TreeFunctions.verifyNodeSelected(firstNode, false, false);
        });

        it('Should be able to change node selection to Cascading', () => {
            expect(tree.selection).toEqual(IGX_TREE_SELECTION_TYPE.BiState);
            const firstNode = tree.nodes.toArray()[0];
            TreeFunctions.clickNodeCheckbox(firstNode);
            fix.detectChanges();
            TreeFunctions.verifyNodeSelected(firstNode);

            tree.selection = IGX_TREE_SELECTION_TYPE.Cascading;
            fix.detectChanges();
            expect(tree.selection).toEqual(IGX_TREE_SELECTION_TYPE.Cascading);
            TreeFunctions.verifyNodeSelected(firstNode, false);
        });

        it('Click on checkbox should call node`s onSelectorClick method', () => {
            const firstNode = tree.nodes.toArray()[0];
            spyOn(firstNode, 'onSelectorClick').and.callThrough();

            const ev = TreeFunctions.clickNodeCheckbox(firstNode);
            fix.detectChanges();

            expect(firstNode.onSelectorClick).toHaveBeenCalledTimes(1);
            expect(firstNode.onSelectorClick).toHaveBeenCalledWith(ev);
        });

        it('Checkbox should correctly represent the node`s selection state', () => {
            const firstNode = tree.nodes.toArray()[0];
            firstNode.selected = true;
            fix.detectChanges();

            const secondNode = tree.nodes.toArray()[1];

            TreeFunctions.verifyNodeSelected(firstNode, true);
            TreeFunctions.verifyNodeSelected(secondNode, false);
        });

        it('Nodes should be selected only from checkboxes', () => {
            const firstNode = tree.nodes.toArray()[0];
            firstNode.expanded = true;
            fix.detectChanges();
            const secondNode = tree.nodes.toArray()[1];

            UIInteractions.simulateClickEvent(firstNode.nativeElement);
            fix.detectChanges();
            UIInteractions.simulateClickEvent(secondNode.nativeElement);
            fix.detectChanges();

            TreeFunctions.verifyNodeSelected(firstNode, false);
            TreeFunctions.verifyNodeSelected(secondNode, false);
        });

        it('Should select multiple nodes with Shift + Click', () => {
            tree.nodes.toArray()[0].expanded = true;
            fix.detectChanges();
            const firstNode = tree.nodes.toArray()[10];

            tree.nodes.toArray()[14].expanded = true;
            fix.detectChanges();
            const secondNode = tree.nodes.toArray()[15];

            const mockEvent = new MouseEvent('click', { shiftKey: true });

            TreeFunctions.clickNodeCheckbox(firstNode);
            fix.detectChanges();

            TreeFunctions.verifyNodeSelected(firstNode);

            // Click on other node holding Shift key
            secondNode.nativeElement.querySelector(`.${TREE_NODE_DIV_SELECTION_CHECKBOX_CSS_CLASS}`).dispatchEvent(mockEvent);
            fix.detectChanges();

            for (let index = 10; index < 16; index++) {
                const node = tree.nodes.toArray()[index];
                TreeFunctions.verifyNodeSelected(node);
            }
        });

        it('Should be able to cancel nodeSelection event', () => {
            const firstNode = tree.nodes.toArray()[0];

            tree.nodeSelection.subscribe((e: any) => {
                e.cancel = true;
            });

            // Click on a node checkbox
            TreeFunctions.clickNodeCheckbox(firstNode);
            fix.detectChanges();
            TreeFunctions.verifyNodeSelected(firstNode, false);
        });

        it('Should be able to programmatically overwrite the selection using nodeSelection event', () => {
            const firstNode = tree.nodes.toArray()[0];

            tree.nodeSelection.subscribe((e: any) => {
                e.newSelection = [tree.nodes.toArray()[1], tree.nodes.toArray()[14]];
            });

            TreeFunctions.clickNodeCheckbox(firstNode);
            fix.detectChanges();

            TreeFunctions.verifyNodeSelected(firstNode, false);
            TreeFunctions.verifyNodeSelected(tree.nodes.toArray()[1]);
            TreeFunctions.verifyNodeSelected(tree.nodes.toArray()[14]);
        });
    });

    describe('UI Interaction tests - Cascading', () => {
        let fix;
        let tree: IgxTreeComponent;

        beforeEach(fakeAsync(() => {
            fix = TestBed.createComponent(IgxTreeSimpleComponent);
            fix.detectChanges();
            tree = fix.componentInstance.tree;
            tree.selection = IGX_TREE_SELECTION_TYPE.Cascading;
            fix.detectChanges();
        }));

        it('Should have checkbox on each node if selection mode is Cascading', () => {
            const nodes = TreeFunctions.getAllNodes(fix);
            expect(nodes.length).toBe(4);
            nodes.forEach((node) => {
                const checkBoxElement = node.nativeElement.querySelector(`.${TREE_NODE_DIV_SELECTION_CHECKBOX_CSS_CLASS}`);
                expect(checkBoxElement).not.toBeNull();
            });
        });

        it('Should be able to change node selection to None', () => {
            expect(tree.selection).toEqual(IGX_TREE_SELECTION_TYPE.Cascading);
            TreeFunctions.clickNodeCheckbox(tree.nodes.toArray()[10]);
            fix.detectChanges();
            for (let i = 10; i < 14; i++) {
                TreeFunctions.verifyNodeSelected(tree.nodes.toArray()[i]);
            }
            TreeFunctions.verifyNodeSelected(tree.nodes.toArray()[0], false, true, true);

            tree.selection = IGX_TREE_SELECTION_TYPE.None;
            fix.detectChanges();
            expect(tree.selection).toEqual(IGX_TREE_SELECTION_TYPE.None);
            for (let i = 10; i < 14; i++) {
                TreeFunctions.verifyNodeSelected(tree.nodes.toArray()[i], false, false);
            }
            TreeFunctions.verifyNodeSelected(tree.nodes.toArray()[0], false, false);
        });

        it('Should be able to change node selection to BiState', () => {
            expect(tree.selection).toEqual(IGX_TREE_SELECTION_TYPE.Cascading);
            TreeFunctions.clickNodeCheckbox(tree.nodes.toArray()[10]);
            fix.detectChanges();
            for (let i = 10; i < 14; i++) {
                TreeFunctions.verifyNodeSelected(tree.nodes.toArray()[i]);
            }
            TreeFunctions.verifyNodeSelected(tree.nodes.toArray()[0], false, true, true);

            tree.selection = IGX_TREE_SELECTION_TYPE.BiState;
            fix.detectChanges();
            expect(tree.selection).toEqual(IGX_TREE_SELECTION_TYPE.BiState);
            for (let i = 10; i < 14; i++) {
                TreeFunctions.verifyNodeSelected(tree.nodes.toArray()[i], false);
            }
            TreeFunctions.verifyNodeSelected(tree.nodes.toArray()[0], false);
        });

        it('Checkbox should correctly represent the node`s selection state', () => {
            const firstNode = tree.nodes.toArray()[0];
            const secondNode = tree.nodes.toArray()[10];
            secondNode.selected = true;
            fix.detectChanges();

            TreeFunctions.verifyNodeSelected(firstNode, false, true, true);
            for (let i = 1; i < 14; i++) {
                if (i < 10) {
                    TreeFunctions.verifyNodeSelected(tree.nodes.toArray()[i], false);
                } else {
                    TreeFunctions.verifyNodeSelected(tree.nodes.toArray()[i]);
                }
            }
        });

        it('Should select multiple nodes with Shift + Click', () => {
            // tree.nodes.toArray()[0].expanded = true;
            // fix.detectChanges();
            const firstNode = tree.nodes.toArray()[10];

            // tree.nodes.toArray()[14].expanded = true;
            // fix.detectChanges();
            const secondNode = tree.nodes.toArray()[15];

            const mockEvent = new MouseEvent('click', { shiftKey: true });

            TreeFunctions.clickNodeCheckbox(firstNode);
            fix.detectChanges();

            TreeFunctions.verifyNodeSelected(firstNode);

            // Click on other node holding Shift key
            secondNode.nativeElement.querySelector(`.${TREE_NODE_DIV_SELECTION_CHECKBOX_CSS_CLASS}`).dispatchEvent(mockEvent);
            fix.detectChanges();

            for (let index = 10; index < 21; index++) {
                const node = tree.nodes.toArray()[index];
                TreeFunctions.verifyNodeSelected(node);
            }
            TreeFunctions.verifyNodeSelected(tree.nodes.toArray()[0], false, true, true);
        });

        it('Should be able to cancel nodeSelection event', () => {
            const firstNode = tree.nodes.toArray()[0];

            tree.nodeSelection.subscribe((e: any) => {
                e.cancel = true;
            });

            // Click on a node checkbox
            TreeFunctions.clickNodeCheckbox(firstNode);
            fix.detectChanges();
            TreeFunctions.verifyNodeSelected(firstNode, false);
        });

        it('Should be able to programmatically overwrite the selection using nodeSelection event', () => {
            const firstNode = tree.nodes.toArray()[0];

            tree.nodeSelection.subscribe((e: any) => {
                e.newSelection = [tree.nodes.toArray()[10], tree.nodes.toArray()[15]];
            });

            TreeFunctions.clickNodeCheckbox(firstNode);
            fix.detectChanges();

            TreeFunctions.verifyNodeSelected(firstNode, false, true, true);
            for(let i = 10; i < 18; i++){
                if(i !== 14) {
                    TreeFunctions.verifyNodeSelected(tree.nodes.toArray()[i]);
                } else{
                    TreeFunctions.verifyNodeSelected(tree.nodes.toArray()[i], false, true, true);
                }
            }
        });
    });


    describe('IgxTree - API Tests', () => {
        let mockNodes: IgxTreeNodeComponent<any>[];
        let mockQuery: jasmine.SpyObj<QueryList<any>>;
        const selectionService = new IgxTreeSelectionService();
        const treeService = new IgxTreeService();
        const tree = new IgxTreeComponent(selectionService, treeService);

        beforeEach(() => {
            mockNodes = createNodeSpies(5);
            mockQuery = jasmine.createSpyObj('mockQuery', ['toArray', 'forEach']);
            mockQuery.toArray.and.returnValue(mockNodes);
            mockQuery.forEach.and.callFake((cb) => mockNodes.forEach(cb));

            tree.selection = IGX_TREE_SELECTION_TYPE.BiState;
            (tree.nodes as any) = mockQuery;
        });

        it('Should be able to deselect all nodes', () => {
            spyOn(selectionService, 'deselectNodesWithNoEvent').and.callThrough();

            tree.nodes.forEach(node => node.selected = true);

            tree.deselectAll();
            expect((tree as any).selectionService.deselectNodesWithNoEvent).toHaveBeenCalled();
            expect((tree as any).selectionService.deselectNodesWithNoEvent).toHaveBeenCalledWith(undefined);
        });

        it('Should be able to deselect multiple nodes', () => {
            spyOn(selectionService, 'deselectNodesWithNoEvent').and.callThrough();

            tree.nodes.toArray()[0].selected = true;
            tree.nodes.toArray()[1].selected = true;

            tree.deselectAll([tree.nodes.toArray()[0], tree.nodes.toArray()[1]]);
            expect((tree as any).selectionService.deselectNodesWithNoEvent).toHaveBeenCalled();
            expect((tree as any).selectionService.deselectNodesWithNoEvent)
                .toHaveBeenCalledWith([tree.nodes.toArray()[0], tree.nodes.toArray()[1]]);
        });
    });

    describe('IgxTreeNode - API Tests', () => {
        const elementRef = { nativeElement: null };
        const selectionService = new IgxTreeSelectionService();
        const treeService = new IgxTreeService();
        const mockEmitter: EventEmitter<ITreeNodeSelectionEvent> = jasmine.createSpyObj('emitter', ['emit']);;
        const mockTree: IgxTree = jasmine.createSpyObj('tree', [''],
            { selection: IGX_TREE_SELECTION_TYPE.BiState, nodeSelection: mockEmitter });
        const mockCdr = jasmine.createSpyObj('ChangeDetectorRef', ['markForCheck', 'detectChanges']);
        selectionService.register(mockTree);

        const node = new IgxTreeNodeComponent(mockTree, selectionService, treeService, mockCdr, null, elementRef, null);

        it('Should call selectNodesWithNoEvent when seting node`s selected property to true', () => {
            spyOn(selectionService, 'selectNodesWithNoEvent').and.callThrough();
            node.selected = true;

            expect((node as any).selectionService.selectNodesWithNoEvent).toHaveBeenCalled();
            expect((node as any).selectionService.selectNodesWithNoEvent).toHaveBeenCalledWith([node]);
        });

        it('Should call deselectNodesWithNoEvent when seting node`s selected property to false', () => {
            spyOn(selectionService, 'deselectNodesWithNoEvent').and.callThrough();
            node.selected = false;

            expect((node as any).selectionService.deselectNodesWithNoEvent).toHaveBeenCalled();
            expect((node as any).selectionService.deselectNodesWithNoEvent).toHaveBeenCalledWith([node]);
        });

        it('Should call isNodeSelected when node`s selected getter is invoked', () => {
            spyOn(selectionService, 'isNodeSelected').and.callThrough();
            const isSelected = node.selected;

            expect(isSelected).toBeFalse();
            expect((node as any).selectionService.isNodeSelected).toHaveBeenCalled();
            expect((node as any).selectionService.isNodeSelected).toHaveBeenCalledWith(node);
        });

        it('Should call isNodeIndeterminate when node`s indeterminate getter is invoked', () => {
            spyOn(selectionService, 'isNodeIndeterminate').and.callThrough();
            const isIndeterminate = node.indeterminate;

            expect(isIndeterminate).toBeFalse();
            expect((node as any).selectionService.isNodeIndeterminate).toHaveBeenCalled();
            expect((node as any).selectionService.isNodeIndeterminate).toHaveBeenCalledWith(node);
        });
    });
});

@Component({
    template: `
    <igx-tree #tree1 class="medium">
            <igx-tree-node *ngFor="let node of data" [selected]="node.ID === 'ALFKI'" [data]="node">
                {{ node.CompanyName }}
                <igx-tree-node *ngFor="let child of node.ChildCompanies" [data]="child">
                    {{ child.CompanyName }}
                    <igx-tree-node *ngFor="let leafchild of child.ChildCompanies" [data]="leafchild">
                        {{ leafchild.CompanyName }}
                    </igx-tree-node>
                </igx-tree-node>
            </igx-tree-node>
        </igx-tree>
    `
})
export class IgxTreeSimpleComponent {
    @ViewChild(IgxTreeComponent, { static: true }) public tree: IgxTreeComponent;
    public data = HIERARCHICAL_SAMPLE_DATA;
}

const createNodeSpies = (count?: number): IgxTreeNodeComponent<any>[] => {
    const nodesArr = [];
    for (let i = 0; i < count; i++) {
        nodesArr.push(jasmine.createSpyObj<IgxTreeNodeComponent<any>>(['id', 'selected']));
    }
    return nodesArr;
};

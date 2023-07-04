import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import {
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    ElementRef,
    OnInit,
    ViewChild,
} from '@angular/core';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import * as d3 from 'd3';
import { SceneBrowserFilterConfig } from 'src/app/models/scenebrowserfilterconfig.model';
import { SceneBrowserFilterResult } from 'src/app/models/scenebrowserfilterresult.model';
import { BackendService } from 'src/app/services/backend/backend.service';
import {
    AddSceneDialog,
    AddSceneDialogResult,
} from './dialog/add-scene-dialog/scene-browser-add-scene-dialog.component';

enum SceneBrowserSorting {
    ID,
    NUM_OBJECTS,
    NUM_RELATIONS,
    NUM_OBJECTS_PLUS_RELATIONS,
}

@Component({
    selector: 'app-scene-browser',
    templateUrl: './scene-browser.component.html',
    styleUrls: ['./scene-browser.component.scss'],
})
export class SceneBrowserComponent implements OnInit, AfterViewInit {
    elems?: SceneListElement[];
    elem_lines?: SceneListElement[][];
    private current_num_lines = 1;

    @ViewChild(CdkVirtualScrollViewport) scroller?: CdkVirtualScrollViewport;
    private renderTimer?: number;
    private resizeTimer?: number;

    @ViewChild('toolbar', { read: ElementRef, static: true })
    toolbarRef?: ElementRef<HTMLDivElement>;
    readonly toolbar_shadow_mat_elevation_z0 =
        '0px 0px 0px 0px rgba(0, 0, 0, 0.2),0px 0px 0px 0px rgba(0, 0, 0, 0.14),0px 0px 0px 0px rgba(0, 0, 0, 0.12)' as const;
    readonly toolbar_shadow_mat_elevation_z24 =
        '0px 11px 15px -7px rgba(0, 0, 0, 0.2),0px 24px 38px 3px rgba(0, 0, 0, 0.14),0px 9px 46px 8px rgba(0, 0, 0, 0.12)' as const;
    private is_showing_toolbar_shadow = false;

    addOnBlur = true;
    readonly separatorKeysCodes = [ENTER, COMMA] as const;

    filter_config: SceneBrowserFilterConfig = {
        enable_train_split: true,
        enable_eval_split: true,
        scene_id: '',
        similarity_id: '',
        object_names: [],
        object_attributes: [],
        relation_names: [],
    };

    sorting_options_labels: Record<SceneBrowserSorting, string> = {
        [SceneBrowserSorting.ID]: 'ID',
        [SceneBrowserSorting.NUM_OBJECTS]: 'Obj#',
        [SceneBrowserSorting.NUM_RELATIONS]: 'Rel#',
        [SceneBrowserSorting.NUM_OBJECTS_PLUS_RELATIONS]: 'Obj# + Rel#',
    };

    sorting_options: SceneBrowserSorting[] = Object.keys(
        this.sorting_options_labels
    ).map((key) => parseInt(key));

    _selected_sorting_option = SceneBrowserSorting.ID;

    data_is_loading = false;

    constructor(
        private changeDetectorRef: ChangeDetectorRef,
        private backend: BackendService,
        public dialog: MatDialog,
        private router: Router
    ) {}

    ngOnInit(): void {
        // this.updateToolbarTitle();
    }

    ngAfterViewInit(): void {
        this.scroller!.elementScrolled().subscribe(() => {
            if (this.renderTimer) {
                window.clearTimeout(this.renderTimer);
            }

            this.renderTimer = window.setTimeout(() => {
                this.loadRequiredThumbnails(
                    this.scroller!,
                    this.elem_lines!,
                    this.changeDetectorRef
                );
            }, 350);

            this.updateToolbarStyle();
        });

        this.requestData();

        this.updateToolbarStyle();
    }

    get selected_sorting_option() {
        return this._selected_sorting_option;
    }

    set selected_sorting_option(option: SceneBrowserSorting) {
        this._selected_sorting_option = option;
        this.finalizeDataForDisplay();
    }

    addFilterString(target: string[], event: MatChipInputEvent) {
        const value = (event.value || '').trim();

        if (value) {
            target.push(value);
        }

        event.chipInput!.clear();
    }

    removeFilterString(target: string[], object_name: string) {
        const index = target.indexOf(object_name);

        if (index >= 0) {
            target.splice(index, 1);
        }
    }

    requestData() {
        this.data_is_loading = true;

        this.backend.requestFilteredSceneIDs(this.filter_config, (response) => {
            this.processDataForFilterResult(response);
            this.data_is_loading = false;
        });
    }

    private processDataForFilterResult(result: SceneBrowserFilterResult) {
        const elements: SceneListElement[] = [];

        Object.keys(result).forEach((scene_id) => {
            const current = result[scene_id];

            elements.push(
                new SceneListElement(
                    scene_id,
                    current.object_count,
                    current.relation_count,
                    this.backend
                )
            );
        });

        this.elems = elements;

        this.finalizeDataForDisplay();
    }

    private finalizeDataForDisplay() {
        const sort_option = this._selected_sorting_option;

        this.elems?.sort((a, b) => {
            switch (sort_option) {
                case SceneBrowserSorting.NUM_OBJECTS:
                    return b.num_objects - a.num_objects;

                case SceneBrowserSorting.NUM_RELATIONS:
                    return b.num_relations - a.num_relations;

                case SceneBrowserSorting.NUM_OBJECTS_PLUS_RELATIONS:
                    return (
                        b.num_objects +
                        b.num_relations -
                        (a.num_objects + a.num_relations)
                    );

                case SceneBrowserSorting.ID:
                default:
                    return parseInt(a.id) - parseInt(b.id);
            }
        });

        this.splitElementsIntoLines();

        // to force rerender the dom (this makes the scroller set the rendered ListRange properly)
        // ...which is required for loadRequiredThumbnails()
        this.changeDetectorRef.detectChanges();

        this.loadRequiredThumbnails(
            this.scroller!,
            this.elem_lines!,
            this.changeDetectorRef
        );
    }

    private displayableNumLines(): number {
        if (this.scroller) {
            const lines = Math.floor(
                this.scroller.elementRef.nativeElement.clientWidth / 300
            );

            return lines > 1 ? lines : 1;
        }

        return 1;
    }

    private splitElementsIntoLines() {
        if (!this.elems || !this.scroller) return;

        this.elem_lines = [];

        const elems_left = Object.assign([], this.elems);

        let i = 0;
        let line = -1;
        let column = 0;

        this.current_num_lines = this.displayableNumLines();

        while (i < elems_left.length) {
            if (column == 0) {
                line++;
                this.elem_lines[line] = [];
            }

            this.elem_lines[line][column] = elems_left[i];

            column = (column + 1) % this.current_num_lines;

            i++;
        }
    }

    loadRequiredThumbnails(
        scroller: CdkVirtualScrollViewport,
        elem_lines: SceneListElement[][],
        changeDetectorRef: ChangeDetectorRef
    ): void {
        const range = scroller.getRenderedRange();

        const elements_to_refresh = [];
        for (let i = range.start; i < range.end && i < elem_lines.length; i++) {
            for (let j = 0; j < elem_lines[i].length; j++) {
                elements_to_refresh.push(elem_lines[i][j]);
            }
        }

        // only display thumbnails once every image is ready
        /* Promise.all(
            elements_to_refresh.map((elem) => elem.thumbnail_async)
        ).finally(() => {
            changeDetectorRef.detectChanges();
        }); */

        // display each thumbnail individually as it finishes loading
        elements_to_refresh.forEach((elem) => {
            elem.thumbnail_async.finally(() => {
                changeDetectorRef.detectChanges();
            });
        });
    }

    onResize(event: any) {
        // only apply changes when no resize event has fired in 350ms
        /* if (this.resizeTimer) {
            window.clearTimeout(this.resizeTimer);
        }

        this.resizeTimer = window.setTimeout(() => {
            this.splitElementsIntoLines();

            if (this.scroller && this.elem_lines) {
                this.loadRequiredThumbnails(
                    this.scroller,
                    this.elem_lines,
                    this.changeDetectorRef
                );
            }
        }, 350); */

        if (this.current_num_lines != this.displayableNumLines()) {
            this.splitElementsIntoLines();

            if (this.scroller && this.elem_lines) {
                this.loadRequiredThumbnails(
                    this.scroller,
                    this.elem_lines,
                    this.changeDetectorRef
                );
            }
        }
    }

    /* private updateToolbarTitle() {
        this.keyword_elem_title =
            this.keywords.length == 0
                ? 'Click to filter by keywords (scene id, objects, attributes, relations)...'
                : 'Keywords';
    } */

    private updateToolbarStyle() {
        if (!this.toolbarRef || !this.scroller) return;

        const toolbar: d3.Selection<HTMLDivElement, unknown, null, undefined> =
            d3.select(this.toolbarRef.nativeElement);

        if (this.scroller.measureScrollOffset() == 0) {
            if (this.is_showing_toolbar_shadow) {
                toolbar.interrupt().style('box-shadow', null);
                this.is_showing_toolbar_shadow = false;
            }
        } else {
            if (!this.is_showing_toolbar_shadow) {
                toolbar
                    .interrupt()
                    .style('box-shadow', this.toolbar_shadow_mat_elevation_z0)
                    .transition()
                    .duration(200)
                    .style('box-shadow', this.toolbar_shadow_mat_elevation_z24);
                this.is_showing_toolbar_shadow = true;
            }
        }
    }

    onAddNewSceneButtonClick() {
        const dialogRef = this.dialog.open(AddSceneDialog, {
            width: '350px',
            data: {},
        });

        dialogRef.afterClosed().subscribe((result: AddSceneDialogResult) => {
            if (result.success) {
                this.router.navigate(['scene', result.scene_id]);
            } else {
                // failed
            }
        });
    }
}

export class SceneListElement {
    private backend: BackendService;

    private _id: string;
    private _num_objects: number;
    private _num_relations: number;

    private cached_thumbnail?: string;
    private pending_request?: Promise<string>;

    constructor(
        id: string,
        object_count: number,
        relation_count: number,
        backend: BackendService
    ) {
        this.backend = backend;
        this._id = id;
        this._num_objects = object_count;
        this._num_relations = relation_count;
    }

    get id(): string {
        return this._id;
    }

    get num_objects(): number {
        return this._num_objects;
    }

    get num_relations(): number {
        return this._num_relations;
    }

    get thumbnail_sync(): string | undefined {
        if (!this.cached_thumbnail) {
            const tmp = this.thumbnail_async; // to trigger the download
        }

        return this.cached_thumbnail;
    }

    get thumbnail(): string | undefined {
        return this.cached_thumbnail;
    }

    /**
     * This function is NOT thread safe!
     * (...and a bit convoluted)
     */
    get thumbnail_async(): Promise<string> {
        let store_promise = false;

        const promise = new Promise<string>((resolve, reject) => {
            if (this.cached_thumbnail) {
                resolve(this.cached_thumbnail);
                return;
            }

            if (this.pending_request) {
                this.pending_request.then(
                    () => {
                        resolve(this.cached_thumbnail!);
                    },
                    () => {
                        reject();
                    }
                );
            } else {
                store_promise = true;

                this.backend.requestThumbnailData(this.id, (response) => {
                    const image = response.body;

                    if (!image) {
                        reject();
                        this.pending_request = undefined;
                        return;
                    }

                    const imageReader = new FileReader();
                    imageReader.onloadend = (e) => {
                        this.cached_thumbnail = imageReader.result!.toString();
                        resolve(this.cached_thumbnail);
                        this.pending_request = undefined;
                    };
                    imageReader.readAsDataURL(image);
                });
            }
        });

        if (store_promise) {
            this.pending_request = promise;
        }

        return promise;
    }
}

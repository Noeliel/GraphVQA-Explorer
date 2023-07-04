import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule, RoutingComponents } from './app-routing.module';
import { HttpClientModule } from '@angular/common/http';
import { AppComponent } from './app.component';
import { GraphComponent } from './components/graph/graph.component';
import { GraphVisComponent } from './components/graph/graph-vis/graph-vis.component';
import { GraphSidebarComponent } from './components/graph/graph-sidebar/graph-sidebar.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatListModule } from '@angular/material/list';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { EditSceneGraphObjectDialog } from './components/graph/graph-sidebar/dialog/graph-sidebar-edit-object-dialog.component';
import { DeleteSceneGraphObjectDialog } from './components/graph/graph-sidebar/dialog/graph-sidebar-delete-object-dialog.component';
import { MatMenuModule } from '@angular/material/menu';
import { EditSceneGraphRelationDialog } from './components/graph/graph-sidebar/dialog/graph-sidebar-edit-relation-dialog.component';
import { DeleteSceneGraphRelationDialog } from './components/graph/graph-sidebar/dialog/graph-sidebar-delete-relation-dialog.component';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { SceneBrowserComponent } from './components/scene-browser/scene-browser.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { EvalBrowserComponent } from './components/eval-browser/eval-browser.component';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { QuestionTableComponent } from './components/eval-browser/question-table/question-table.component';
import { FocusCategoryTableComponent } from './components/eval-browser/focus-category-table/focus-category-table.component';
import { FocusCategoryPlotComponent } from './components/eval-browser/focus-category-plot/focus-category-plot.component';
import { MatTableExporterModule } from 'mat-table-exporter';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ElementFilterWidgetComponent } from './components/graph/graph-sidebar/widget/element-filter/element-filter-widget.component';
import { ElementListWidgetComponent } from './components/graph/graph-sidebar/widget/element-list/element-list-widget.component';
import { QAWidgetComponent } from './components/graph/graph-sidebar/widget/qa/qa-widget.component';
import { DisplayModeWidgetComponent } from './components/graph/graph-sidebar/widget/display-mode/display-mode-widget.component';
import { ElementListRipple } from './components/graph/graph-sidebar/widget/element-list/directive/elementlistoptionripple';
import { OverlayModule } from '@angular/cdk/overlay';
import { AddSceneDialog } from './components/scene-browser/dialog/add-scene-dialog/scene-browser-add-scene-dialog.component';
import { MaterialFileInputModule } from 'ngx-material-file-input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { TimelineWidgetComponent } from './entities/displaymode/widgets/timeline/timeline-widget.component';

@NgModule({
    declarations: [
        AppComponent,
        RoutingComponents,
        GraphComponent,
        GraphVisComponent,
        GraphSidebarComponent,
        EditSceneGraphObjectDialog,
        DeleteSceneGraphObjectDialog,
        EditSceneGraphRelationDialog,
        DeleteSceneGraphRelationDialog,
        SceneBrowserComponent,
        EvalBrowserComponent,
        QuestionTableComponent,
        FocusCategoryTableComponent,
        FocusCategoryPlotComponent,
        ElementListWidgetComponent,
        ElementFilterWidgetComponent,
        QAWidgetComponent,
        DisplayModeWidgetComponent,
        ElementListRipple,
        AddSceneDialog,
        TimelineWidgetComponent,
    ],
    imports: [
        BrowserModule,
        HttpClientModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        MatFormFieldModule,
        MatAutocompleteModule,
        MatChipsModule,
        MatIconModule,
        MatRadioModule,
        FormsModule,
        MatListModule,
        MatInputModule,
        MatProgressBarModule,
        MatCheckboxModule,
        MatCardModule,
        MatButtonToggleModule,
        MatButtonModule,
        MatTabsModule,
        MatSelectModule,
        MatDialogModule,
        MatSnackBarModule,
        MatMenuModule,
        ScrollingModule,
        MatProgressSpinnerModule,
        MatSlideToggleModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        ReactiveFormsModule,
        MatTableExporterModule,
        MatTooltipModule,
        OverlayModule,
        MaterialFileInputModule,
    ],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule {}

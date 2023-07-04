import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EvalBrowserComponent } from './components/eval-browser/eval-browser.component';
import { GraphComponent } from './components/graph/graph.component';
import { SceneBrowserComponent } from './components/scene-browser/scene-browser.component';

export const RoutingComponents = [GraphComponent];

const routes: Routes = [
    { path: '', redirectTo: '/scenes', pathMatch: 'full' },
    { path: 'scenes', component: SceneBrowserComponent },
    { path: 'evaluation', component: EvalBrowserComponent },
    { path: 'scene', component: GraphComponent },
    { path: 'scene/:id', component: GraphComponent },
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule],
})
export class AppRoutingModule {}

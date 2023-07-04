import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { catchError, Observable, ObservableInput, take } from 'rxjs';
import {
    SceneGraphRaw,
    SceneGraphRawWrapped,
} from 'src/app/models/scenegraph.model';
import { QAPrediction } from 'src/app/models/qa.model';
import { EvaluationData } from 'src/app/models/evaluationdata.model';
import { SceneBrowserFilterResult } from 'src/app/models/scenebrowserfilterresult.model';
import { SceneBrowserFilterConfig } from 'src/app/models/scenebrowserfilterconfig.model';
import { environment } from 'src/environments/environment';
import { ModelVocab } from 'src/app/models/modelvocab.model';

@Injectable({
    providedIn: 'root',
})
export class BackendService {
    //private static shared_service?: RequestService = undefined;

    private host?: string;

    constructor(public http: HttpClient) {
        this.host =
            environment.server_protocol +
            '://' +
            environment.server_host +
            ':' +
            environment.server_port;
    }

    /*static sharedService(): RequestService {
        if (!RequestService.shared_service) {
            RequestService.shared_service = new RequestService();
        }
        return RequestService.shared_service;
    }*/

    // getters

    requestSceneIDs(callback: (value: string[]) => void) {
        const observable = this.http.get(this.host + '/get/ids') as Observable<
            string[]
        >;
        observable.pipe(take(1)).subscribe(callback);
    }

    requestFilteredSceneIDs(
        config: SceneBrowserFilterConfig,
        callback: (value: SceneBrowserFilterResult) => void
    ) {
        const observable = this.http.post(
            this.host + '/get/filtered_ids',
            JSON.stringify(config)
        ) as Observable<SceneBrowserFilterResult>;
        observable
            .pipe(
                catchError(
                    (
                        err: any,
                        caught: Observable<SceneBrowserFilterResult>
                    ) => {
                        return [
                            {},
                        ] as ObservableInput<SceneBrowserFilterResult>;
                    }
                )
            )
            .pipe(take(1))
            .subscribe(callback);
    }

    requestSceneGraphData(
        id: string,
        callback: (value: SceneGraphRawWrapped) => void
    ) {
        const observable = this.http.get(
            this.host + '/get/scenegraph/' + id
        ) as Observable<SceneGraphRawWrapped>;
        observable.pipe(take(1)).subscribe(callback);
    }

    requestVocab(callback: (value: ModelVocab) => void) {
        const observable = this.http.get(
            this.host + '/get/vocab'
        ) as Observable<ModelVocab>;
        observable.pipe(take(1)).subscribe(callback);
    }

    requestImageData(
        id: string,
        callback: (value: HttpResponse<Blob>) => void
    ) {
        const observable = this.http.get(this.host + '/get/image/' + id, {
            observe: 'response',
            responseType: 'blob',
        }) as Observable<HttpResponse<Blob>>;
        observable.pipe(take(1)).subscribe(callback);
    }

    requestThumbnailData(
        id: string,
        callback: (value: HttpResponse<Blob>) => void
    ) {
        const observable = this.http.get(this.host + '/get/thumbnail/' + id, {
            observe: 'response',
            responseType: 'blob',
        }) as Observable<HttpResponse<Blob>>;
        observable.pipe(take(1)).subscribe(callback);
    }

    requestPredictions(
        id: string,
        model: string,
        question: string,
        callback: (response: QAPrediction) => void
    ) {
        const observable = this.http.post(
            this.host + '/get/predictions/' + id,
            '{"model": ' +
                '"' +
                model +
                '", "question": ' +
                '"' +
                question +
                '"}'
        ) as Observable<QAPrediction>;
        observable.pipe(take(1)).subscribe(callback);
    }

    requestEvaluationData(
        model: string,
        split: string,
        callback: (response: EvaluationData) => void
    ) {
        const observable = this.http.post(
            this.host + '/get/evaluation',
            '{"model": ' + '"' + model + '", "split": ' + '"' + split + '"}'
        ) as Observable<EvaluationData>;
        observable
            .pipe(
                catchError((err: any, caught: Observable<EvaluationData>) => {
                    return [{}] as ObservableInput<EvaluationData>;
                })
            )
            .pipe(take(1))
            .subscribe(callback);
    }

    // setters

    updateSceneGraphData(
        id: string,
        scene_graph: SceneGraphRaw,
        callback: (response: boolean) => void
    ) {
        const observable = this.http.post(
            this.host + '/update/scenegraph/' + id,
            JSON.stringify(scene_graph)
        ) as Observable<boolean>;
        observable.pipe(take(1)).subscribe(callback);
    }

    createScene(image: any, callback: (response: string) => void) {
        const formData = new FormData();
        formData.append('file', image);

        const observable = this.http.post(
            this.host + '/create/scene',
            formData
        ) as Observable<string>;
        observable
            .pipe(
                catchError((err: any, caught: Observable<string>) => {
                    return [''] as ObservableInput<string>;
                })
            )
            .pipe(take(1))
            .subscribe(callback);
    }
}
